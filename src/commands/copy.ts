import { pushFile, pullFile } from "../core/exec.js";
import { printResults } from "../core/output.js";
import { parseArgs, optString, optBool } from "../utils/args.js";
import { loadHosts } from "./list.js";

/**
 * `copy` — push or pull a file across hosts via SFTP.
 *
 * Usage:
 *   ssh-fleet copy push <local> <remote>
 *   ssh-fleet copy pull <remote> <local>
 */
export function copyCommand(rawArgs: string[]): void {
  const args = parseArgs(rawArgs);
  const direction = args.positional[0] as "push" | "pull" | undefined;
  const source = args.positional[1];
  const destination = args.positional[2];

  if (!direction || !source || !destination) {
    console.error("Usage:");
    console.error("  ssh-fleet copy push <local-path> <remote-path>");
    console.error("  ssh-fleet copy pull <remote-path> <local-path>");
    process.exit(1);
  }

  if (direction !== "push" && direction !== "pull") {
    console.error(`Unknown direction: ${direction} (expected "push" or "pull")`);
    process.exit(1);
  }

  const hosts = loadHosts(optString(args, "config"));
  const selector = optString(args, "hosts", "selector");
  const selected = selector ? selectHosts(hosts, selector) : hosts;

  if (selected.length === 0) {
    console.error("No matching hosts.");
    process.exit(1);
  }

  const overwrite = optBool(args, "overwrite", "w") ? undefined : false;

  const tasks = selected.map((host) =>
    direction === "push"
      ? pushFile(host, source, destination, { overwrite })
      : pullFile(host, source, `${destination}.${host.name}`, {}),
  );

  Promise.all(tasks).then((results) => {
    printResults(results, "grouped");
    const failed = results.filter((r) => r.exitCode !== 0).length;
    process.exit(failed > 0 ? 1 : 0);
  });
}

function selectHosts(hosts: ReturnType<typeof loadHosts>, selector: string) {
  if (selector === "all" || selector === "*") return hosts;
  if (selector.startsWith("tag:")) {
    const tag = selector.slice(4).trim();
    return hosts.filter((h) => h.tags?.includes(tag));
  }
  const names = selector.split(",").map((s) => s.trim()).filter(Boolean);
  const byName = new Map(hosts.map((h) => [h.name, h]));
  const result = [];
  for (const name of names) {
    const h = byName.get(name);
    if (!h) {
      console.error(`Unknown host: ${name}`);
      process.exit(1);
    }
    result.push(h);
  }
  return result;
}
