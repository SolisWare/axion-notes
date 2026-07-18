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
import { NoteSortOrder } from "./NoteSortOrder";
import { NoteFontPreference } from "./NoteFontPreference";
import { NoteLayoutPreference } from "./NoteLayoutPreference";
import { NoteSizePreference } from "./noteSizePreference";
import { DEFAULT_LANGUAGE } from "../i18n/languageConfig";
import { DateFormat } from "../utils/dt-formatter/DateFormat";
import { TimeFormat } from "../utils/dt-formatter/TimeFormat";

export const defaultAppSettings: AppSettings = {
  showWelcomeScreenOnLaunch: true,
  keepNotesMainWindowOnTop: false,
  notesSortOrder: NoteSortOrder.DATE_CREATED_ASC,
  theme: AppThemePreference.AUTO,
  defaultNoteColor: NoteColorPreference.AUTO,
  language: DEFAULT_LANGUAGE,
  dateFormat: DateFormat.MonthDayYearSlash,
  timeFormat: TimeFormat.Regular,
  noteFont: NoteFontPreference.SYSTEM,
  noteSize: NoteSizePreference.DEFAULT,
  showNoteTitles: true,
  showNoteFooters: true,
  noteLayout: NoteLayoutPreference.GRID
};

export const defaultMainWindowGridBounds: AppWindowBounds = {
  width: 1250,
  height: 800
};

export const defaultMainWindowListBounds: AppWindowBounds = {
  width: 480,
  height: 800
};
