/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { DEFAULT_LANGUAGE } from "../../src/i18n/languages";
import { getTranslation, TranslationNode } from "../../src/i18n/translationLoader";

export function translate(key: string): string {
  const translations = getTranslation(DEFAULT_LANGUAGE);
  const value = key
    .split(".")
    .reduce<TranslationNode | undefined>((currentValue, keyPart) => {
      if (!currentValue || typeof currentValue === "string") {
        return undefined;
      }

      return currentValue[keyPart];
    }, translations);

  return typeof value === "string" ? value : key;
}
