/**
 * Copyright (c) 2023-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { JSONContent } from "@tiptap/core";
import { NoteColorKey } from "../theme/NoteColors";

export type TiptapDocument = JSONContent;

export type NoteType = {
  id: string;
  bgcolor: NoteColorKey;
  title?: string;
  isPinned?: boolean;
  pinnedOn?: Date;
  pinnedFromNoteIds?: string[];
  isTitleHidden?: boolean;
  isFolded?: boolean;
  content: string;
  richContent?: TiptapDocument;
  createdOn: Date;
  lastModifiedOn: Date;
};
