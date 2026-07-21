import { spawnSync } from "node:child_process";
import { writeFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const composeFile = "examples/docker-demo/compose.yml";
let composeCommand = ["docker", "compose"];
const config = "examples/docker-demo/ssh-fleet.yml";
const fixture = resolve("examples/docker-demo/judge-upload.txt");
const pulled = resolve("examples/docker-demo/judge-download");

function run(command, args, options = {}) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} exited with status ${result.status}`);
  }
}

function fleet(args, options) {
  run(process.execPath, ["dist/cli.js", ...args, "--config", config], options);
}

function configureCompose() {
  const plugin = spawnSync("docker", ["compose", "version"], { stdio: "ignore" });
  if (plugin.status === 0) return;

  const legacy = spawnSync("docker-compose", ["--version"], { stdio: "ignore" });
  if (legacy.status === 0) {
    composeCommand = ["docker-compose"];
    return;
  }

  throw new Error("Docker Compose is not installed");
}

function compose(args) {
  run(composeCommand[0], [
    ...composeCommand.slice(1),
    "-f",
    composeFile,
    ...args,
  ]);
}

function waitForSsh() {
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    const result = spawnSync(
      process.execPath,
      ["dist/cli.js", "exec", "hostname", "--config", config],
      { stdio: attempt === 20 ? "inherit" : "ignore" },
    );
    if (result.status === 0) return;
    console.log(`Waiting for SSH hosts (${attempt}/20)...`);
    spawnSync(process.execPath, ["-e", "setTimeout(()=>{}, 1000)"]);
  }
  throw new Error("Docker SSH hosts did not become ready in time");
}

let failure;

try {
  run("docker", ["--version"]);
  configureCompose();
  run("npm", ["run", "build"]);
  compose(["up", "-d", "--build"]);
  waitForSsh();

  fleet(["list"]);
  fleet(["exec", "hostname && uptime"]);
  fleet(["exec", "uname -a", "--hosts", "tag:web", "--output", "json"]);
  fleet(["run", "examples/docker-demo/health-check.sh", "--fail-fast"]);

  writeFileSync(fixture, "SSH Fleet judge transfer\n");
  fleet(["copy", "push", fixture, "/tmp/ssh-fleet-judge.txt", "--overwrite"]);
  fleet(["copy", "pull", "/tmp/ssh-fleet-judge.txt", pulled]);
  console.log("\nSSH Fleet judge walkthrough passed.");
} catch (error) {
  failure = error;
} finally {
  rmSync(fixture, { force: true });
  rmSync(`${pulled}.web-1`, { force: true });
  rmSync(`${pulled}.web-2`, { force: true });
  spawnSync(
    composeCommand[0],
    [...composeCommand.slice(1), "-f", composeFile, "down", "--volumes", "--remove-orphans"],
    { stdio: "inherit" },
  );
}

if (failure) {
  console.error(`\nJudge walkthrough failed: ${failure.message}`);
  console.error("Install and start Docker, then run npm run judge again.");
  process.exitCode = 1;
}
