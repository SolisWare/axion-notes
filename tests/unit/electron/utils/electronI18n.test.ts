/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../src/i18n/translationLoader", () => ({
  getI18nResources: () => ({
    en: {
      translation: {
        greeting: "Hello {{name}}",
        menu: { close: "Close" }
      }
    },
    et: {
      translation: {
        greeting: "Tere {{name}}",
        menu: { close: "Sulge" }
      }
    }
  })
}));

import { getElectronMenuTranslator, setElectronLanguage, translate } from "../../../../electron/utils/electronI18n";

describe("electronI18n", () => {
  afterEach(async () => {
    await setElectronLanguage("en");
  });

  it("translates menu content and interpolation values in the selected language", async () => {
    await setElectronLanguage("et");

    expect(translate("menu.close")).toBe("Sulge");
    expect(translate("greeting", { name: "Michael" })).toBe("Tere Michael");
  });

  it("falls back to English for unsupported language codes", async () => {
    await setElectronLanguage("unsupported" as never);

    expect(getElectronMenuTranslator()("menu.close")).toBe("Close");
  });
});
