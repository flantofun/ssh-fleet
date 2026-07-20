import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import chalk from "chalk";
import { HostConfig } from "../core/types.js";
import type { ResolvedHost } from "../core/exec.js";
import { loadFleetConfig } from "./init.js";

export function listCommand(_args: { verbose?: boolean; json?: boolean; tags?: boolean }): void {
  const { config, path } = loadFleetConfig();
  if (!config) {
    console.error("No fleet config found. Run `ssh-fleet init` first.");
    process.exit(1);
  }
  const hosts = (config.hosts as HostConfig[]) ?? [];

  if (_args.json) {
    console.log(JSON.stringify(hosts, null, 2));
    return;
  }

  const total = hosts.length;
  const totalTags = hosts.flatMap((h) => h.tags ?? []);
  const uniqueTags = [...new Set(totalTags)].sort();

  console.log(chalk.bold("Fleet hosts:") + chalk.gray(` ${total} host(s)`));
  console.log(chalk.gray(`Config: ${path ?? "(none)"}`));
  if (uniqueTags.length > 0) console.log(chalk.gray(`Tags: ${uniqueTags.join(", ")}`));
  console.log();

  for (const h of hosts) {
    const keyPath = h.privateKeyPath ?? (config.defaultPrivateKeyPath as string);
    const keyExists = keyPath ? existsSync(keyPath) : false;
    const key = keyExists ? chalk.green("✓") : chalk.red("✗");

    const user = h.user ?? (config.defaultUser as string) ?? "?";
    const port = h.port ?? (config.defaultPort as number) ?? 22;
    const tags = h.tags ? chalk.cyan(`[${h.tags.join(",")}]`) : "";

    console.log(chalk.bold(h.name) + `  ${user}@${h.host}:${port}  ${key}  ${tags}`);
  }
}

/** Load hosts from config, with defaults applied, for downstream commands. */
export function loadHosts(explicitPath?: string): ResolvedHost[] {
  const { config, path: _ } = loadFleetConfig(explicitPath);
  if (!config) {
    console.error("No fleet config found. Run `ssh-fleet init` first.");
    process.exit(1);
  }

  const defaultUser = config.defaultUser as string;
  const defaultPort = config.defaultPort as number;
  const defaultKey = config.defaultPrivateKeyPath as string;
  const defaultPassword = config.defaultPassword as string;

  return (config.hosts as HostConfig[]).map(
    (h): ResolvedHost => ({
      ...h,
      port: h.port ?? defaultPort ?? 22,
      user: h.user ?? defaultUser ?? "root",
      password: h.password ?? defaultPassword,
      privateKeyPath: h.privateKeyPath ?? defaultKey ?? join(homedir(), ".ssh", "id_rsa"),
    }),
  );
}
