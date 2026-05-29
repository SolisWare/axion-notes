/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { ChangeEvent } from "react";
import { AppSettings } from "../../../settings/AppSettings";
import { AppThemePreference } from "../../../settings/AppThemePreference";
import styles from "./SettingsPages.module.css";

type AppearanceProps = {
  appSettings: AppSettings;
  onAppSettingsChange: (settings: AppSettings) => void;
};

function Appearance(props: AppearanceProps) {
  function handleThemeChange(event: ChangeEvent<HTMLInputElement>) {
    props.onAppSettingsChange({
      ...props.appSettings,
      theme: event.target.value as AppThemePreference
    });
  }

  return (
    <div className={styles.appearancePage}>
      <section className={styles.settingsSection} aria-labelledby="appearance-theme-title">
        <div className={styles.themeRow}>
          <h3 className={styles.settingsSectionTitle} id="appearance-theme-title">Application Theme</h3>
          <fieldset className={styles.radioGroup}>
            <legend className={styles.visuallyHidden}>Application Theme</legend>
            <label className={styles.radioOption}>
              <input
                checked={props.appSettings.theme === AppThemePreference.AUTO}
                className={styles.radioInput}
                type="radio"
                name="app-theme"
                value={AppThemePreference.AUTO}
                onChange={handleThemeChange}
              />
              <span className={styles.radioLabel}>Auto</span>
              <span className={styles.radioControl} aria-hidden="true" />
            </label>
            <label className={styles.radioOption}>
              <input
                checked={props.appSettings.theme === AppThemePreference.LIGHT}
                className={styles.radioInput}
                type="radio"
                name="app-theme"
                value={AppThemePreference.LIGHT}
                onChange={handleThemeChange}
              />
              <span className={styles.radioLabel}>Light</span>
              <span className={styles.radioControl} aria-hidden="true" />
            </label>
            <label className={styles.radioOption}>
              <input
                checked={props.appSettings.theme === AppThemePreference.DARK}
                className={styles.radioInput}
                type="radio"
                name="app-theme"
                value={AppThemePreference.DARK}
                onChange={handleThemeChange}
              />
              <span className={styles.radioLabel}>Dark</span>
              <span className={styles.radioControl} aria-hidden="true" />
            </label>
          </fieldset>
        </div>
      </section>
    </div>
  );
}

export default Appearance;
