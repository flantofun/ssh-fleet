import { strict as assert } from "node:assert";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { listCommand } from "../src/commands/list.js";

describe("list command", () => {
  it("loads an explicit config path", () => {
    const dir = mkdtempSync(join(tmpdir(), "ssh-fleet-list-"));
    const path = join(dir, "custom.yml");
    writeFileSync(path, "hosts:\n  - name: demo\n    host: 127.0.0.1\n");

    const lines: string[] = [];
    const originalLog = console.log;
    console.log = (...values: unknown[]) => lines.push(values.join(" "));
    try {
      listCommand({ config: path });
    } finally {
      console.log = originalLog;
    }

    assert.match(lines.join("\n"), /Fleet hosts:\s+1 host\(s\)/);
    assert.match(lines.join("\n"), /demo/);
    assert.match(lines.join("\n"), new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  });
});
