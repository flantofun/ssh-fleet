# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-07-20

### Added
- **Core command execution** across multiple SSH hosts in parallel.
- **Sequential mode** (`--seq`) for ordered execution.
- **Configurable concurrency** (`-c N`) to limit simultaneous connections.
- **Per-host timeout** (`-t MS`) with graceful stream cleanup.
- **Tag-based host selection** (`--hosts tag:prod`) plus name lists and `all`.
- **YAML and JSON fleet config** with parent-directory auto-discovery.
- **SSH key authentication** (with optional passphrase).
- **Password authentication** (via `defaultPassword` or per-host `password`).
- **Multiple output formats**: `grouped` (default), `combined`, `json`, `silent`.
- **SFTP file transfer**: `copy push` and `copy pull` commands.
- **`init`** command to scaffold a starter config file.
- **`list`** command with verbose, JSON, and tag views.
- **`status`** shortcut for a quick fleet health check.
- **Summary line** showing ok/failed counts and total duration.
- **Cross-platform CI** on Node.js 18 / 20 / 22 / 24 across Linux, macOS, Windows.
- **27 unit tests** covering arg parsing, YAML parsing, and CLI options.
- MIT license, CONTRIBUTING guide, example config.
