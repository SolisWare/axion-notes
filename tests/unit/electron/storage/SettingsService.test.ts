/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultAppSettings } from "../../../../src/settings/defaultSettings";

const { getSettings, replaceSettings, setSettings } = vi.hoisted(() => ({
  getSettings: vi.fn(),
  replaceSettings: vi.fn(),
  setSettings: vi.fn()
}));

vi.mock("../../../../electron/storage/appSettingsStorage", () => ({
  getSettings,
  replaceSettings,
  setSettings
}));

import { SettingsService } from "../../../../electron/storage/SettingsService";

const settingsPath = "/app/settings/app-settings.json";

beforeEach(() => {
  vi.clearAllMocks();
  getSettings.mockResolvedValue(undefined);
  replaceSettings.mockResolvedValue(undefined);
  setSettings.mockResolvedValue(undefined);
});

describe("SettingsService", () => {
  it("loads settings once and serves later reads from its cache", async () => {
    const settings = { ...defaultAppSettings, showWelcomeScreenOnLaunch: false };
    getSettings.mockResolvedValue(settings);
    const service = new SettingsService(settingsPath);

    await expect(service.getSettings()).resolves.toEqual(settings);
    await expect(service.getSettings()).resolves.toEqual(settings);

    expect(getSettings).toHaveBeenCalledTimes(1);
    expect(getSettings).toHaveBeenCalledWith(settingsPath);
    expect(service.getCachedSettings()).toEqual(settings);
  });

  it("refreshes the cache from disk", async () => {
    const initialSettings = { ...defaultAppSettings, showWelcomeScreenOnLaunch: true };
    const refreshedSettings = { ...defaultAppSettings, showWelcomeScreenOnLaunch: false };
    getSettings.mockResolvedValueOnce(initialSettings).mockResolvedValueOnce(refreshedSettings);
    const service = new SettingsService(settingsPath);
    await service.getSettings();

    await expect(service.refreshSettings()).resolves.toEqual(refreshedSettings);

    expect(service.getCachedSettings()).toEqual(refreshedSettings);
    expect(getSettings).toHaveBeenCalledTimes(2);
  });

  it("queues accepted setting writes in order and exposes the newest settings immediately", async () => {
    const firstSettings = { ...defaultAppSettings, showWelcomeScreenOnLaunch: false };
    const secondSettings = { ...defaultAppSettings, lockScreenEnabled: true };
    const service = new SettingsService(settingsPath);

    service.setSettings(firstSettings);
    service.setSettings(secondSettings);

    expect(service.getCachedSettings()).toEqual(secondSettings);
    await service.waitForPendingSettingsWrite();

    expect(setSettings).toHaveBeenNthCalledWith(1, settingsPath, firstSettings);
    expect(setSettings).toHaveBeenNthCalledWith(2, settingsPath, secondSettings);
  });

  it("waits for accepted writes before atomically replacing settings", async () => {
    let finishWrite: (() => void) | undefined;
    setSettings.mockImplementationOnce(() => new Promise<void>((resolve) => {
      finishWrite = resolve;
    }));
    const pendingSettings = { ...defaultAppSettings, showWelcomeScreenOnLaunch: false };
    const replacementSettings = { ...defaultAppSettings, noteLayout: "list" as never };
    const service = new SettingsService(settingsPath);
    service.setSettings(pendingSettings);

    const replacement = service.replaceSettings(replacementSettings);
    await Promise.resolve();
    expect(replaceSettings).not.toHaveBeenCalled();

    finishWrite?.();
    await replacement;

    expect(replaceSettings).toHaveBeenCalledWith(settingsPath, replacementSettings);
    expect(service.getCachedSettings()).toEqual(replacementSettings);
  });

  it("returns the configured settings directory", () => {
    const service = new SettingsService(settingsPath);

    expect(service.getSettingsFolderLocation()).toBe("/app/settings");
  });
});
