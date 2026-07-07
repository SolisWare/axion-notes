/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
export enum NoteSizePreference {
  COMPACT = "compact",
  DEFAULT = "default",
  LARGE = "large",
  WIDE = "wide"
}

export type NoteSizeDefinition = {
  width: number;
  height: number;
};

export const NOTE_SIZE_DEFINITIONS: Record<NoteSizePreference, NoteSizeDefinition> = {
  [NoteSizePreference.COMPACT]: {
    width: 220,
    height: 190
  },
  [NoteSizePreference.DEFAULT]: {
    width: 275,
    height: 250
  },
  [NoteSizePreference.LARGE]: {
    width: 340,
    height: 310
  },
  [NoteSizePreference.WIDE]: {
    width: 420,
    height: 250
  }
};

export function getNoteSizeDefinition(noteSize: NoteSizePreference): NoteSizeDefinition {
  return NOTE_SIZE_DEFINITIONS[noteSize] ?? NOTE_SIZE_DEFINITIONS[NoteSizePreference.DEFAULT];
}
