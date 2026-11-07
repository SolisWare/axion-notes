/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { AppSettings } from "../../src/settings/AppSettings";

export function getSettings(appSettingsFilePath: string): Promise<AppSettings | undefined> {
  return fs.promises.readFile(appSettingsFilePath, "utf-8")
    .then((content): AppSettings | undefined => {
      if (!content.trim()) {
        return undefined;
      }

      return JSON.parse(content) as AppSettings;
    })
    .catch((err): AppSettings | undefined => {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return undefined;
      }

      console.warn("Failed to read app settings:", err);
      return undefined;
    });
}

export async function setSettings(appSettingsFilePath: string, settings: AppSettings): Promise<void> {
  const serializedSettings = JSON.stringify(settings, null, 2);

  try {
    await fs.promises.writeFile(appSettingsFilePath, serializedSettings);
  } catch (err) {
    console.warn("Failed to write app settings:", err);
  }
}

export async function replaceSettings(appSettingsFilePath: string, settings: AppSettings): Promise<void> {
  const temporaryFilePath = `${appSettingsFilePath}.tmp`;

  await fs.promises.mkdir(path.dirname(appSettingsFilePath), { recursive: true });
  await fs.promises.writeFile(temporaryFilePath, JSON.stringify(settings, null, 2), "utf-8");
  await fs.promises.rename(temporaryFilePath, appSettingsFilePath);
}
