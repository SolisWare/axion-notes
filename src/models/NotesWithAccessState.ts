/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { NoteAccessStatus } from "./NoteAccessStatus";
import { NoteType } from "./NoteType";

export type NotesWithAccessState = {
  status: NoteAccessStatus;
  notes: NoteType[];
};
