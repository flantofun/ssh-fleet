import { strict as assert } from "node:assert";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { initCommand } from "../src/commands/init.js";

describe("init command", () => {
  it("creates a config at an absolute target path", () => {
    const root = mkdtempSync(join(tmpdir(), "ssh-fleet-init-"));
    const target = join(root, "nested");

    const originalLog = console.log;
    console.log = () => {};
    try {
      initCommand({ path: target });
    } finally {
      console.log = originalLog;
    }

    assert.equal(existsSync(join(target, "ssh-fleet.yml")), true);
  });
});
