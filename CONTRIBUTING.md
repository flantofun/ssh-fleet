# Contributing to SSH Fleet

Thanks for your interest! This is a small project — PRs welcome.

## Development setup

```bash
git clone https://github.com/qingmeijiu/ssh-fleet
cd ssh-fleet
npm install
```

## Workflow

1. Create a branch: `git checkout -b feat/my-feature`
2. Make your changes in `src/`
3. Add or update tests in `test/`
4. Run checks:

```bash
npm run typecheck   # tsc --noEmit
npm test            # node:test runner
npm run build       # compile to dist/
```

5. Commit using [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: add push subcommand`
   - `fix: handle timeout in sequential mode`
   - `docs: clarify config format in README`
6. Open a PR against `main`.

## Code style

- TypeScript strict mode.
- ESM (`"type": "module"`).
- Prefer small, well-named functions; avoid adding new runtime dependencies
  unless absolutely necessary — the lean dependency tree is a feature.
- Public API changes should be reflected in the README and tests.

## Reporting issues

Include:
- OS and Node.js version
- ssh-fleet version (`ssh-fleet version`)
- Minimal reproduction (config snippet + command)
- Expected vs actual output

## License

By contributing you agree your contributions are licensed MIT alongside the
rest of the project.
