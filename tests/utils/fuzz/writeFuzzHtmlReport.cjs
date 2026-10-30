/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
const fs = require("fs");
const path = require("path");

module.exports = function writeFuzzHtmlReport(reportPath, htmlPath) {
  if (!fs.existsSync(reportPath)) {
    return;
  }

  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  const testResults = report.testResults || [];
  const assertions = testResults.flatMap((result) => result.assertionResults || []);
  const passed = assertions.filter((assertion) => assertion.status === "passed").length;
  const failed = assertions.filter((assertion) => assertion.status === "failed").length;
  const escapedAssertions = assertions.map((assertion) => {
    const failureMessages = (assertion.failureMessages || []).join("\n");
    const details = failureMessages
      ? `<details><summary>Failure details</summary><pre>${escapeHtml(failureMessages)}</pre></details>`
      : "";

    return `
      <article class="test ${escapeHtml(assertion.status)}">
        <div class="test-header">
          <span class="status">${statusIcon(assertion.status)} ${escapeHtml(assertion.status)}</span>
          <span class="duration">${formatDuration(assertion.duration)}</span>
        </div>
        <h3>${escapeHtml(assertion.fullName)}</h3>
        ${details}
      </article>`;
  }).join("\n");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Axion Notes Fuzz Test Report</title>
  <style>
    :root { color-scheme: light dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
    body { margin: 0; background: #f6f8fa; color: #1f2328; }
    main { max-width: 960px; margin: 0 auto; padding: 48px 24px; }
    h1 { margin: 0 0 8px; font-size: 2rem; }
    .subtitle { color: #59636e; margin: 0 0 28px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 28px; }
    .metric, .test { background: #fff; border: 1px solid #d0d7de; border-radius: 10px; box-shadow: 0 1px 2px #1f23280a; }
    .metric { padding: 16px; }
    .metric strong { display: block; font-size: 1.5rem; }
    .tests { display: grid; gap: 12px; }
    .test { padding: 18px; border-left: 5px solid #1f883d; }
    .test.failed { border-left-color: #cf222e; }
    .test.skipped, .test.pending { border-left-color: #9a6700; }
    .test-header { display: flex; justify-content: space-between; gap: 16px; color: #59636e; font-size: .875rem; text-transform: capitalize; }
    h3 { margin: 10px 0 0; font-size: 1rem; overflow-wrap: anywhere; }
    details { margin-top: 16px; }
    pre { white-space: pre-wrap; overflow-wrap: anywhere; padding: 12px; background: #fff8f8; border-radius: 6px; color: #82071e; }
    footer { color: #59636e; font-size: .875rem; margin-top: 28px; }
    @media (prefers-color-scheme: dark) { body { background: #0d1117; color: #f0f6fc; } .metric, .test { background: #161b22; border-color: #30363d; } .subtitle, .test-header, footer { color: #8b949e; } pre { background: #2d1115; color: #ffb4ab; } }
  </style>
</head>
<body>
  <main>
    <h1>Axion Notes Fuzz Test Report</h1>
    <p class="subtitle">Generated ${formatGeneratedTimestamp(new Date())}</p>
    <section class="summary" aria-label="Test summary">
      <div class="metric"><strong>${testResults.length}</strong>test files</div>
      <div class="metric"><strong>${passed}</strong>passed</div>
      <div class="metric"><strong>${failed}</strong>failed</div>
      <div class="metric"><strong>${report.numTotalTests || assertions.length}</strong>total tests</div>
    </section>
    <section class="tests" aria-label="Test results">${escapedAssertions}</section>
    <footer>Open this file directly in a browser. Failure details include reproducible fast-check seeds when available.</footer>
  </main>
</body>
</html>`;

  fs.mkdirSync(path.dirname(htmlPath), { recursive: true });
  fs.writeFileSync(htmlPath, html, "utf8");
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDuration(duration) {
  return typeof duration === "number" ? `${Math.round(duration)} ms` : "";
}

function statusIcon(status) {
  return status === "passed" ? "✓" : status === "failed" ? "✗" : "•";
}

function formatGeneratedTimestamp(date) {
  const hour = date.getUTCHours();
  const period = hour < 12 ? "AM" : "PM";
  const twelveHour = hour % 12 || 12;

  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}/${date.getUTCFullYear()}`
    + ` at ${twelveHour}:${String(date.getUTCMinutes()).padStart(2, "0")} ${period} (UTC)`;
}
