/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { NoteType } from "../types/NoteType";

export function areNotesEqual(first: NoteType, second: NoteType): boolean {
  return JSON.stringify(first) === JSON.stringify(second);
}

export function isValidTimestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}
