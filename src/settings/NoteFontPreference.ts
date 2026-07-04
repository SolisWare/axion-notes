/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
export enum NoteFontPreference {
  SYSTEM = "system",
  SERIF = "serif",
  SANS_SERIF = "sansSerif",
  MONOSPACE = "monospace"
}

export function getNoteFontFamily(noteFont: NoteFontPreference): string | undefined {
  switch (noteFont) {
    case NoteFontPreference.SERIF:
      return "Georgia, 'Times New Roman', serif";
    case NoteFontPreference.SANS_SERIF:
      return "Arial, Helvetica, sans-serif";
    case NoteFontPreference.MONOSPACE:
      return "'SFMono-Regular', Consolas, 'Liberation Mono', monospace";
    case NoteFontPreference.SYSTEM:
    default:
      return undefined;
  }
}
