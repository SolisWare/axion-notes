/**
 * Copyright (c) 2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { AppThemePreference } from "./AppThemePreference";
import { DefaultNoteColorPreference } from "./noteColorPreference";

export type AppSettings = {
  showWelcomeScreenOnLaunch: boolean;
  keepNotesMainWindowOnTop: boolean;
  theme: AppThemePreference;
  defaultNoteColor: DefaultNoteColorPreference;
};
