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
  isInlineCodeActive: boolean;
  isHighlightActive: boolean;
  isSuperscriptActive: boolean;
  isSubscriptActive: boolean;
  isBulletListActive: boolean;
  isDashedListActive: boolean;
  isNumberedListActive: boolean;
  isChecklistActive: boolean;
  activeFontSize?: NoteFontSize;
  activeFont?: NoteFontPreference;
};

export function getInactiveRichTextFormatState(): RichTextFormatState {
  return {
    canFormat: false,
    isBoldActive: false,
    isItalicActive: false,
    isUnderlineActive: false,
    isStrikethroughActive: false,
    isInlineCodeActive: false,
    isHighlightActive: false,
    isSuperscriptActive: false,
    isSubscriptActive: false,
    isBulletListActive: false,
    isDashedListActive: false,
    isNumberedListActive: false,
    isChecklistActive: false,
    activeFontSize: undefined,
    activeFont: undefined
  };
}
