/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
const { spawnSync } = require("child_process");
const path = require("path");

const reportDirectory = "test-results/fuzz";
const reportPath = path.join(reportDirectory, "fuzz-report.json");
const vitestPath = path.join(process.cwd(), "node_modules", "vitest", "vitest.mjs");
const result = spawnSync(process.execPath, [
  vitestPath,
  "run",
  "tests/fuzz",
  "--reporter=verbose",
  "--reporter=json",
  `--outputFile.json=${reportPath}`
], {
  env: process.env,
  stdio: "inherit"
});

require("./writeFuzzHtmlReport.cjs")(reportPath, path.join(reportDirectory, "fuzz-report.html"));

process.exit(result.status ?? 1);
