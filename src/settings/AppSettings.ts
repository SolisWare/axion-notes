/**
 * Copyright (c) 2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { SystemTheme } from "../theme/SystemTheme";
import { AppWindowBounds } from "./AppWindowBounds";

export type AppSettings = {
  showWelcomeScreenOnLaunch: boolean;
  theme: SystemTheme;
  mainWindowBounds?: AppWindowBounds;
};
