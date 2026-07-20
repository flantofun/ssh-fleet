#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execCommand } from "./commands/exec.js";
import { initCommand } from "./commands/init.js";
import { listCommand } from "./commands/list.js";
import { parseArgs, optString, optBool, optInt } from "./utils/args.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8"));
const VERSION = pkg.version;

function banner(): void {
  console.log(`ssh-fleet v${VERSION} — Multi-server SSH command runner`);
  console.log();
}

function usage(): void {
  banner();
  console.log("Usage: ssh-fleet <command> [options] [args]");
  console.log();
  console.log("Commands:");
  console.log("  exec <command>        Run a shell command on selected hosts");
  console.log("  list                  List configured hosts");
  console.log("  init                  Create a fleet config file");
  console.log("  status                Quick health check (same as `exec hostname && uptime`)");
  console.log("  help                  Show this help message");
  console.log("  version               Show version");
  console.log();
  console.log("Global options:");
  console.log("  --config <path>      Path to fleet config file");
  console.log("  --help               Show help for a command");
  console.log();
  console.log("Examples:");
  console.log("  ssh-fleet init");
  console.log("  ssh-fleet exec 'uptime'");
  console.log("  ssh-fleet exec 'df -h' --hosts tag:web");
  console.log("  ssh-fleet exec 'docker ps' --hosts web-1,db-1 --concurrency 2");
  console.log("  ssh-fleet exec 'free -m' --output json");
  console.log("  ssh-fleet list");
  console.log("  ssh-fleet list --verbose");
  console.log("  ssh-fleet status");
}

async function main(): Promise<void> {
  const raw = process.argv.slice(2);
  if (raw.length === 0) {
    usage();
    process.exit(0);
  }

  const args = parseArgs(raw);
  const cmd = args.positional[0];
  const rest = raw.slice(1);

  switch (cmd) {
    case "exec": {
      execCommand(rest);
      break;
    }
    case "list": {
      const listArgs = parseArgs(rest);
      listCommand({
        verbose: optBool(listArgs, "verbose", "v"),
        json: optBool(listArgs, "json", "j"),
        tags: optBool(listArgs, "tags", "t"),
      });
      break;
    }
    case "init": {
      const initArgs = parseArgs(rest);
      initCommand({
        force: optBool(initArgs, "force", "f"),
        path: optString(initArgs, "path", "p"),
        json: optBool(initArgs, "json", "j"),
      });
      break;
    }
    case "status": {
      execCommand([...rest, "echo '=== HOSTNAME ===' && hostname && echo '=== UPTIME ===' && uptime && echo '=== LOAD ===' && (cat /proc/loadavg || echo '(non-Linux)')"]);
      break;
    }
    case "help":
    case "--help":
    case "-h": {
      usage();
      break;
    }
    case "version":
    case "--version":
    case "-v": {
      console.log(VERSION);
      break;
    }
    default: {
      console.error(`Unknown command: ${cmd}`);
      console.error("Run `ssh-fleet help` for usage.");
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});