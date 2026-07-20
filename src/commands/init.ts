import { existsSync, writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import YAML from "../utils/yaml.js";

const DEFAULT_CONFIG = {
  defaultUser: "root",
  defaultPort: 22,
  defaultPrivateKeyPath: join(homedir(), ".ssh", "id_rsa"),
  hosts: [
    {
      name: "web-1",
      host: "192.168.1.10",
      tags: ["web", "prod"],
    },
    {
      name: "web-2",
      host: "192.168.1.11",
      tags: ["web", "prod"],
    },
    {
      name: "db-1",
      host: "192.168.1.20",
      user: "postgres",
      tags: ["db", "prod"],
    },
  ],
};

const YAML_TEMPLATE = `# ssh-fleet configuration — see https://github.com/qingmeijiu/ssh-fleet
defaultUser: root
defaultPort: 22
defaultPrivateKeyPath: ${join(homedir(), ".ssh", "id_rsa")}

hosts:
  - name: web-1
    host: 192.168.1.10
    tags: [web, prod]

  - name: web-2
    host: 192.168.1.11
    tags: [web, prod]

  - name: db-1
    host: 192.168.1.20
    user: postgres
    tags: [db, prod]
`;

const JSON_TEMPLATE = JSON.stringify(DEFAULT_CONFIG, null, 2) + "\n";

export function initCommand(args: { force?: boolean; path?: string; json?: boolean }): void {
  const cwd = process.cwd();
  const target = args.path ? join(cwd, args.path) : cwd;

  const filename = args.json ? "ssh-fleet.json" : "ssh-fleet.yml";
  const fullPath = join(target, filename);

  if (!existsSync(target)) mkdirSync(target, { recursive: true });

  if (existsSync(fullPath)) {
    if (!args.force) {
      console.error(`Config already exists: ${fullPath} (use --force to overwrite)`);
      process.exit(1);
    }
  }

  writeFileSync(fullPath, args.json ? JSON_TEMPLATE : YAML_TEMPLATE);
  console.log(`Created ${fullPath}`);
}

export function loadFleetConfig(explicitPath?: string) {
  const paths = explicitPath
    ? [explicitPath]
    : [
        join(process.cwd(), "ssh-fleet.yml"),
        join(process.cwd(), "ssh-fleet.yaml"),
        join(process.cwd(), "ssh-fleet.json"),
        join(process.cwd(), ".ssh-fleet.yml"),
        join(process.cwd(), ".ssh-fleet.yaml"),
        join(process.cwd(), ".ssh-fleet.json"),
        join(homedir(), ".ssh-fleet.yml"),
        join(homedir(), ".ssh-fleet.yaml"),
        join(homedir(), ".ssh-fleet.json"),
      ];

  for (const p of paths) {
    if (existsSync(p)) {
      const raw = readFileSync(p, "utf8");
      const parsed = p.endsWith(".json") ? JSON.parse(raw) : YAML.parse(raw);
      return { config: parsed as Record<string, unknown>, path: p };
    }
  }
  return { config: null, path: null };
}
