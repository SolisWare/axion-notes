/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import i18next, { Resource, TFunction } from "i18next";
import { DEFAULT_LANGUAGE, isSupportedLanguageCode, SupportedLanguageCode } from "../../src/i18n/languageConfig";
import { getI18nResources } from "../../src/i18n/translationLoader";

type TranslationVariables = Record<string, string | number>;

const electronI18n = i18next.createInstance();

void electronI18n.init({
  fallbackLng: DEFAULT_LANGUAGE,
  initImmediate: false,
  interpolation: {
    escapeValue: false
  },
  lng: DEFAULT_LANGUAGE,
  resources: getI18nResources() as unknown as Resource
});

export function setElectronLanguage(language: SupportedLanguageCode): void {
  void electronI18n.changeLanguage(isSupportedLanguageCode(language) ? language : DEFAULT_LANGUAGE);
}

export function translate(key: string, variables?: TranslationVariables): string {
  return electronI18n.t(key, variables);
}

export function getElectronMenuTranslator(): TFunction {
  return electronI18n.t.bind(electronI18n);
}
