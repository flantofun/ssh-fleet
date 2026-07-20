import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { executeCommand } from "./exec.js";
import { parseArgs } from "../utils/args.js";

export function loadScript(path: string): string {
  const script = readFileSync(resolve(path), "utf8").replace(/^\uFEFF/, "");
  if (!script.trim()) throw new Error(`Script is empty: ${path}`);
  return script;
}

export function runCommand(rawArgs: string[]): void {
  const args = parseArgs(rawArgs);
  if (args.positional.length !== 1) {
    console.error("Usage: ssh-fleet run [options] <script-file>");
    process.exit(1);
  }

  const path = args.positional[0]!;
  let script: string;
  try {
    script = loadScript(path);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  executeCommand(script, args);
}
