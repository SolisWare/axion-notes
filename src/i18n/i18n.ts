/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { DEFAULT_LANGUAGE, resolvePreferredSupportedLanguageCode, SupportedLanguageCode } from "./languageConfig";
import { getI18nResources, setBrowserTranslations, TranslationNode } from "./translationLoader";

const browserTranslationModules = import.meta.glob<TranslationNode>("./locales/*/*.json", {
  eager: true,
  import: "default"
});

setBrowserTranslations(
  Object.fromEntries(
    Object.entries(browserTranslationModules).map(([filePath, translation]) => [
      filePath.split("/").at(-2) ?? "",
      translation
    ])
  )
);

function resolveInitialLanguage(): SupportedLanguageCode {
  return resolvePreferredSupportedLanguageCode(navigator.languages.length > 0 ? navigator.languages : [navigator.language]);
}

i18n
  .use(initReactI18next)
  .init({
    resources: getI18nResources(),
    lng: resolveInitialLanguage(),
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
      escapeValue: false
    },
    returnEmptyString: false
  });

export default i18n;
