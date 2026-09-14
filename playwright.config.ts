/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { defineConfig } from "@playwright/test";

const shouldStartWebServer = process.env.AXION_NOTES_E2E_START_WEB_SERVER === "1";

export default defineConfig({
  fullyParallel: false,
  reporter: "list",
  testDir: "./tests/e2e",
  timeout: 30000,
  use: {
    trace: "on-first-retry"
  },
  projects: [
    {
      name: "desktop",
      testDir: "./tests/e2e/desktop"
    },
    {
      name: "web",
      testDir: "./tests/e2e/web",
      use: {
        baseURL: "http://127.0.0.1:3000"
      }
    }
  ],
  ...(shouldStartWebServer
    ? {
      webServer: {
        command: "./node_modules/.bin/cross-env HOST=127.0.0.1 BROWSER=none npm run start:web",
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
        url: "http://127.0.0.1:3000"
      }
    }
    : {})
});
