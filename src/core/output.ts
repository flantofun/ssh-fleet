import chalk from "chalk";
import { ExecResult, OutputMode } from "./types.js";

/** Print results according to the chosen mode. */
export function printResults(results: ExecResult[], mode: OutputMode = "grouped"): void {
  switch (mode) {
    case "json":
      process.stdout.write(JSON.stringify(results, null, 2) + "\n");
      break;
    case "silent":
      break;
    case "combined":
      printCombined(results);
      break;
    case "grouped":
    default:
      printGrouped(results);
      break;
  }
}

function printCombined(results: ExecResult[]): void {
  for (const r of results) {
    const tag = r.exitCode === 0 ? chalk.green(`[${r.name}]`) : chalk.red(`[${r.name}]`);
    process.stdout.write(`${tag} ${r.stdout}`);
    if (r.stderr) process.stderr.write(`${tag} ${r.stderr}`);
  }
}

function printGrouped(results: ExecResult[]): void {
  for (const r of results) {
    const header = formatHeader(r);
    process.stdout.write(`${header}\n`);
    if (r.stdout) process.stdout.write(`${r.stdout}\n`);
    if (r.stderr) process.stderr.write(`${r.stderr}\n`);
    if (!r.stdout && !r.stderr && !r.error) process.stdout.write("(no output)\n");
    process.stdout.write("\n");
  }
  printSummary(results);
}

function formatHeader(r: ExecResult): string {
  const status =
    r.exitCode === 0
      ? chalk.bgGreen.black(" OK ")
      : chalk.bgRed.black(` FAIL ${r.exitCode ?? "?"} `);
  const time = chalk.gray(`${r.durationMs}ms`);
  return `${status} ${chalk.bold(r.name)} ${chalk.gray(r.host)} ${time}`;
}

export function printSummary(results: ExecResult[]): void {
  const total = results.length;
  const ok = results.filter((r) => r.exitCode === 0).length;
  const fail = total - ok;
  const totalMs = results.reduce((s, r) => s + r.durationMs, 0);

  const parts: string[] = [];
  parts.push(chalk.bold("Summary:"));
  parts.push(chalk.green(`${ok} ok`));
  if (fail > 0) parts.push(chalk.red(`${fail} failed`));
  parts.push(chalk.gray(`${total} hosts`));
  parts.push(chalk.gray(`${totalMs}ms total`));
  process.stdout.write(parts.join("  ") + "\n");
}
