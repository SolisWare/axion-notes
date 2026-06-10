/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
const { spawn } = require("node:child_process");

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const electronPath = require("electron");
const child = spawn(electronPath, ["."], {
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
