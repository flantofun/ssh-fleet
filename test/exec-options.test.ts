import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { parseArgs, optInt, optBool, optString } from "../src/utils/args.js";

describe("exec options parsing", () => {
  it("parses concurrency as integer", () => {
    const a = parseArgs(["--concurrency", "4"]);
    assert.equal(optInt(a, "concurrency", "c"), 4);
  });

  it("parses short -c as integer", () => {
    const a = parseArgs(["-c", "16"]);
    assert.equal(optInt(a, "concurrency", "c"), 16);
  });

  it("parses timeout in milliseconds", () => {
    const a = parseArgs(["--timeout", "5000"]);
    assert.equal(optInt(a, "timeout", "t"), 5000);
  });

  it("parses sequential flag", () => {
    const a = parseArgs(["--seq"]);
    assert.equal(optBool(a, "sequential", "seq"), true);
  });

  it("parses fail-fast flag", () => {
    const a = parseArgs(["-f"]);
    assert.equal(optBool(a, "fail-fast", "f"), true);
  });

  it("parses output mode", () => {
    const a = parseArgs(["-o", "json"]);
    assert.equal(optString(a, "output", "o"), "json");
  });

  it("parses host selector", () => {
    const a = parseArgs(["--hosts", "tag:prod"]);
    assert.equal(optString(a, "hosts", "selector"), "tag:prod");
  });

  it("handles unknown options gracefully", () => {
    const a = parseArgs(["--unknown-flag", "value", "exec", "uptime"]);
    assert.equal(a.options["unknown-flag"], "value");
    assert.deepEqual(a.positional, ["exec", "uptime"]);
  });
});

describe("multiple options together", () => {
  it("parses complex command line", () => {
    const a = parseArgs([
      "exec", "docker ps",
      "--hosts", "tag:web",
      "-c", "2",
      "--timeout", "30000",
      "-o", "json",
      "-f",
    ]);
    assert.deepEqual(a.positional, ["exec", "docker ps"]);
    assert.equal(optString(a, "hosts"), "tag:web");
    assert.equal(optInt(a, "concurrency", "c"), 2);
    assert.equal(optInt(a, "timeout", "t"), 30000);
    assert.equal(optString(a, "output", "o"), "json");
    assert.equal(optBool(a, "fail-fast", "f"), true);
  });
});
