/**
 * Tiny argv parser — keeps the CLI dependency-free and fast to load.
 *
 * Supports:
 *   --flag
 *   --key=value
 *   --key value
 *   -k value / -k=value
 *   positional args
 */

export interface ParsedArgs {
  /** Named flags and options. */
  options: Record<string, string | boolean>;
  /** Bare positional arguments. */
  positional: string[];
}

export function parseArgs(argv: string[]): ParsedArgs {
  const options: Record<string, string | boolean> = {};
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "--") {
      positional.push(...argv.slice(i + 1));
      break;
    }

    if (arg?.startsWith("--")) {
      const body = arg.slice(2);
      const eq = body.indexOf("=");
      if (eq !== -1) {
        options[body.slice(0, eq)] = body.slice(eq + 1);
      } else if (i + 1 < argv.length && !argv[i + 1]?.startsWith("-")) {
        options[body] = argv[i + 1]!;
        i++;
      } else {
        options[body] = true;
      }
      continue;
    }

    if (arg?.startsWith("-") && arg.length > 1) {
      const body = arg.slice(1);
      const eq = body.indexOf("=");
      if (eq !== -1) {
        options[body.slice(0, eq)] = body.slice(eq + 1);
      } else if (i + 1 < argv.length && !argv[i + 1]?.startsWith("-")) {
        options[body] = argv[i + 1]!;
        i++;
      } else {
        options[body] = true;
      }
      continue;
    }

    if (arg) positional.push(arg);
  }

  return { options, positional };
}

export function optString(args: ParsedArgs, ...names: string[]): string | undefined {
  for (const n of names) {
    const v = args.options[n];
    if (typeof v === "string") return v;
  }
  return undefined;
}

export function optInt(args: ParsedArgs, ...names: string[]): number | undefined {
  const v = optString(args, ...names);
  if (v === undefined) return undefined;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? undefined : n;
}

export function optBool(args: ParsedArgs, ...names: string[]): boolean {
  for (const n of names) {
    if (args.options[n] !== undefined) return true;
  }
  return false;
}
