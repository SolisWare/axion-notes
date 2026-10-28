/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { SUPPORTED_LANGUAGES, SupportedLanguageCode } from "./languageConfig";
import { UserAgent } from "../utils/UserAgent";

export type TranslationNode = string | {
  [key: string]: TranslationNode;
};

const translationCache: Partial<Record<SupportedLanguageCode, TranslationNode>> = {};
let browserTranslations: Record<string, TranslationNode> | undefined;
let electronTranslations: Record<string, TranslationNode> | undefined;

export function setBrowserTranslations(translations: Record<string, TranslationNode>): void {
  browserTranslations = translations;
}

function loadTranslation(languageCode: SupportedLanguageCode): TranslationNode {
  if (!translationCache[languageCode]) {
    const translation = isElectronMainProcess()
      ? getElectronTranslations()[languageCode]
      : browserTranslations?.[languageCode];

    if (!translation) {
      throw new Error(`Could not load translations for supported language: ${languageCode}`);
    }

    translationCache[languageCode] = translation;
  }

  return translationCache[languageCode];
}

function isElectronMainProcess(): boolean {
  return UserAgent.isElectron && typeof window === "undefined";
}

function getElectronTranslations(): Record<string, TranslationNode> {
  if (electronTranslations) {
    return electronTranslations;
  }

  const getBuiltinModule = (process as NodeJS.Process & {
    getBuiltinModule(moduleName: string): unknown;
  }).getBuiltinModule;
  const fs = getBuiltinModule("node:fs") as typeof import("node:fs");
  const path = getBuiltinModule("node:path") as typeof import("node:path");
  const localesDirectoryPath = path.join(__dirname, "locales");
  const translations = Object.fromEntries(
    fs.readdirSync(localesDirectoryPath, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .flatMap((directory) => fs.readdirSync(path.join(localesDirectoryPath, directory.name))
        .filter((fileName) => fileName.endsWith(".json"))
        .map((fileName) => [
          directory.name,
          JSON.parse(fs.readFileSync(path.join(localesDirectoryPath, directory.name, fileName), "utf-8")) as TranslationNode
        ]))
  ) as Record<string, TranslationNode>;

  electronTranslations = translations;
  return translations;
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
