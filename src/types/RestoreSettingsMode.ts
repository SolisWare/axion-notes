/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
export const RestoreSettingsMode = {
  KEEP_CURRENT: "keepCurrent",
  RESTORE_BACKUP: "restoreBackup"
} as const;

export type RestoreSettingsMode = typeof RestoreSettingsMode[keyof typeof RestoreSettingsMode];
