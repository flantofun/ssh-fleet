/**
 * Core type definitions for ssh-fleet.
 */

export interface HostConfig {
  /** Unique name used to reference the host from the CLI. */
  name: string;
  /** Hostname or IP address. */
  host: string;
  /** SSH port. Defaults to 22. */
  port?: number;
  /** SSH user. Defaults to current OS user. */
  user?: string;
  /** Explicit password (not recommended — prefer keys). */
  password?: string;
  /** Path to a private key file. */
  privateKeyPath?: string;
  /** Passphrase for an encrypted private key. */
  passphrase?: string;
  /** Tags used for grouping, e.g. ["web", "prod"]. */
  tags?: string[];
}

export interface FleetConfig {
  hosts: HostConfig[];
  /** Default SSH user applied when a host omits its own. */
  defaultUser?: string;
  /** Default private key path applied when a host omits its own. */
  defaultPrivateKeyPath?: string;
  /** Default SSH port applied when a host omits its own. */
  defaultPort?: number;
  /** Default password applied when a host omits its own. */
  defaultPassword?: string;
}

export interface ExecResult {
  host: string;
  name: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  error?: string;
}

export type OutputMode = "combined" | "grouped" | "json" | "silent";

export interface ExecOptions {
  /** Run commands in parallel (default) or sequentially. */
  parallel?: boolean;
  /** Maximum concurrent connections when running in parallel. */
  concurrency?: number;
  /** Per-host timeout in milliseconds. */
  timeoutMs?: number;
  /** How to format results on stdout. */
  output?: OutputMode;
  /** Throw / exit non-zero if any host fails. */
  failFast?: boolean;
}

export interface TransferOptions {
  /** Overwrite existing remote files. */
  overwrite?: boolean;
  /** Preserve modification / access times. */
  preserveTimes?: boolean;
}

export type TransferDirection = "push" | "pull";
