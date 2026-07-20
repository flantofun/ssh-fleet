import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "../utils/yaml.js";
import { FleetConfig, HostConfig } from "./types.js";

const CONFIG_FILENAMES = [
  ".ssh-fleet.yml",
  ".ssh-fleet.yaml",
  ".ssh-fleet.json",
  "ssh-fleet.yml",
  "ssh-fleet.yaml",
  "ssh-fleet.json",
];

/**
 * Resolve an optional `--config` path or search the cwd and its parents for a
 * recognised fleet config file.
 */
export function resolveConfigPath(explicit?: string): string | null {
  if (explicit) {
    const abs = resolve(explicit);
    return abs;
  }

  const cwd = process.cwd();
  const home = homedir();

  let dir = cwd;
  for (let i = 0; i < 20; i++) {
    for (const name of CONFIG_FILENAMES) {
      const candidate = join(dir, name);
      try {
        readFileSync(candidate);
        return candidate;
      } catch {
        /* not found, continue */
      }
    }
    if (dir === home || dir === "/" || dirname(dir) === dir) break;
    dir = dirname(dir);
  }
  return null;
}

/**
 * Read and parse a fleet config file. Supports YAML and JSON.
 */
export function loadConfig(explicitPath?: string): { config: FleetConfig; path: string } {
  const path = resolveConfigPath(explicitPath);
  if (!path) {
    return { config: { hosts: [] }, path: "" };
  }
  const raw = readFileSync(path, "utf8");
  let parsed: unknown;
  if (path.endsWith(".json")) {
    parsed = JSON.parse(raw);
  } else {
    parsed = YAML.parse(raw);
  }
  return { config: normalizeConfig(parsed), path };
}

function normalizeConfig(raw: unknown): FleetConfig {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Invalid config: expected an object");
  }
  const obj = raw as Record<string, unknown>;
  const hosts = Array.isArray(obj.hosts) ? (obj.hosts as HostConfig[]) : [];
  const cfg: FleetConfig = { hosts };

  if (typeof obj.defaultUser === "string") cfg.defaultUser = obj.defaultUser;
  if (typeof obj.defaultPort === "number") cfg.defaultPort = obj.defaultPort;
  if (typeof obj.defaultPrivateKeyPath === "string") cfg.defaultPrivateKeyPath = obj.defaultPrivateKeyPath;

  return cfg;
}

/**
 * Select hosts from a fleet config by an optional selector.
 *
 * Selector grammar:
 *   - omitted        → all hosts
 *   - "name1,name2"  → explicit comma-separated names
 *   - "tag:web"      → hosts whose tags array includes "web"
 *   - "all"          → all hosts
 */
export function selectHosts(
  config: FleetConfig,
  selector?: string,
): HostConfig[] {
  if (!selector || selector === "all") {
    return config.hosts;
  }

  if (selector.startsWith("tag:")) {
    const tag = selector.slice(4).trim();
    return config.hosts.filter((h) => h.tags?.includes(tag));
  }

  const names = selector.split(",").map((s) => s.trim()).filter(Boolean);
  const byName = new Map(config.hosts.map((h) => [h.name, h]));
  const result: HostConfig[] = [];
  for (const name of names) {
    const host = byName.get(name);
    if (!host) {
      throw new Error(`Unknown host: ${name}`);
    }
    result.push(host);
  }
  return result;
}

/**
 * Fill in defaults from a FleetConfig so downstream code can assume a fully
 * populated HostConfig.
 */
export function applyDefaults(host: HostConfig, config: FleetConfig): HostConfig {
  return {
    ...host,
    port: host.port ?? config.defaultPort ?? 22,
    user: host.user ?? config.defaultUser ?? homedir().split(":").pop() ?? "root",
    privateKeyPath:
      host.privateKeyPath ?? config.defaultPrivateKeyPath ?? join(homedir(), ".ssh", "id_rsa"),
  };
}
