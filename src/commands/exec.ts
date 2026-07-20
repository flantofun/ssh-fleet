import { execAcrossHosts, ResolvedHost } from "../core/exec.js";
import { printResults } from "../core/output.js";
import { parseArgs, optString, optInt, optBool, ParsedArgs } from "../utils/args.js";
import { loadHosts } from "./list.js";

export function execCommand(rawArgs: string[]): void {
  const args = parseArgs(rawArgs);

  const command = args.positional.join(" ");
  if (!command) {
    console.error("Usage: ssh-fleet exec [options] <command>");
    process.exit(1);
  }

  executeCommand(command, args);
}

export function executeCommand(command: string, args: ParsedArgs): void {
  const hosts = loadHosts(optString(args, "config"));
  const selector = optString(args, "hosts", "selector");
  const selected = selector ? selectHosts(hosts, selector) : hosts;

  if (selected.length === 0) {
    console.error("No matching hosts.");
    process.exit(1);
  }

  const concurrency = optInt(args, "concurrency", "c") ?? 8;
  const timeoutMs = optInt(args, "timeout", "t");
  const output = optString(args, "output", "o") ?? "grouped";

  if (!Number.isInteger(concurrency) || concurrency < 1) {
    console.error("Concurrency must be a positive integer.");
    process.exit(1);
  }
  if (timeoutMs !== undefined && (!Number.isInteger(timeoutMs) || timeoutMs < 1)) {
    console.error("Timeout must be a positive integer in milliseconds.");
    process.exit(1);
  }
  if (!["combined", "grouped", "json", "silent"].includes(output)) {
    console.error(`Unknown output mode: ${output}`);
    process.exit(1);
  }

  const opts = {
    parallel: !optBool(args, "sequential", "seq"),
    concurrency,
    timeoutMs,
    failFast: optBool(args, "fail-fast", "f"),
    output: output as "combined" | "grouped" | "json" | "silent",
  };

  execAcrossHosts(selected, command, opts).then((results) => {
    printResults(results, opts.output);
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
