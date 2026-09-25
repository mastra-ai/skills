import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const script = join(dirname(fileURLToPath(import.meta.url)), "provider-registry.mjs");

test("finds @mastra/core in an isolated-linker workspace", (t) => {
  const root = mkdtempSync(join(tmpdir(), "provider-registry-"));
  t.after(() => rmSync(root, { recursive: true }));
  const store = join(root, "node_modules/.bun/@mastra+core@1.65.0/node_modules/@mastra/core");
  const linkedCore = join(root, "apps/core/node_modules/@mastra/core");

  mkdirSync(join(store, "dist"), { recursive: true });
  mkdirSync(dirname(linkedCore), { recursive: true });
  writeFileSync(
    join(store, "dist/provider-registry.json"),
    JSON.stringify({ providers: { test: { name: "Test", models: ["test-1"] } } }),
  );
  symlinkSync(store, linkedCore, "dir");

  const result = spawnSync(process.execPath, [script, "--list"], { cwd: root, encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /test\s+Test\s+1/);
});
