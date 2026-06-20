/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { DEFAULT_LANGUAGE, getBaseLanguageCode, isSupportedLanguageCode, SupportedLanguageCode } from "./languages";
import en from "./locales/en/en.json";

const resources = {
  en: {
    translation: en
  }
};

function resolveInitialLanguage(): SupportedLanguageCode {
  const browserLanguage = getBaseLanguageCode(navigator.language);

  if (isSupportedLanguageCode(browserLanguage)) {
    return browserLanguage;
  }

  return DEFAULT_LANGUAGE;
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: resolveInitialLanguage(),
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
      escapeValue: false
    },
    returnEmptyString: false
  });

export default i18n;
