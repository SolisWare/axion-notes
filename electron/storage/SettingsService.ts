/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as path from "node:path";
import { AppSettings } from "../../src/settings/AppSettings";
import { getSettings, setSettings } from "./appSettingsStorage";

/**
 * Provides cached app settings access for the Electron main process.
 */
export class SettingsService {
  
  private settings: AppSettings | undefined;

  public constructor(private readonly appSettingsFilePath: string) {
  }

  /**
   * Returns cached settings, loading them from disk when needed.
   */
  public async getSettings(): Promise<AppSettings | undefined> {
    if (!this.settings) {
      this.settings = await getSettings(this.appSettingsFilePath);
    }

    return this.settings;
  }

  /**
   * Returns settings currently held in memory without reading from disk.
   */
  public getCachedSettings(): AppSettings | undefined {
    return this.settings;
  }

  /**
   * Reloads settings from disk and replaces the in-memory cache.
   */
  public async refreshSettings(): Promise<AppSettings | undefined> {
    this.settings = await getSettings(this.appSettingsFilePath);
    return this.settings;
  }

  /**
   * Stores settings in memory and writes them to disk.
   *
   * @param settings Updated app settings.
   */
  public setSettings(settings: AppSettings): void {
    this.settings = settings;
    setSettings(this.appSettingsFilePath, settings);
  }

  /**
   * Returns the settings folder path.
   */
  public getSettingsFolderLocation(): string {
    return path.dirname(this.appSettingsFilePath);
  }
}
