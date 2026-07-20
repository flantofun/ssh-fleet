import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { parseArgs, optString, optInt, optBool } from "../src/utils/args.js";

describe("parseArgs", () => {
  it("parses --flag", () => {
    const r = parseArgs(["--verbose"]);
    assert.equal(r.options.verbose, true);
    assert.deepEqual(r.positional, []);
  });

  it("parses --key=value", () => {
    const r = parseArgs(["--hosts=web-1,web-2"]);
    assert.equal(r.options.hosts, "web-1,web-2");
  });

  it("parses --key value", () => {
    const r = parseArgs(["--output", "json"]);
    assert.equal(r.options.output, "json");
  });

  it("parses short -k value", () => {
    const r = parseArgs(["-c", "4"]);
    assert.equal(r.options.c, "4");
  });

  it("parses short -k=value", () => {
    const r = parseArgs(["-c=4"]);
    assert.equal(r.options.c, "4");
  });

  it("collects positional args", () => {
    const r = parseArgs(["exec", "uptime", "--hosts", "all"]);
    assert.deepEqual(r.positional, ["exec", "uptime"]);
    assert.equal(r.options.hosts, "all");
  });

  it("treats -- as terminator", () => {
    const r = parseArgs(["exec", "--", "--weird-flag"]);
    assert.deepEqual(r.positional, ["exec", "--weird-flag"]);
  });

  it("does not consume next flag as value", () => {
    const r = parseArgs(["--flag", "--other"]);
    assert.equal(r.options.flag, true);
    assert.equal(r.options.other, true);
  });
});

describe("opt helpers", () => {
  const args = parseArgs(["--host", "web-1", "--port", "22", "--verbose"]);

  it("optString", () => {
    assert.equal(optString(args, "host"), "web-1");
    assert.equal(optString(args, "missing"), undefined);
  });

  it("optInt", () => {
    assert.equal(optInt(args, "port"), 22);
    assert.equal(optInt(args, "missing"), undefined);
  });

  it("optInt returns undefined for NaN", () => {
    const a = parseArgs(["--port", "abc"]);
    assert.equal(optInt(a, "port"), undefined);
  });

  it("optBool", () => {
    assert.equal(optBool(args, "verbose"), true);
    assert.equal(optBool(args, "missing"), false);
  });
});
