/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { NoteColorKey } from "../theme/NoteColors";

export enum NoteColorPreference {
  AUTO = "auto"
}

export type DefaultNoteColorPreference = NoteColorKey | NoteColorPreference.AUTO;
