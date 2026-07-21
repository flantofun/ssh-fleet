# Codex + GPT-5.6 Build Log

SSH Fleet was created from scratch for OpenAI Build Week through an AI-native vibe
coding workflow with Codex using GPT-5.6 on July 20, 2026.

## Core contribution

The builder started with the product idea: one compact CLI for safe, repeatable
operations across SSH hosts. Through prompts, live feedback, testing, and product
decisions, the builder directed Codex GPT-5.6 from a blank starting point to the
submitted tool. The session:

1. Designed the TypeScript CLI, inventory format, command structure, and bounded
   parallel execution workflow.
2. Implemented `ssh-fleet run <script-file>` with host selection,
   concurrency, timeout, fail-fast, configuration, and output options.
3. Added explicit validation for concurrency, timeout, and output mode values.
4. Added tests for exact multi-line loading, UTF-8 BOM handling, and empty files.
5. Added a disposable two-host Docker environment for judge testing.
6. Found and fixed a `list --config <path>` forwarding bug during the
   end-to-end judge walkthrough.
7. Diagnosed the remote CI failure, corrected absolute `init --path` handling, and
   made the smoke test portable across Linux, macOS, and Windows.
8. Updated both English and Chinese documentation and prepared the Devpost entry.

## Why Codex mattered

Codex made it possible to move from idea to a functioning, tested developer tool
in one continuous session. The builder remained responsible for the concept,
requirements, iterative feedback, hands-on validation, tradeoffs, and final
decisions, while GPT-5.6 generated and refined the implementation and supporting
assets.

## Verification evidence

The final session ran these checks from a clean dependency install:

```text
npm ci
npm run typecheck
npm test          # 32 passed, 0 failed
npm run build
node dist/cli.js help
git diff --check
```

The Docker Compose files are included for reproducible judge testing. Docker was
not available in the Codex workspace, so that environment is documented and
statically reviewed but must be smoke-tested on a Docker-enabled machine.

## Codex Session ID

`019f7e47-30f2-70f2-896f-4d4523f71227`

This session covers the repository review, core `run` implementation, validation,
tests, Docker judge environment, CI diagnosis, documentation, and final release
verification described above.
