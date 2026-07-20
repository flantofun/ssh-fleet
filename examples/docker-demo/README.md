# Disposable SSH Fleet Demo

This environment starts two local SSH servers with Docker Compose. The credentials
are intentionally public and must only be used for these disposable containers.

From the repository root, after installing dependencies:

```bash
npm run build
docker compose -f examples/docker-demo/compose.yml up -d --build
node dist/cli.js list --config examples/docker-demo/ssh-fleet.yml
node dist/cli.js exec 'hostname && uptime' --config examples/docker-demo/ssh-fleet.yml
node dist/cli.js exec 'uname -a' --hosts tag:web --output json --config examples/docker-demo/ssh-fleet.yml
node dist/cli.js run examples/docker-demo/health-check.sh --config examples/docker-demo/ssh-fleet.yml
docker compose -f examples/docker-demo/compose.yml down
```

If a command is run immediately after `docker compose up`, SSH may need a few
seconds to become ready. Re-run the command once both containers are listening.
