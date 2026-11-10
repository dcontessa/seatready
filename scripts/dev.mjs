import { spawn } from "node:child_process";
const children = [
  spawn("npm", ["run", "dev:api"], { stdio: "inherit" }),
  spawn("npm", ["run", "dev:ui"], { stdio: "inherit" }),
];
let closing = false;
function stop(code = 0) {
  if (closing) return;
  closing = true;
  children.forEach((p) => p.kill("SIGTERM"));
  process.exitCode = code;
}
children.forEach((p) => p.on("exit", (code) => stop(code ?? 0)));
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
