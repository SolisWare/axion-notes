/**
 * Copyright (c) 2026 SolisWare and contributors.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
const fs = require("fs");

const reportPath = process.argv[2];
const reportTitle = process.argv[3] || "Playwright Test Report";
const summaryPath = process.env.GITHUB_STEP_SUMMARY;

if (!summaryPath) {
  process.exit(0);
}

function collectSpecs(suites, specs = []) {
  for (const suite of suites || []) {
    specs.push(...(suite.specs || []));
    collectSpecs(suite.suites, specs);
  }

  return specs;
}

function getSpecStatus(spec) {
  const tests = spec.tests || [];
  const results = tests.flatMap((test) => test.results || []);

  if (results.some((result) => result.status === "failed" || result.status === "timedOut" || result.status === "interrupted")) {
    return "failed";
  }

  if (results.some((result) => result.status === "passed")) {
    return "passed";
  }

  if (tests.some((test) => test.outcome === "skipped") || results.some((result) => result.status === "skipped")) {
    return "skipped";
  }

  return "unknown";
}

function formatStatus(label, passed, failed, skipped, total) {
  const parts = [];

  if (passed > 0) {
    parts.push(`✅ ${passed} passed`);
  }

  if (failed > 0) {
    parts.push(`❌ ${failed} failed`);
  }

  if (skipped > 0) {
    parts.push(`⏭️ ${skipped} skipped`);
  }

  if (parts.length === 0) {
    parts.push(`${total} total`);
  } else {
    parts.push(`${total} total`);
  }

  return `- **${label}:** ${parts.join(" · ")}`;
}

function writeSummary(markdown) {
  fs.appendFileSync(summaryPath, `${markdown}\n`);
}

if (!reportPath || !fs.existsSync(reportPath)) {
  writeSummary(`## ${reportTitle}\n\n### Summary\n\n- Playwright JSON report was not found.\n\n_Job summary generated at run-time_`);
  process.exit(0);
}

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const stats = report.stats || {};
const specs = collectSpecs(report.suites);
const specStatuses = specs.map(getSpecStatus);
const passedFiles = specStatuses.filter((status) => status === "passed").length;
const failedFiles = specStatuses.filter((status) => status === "failed").length;
const skippedFiles = specStatuses.filter((status) => status === "skipped").length;
const totalFiles = specs.length;
const passedTests = stats.expected || 0;
const failedTests = stats.unexpected || 0;
const skippedTests = stats.skipped || 0;
const flakyTests = stats.flaky || 0;
const totalTests = passedTests + failedTests + skippedTests + flakyTests;

writeSummary([
  `## ${reportTitle}`,
  "",
  "### Summary",
  "",
  formatStatus("Test Files", passedFiles, failedFiles, skippedFiles, totalFiles),
  formatStatus("Test Results", passedTests + flakyTests, failedTests, skippedTests, totalTests),
  "",
  "_Job summary generated at run-time_"
].join("\n"));
