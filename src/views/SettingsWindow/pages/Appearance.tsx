/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { AppSettings } from "../../../settings/AppSettings";
import { AppThemePreference } from "../../../settings/AppThemePreference";
import { DefaultNoteColorPreference, NoteColorPreference } from "../../../settings/noteColorPreference";
import { SystemTheme } from "../../../theme/SystemTheme";
import { NoteColorKey, NoteColors } from "../../../theme/NoteColors";
import styles from "./SettingsPages.module.css";

type AppearanceProps = {
  theme: SystemTheme;
  appSettings: AppSettings;
  onAppSettingsChange: (settings: AppSettings) => void;
};

function Appearance(props: AppearanceProps) {
  const { t } = useTranslation();
  const noteColorKeys = Object.values(NoteColorKey);
  const autoColorBackground = `conic-gradient(${noteColorKeys
    .map((colorKey) => NoteColors.light[colorKey])
    .join(", ")}, ${NoteColors.light[noteColorKeys[0]]})`;

  function handleThemeChange(event: ChangeEvent<HTMLInputElement>) {
    props.onAppSettingsChange({
      ...props.appSettings,
      theme: event.target.value as AppThemePreference
    });
  }

  function handleDefaultNoteColorChange(event: ChangeEvent<HTMLInputElement>) {
    props.onAppSettingsChange({
      ...props.appSettings,
      defaultNoteColor: event.target.value as DefaultNoteColorPreference
    });
  }

  return (
    <div className={styles.appearancePage}>
      <section className={styles.settingsSection} aria-labelledby="appearance-theme-title">
        <div className={styles.settingsRows}>
          <div className={styles.settingsRow}>
            <h3 className={styles.settingsSectionTitle} id="appearance-theme-title">{t("settingsWindow.appearance.applicationTheme")}</h3>
            <fieldset className={styles.radioGroup}>
              <legend className={styles.visuallyHidden}>{t("settingsWindow.appearance.applicationTheme")}</legend>
              <label className={styles.radioOption}>
                <input
                  checked={props.appSettings.theme === AppThemePreference.AUTO}
                  className={styles.radioInput}
                  type="radio"
                  name="app-theme"
                  value={AppThemePreference.AUTO}
                  onChange={handleThemeChange}
                />
                <span className={styles.radioLabel}>{t("settingsWindow.appearance.themeOptions.auto")}</span>
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
                <span className={styles.radioLabel}>{t("settingsWindow.appearance.themeOptions.light")}</span>
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
                <span className={styles.radioLabel}>{t("settingsWindow.appearance.themeOptions.dark")}</span>
                <span className={styles.radioControl} aria-hidden="true" />
              </label>
            </fieldset>
          </div>
          <div className={styles.settingsRow}>
            <div className={styles.settingsRowText}>
              <h3 className={styles.settingsSectionTitle}>{t("settingsWindow.appearance.newNoteDefaultColor")}</h3>
            </div>
            <fieldset className={styles.colorSwatchGroup}>
              <legend className={styles.visuallyHidden}>{t("settingsWindow.appearance.newNoteDefaultColor")}</legend>
              <label className={styles.colorSwatchOption}>
                <input
                  checked={props.appSettings.defaultNoteColor === NoteColorPreference.AUTO}
                  className={styles.colorSwatchInput}
                  type="radio"
                  name="new-note-color"
                  value={NoteColorPreference.AUTO}
                  onChange={handleDefaultNoteColorChange}
                />
                <span
                  className={styles.autoColorSwatch}
                  style={{ background: autoColorBackground }}
                  aria-hidden="true"
                />
                <span className={styles.colorSwatchLabel}>{t("settingsWindow.appearance.noteColors.auto")}</span>
              </label>
              {noteColorKeys.map((colorKey) => (
                <label className={styles.colorSwatchOption} key={colorKey}>
                  <input
                    checked={props.appSettings.defaultNoteColor === colorKey}
                    className={styles.colorSwatchInput}
                    type="radio"
                    name="new-note-color"
                    value={colorKey}
                    onChange={handleDefaultNoteColorChange}
                  />
                  <span
                    className={styles.colorSwatch}
                    style={{ backgroundColor: NoteColors.light[colorKey] }}
                    aria-hidden="true"
                  />
                  <span className={styles.colorSwatchLabel}>
                    {t(`settingsWindow.appearance.noteColors.${colorKey}`)}
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
