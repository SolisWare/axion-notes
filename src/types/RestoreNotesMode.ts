/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
export const RestoreNotesMode = {
  REPLACE_CURRENT: "replaceCurrent",
  ADD_TO_CURRENT: "addToCurrent"
} as const;

export type RestoreNotesMode = typeof RestoreNotesMode[keyof typeof RestoreNotesMode];
