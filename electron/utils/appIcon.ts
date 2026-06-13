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
  return resolveIconPath("axion_notes_icon1024.png");
}

// Returns the small window icon shown in the title bar and task switcher outside macOS.
export function getWindowIconPath(): string {
  return resolveIconPath("app_favicon.ico");
}

function resolveIconPath(fileName: string): string {
  const iconPathCandidates = isDev
    ? [
      path.join(process.cwd(), `public/${fileName}`),
      path.join(__dirname, `../../${fileName}`)
    ]
    : [
      path.join(__dirname, `../../${fileName}`)
    ];

  const iconPath = iconPathCandidates.find((candidate) => fs.existsSync(candidate));

  if (!iconPath) {
    throw new Error(`App icon not found. Checked: ${iconPathCandidates.join(", ")}`);
  }

  return iconPath;
}
