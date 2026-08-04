import { spawn } from "node:child_process";

const api = spawn("npm.cmd", ["run", "dev"], {
  cwd: "./apps/api",
  stdio: "inherit",
  shell: true,
});

const web = spawn("npm.cmd", ["run", "dev"], {
  cwd: "./apps/web",
  stdio: "inherit",
  shell: true,
});

function close() {
  api.kill();
  web.kill();
  process.exit();
}

process.on("SIGINT", close);
process.on("SIGTERM", close);