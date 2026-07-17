import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const messageParts = args.filter((argument) => argument !== "--dry-run");
const message = messageParts.join(" ").trim();

if (
  !message ||
  message.startsWith("-") ||
  message.length > 120 ||
  /[\r\n]/u.test(message)
) {
  console.error(
    "A safe commit message is required (1-120 characters, one line, and not beginning with '-').",
  );
  process.exit(2);
}

const npm =
  process.platform === "win32" ? (process.env.ComSpec ?? "cmd.exe") : "npm";
const npmVerifyArgs =
  process.platform === "win32"
    ? ["/d", "/s", "/c", "npm run verify"]
    : ["run", "verify"];
const git = process.platform === "win32" ? "git.exe" : "git";

function render(command, commandArgs) {
  return [command.replace(/\.(cmd|exe)$/u, ""), ...commandArgs].join(" ");
}

function run(command, commandArgs, options = {}) {
  const display = options.display ?? render(command, commandArgs);

  if (dryRun) {
    console.log(`[DRY RUN] ${display}`);
    return { status: 0, stdout: "" };
  }

  console.log(`\n> ${display}`);
  const result = spawnSync(command, commandArgs, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0 && !options.allowFailure) {
    if (options.capture && result.stderr) {
      console.error(result.stderr.trim());
    }
    process.exit(result.status ?? 1);
  }

  return result;
}

run(npm, npmVerifyArgs, { display: "npm run verify" });
run(git, ["add", "--all", "--", "."], { display: "git add --all -- ." });

if (!dryRun) {
  const staged = run(git, ["diff", "--cached", "--quiet"], {
    allowFailure: true,
    capture: true,
  });

  if (staged.status === 0) {
    console.log("No staged changes; checkpoint is already up to date.");
    process.exit(0);
  }
}

run(git, ["commit", "-m", message], {
  display: `git commit -m ${message}`,
});

if (dryRun) {
  run(git, ["push"], { display: "git push" });
  process.exit(0);
}

const branchResult = run(git, ["branch", "--show-current"], { capture: true });
const branch = branchResult.stdout.trim();

if (!branch) {
  console.error("Cannot push a detached HEAD. Check out a branch and retry.");
  process.exit(1);
}

const upstream = run(
  git,
  ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"],
  { allowFailure: true, capture: true },
);

if (upstream.status === 0) {
  run(git, ["push"]);
} else {
  run(git, ["push", "--set-upstream", "origin", branch]);
}

console.log(`Checkpoint published from ${branch}.`);
