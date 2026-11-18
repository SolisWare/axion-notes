/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { SettingsService } from "../../../../electron/storage/SettingsService";
import { defaultAppSettings } from "../../../../src/settings/defaultSettings";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => fs.promises.rm(directory, { force: true, recursive: true })));
});

describe("SettingsService filesystem integration", () => {
  it("returns undefined when no settings file has been created", async () => {
    const { service } = await createService();

    await expect(service.getSettings()).resolves.toBeUndefined();
    expect(service.getCachedSettings()).toBeUndefined();
  });

  it("persists queued writes so a new service reads the newest settings", async () => {
    const { settingsPath, service } = await createService();
    await fs.promises.mkdir(path.dirname(settingsPath), { recursive: true });
    const firstSettings = { ...defaultAppSettings, showWelcomeScreenOnLaunch: false };
    const secondSettings = { ...defaultAppSettings, lockScreenEnabled: true };

    service.setSettings(firstSettings);
    service.setSettings(secondSettings);
    await service.waitForPendingSettingsWrite();

    await expect(fs.promises.readFile(settingsPath, "utf-8")).resolves.toBe(JSON.stringify(secondSettings, null, 2));
    await expect(new SettingsService(settingsPath).getSettings()).resolves.toEqual(secondSettings);
  });

  it("refreshes externally changed settings and atomically replaces them in a missing directory", async () => {
    const { settingsPath, service } = await createService();
    const externalSettings = { ...defaultAppSettings, showWelcomeScreenOnLaunch: false };
    const replacementSettings = { ...defaultAppSettings, lockScreenEnabled: true };

    await service.replaceSettings(externalSettings);
    await fs.promises.writeFile(settingsPath, JSON.stringify(replacementSettings, null, 2), "utf-8");

    await expect(service.refreshSettings()).resolves.toEqual(replacementSettings);
    expect(await fs.promises.access(`${settingsPath}.tmp`).then(() => true).catch(() => false)).toBe(false);
  });
});

async function createService(): Promise<{ service: SettingsService; settingsPath: string }> {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), "axion-notes-settings-service-"));
  temporaryDirectories.push(directory);
  const settingsPath = path.join(directory, "nested", "settings", "app-settings.json");

  return {
    service: new SettingsService(settingsPath),
    settingsPath
  };
}
