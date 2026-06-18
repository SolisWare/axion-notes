/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import en from "../../src/i18n/locales/en/en.json";
import { DEFAULT_LANGUAGE, SupportedLanguageCode } from "../../src/i18n/languages";

type TranslationNode = string | {
  [key: string]: TranslationNode;
};

const translationsByLanguage: Record<SupportedLanguageCode, TranslationNode> = {
  en: en as TranslationNode
};

export function translate(key: string): string {
  const translations = translationsByLanguage[DEFAULT_LANGUAGE];
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
