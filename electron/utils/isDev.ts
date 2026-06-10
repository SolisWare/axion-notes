/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { app } from "electron";

const isEnvSet = "ELECTRON_IS_DEV" in process.env;
const isEnvDev = Number.parseInt(process.env.ELECTRON_IS_DEV ?? "", 10) === 1;

export const isDev = isEnvSet ? isEnvDev : !app.isPackaged;
