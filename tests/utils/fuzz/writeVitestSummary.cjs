/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
const fs = require("fs");

const reportPath = process.argv[2];
const summaryPath = process.env.GITHUB_STEP_SUMMARY;

if (!summaryPath) {
  process.exit(0);
}

function writeSummary(markdown) {
  fs.appendFileSync(summaryPath, `${markdown}\n`);
}

if (!reportPath || !fs.existsSync(reportPath)) {
  writeSummary("## Encryption Fuzz Test Report\n\n- Fuzz JSON report was not found.");
  process.exit(0);
}

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const testResults = report.testResults || [];
const failedAssertions = (report.testResults || [])
  .flatMap((result) => result.assertionResults || [])
  .filter((assertion) => assertion.status === "failed");
const passedFiles = testResults.filter((result) => result.status === "passed").length;
const failedFiles = testResults.filter((result) => result.status === "failed").length;
const summary = [
  "## Encryption Fuzz Test Report",
  "",
  `- **Test files:** ${passedFiles} passed · ${failedFiles} failed · ${testResults.length} total`,
  `- **Tests:** ${report.numPassedTests || 0} passed · ${report.numFailedTests || 0} failed · ${report.numTotalTests || 0} total`
];

if (failedAssertions.length > 0) {
  summary.push("", "### Failures");

  failedAssertions.forEach((assertion) => {
    const failureMessage = (assertion.failureMessages || []).join("\n").slice(0, 8_000);
    summary.push("", `#### ${assertion.fullName}`, "", "```text", failureMessage, "```");
  });
}

writeSummary(summary.join("\n"));
