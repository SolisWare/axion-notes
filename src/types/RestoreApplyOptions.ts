/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { RestoreNotesMode } from "./RestoreNotesMode";
import { RestoreSettingsMode } from "./RestoreSettingsMode";

export type RestoreApplyOptions = {
  notesMode: RestoreNotesMode;
  password?: string;
  settingsMode: RestoreSettingsMode;
};
