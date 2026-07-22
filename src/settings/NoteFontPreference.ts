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
  MONOSPACE = "monospace",
  INTER = "inter",
  LORA = "lora",
  SOURCE_SANS_3 = "sourceSans3",
  SOURCE_SERIF_4 = "sourceSerif4",
  SPACE_MONO = "spaceMono",
  CAVEAT = "caveat",
  DANCING_SCRIPT = "dancingScript"
}

export enum NoteFontCategory {
  GENERIC = "generic",
  STANDARD = "standard",
  TYPEWRITER = "typewriter",
  HANDWRITING = "handwriting",
  CALLIGRAPHIC = "calligraphic"
}

export type NoteFontOption = {
  value: NoteFontPreference;
  labelKey: string;
  category: NoteFontCategory;
  fontFamily?: string;
};

export const NOTE_FONT_OPTIONS: readonly NoteFontOption[] = [
  {
    value: NoteFontPreference.SYSTEM,
    labelKey: "settingsWindow.appearance.noteFontOptions.system",
    category: NoteFontCategory.GENERIC
  },
  {
    value: NoteFontPreference.SERIF,
    labelKey: "settingsWindow.appearance.noteFontOptions.serif",
    category: NoteFontCategory.GENERIC,
    fontFamily: "Georgia, 'Times New Roman', serif"
  },
  {
    value: NoteFontPreference.SANS_SERIF,
    labelKey: "settingsWindow.appearance.noteFontOptions.sansSerif",
    category: NoteFontCategory.GENERIC,
    fontFamily: "Arial, Helvetica, sans-serif"
  },
  {
    value: NoteFontPreference.MONOSPACE,
    labelKey: "settingsWindow.appearance.noteFontOptions.monospace",
    category: NoteFontCategory.GENERIC,
    fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace"
  },
  {
    value: NoteFontPreference.INTER,
    labelKey: "settingsWindow.appearance.noteFontOptions.inter",
    category: NoteFontCategory.STANDARD,
    fontFamily: "'Axion Inter', system-ui, sans-serif"
  },
  {
    value: NoteFontPreference.SOURCE_SANS_3,
    labelKey: "settingsWindow.appearance.noteFontOptions.sourceSans3",
    category: NoteFontCategory.STANDARD,
    fontFamily: "'Axion Source Sans 3', system-ui, sans-serif"
  },
  {
    value: NoteFontPreference.LORA,
    labelKey: "settingsWindow.appearance.noteFontOptions.lora",
    category: NoteFontCategory.STANDARD,
    fontFamily: "'Axion Lora', Georgia, serif"
  },
  {
    value: NoteFontPreference.SOURCE_SERIF_4,
    labelKey: "settingsWindow.appearance.noteFontOptions.sourceSerif4",
    category: NoteFontCategory.STANDARD,
    fontFamily: "'Axion Source Serif 4', Georgia, serif"
  },
  {
    value: NoteFontPreference.SPACE_MONO,
    labelKey: "settingsWindow.appearance.noteFontOptions.spaceMono",
    category: NoteFontCategory.TYPEWRITER,
    fontFamily: "'Axion Space Mono', 'SFMono-Regular', Consolas, monospace"
  },
  {
    value: NoteFontPreference.CAVEAT,
    labelKey: "settingsWindow.appearance.noteFontOptions.caveat",
    category: NoteFontCategory.HANDWRITING,
    fontFamily: "'Axion Caveat', cursive"
  },
  {
    value: NoteFontPreference.DANCING_SCRIPT,
    labelKey: "settingsWindow.appearance.noteFontOptions.dancingScript",
    category: NoteFontCategory.CALLIGRAPHIC,
    fontFamily: "'Axion Dancing Script', cursive"
  }
];

export const NOTE_FONT_CATEGORIES: readonly NoteFontCategory[] = [
  NoteFontCategory.GENERIC,
  NoteFontCategory.STANDARD,
  NoteFontCategory.TYPEWRITER,
  NoteFontCategory.HANDWRITING,
  NoteFontCategory.CALLIGRAPHIC
];

export function getNoteFontFamily(noteFont: NoteFontPreference): string | undefined {
  return NOTE_FONT_OPTIONS.find((option) => option.value === noteFont)?.fontFamily;
}

export function getNoteFontPreferenceByFontFamily(fontFamily: string | undefined): NoteFontPreference | undefined {
  return NOTE_FONT_OPTIONS.find((option) => option.fontFamily === fontFamily)?.value;
}
