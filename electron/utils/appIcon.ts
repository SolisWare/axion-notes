/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as path from "path";
import * as fs from "node:fs";
import { isDev } from "./isDev";

export function getAppIconPath(): string {
  const iconPathCandidates = isDev
    ? [
      path.join(process.cwd(), "public/axion_notes_icon1024.png"),
      path.join(__dirname, "../../axion_notes_icon1024.png")
    ]
    : [
      path.join(__dirname, "../../axion_notes_icon1024.png")
    ];

  const iconPath = iconPathCandidates.find((candidate) => fs.existsSync(candidate));

  if (!iconPath) {
    throw new Error(`App icon not found. Checked: ${iconPathCandidates.join(", ")}`);
  }

  return iconPath;
}
