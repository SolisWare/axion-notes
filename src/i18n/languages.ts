/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */

/**
 * Describes a language available for localization.
 */
export type Language = {
  code: string;
  label: string;
  nativeLabel: string;
};

/**
 * List of languages currently available in Axion Notes.
 */
export const SUPPORTED_LANGUAGES = [
  {
    code: "en",
    label: "English",
    nativeLabel: "English"
  }
] as const satisfies readonly Language[];

/**
 * Language code inferred from the supported language list.
 */
export type SupportedLanguageCode = typeof SUPPORTED_LANGUAGES[number]["code"];

/**
 * Fallback language used when the requested language or translation key is unavailable.
 */
export const DEFAULT_LANGUAGE: SupportedLanguageCode = "en";

/**
 * Checks whether a language code is supported.
 */
export function isSupportedLanguageCode(languageCode: string): languageCode is SupportedLanguageCode {
  return SUPPORTED_LANGUAGES.some((language) => language.code === languageCode);
}

/**
 * Returns the base language code from a regional code, such as "en" from "en-US".
 */
export function getBaseLanguageCode(languageCode: string): string {
  return languageCode.toLowerCase().split("-")[0];
}
