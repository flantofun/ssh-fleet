import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import YAML from "../src/utils/yaml.js";

describe("YAML.parse", () => {
  it("parses a simple mapping", () => {
    const r = YAML.parse("a: 1\nb: hello") as Record<string, unknown>;
    assert.equal(r.a, 1);
    assert.equal(r.b, "hello");
  });

  it("parses inline list", () => {
    const r = YAML.parse("tags: [web, prod]") as Record<string, unknown>;
    assert.deepEqual(r.tags, ["web", "prod"]);
  });

  it("parses block list of objects", () => {
    const r = YAML.parse(`
hosts:
  - name: web-1
    host: 1.2.3.4
    tags: [web]
  - name: db-1
    host: 5.6.7.8
`) as Record<string, unknown>;
    const hosts = r.hosts as Record<string, unknown>[];
    assert.equal(hosts.length, 2);
    assert.equal(hosts[0].name, "web-1");
    assert.equal(hosts[0].host, "1.2.3.4");
    assert.deepEqual(hosts[0].tags, ["web"]);
    assert.equal(hosts[1].name, "db-1");
  });

  it("parses nested objects", () => {
    const r = YAML.parse(`
defaults:
  user: root
  port: 22
`) as Record<string, unknown>;
    const d = r.defaults as Record<string, unknown>;
    assert.equal(d.user, "root");
    assert.equal(d.port, 22);
  });

  it("handles comments and blank lines", () => {
    const r = YAML.parse(`
# comment
a: 1

b: 2 # trailing
`) as Record<string, unknown>;
    assert.equal(r.a, 1);
    assert.equal(r.b, 2);
  });

  it("handles booleans and null", () => {
    const r = YAML.parse("a: true\nb: false\nc: null\nd: ~") as Record<string, unknown>;
    assert.equal(r.a, true);
    assert.equal(r.b, false);
    assert.equal(r.c, null);
    assert.equal(r.d, null);
  });
});
