# SSH Fleet — OpenAI Build Week Submission

## Track

Developer Tools

## Tagline

Run one command or deployment script across an SSH fleet, safely and in parallel.

## Inspiration

Small teams often operate a handful of servers that are too important for manual
copy-paste but do not justify a full configuration-management stack. We wanted the
speed of SSH with the repeatability, targeting, and machine-readable results of a
purpose-built fleet tool.

## What it does

SSH Fleet is a lightweight TypeScript CLI that keeps a fleet in one YAML or JSON
file. It can run commands and multi-line scripts concurrently, target hosts by
name or tag, enforce per-host timeouts, stop after failures, return JSON for CI,
perform health checks, and transfer files over SFTP.

## How we built it

The CLI is built with Node.js, TypeScript, and ssh2. Its execution engine uses a
bounded worker pool so operators can control connection pressure while preserving
result order. The configuration loader resolves defaults and SSH credentials,
and the output layer supports both human-readable summaries and structured JSON.
The project ships with automated tests and a cross-platform CI matrix.

Codex with GPT-5.6 was used as an engineering partner for the core workflow: it
reviewed the command architecture, implemented the multi-line `run` command,
strengthened execution-option validation, added tests, and prepared the project
for reproducible judging. The submitted Codex Session ID documents that work.

**Codex Session ID:** `019f7e47-30f2-70f2-896f-4d4523f71227`

## Challenges

The hardest design constraint was keeping the tool small while handling behavior
that becomes complicated across many hosts: bounded concurrency, partial failure,
timeouts, stable result ordering, authentication differences, and output suitable
for both people and automation.

## Accomplishments

- One-command install and a two-command quick start
- Parallel execution with bounded concurrency and host/tag selection
- Local multi-line scripts executed remotely without a separate upload step
- JSON output and meaningful process exit codes for CI pipelines
- SSH key, password, and agent authentication plus SFTP transfer
- TypeScript tests and CI across Linux, macOS, Windows, and multiple Node versions

## What we learned

A useful developer tool is defined as much by predictable failure behavior as by
the happy path. Explicit timeouts, stable JSON, selection rules, and a testable
setup make a small CLI much easier to trust in real operations.

## What's next

Next we plan to add output-diff mode, shell completion, an interactive host picker,
and a containerized demo environment for trying SSH Fleet without real servers.

## Judge setup

```bash
git clone https://github.com/flantofun/ssh-fleet
cd ssh-fleet
npm install
npm test
npm run build
node dist/cli.js help
```

To test against SSH hosts, create an inventory with `node dist/cli.js init`, edit
the generated `ssh-fleet.yml`, then run:

```bash
node dist/cli.js list
node dist/cli.js exec 'uname -a' --hosts all
node dist/cli.js run ./deploy.sh --hosts tag:web
```

## Demo video outline (under 3 minutes)

**0:00–0:20 — Problem.** Show several terminal tabs and explain that small fleets
need repeatable operations without a heavy orchestration stack.

**0:20–0:45 — Setup.** Install SSH Fleet, show the compact YAML inventory, then run
`ssh-fleet list --tags`.

**0:45–1:25 — Core workflow.** Run `ssh-fleet exec 'hostname && uptime'` across the
fleet, then target only `tag:web`. Highlight bounded parallelism and the summary.

**1:25–1:55 — New script workflow.** Open a short `deploy.sh`, then run
`ssh-fleet run ./deploy.sh --hosts tag:web --fail-fast`.

**1:55–2:20 — Automation.** Run a command with `--output json` and pipe it to `jq`.
Briefly show that a failed host produces a non-zero CLI exit code.

**2:20–2:45 — Codex and GPT-5.6.** Show the Codex session that implemented `run`,
validation, tests, and submission documentation; include the `/feedback` Session ID.

**2:45–2:55 — Close.** State the value proposition: one inventory, one command,
every server, with output humans and pipelines can trust.

## Submission checklist

- [ ] Select **Developer Tools** on Devpost
- [ ] Add the public repository URL and confirm the MIT license is visible
- [ ] Record and publish a public YouTube video under three minutes with audio
- [x] Add the Codex `/feedback` Session ID covering the core implementation
- [ ] Paste the relevant sections above into the Devpost submission form
- [ ] Verify installation and commands from a fresh clone
