import { execAcrossHosts, execOnHost, ResolvedHost } from "../core/exec.js";
import { printResults } from "../core/output.js";
import { parseArgs, optString, optInt, optBool } from "../utils/args.js";
import { loadHosts } from "./list.js";

export function execCommand(rawArgs: string[]): void {
  const args = parseArgs(rawArgs);

  const command = args.positional.join(" ");
  if (!command) {
    console.error("Usage: ssh-fleet exec [options] <command>");
    process.exit(1);
  }

  const hosts = loadHosts(optString(args, "config"));
  const selector = optString(args, "hosts", "selector");
  const selected = selector ? selectHosts(hosts, selector) : hosts;

  if (selected.length === 0) {
    console.error("No matching hosts.");
    process.exit(1);
  }

  const opts = {
    parallel: !optBool(args, "sequential", "seq"),
    concurrency: optInt(args, "concurrency", "c") ?? 8,
    timeoutMs: optInt(args, "timeout", "t"),
    failFast: optBool(args, "fail-fast", "f"),
    output: optString(args, "output", "o") as "combined" | "grouped" | "json" | "silent" | undefined,
  };

  execAcrossHosts(selected, command, opts).then((results) => {
    printResults(results, opts.output ?? "grouped");
    const failed = results.filter((r) => r.exitCode !== 0).length;
    process.exit(failed > 0 ? 1 : 0);
  });
}

function selectHosts(hosts: ResolvedHost[], selector: string): ResolvedHost[] {
  if (selector === "all" || selector === "*") return hosts;

  // tag:xxx
  if (selector.startsWith("tag:")) {
    const tag = selector.slice(4).trim();
    return hosts.filter((h) => h.tags?.includes(tag));
  }

  // comma-separated names
  const names = selector.split(",").map((s) => s.trim()).filter(Boolean);
  const byName = new Map(hosts.map((h) => [h.name, h]));
  const result: ResolvedHost[] = [];
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