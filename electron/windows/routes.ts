/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import type { LoadFileOptions } from "electron";
import * as path from "path";
import { createFileRoute, createURLRoute } from "electron-router-dom";

export const dev = (handle: string): string => {
  return createURLRoute(
    "http://localhost:3000",
    handle
  ).toString();
};

export const production = (handle: string): [string, LoadFileOptions] => {
  return createFileRoute(
    path.join(__dirname, "../index.html"),
    handle
  );
};
