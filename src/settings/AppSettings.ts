/**
 * Copyright (c) 2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { AppThemePreference } from "./AppThemePreference";
import { DefaultNoteColorPreference } from "./noteColorPreference";
import { NoteSortOrder } from "./NoteSortOrder";
import { NoteFontPreference } from "./NoteFontPreference";
import { NoteLayoutPreference } from "./NoteLayoutPreference";
import { NoteSizePreference } from "./noteSizePreference";
import { SupportedLanguageCode } from "../i18n/languageConfig";
import { DateFormat } from "../utils/dt-formatter/DateFormat";
import { TimeFormat } from "../utils/dt-formatter/TimeFormat";

export type AppSettings = {
  showWelcomeScreenOnLaunch: boolean;
  keepNotesMainWindowOnTop: boolean;
  notesSortOrder: NoteSortOrder;
  theme: AppThemePreference;
  defaultNoteColor: DefaultNoteColorPreference;
  language: SupportedLanguageCode;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  noteFont: NoteFontPreference;
  noteSize: NoteSizePreference;
  showNoteTitles: boolean;
  showNoteFooters: boolean;
  noteLayout: NoteLayoutPreference;
  showFloatingFormatToolbar: boolean;
};
