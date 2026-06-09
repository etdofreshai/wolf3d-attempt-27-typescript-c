import { spawn } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const processes = [
  ["launcher", ["--workspace", "@wolf3d/launcher", "run", "dev", "--", "--port", "5173"]],
  ["steam", ["--workspace", "@wolf3d/dos-page", "run", "dev", "--", "--port", "5174"]],
  ["source", ["--workspace", "@wolf3d/source-dos", "run", "dev", "--", "--port", "5175"]],
  ["source-modified", ["--workspace", "@wolf3d/source-modified-dos", "run", "dev", "--", "--port", "5176"]],
  ["source-typescript", ["--workspace", "@wolf3d/source-typescript", "run", "dev", "--", "--port", "5177"]]
];

let shuttingDown = false;

const children = processes.map(([label, args]) => {
  const child = spawn(npmCommand, args, {
    shell: false,
    stdio: ["ignore", "pipe", "pipe"]
  });

  child.stdout.on("data", (chunk) => writeLines(label, chunk, false));
  child.stderr.on("data", (chunk) => writeLines(label, chunk, true));
  child.on("exit", (code) => {
    if (code && !shuttingDown) {
      console.error(`[${label}] exited with code ${code}`);
      stopAll();
    }
  });

  return child;
});

process.on("SIGINT", stopAll);
process.on("SIGTERM", stopAll);

function writeLines(label, chunk, error) {
  const lines = chunk.toString().split(/\r?\n/).filter(Boolean);
  for (const line of lines) {
    const stream = error ? process.stderr : process.stdout;
    stream.write(`[${label}] ${line}\n`);
  }
}

function stopAll() {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  for (const child of children) {
    child.kill();
  }
}
