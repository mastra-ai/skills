import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const script = join(dirname(fileURLToPath(import.meta.url)), "provider-registry.mjs");

function createProject(t) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "provider-registry-")));
  t.after(() => rmSync(root, { recursive: true }));
  const project = join(root, "project");
  const installedScript = join(root, "provider-registry.mjs");
  mkdirSync(project);
  copyFileSync(script, installedScript);
  return {
    project,
    run: (cwd = project) => spawnSync(process.execPath, [installedScript, "--list"], { cwd, encoding: "utf8" }),
  };
}

function writeRegistry(core, provider = "test") {
  mkdirSync(join(core, "dist"), { recursive: true });
  writeFileSync(
    join(core, "dist/provider-registry.json"),
    JSON.stringify({ providers: { [provider]: { name: "Test", models: ["test-1"] } } }),
  );
}

function createIsolatedCore(project) {
  const store = join(project, "node_modules/.bun/@mastra+core@1.65.0/node_modules/@mastra/core");
  writeRegistry(store);
  return store;
}

function linkCore(project, workspace, store) {
  const linkedCore = join(project, workspace, "node_modules/@mastra/core");
  mkdirSync(dirname(linkedCore), { recursive: true });
  symlinkSync(store, linkedCore, "dir");
}

test("finds @mastra/core in an isolated-linker workspace", (t) => {
  const { project, run } = createProject(t);
  linkCore(project, "apps/core", createIsolatedCore(project));

  const result = run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /test\s+Test\s+1/);
});

test("accepts two workspace links to the same registry", (t) => {
  const { project, run } = createProject(t);
  const store = createIsolatedCore(project);
  linkCore(project, "apps/api", store);
  linkCore(project, "apps/web", store);

  const result = run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /test\s+Test\s+1/);
});

test("reports distinct fallback installations and lets the caller select an app by cwd", (t) => {
  const { project, run } = createProject(t);
  linkCore(project, "apps/api", createIsolatedCore(project));
  const backup = join(project, "backup/node_modules/@mastra/core");
  writeRegistry(backup, "old");

  const result = run();
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /Multiple @mastra\/core installations found/);
  assert.ok(result.stderr.includes(join(project, "apps/api/node_modules/@mastra/core/dist/provider-registry.json")));
  assert.ok(result.stderr.includes(join(backup, "dist/provider-registry.json")));
  assert.match(result.stderr, /Run this command from the application directory/);

  const appResult = run(join(project, "apps/api"));
  assert.equal(appResult.status, 0, appResult.stderr);
  assert.match(appResult.stdout, /test\s+Test\s+1/);
});

test("prefers a direct cwd installation over a nested one", (t) => {
  const { project, run } = createProject(t);
  writeRegistry(join(project, "node_modules/@mastra/core"), "direct");
  linkCore(project, "apps/api", createIsolatedCore(project));

  const result = run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /direct\s+Test\s+1/);
});

test("preserves the missing-registry error with no linked installation", (t) => {
  const { project, run } = createProject(t);
  createIsolatedCore(project);

  const result = run();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Error: Could not load provider registry/);
  assert.ok(result.stderr.includes(join(project, "node_modules/@mastra/core/dist/provider-registry.json")));
  assert.match(result.stderr, /ENOENT/);
});
