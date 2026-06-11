#!/usr/bin/env node
/**
 * finish-worktree — merge a worktree branch back into main, then clean up.
 *
 * Steps (each one stops the script and reports if it fails):
 *   1. Merge the worktree's branch into `main`.
 *   2. Remove the worktree and delete its (now-merged) branch.
 *   3. Prune stale worktree entries and unreachable git objects.
 *
 * Usage:
 *   node scripts/finish-worktree.mjs            # finish the current worktree
 *   node scripts/finish-worktree.mjs <branch>   # finish the worktree for <branch>
 *   npm run finish-worktree -- <branch>
 *
 * All git work is routed through `git -C <main-worktree>`, so this is safe to
 * run from anywhere — EXCEPT do not run it from a shell whose current directory
 * is inside the worktree being removed (the OS will refuse to delete a directory
 * that is in use). Run it from the main repo, or `cd` out first.
 */

import { execFileSync } from "node:child_process";

const MAIN_BRANCH = "main";

main();

function main() {
  const branch = process.argv[2] ?? currentBranch();

  if (branch === MAIN_BRANCH) {
    fail(
      "preflight",
      `Refusing to finish '${MAIN_BRANCH}' itself. Run from a worktree branch, or pass a branch name.`
    );
  }

  const worktrees = listWorktrees();
  const mainWorktree = worktrees.find((entry) => entry.branch === MAIN_BRANCH);
  if (!mainWorktree) {
    fail("preflight", `Could not find a worktree with '${MAIN_BRANCH}' checked out.`);
  }

  const target = worktrees.find((entry) => entry.branch === branch);
  if (!target) {
    fail("preflight", `Could not find a worktree for branch '${branch}'.`);
  }

  const main = mainWorktree.path;

  const targetDirty = capture(["-C", target.path, "status", "--porcelain"]).out.trim();
  if (targetDirty) {
    fail(
      "preflight",
      `Worktree has uncommitted changes — commit or stash them first:\n${target.path}\n${targetDirty}`
    );
  }

  const mainDirty = capture(["-C", main, "status", "--porcelain"]).out.trim();
  if (mainDirty) {
    fail("preflight", `The '${MAIN_BRANCH}' worktree is not clean:\n${main}\n${mainDirty}`);
  }

  console.log("finish-worktree");
  console.log(`  branch : ${branch}`);
  console.log(`  path   : ${target.path}`);
  console.log(`  into   : ${MAIN_BRANCH} (${main})`);

  // Step 1 — merge.
  banner(1, `Merge ${branch} into ${MAIN_BRANCH}`);
  const merge = capture(["-C", main, "merge", "--no-edit", branch]);
  if (!merge.ok) {
    capture(["-C", main, "merge", "--abort"]);
    fail("merge", merge.out || "git merge failed; the merge was aborted.");
  }
  console.log((merge.out.trim() || "Merged.").replace(/^/gm, "  "));

  // Step 2 — remove the worktree and its branch.
  banner(2, "Remove worktree and delete branch");
  const removed = capture(["-C", main, "worktree", "remove", target.path]);
  if (!removed.ok) {
    fail(
      "remove worktree",
      `${removed.out}\nIs a shell, editor, or process still open inside the worktree?\n${target.path}`
    );
  }
  console.log(`  Removed worktree ${target.path}`);

  const deleted = capture(["-C", main, "branch", "-d", branch]);
  if (!deleted.ok) {
    fail("delete branch", deleted.out);
  }
  console.log(`  ${deleted.out.trim()}`);

  // Step 3 — prune.
  banner(3, "Prune stale worktrees and unreachable objects");
  const wtPrune = capture(["-C", main, "worktree", "prune"]);
  if (!wtPrune.ok) {
    fail("worktree prune", wtPrune.out);
  }
  const prune = capture(["-C", main, "prune"]);
  if (!prune.ok) {
    fail("prune", prune.out);
  }
  console.log("  Pruned.");

  console.log(`\n✔ Done — '${branch}' merged into ${MAIN_BRANCH}; worktree and branch removed.`);
}

function currentBranch() {
  return run(["rev-parse", "--abbrev-ref", "HEAD"]);
}

/** Parse `git worktree list --porcelain` into { path, branch } records. */
function listWorktrees() {
  const raw = run(["worktree", "list", "--porcelain"]);
  const entries = [];
  let current = null;

  for (const line of raw.split("\n")) {
    if (line.startsWith("worktree ")) {
      if (current) {
        entries.push(current);
      }
      current = { path: line.slice("worktree ".length).trim(), branch: null };
    } else if (line.startsWith("branch ") && current) {
      current.branch = line.slice("branch ".length).trim().replace("refs/heads/", "");
    }
  }
  if (current) {
    entries.push(current);
  }

  return entries;
}

/** Run git, throwing on failure (for read-only queries we expect to succeed). */
function run(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

/** Run git, capturing output and never throwing: { ok, out }. */
function capture(args) {
  try {
    const out = execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    });
    return { ok: true, out };
  } catch (error) {
    const stdout = error.stdout ? error.stdout.toString() : "";
    const stderr = error.stderr ? error.stderr.toString() : "";
    return { ok: false, out: `${stdout}${stderr}`.trim() || String(error.message ?? error) };
  }
}

function banner(step, label) {
  console.log(`\n▶ Step ${step}: ${label}`);
}

function fail(step, message) {
  console.error(`\n✖ ${step} failed:\n${message}`);
  console.error("\nStopped. No further steps were run.");
  process.exit(1);
}
