/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const [command, ...args] = process.argv.slice(2);

if (!["build", "start"].includes(command)) {
  console.error("Usage: node src/utils/app-version/reactScripts.cjs <build|start>");
  process.exit(1);
}

const rootDir = process.cwd();
const appVersionConfigPath = path.join(rootDir, "app-version-config.json");
const appVersionConfig = JSON.parse(fs.readFileSync(appVersionConfigPath, "utf-8"));
const reactScriptsPath = require.resolve("react-scripts/bin/react-scripts.js");
const env = {
  ...process.env,
  REACT_APP_APP_VERSION_CONFIG: JSON.stringify(appVersionConfig)
};

if (command === "build" && env.PUBLIC_URL === undefined) {
  env.PUBLIC_URL = "./";
}

const child = spawn(process.execPath, [reactScriptsPath, command, ...args], {
  env,
  stdio: "inherit"
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
