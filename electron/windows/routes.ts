/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { LoadFileOptions } from "electron";
import * as path from "path";
import { ElectronWindowId } from "../../src/types/ElectronWindowId";

export const dev = (windowId: ElectronWindowId, routePath = ""): string => {
  return `http://127.0.0.1:3000/#/${windowId}${routePath}`;
};

export const production = (windowId: ElectronWindowId, routePath = ""): [string, LoadFileOptions] => {
  return [
    path.join(__dirname, "../../index.html"),
    { hash: `/${windowId}${routePath}` }
  ];
};
