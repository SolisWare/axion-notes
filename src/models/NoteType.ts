/**
 * Copyright (c) 2023-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { NoteColorKey } from "../theme/NoteColors";

export type NoteType = {
  id: string;
  bgcolor: NoteColorKey;
  title?: string;
  isTitleHidden?: boolean;
  content: string;
  createdOn: Date;
  lastModifiedOn: Date;
};
