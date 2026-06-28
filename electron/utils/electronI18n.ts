/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { DEFAULT_LANGUAGE, SupportedLanguageCode } from "../../src/i18n/languages";
import { getTranslation, TranslationNode } from "../../src/i18n/translationLoader";

let currentLanguage: SupportedLanguageCode = DEFAULT_LANGUAGE;

export function setElectronLanguage(language: SupportedLanguageCode): void {
  currentLanguage = language;
}

export function translate(key: string): string {
  const translations = getTranslation(currentLanguage);
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
