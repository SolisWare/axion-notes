/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { DEFAULT_LANGUAGE, isSupportedLanguageCode, SupportedLanguageCode } from "../../src/i18n/languageConfig";
import { getTranslation, TranslationNode } from "../../src/i18n/translationLoader";

type TranslationVariables = Record<string, string | number>;

let currentLanguage: SupportedLanguageCode = DEFAULT_LANGUAGE;

export function setElectronLanguage(language: SupportedLanguageCode): void {
  currentLanguage = isSupportedLanguageCode(language) ? language : DEFAULT_LANGUAGE;
}

function getTranslationValue(translations: TranslationNode, key: string): string | undefined {
  const value = key
    .split(".")
    .reduce<TranslationNode | undefined>((currentValue, keyPart) => {
      if (!currentValue || typeof currentValue === "string") {
        return undefined;
      }

      return currentValue[keyPart];
    }, translations);

  return typeof value === "string" ? value : undefined;
}

function interpolate(value: string, variables?: TranslationVariables): string {
  if (!variables) {
    return value;
  }

  return Object.entries(variables).reduce(
    (translatedValue, [variableName, variableValue]) => translatedValue.replaceAll(`{{${variableName}}}`, String(variableValue)),
    value
  );
}

export function translate(key: string, variables?: TranslationVariables): string {
  const translations = getTranslation(currentLanguage);
  const value = getTranslationValue(translations, key);

  if (value) {
    return interpolate(value, variables);
  }

  if (currentLanguage !== DEFAULT_LANGUAGE) {
    const defaultTranslations = getTranslation(DEFAULT_LANGUAGE);
    const defaultValue = getTranslationValue(defaultTranslations, key);

    if (defaultValue) {
      return interpolate(defaultValue, variables);
    }
  }

  return key;
}
