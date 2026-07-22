/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { NoteFontPreference } from "../settings/NoteFontPreference";
import { NoteFontSize } from "../settings/NoteFontSize";

export type RichTextFormatState = {
  canFormat: boolean;
  isBoldActive: boolean;
  isItalicActive: boolean;
  isUnderlineActive: boolean;
  isStrikethroughActive: boolean;
  isSuperscriptActive: boolean;
  isSubscriptActive: boolean;
  isBulletListActive: boolean;
  isDashedListActive: boolean;
  isNumberedListActive: boolean;
  activeFontSize?: NoteFontSize;
  activeFont?: NoteFontPreference;
};
