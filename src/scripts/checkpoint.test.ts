import { spawnSync } from "node:child_process";
import path from "node:path";

import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "../..");

describe("checkpoint automation", () => {
  it("prints every release gate without mutating Git during a dry run", () => {
    const result = spawnSync(
      process.execPath,
      ["scripts/checkpoint.mjs", "--dry-run", "feat: verify checkpoint"],
      {
        cwd: projectRoot,
        encoding: "utf8",
      },
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("npm run verify");
    expect(result.stdout).toContain("git add --all -- .");
    expect(result.stdout).toContain("git commit -m feat: verify checkpoint");
    expect(result.stdout).toContain("git push");
    expect(result.stdout).toContain("DRY RUN");
  });

  it("rejects an unsafe or missing commit message", () => {
    const result = spawnSync(
      process.execPath,
      ["scripts/checkpoint.mjs", "--dry-run", "-m"],
      {
        cwd: projectRoot,
        encoding: "utf8",
      },
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("commit message");
  });
});
