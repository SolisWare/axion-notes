/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 *
 * @author Michael Polowczuk
 */
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const [command, ...args] = process.argv.slice(2);

if (!["build", "start"].includes(command)) {
  console.error("Usage: node src/utils/app-version/vite.cjs <build|start>");
  process.exit(1);
}

const rootDir = process.cwd();
const appVersionConfigPath = path.join(rootDir, "app-version-config.json");
const appVersionConfig = JSON.parse(fs.readFileSync(appVersionConfigPath, "utf-8"));
const vitePath = path.join(path.dirname(require.resolve("vite/package.json")), "bin", "vite.js");
const viteArgs = command === "build" ? ["build", ...args] : args;
const env = {
  ...process.env,
  VITE_APP_VERSION_CONFIG: JSON.stringify(appVersionConfig)
};

const child = spawn(process.execPath, [vitePath, ...viteArgs], {
  env,
  stdio: "inherit"
});

function stopChild(signal) {
  if (!child.killed) {
    child.kill(signal);
  }
}

process.once("SIGINT", () => stopChild("SIGINT"));
process.once("SIGTERM", () => stopChild("SIGTERM"));

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
