/**
 * Copyright (c) 2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { SystemTheme } from "../theme/SystemTheme";
import { AppSettings } from "./AppSettings";
import { AppWindowBounds } from "./AppWindowBounds";

export const defaultAppSettings: AppSettings = {
  showWelcomeScreenOnLaunch: true,
  theme: SystemTheme.LIGHT
};

export const defaultMainWindowBounds: AppWindowBounds = {
  width: 1250,
  height: 800
};
