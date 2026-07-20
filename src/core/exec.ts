import { readFileSync, createReadStream, createWriteStream } from "node:fs";
import { Client, ClientChannel, SFTPWrapper } from "ssh2";
import { ExecOptions, ExecResult, HostConfig, TransferOptions } from "./types.js";

export interface ResolvedHost extends HostConfig {
  port: number;
  user: string;
  privateKeyPath: string;
  password?: string;
}

/**
 * Build the ssh2 connection options for a host.
 */
function connectOptions(host: ResolvedHost) {
  const opts: Record<string, unknown> = {
    host: host.host,
    port: host.port,
    username: host.user,
    readyTimeout: host.password ? 10_000 : 20_000,
  };

  if (host.privateKeyPath) {
    try {
      opts.privateKey = readFileSync(host.privateKeyPath);
      if (host.passphrase) opts.passphrase = host.passphrase;
    } catch {
      /* fall through to password / agent */
    }
  }

  if (host.password) opts.password = host.password;
  opts.agent = process.env.SSH_AUTH_SOCK;

  return opts;
}

function connect(host: ResolvedHost): Promise<Client> {
  return new Promise((resolve, reject) => {
    const client = new Client();
    client.once("ready", () => resolve(client));
    client.once("error", (err: Error) => reject(err));
    client.connect(connectOptions(host));
  });
}

/**
 * Execute a shell command on a single host.
 */
export async function execOnHost(
  host: ResolvedHost,
  command: string,
  opts: ExecOptions = {},
): Promise<ExecResult> {
  const start = Date.now();
  const result: ExecResult = {
    host: host.host,
    name: host.name,
    exitCode: null,
    stdout: "",
    stderr: "",
    durationMs: 0,
  };

  let client: Client | null = null;
  try {
    client = await connect(host);
    const { stdout, stderr, code } = await runCommand(client, command, opts.timeoutMs);
    result.stdout = stdout;
    result.stderr = stderr;
    result.exitCode = code;
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
    result.exitCode = -1;
  } finally {
    client?.end();
    result.durationMs = Date.now() - start;
  }
  return result;
}

function runCommand(
  client: Client,
  command: string,
  timeoutMs?: number,
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    client.exec(command, (err: Error | undefined, stream: ClientChannel) => {
      if (err) return reject(err);

      let stdout = "";
      let stderr = "";
      let code = 0;
      let timer: NodeJS.Timeout | null = null;

      stream.on("data", (data: Buffer) => {
        stdout += data.toString();
      });
      stream.stderr.on("data", (data: Buffer) => {
        stderr += data.toString();
      });
      stream.on("close", (exitCode: number) => {
        if (timer) clearTimeout(timer);
        code = exitCode ?? 0;
        resolve({ stdout, stderr, code });
      });

      if (timeoutMs) {
        timer = setTimeout(() => {
          stream.close();
          reject(new Error(`Command timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }
    });
  });
}

/**
 * Execute a command across many hosts, either in parallel (with an optional
 * concurrency limit) or sequentially.
 */
export async function execAcrossHosts(
  hosts: ResolvedHost[],
  command: string,
  opts: ExecOptions = {},
): Promise<ExecResult[]> {
  const { parallel = true, concurrency = 8, failFast = false } = opts;

  if (!parallel) {
    const results: ExecResult[] = [];
    for (const host of hosts) {
      const r = await execOnHost(host, command, opts);
      results.push(r);
      if (failFast && r.exitCode !== 0) break;
    }
    return results;
  }

  if (concurrency <= 0 || concurrency >= hosts.length) {
    return Promise.all(hosts.map((h) => execOnHost(h, command, opts)));
  }

  // Limited concurrency pool
  const queue = [...hosts.map((h) => ({ host: h, idx: 0 }))];
  queue.forEach((q, i) => (q.idx = i));
  const results: ExecResult[] = new Array(hosts.length);

  let cursor = 0;
  async function worker() {
    while (cursor < queue.length) {
      const current = queue[cursor++];
      const r = await execOnHost(current.host, command, opts);
      results[current.idx] = r;
      if (failFast && r.exitCode !== 0) {
        cursor = queue.length;
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, hosts.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

/**
 * Upload a local file to a host via SFTP.
 */
export async function pushFile(
  host: ResolvedHost,
  localPath: string,
  remotePath: string,
  opts: TransferOptions = {},
): Promise<ExecResult> {
  const start = Date.now();
  const result: ExecResult = {
    host: host.host,
    name: host.name,
    exitCode: 0,
    stdout: `pushed ${localPath} → ${remotePath}`,
    stderr: "",
    durationMs: 0,
  };

  let client: Client | null = null;
  try {
    client = await connect(host);
    await new Promise<void>((resolve, reject) => {
      client!.sftp((err: Error | undefined, sftp: SFTPWrapper) => {
        if (err) return reject(err);
        const flags = opts.overwrite === false ? "wx" : "w";
        const writeStream = sftp.createWriteStream(remotePath, { flags });
        const readStream = createReadStream(localPath);
        writeStream.on("close", () => resolve());
        writeStream.on("error", reject);
        readStream.pipe(writeStream);
      });
    });
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
    result.exitCode = -1;
  } finally {
    client?.end();
    result.durationMs = Date.now() - start;
  }
  return result;
}

/**
 * Download a remote file to the local machine via SFTP.
 */
export async function pullFile(
  host: ResolvedHost,
  remotePath: string,
  localPath: string,
  _opts: TransferOptions = {},
): Promise<ExecResult> {
  const start = Date.now();
  const result: ExecResult = {
    host: host.host,
    name: host.name,
    exitCode: 0,
    stdout: `pulled ${remotePath} → ${localPath}`,
    stderr: "",
    durationMs: 0,
  };

  let client: Client | null = null;
  try {
    client = await connect(host);
    await new Promise<void>((resolve, reject) => {
      client!.sftp((err: Error | undefined, sftp: SFTPWrapper) => {
        if (err) return reject(err);
        const readStream = sftp.createReadStream(remotePath);
        const writeStream = createWriteStream(localPath);
        writeStream.on("close", () => resolve());
        writeStream.on("error", reject);
        readStream.pipe(writeStream);
      });
    });
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
    result.exitCode = -1;
  } finally {
    client?.end();
    result.durationMs = Date.now() - start;
  }
  return result;
}
