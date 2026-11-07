/// <reference types="node" />
// @vitest-environment node
// cspell:ignore gpgsign
// biome-ignore-all lint/correctness/noNodejsModules: exercises release commands in disposable Git repositories.
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import process from "node:process";
import { afterEach, expect, it } from "vitest";

const root = resolve(".");
const fixtures: string[] = [];
const gitPath = spawnSync("which", ["git"], { encoding: "utf8" }).stdout.trim();
const gitVariables = spawnSync(gitPath, ["rev-parse", "--local-env-vars"], { encoding: "utf8" })
  .stdout.trim()
  .split("\n");

function fixture() {
  const cwd = mkdtempSync(join(tmpdir(), "release-test-"));
  fixtures.push(cwd);
  const env: NodeJS.ProcessEnv = { ...process.env };
  for (const name of gitVariables) delete env[name];
  // The fixture must also ignore Git configuration inherited from a commit hook.
  env.GIT_CONFIG_GLOBAL = "/dev/null";
  env.GIT_CONFIG_NOSYSTEM = "1";
  const run = (command: string, args: string[]) => spawnSync(command, args, { cwd, env, encoding: "utf8" });
  const git = (...args: string[]) => {
    const result = run(gitPath, [
      "-c",
      "core.hooksPath=/dev/null",
      "-c",
      "commit.gpgsign=false",
      "-c",
      "user.name=Release Tester",
      "-c",
      "user.email=release@example.test",
      ...args,
    ]);
    if (result.status !== 0) throw new Error(result.stderr);
    return result.stdout.trim();
  };
  mkdirSync(join(cwd, ".github/scripts"), { recursive: true });
  mkdirSync(join(cwd, "bin"));
  for (const script of ["release-notes.sh", "tag-release.sh"]) {
    copyFileSync(join(root, ".github/scripts", script), join(cwd, ".github/scripts", script));
  }
  writeFileSync(join(cwd, "package.json"), '{"name":"release-fixture","version":"0.4.0"}\n');
  writeFileSync(join(cwd, "CHANGELOG.md"), "# Changelog\n\n## [Unreleased]\n\n### Fixed\n\n- Fix a bug.\n");
  git("init", "--initial-branch=main");
  git("add", "package.json", "CHANGELOG.md", ".github/scripts/release-notes.sh", ".github/scripts/tag-release.sh");
  git("commit", "-m", "test: initial fixture");
  git("update-ref", "refs/remotes/origin/main", "HEAD");
  // Only network and signing calls are faked; preparation uses real Git commits.
  writeFileSync(
    join(cwd, "bin/git"),
    `#!/usr/bin/env bash
case "$1" in
  fetch) exit 0 ;;
  tag) if [ "$2" = --sign ]; then echo sign >> release-actions; exit 0; fi ;;
  verify-tag) exit 0 ;;
  push) echo push >> release-actions; exit 0 ;;
esac
exec "$RELEASE_TEST_GIT" -c core.hooksPath=/dev/null -c commit.gpgsign=false -c user.name="Release Tester" -c user.email=release@example.test "$@"
`,
    { mode: 0o755 },
  );
  Object.assign(env, { PATH: `${join(cwd, "bin")}:${process.env.PATH}`, RELEASE_TEST_GIT: gitPath });
  return { cwd, run, git };
}

afterEach(() => {
  for (const cwd of fixtures.splice(0)) rmSync(cwd, { recursive: true, force: true });
});

it("prepares and commits the manifest version with the release changelog", () => {
  const { cwd, run, git } = fixture();
  // Run the real recipe body without requiring just in the Node CI job.
  const recipe = readFileSync(join(root, "justfile"), "utf8").split("release version:\n")[1]?.split("\n# Protect")[0];
  expect(recipe).toBeDefined();
  const result = run("bash", ["-c", recipe?.replaceAll("{{ version }}", "0.5.0") ?? "exit 1"]);
  expect(result.status, result.stderr).toBe(0);
  expect(JSON.parse(readFileSync(join(cwd, "package.json"), "utf8")).version).toBe("0.5.0");
  expect(git("show", "HEAD:package.json")).toContain('"0.5.0"');
  expect(git("show", "HEAD:CHANGELOG.md")).toContain("## [0.5.0] - ");
  expect(git("diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD").split("\n")).toEqual([
    "CHANGELOG.md",
    "package.json",
  ]);
  expect(git("status", "--porcelain", "--untracked-files=no")).toBe("");
});

it("refuses a mismatched manifest before signing or pushing a release tag", () => {
  const { cwd, run, git } = fixture();
  writeFileSync(join(cwd, "CHANGELOG.md"), "## [0.5.0] - 2026-01-01\n\n- Fix a bug.\n");
  git("add", "CHANGELOG.md");
  git("commit", "-m", "test: prepare mismatched release");
  git("update-ref", "refs/remotes/origin/main", "HEAD");
  const result = run("bash", [".github/scripts/tag-release.sh", "0.5.0"]);
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain("package.json version 0.4.0 does not match 0.5.0");
  expect(() => readFileSync(join(cwd, "release-actions"))).toThrow();
});
