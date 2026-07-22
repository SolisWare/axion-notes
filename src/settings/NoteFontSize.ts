/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
export const DEFAULT_NOTE_FONT_SIZE = 14;

export const NOTE_FONT_SIZE_OPTIONS = [10, 12, 14, 16, 18, 20, 24, 28, 32] as const;

export type NoteFontSize = typeof NOTE_FONT_SIZE_OPTIONS[number];
