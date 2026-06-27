/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { SUPPORTED_LANGUAGES, SupportedLanguageCode } from "./languages";

export type TranslationNode = string | {
  [key: string]: TranslationNode;
};

const translationCache: Partial<Record<SupportedLanguageCode, TranslationNode>> = {};

function loadTranslation(languageCode: SupportedLanguageCode): TranslationNode {
  if (!translationCache[languageCode]) {
    const locale = require(`./locales/${languageCode}/${languageCode}.json`);
    translationCache[languageCode] = (locale.default ?? locale) as TranslationNode;
  }

  return translationCache[languageCode];
}

export function getTranslation(languageCode: SupportedLanguageCode): TranslationNode {
  return loadTranslation(languageCode);
}

export function getI18nResources(): Record<SupportedLanguageCode, { translation: TranslationNode }> {
  return Object.fromEntries(
    SUPPORTED_LANGUAGES.map((language) => [
      language.code,
      {
        translation: loadTranslation(language.code)
      }
    ])
  ) as Record<SupportedLanguageCode, { translation: TranslationNode }>;
}
