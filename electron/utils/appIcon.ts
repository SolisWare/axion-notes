/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as path from "path";
import * as fs from "fs";
import { isDev } from "./isDev";

export function getAppIconPath(): string {
  const iconFileName = "axion_notes_icon512.png";
  const candidatePaths = isDev
    ? [
        path.join(process.cwd(), "public", iconFileName),
        path.join(__dirname, "../", iconFileName)
      ]
    : [
        path.join(__dirname, "../", iconFileName),
        path.join(process.cwd(), "public", iconFileName)
      ];

  return candidatePaths.find((candidatePath) => fs.existsSync(candidatePath)) ?? candidatePaths[0];
}
