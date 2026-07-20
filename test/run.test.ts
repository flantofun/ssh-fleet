import { strict as assert } from "node:assert";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { loadScript } from "../src/commands/run.js";

describe("run command script loading", () => {
  it("loads a multiline script without changing its contents", () => {
    const dir = mkdtempSync(join(tmpdir(), "ssh-fleet-"));
    const path = join(dir, "deploy.sh");
    const contents = "set -e\necho deploying\nuname -a\n";
    writeFileSync(path, contents);
    assert.equal(loadScript(path), contents);
  });

  it("removes a UTF-8 BOM", () => {
    const dir = mkdtempSync(join(tmpdir(), "ssh-fleet-"));
    const path = join(dir, "check.sh");
    writeFileSync(path, "\uFEFF#!/bin/sh\necho ok\n");
    assert.equal(loadScript(path), "#!/bin/sh\necho ok\n");
  });

  it("rejects an empty script", () => {
    const dir = mkdtempSync(join(tmpdir(), "ssh-fleet-"));
    const path = join(dir, "empty.sh");
    writeFileSync(path, "  \n");
    assert.throws(() => loadScript(path), /Script is empty/);
  });
});
