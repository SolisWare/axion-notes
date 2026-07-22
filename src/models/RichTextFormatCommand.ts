/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { NoteFontPreference } from "../settings/NoteFontPreference";
import { NoteFontSize } from "../settings/NoteFontSize";

export enum RichTextFormatCommand {
  BOLD = "bold",
  ITALIC = "italic",
  UNDERLINE = "underline",
  STRIKETHROUGH = "strikethrough",
  SUPERSCRIPT = "superscript",
  SUBSCRIPT = "subscript",
  BULLET_LIST = "bulletList",
  DASHED_LIST = "dashedList",
  NUMBERED_LIST = "numberedList",
  FONT_SIZE = "fontSize",
  FONT_FAMILY = "fontFamily"
}

export type RichTextFormatAction =
  | RichTextFormatCommand
  | {
    command: RichTextFormatCommand.FONT_SIZE;
    fontSize: NoteFontSize;
  }
  | {
    command: RichTextFormatCommand.FONT_FAMILY;
    noteFont: NoteFontPreference;
  };
