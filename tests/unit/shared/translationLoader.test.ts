/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SUPPORTED_LANGUAGES, SupportedLanguageCode } from "../../../src/i18n/languageConfig";
import { TranslationNode } from "../../../src/i18n/translationLoader";

const userAgent = vi.hoisted(() => ({ isElectron: false }));
const builtinModules = vi.hoisted(() => vi.fn());
const originalWindowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
const originalGetBuiltinModule = (process as NodeJS.Process & { getBuiltinModule?: (moduleName: string) => unknown }).getBuiltinModule;

vi.mock("../../../src/utils/UserAgent", () => ({ UserAgent: userAgent }));

describe("translationLoader", () => {
  beforeEach(() => {
    userAgent.isElectron = false;
    builtinModules.mockReset();
    vi.resetModules();
  });

  afterEach(() => {
    if (originalWindowDescriptor) {
      Object.defineProperty(globalThis, "window", originalWindowDescriptor);
    }

    (process as NodeJS.Process & { getBuiltinModule?: (moduleName: string) => unknown }).getBuiltinModule = originalGetBuiltinModule;
  });

  it("loads browser translations and returns resources for every supported language", async () => {
    const loader = await loadTranslationLoader();
    const translations = Object.fromEntries(
      SUPPORTED_LANGUAGES.map(({ code }) => [code, { label: `Language ${code}` }])
    ) as Record<string, TranslationNode>;

    loader.setBrowserTranslations(translations);

    expect(loader.getTranslation("en")).toEqual({ label: "Language en" });
    expect(loader.getI18nResources()).toEqual(Object.fromEntries(
      SUPPORTED_LANGUAGES.map(({ code }) => [code, { translation: { label: `Language ${code}` } }])
    ));
  });

  it("caches an already loaded browser translation", async () => {
    const loader = await loadTranslationLoader();
    const firstEnglishTranslation = { label: "First" };
    loader.setBrowserTranslations({ en: firstEnglishTranslation });

    expect(loader.getTranslation("en")).toBe(firstEnglishTranslation);
    loader.setBrowserTranslations({ en: { label: "Replacement" } });
    expect(loader.getTranslation("en")).toBe(firstEnglishTranslation);
  });

  it("reports missing browser translations", async () => {
    const loader = await loadTranslationLoader();

    expect(() => loader.getTranslation("en")).toThrow("Could not load translations for supported language: en");
  });

  it("loads and caches Electron main-process translation files", async () => {
    userAgent.isElectron = true;
    Object.defineProperty(globalThis, "window", { configurable: true, value: undefined });
    const fs = {
      readFileSync: vi.fn(() => JSON.stringify({ menu: { close: "Close" } })),
      readdirSync: vi.fn((directoryPath: string) => directoryPath.endsWith("locales")
        ? [
          { isDirectory: () => true, name: "en" },
          { isDirectory: () => false, name: "ignored-file" }
        ]
        : ["en.json", "ignored.txt"])
    };
    const path = { join: (...segments: string[]) => segments.join("/") };
    builtinModules.mockImplementation((moduleName: string) => moduleName === "node:fs" ? fs : path);
    (process as NodeJS.Process & { getBuiltinModule?: (moduleName: string) => unknown }).getBuiltinModule = builtinModules;
    const loader = await loadTranslationLoader();

    expect(loader.getTranslation("en")).toEqual({ menu: { close: "Close" } });
    expect(loader.getTranslation("en")).toEqual({ menu: { close: "Close" } });
    expect(fs.readdirSync).toHaveBeenCalledTimes(2);
    expect(fs.readFileSync).toHaveBeenCalledTimes(1);
    expect(() => loader.getTranslation("et")).toThrow("Could not load translations for supported language: et");
  });
});

async function loadTranslationLoader(): Promise<typeof import("../../../src/i18n/translationLoader")> {
  return import("../../../src/i18n/translationLoader");
}
