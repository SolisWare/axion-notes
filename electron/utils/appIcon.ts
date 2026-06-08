/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as path from "path";
import isDev from "electron-is-dev";

export function getAppIconPath(): string {
  return isDev
    ? path.join(__dirname, "../../public/axion_notes_icon512.png")
    : path.join(__dirname, "../../axion_notes_icon512.png");
}
