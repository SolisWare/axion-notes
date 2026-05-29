/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { ChangeEvent } from "react";
import { AppSettings } from "../../../settings/AppSettings";
import { AppThemePreference } from "../../../settings/AppThemePreference";
import { SystemTheme } from "../../../theme/SystemTheme";
import { NoteColorKey, NoteColors } from "../../../theme/NoteColors";
import styles from "./SettingsPages.module.css";

type AppearanceProps = {
  theme: SystemTheme;
  appSettings: AppSettings;
  onAppSettingsChange: (settings: AppSettings) => void;
};

function Appearance(props: AppearanceProps) {
  const noteColorKeys = Object.values(NoteColorKey);
  const autoColorBackground = `conic-gradient(${noteColorKeys
    .map((colorKey) => NoteColors[props.theme][colorKey])
    .join(", ")}, ${NoteColors[props.theme][noteColorKeys[0]]})`;

  function handleThemeChange(event: ChangeEvent<HTMLInputElement>) {
    props.onAppSettingsChange({
      ...props.appSettings,
      theme: event.target.value as AppThemePreference
    });
  }

  return (
    <div className={styles.appearancePage}>
      <section className={styles.settingsSection} aria-labelledby="appearance-theme-title">
        <div className={styles.settingsRows}>
          <div className={styles.settingsRow}>
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
          <div className={styles.settingsRow}>
            <div className={styles.settingsRowText}>
              <h3 className={styles.settingsSectionTitle}>New note default color</h3>
            </div>
            <fieldset className={styles.colorSwatchGroup}>
              <legend className={styles.visuallyHidden}>New note default color</legend>
              <label className={styles.colorSwatchOption}>
                <input
                  className={styles.colorSwatchInput}
                  type="radio"
                  name="new-note-color"
                  value="auto"
                  defaultChecked
                />
                <span
                  className={styles.autoColorSwatch}
                  style={{ background: autoColorBackground }}
                  aria-hidden="true"
                />
                <span className={styles.colorSwatchLabel}>Auto</span>
              </label>
              {noteColorKeys.map((colorKey) => (
                <label className={styles.colorSwatchOption} key={colorKey}>
                  <input className={styles.colorSwatchInput} type="radio" name="new-note-color" value={colorKey} />
                  <span
                    className={styles.colorSwatch}
                    style={{ backgroundColor: NoteColors[props.theme][colorKey] }}
                    aria-hidden="true"
                  />
                  <span className={styles.colorSwatchLabel}>
                    {colorKey.charAt(0).toUpperCase() + colorKey.slice(1)}
                  </span>
                </label>
              ))}
            </fieldset>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Appearance;
