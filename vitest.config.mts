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
    css: true,
    environment: "jsdom",
    globals: true,
    include: [
      "tests/unit/**/*.{test,spec}.{ts,tsx}",
      "tests/integration/**/*.{test,spec}.{ts,tsx}",
      "tests/regression/**/*.{test,spec}.{ts,tsx}"
    ],
    passWithNoTests: true,
    restoreMocks: true,
    setupFiles: [
      "./tests/setup/vitest.ts"
    ]
  }
});
