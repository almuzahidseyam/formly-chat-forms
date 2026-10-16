import { spawn } from "node:child_process";
import { setTimeout } from "node:timers/promises";

const base = "http://127.0.0.1:3100";
const server = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3100"],
  { stdio: "inherit", env: { ...process.env, ALLOW_HTTP_COOKIES: "true" } },
);
let result = 1;
try {
  const deadline = Date.now() + 60000;
  let ready = false;
  while (Date.now() < deadline && server.exitCode === null) {
    try {
      if ((await fetch(`${base}/api/health`)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await setTimeout(500);
  }
  if (!ready) throw new Error("Production server did not become ready within 60 seconds.");
  const tests = spawn(
    process.execPath,
    ["node_modules/tsx/dist/cli.mjs", "--test", "tests/integration/*.test.ts"],
    { stdio: "inherit", env: { ...process.env, TEST_BASE_URL: base } },
  );
  result = await new Promise((resolve) => tests.on("exit", (code) => resolve(code ?? 1)));
} catch (error) {
  console.error(error.message);
} finally {
  server.kill();
}
process.exitCode = result;
