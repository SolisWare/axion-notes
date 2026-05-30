/**
 * Copyright (c) 2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { AppThemePreference } from "./AppThemePreference";
import { AppSettings } from "./AppSettings";
import { AppWindowBounds } from "./AppWindowBounds";
import { NoteColorPreference } from "./noteColorPreference";

export const defaultAppSettings: AppSettings = {
  showWelcomeScreenOnLaunch: true,
  keepNotesMainWindowOnTop: false,
  theme: AppThemePreference.AUTO,
  defaultNoteColor: NoteColorPreference.AUTO
};

export const defaultMainWindowBounds: AppWindowBounds = {
  width: 1250,
  height: 800
};
