/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    clearMocks: true,
    coverage: {
      all: true,
      exclude: [
        "src/**/*.d.ts",
        "src/index.tsx",
        "src/setupTests.ts"
      ],
      include: [
        "electron/**/*.ts",
        "src/**/*.{ts,tsx}"
      ],
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "test-results/coverage"
    },
    css: true,
    environment: "jsdom",
    globals: true,
    include: [
      "tests/unit/**/*.{test,spec}.{ts,tsx}",
      "tests/integration/**/*.{test,spec}.{ts,tsx}",
      "tests/fuzz/**/*.{test,spec}.{ts,tsx}"
    ],
    passWithNoTests: true,
    restoreMocks: true,
    setupFiles: [
      "./tests/setup/vitest.ts"
    ]
  }
});
