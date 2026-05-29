/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { SystemTheme } from "../theme/SystemTheme";

export enum AppThemePreference {
  AUTO = "auto",
  LIGHT = "light",
  DARK = "dark"
}

export function resolveAppThemePreference(preference: AppThemePreference, systemTheme: SystemTheme): SystemTheme {
  switch (preference) {
    case AppThemePreference.LIGHT:
      return SystemTheme.LIGHT;
    case AppThemePreference.DARK:
      return SystemTheme.DARK;
    case AppThemePreference.AUTO:
    default:
      return systemTheme;
  }
}
