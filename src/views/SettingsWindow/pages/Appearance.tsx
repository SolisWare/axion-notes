/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { ChangeEvent } from "react";
import { Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { AppSettings } from "../../../settings/AppSettings";
import { AppThemePreference } from "../../../settings/AppThemePreference";
import { DefaultNoteColorPreference, NoteColorPreference } from "../../../settings/noteColorPreference";
import { NoteSizePreference } from "../../../settings/noteSizePreference";
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
  const isFloatingFormatToolbarDisabled = !props.appSettings.richTextEditorEnabled;
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

  function handleNoteSizeChange(event: ChangeEvent<HTMLSelectElement>) {
    props.onAppSettingsChange({
      ...props.appSettings,
      noteSize: event.target.value as NoteSizePreference
    });

    event.currentTarget.blur();
  }

  function handleShowNoteTitlesChange(event: ChangeEvent<HTMLInputElement>) {
    props.onAppSettingsChange({
      ...props.appSettings,
      showTitles: event.target.checked
    });
  }

  function handleShowNoteFootersChange(event: ChangeEvent<HTMLInputElement>) {
    props.onAppSettingsChange({
      ...props.appSettings,
      showNoteFooters: event.target.checked
    });
  }

  function handleShowFloatingFormatToolbarChange(event: ChangeEvent<HTMLInputElement>) {
    props.onAppSettingsChange({
      ...props.appSettings,
      showFloatingFormatToolbar: event.target.checked
    });
  }

  return (
    <div className={styles.appearancePage}>
      <section className={styles.settingsSection} aria-labelledby="appearance-theme-title">
        <div className={styles.settingsRows}>
          <div className={styles.settingsRow}>
            <h3 className={styles.settingsSectionTitle} id="appearance-theme-title">{t("applicationTheme")}</h3>
            <fieldset className={styles.radioGroup}>
              <legend className={styles.visuallyHidden}>{t("applicationTheme")}</legend>
              <label className={styles.radioOption}>
                <input
                  checked={props.appSettings.theme === AppThemePreference.AUTO}
                  className={styles.radioInput}
                  type="radio"
                  name="app-theme"
                  value={AppThemePreference.AUTO}
                  onChange={handleThemeChange}
                />
                <span className={styles.radioLabel}>{t("themeOptions.auto")}</span>
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
                <span className={styles.radioLabel}>{t("themeOptions.light")}</span>
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
                <span className={styles.radioLabel}>{t("themeOptions.dark")}</span>
                <span className={styles.radioControl} aria-hidden="true" />
              </label>
            </fieldset>
          </div>
          <div className={`${styles.settingsRow} ${styles.noteFontRow}`}>
            <div className={styles.settingsRowText}>
              <h3 className={styles.settingsSectionTitle} id="show-note-titles-title">{t("showTitles")}</h3>
              <p className={styles.settingsSectionDescription}>{t("showTitlesDescription")}</p>
            </div>
            <label className={styles.switchControl}>
              <input
                aria-labelledby="show-note-titles-title"
                checked={props.appSettings.showTitles}
                className={styles.switchInput}
                type="checkbox"
                onChange={handleShowNoteTitlesChange}
              />
              <span className={styles.switchTrack} aria-hidden="true">
                <span className={styles.switchThumb} />
              </span>
              <span className={styles.visuallyHidden}>{t("showTitles")}</span>
            </label>
          </div>
          <div className={styles.settingsRow}>
            <div className={styles.settingsRowText}>
              <h3 className={styles.settingsSectionTitle} id="show-note-footers-title">{t("showNoteFooters")}</h3>
              <p className={styles.settingsSectionDescription}>{t("showNoteFootersHelp")}</p>
            </div>
            <label className={styles.switchControl}>
              <input
                aria-labelledby="show-note-footers-title"
                checked={props.appSettings.showNoteFooters}
                className={styles.switchInput}
                type="checkbox"
                onChange={handleShowNoteFootersChange}
              />
              <span className={styles.switchTrack} aria-hidden="true">
                <span className={styles.switchThumb} />
              </span>
              <span className={styles.visuallyHidden}>{t("showNoteFooters")}</span>
            </label>
          </div>
          <Tooltip
            arrow
            disableHoverListener={!isFloatingFormatToolbarDisabled}
            enterDelay={300}
            enterNextDelay={300}
            title={t("richTextEditorRequired")}
          >
            <div className={`${styles.settingsRow} ${isFloatingFormatToolbarDisabled ? styles.settingsRowDisabled : ""}`}>
              <div className={styles.settingsRowText}>
                <h3 className={styles.settingsSectionTitle} id="show-floating-format-toolbar-title">{t("showFloatingFormatToolbar")}</h3>
                <p className={styles.settingsSectionDescription}>{t("showFloatingFormatToolbarHelp")}</p>
              </div>
              <label className={styles.switchControl}>
                <input
                  aria-labelledby="show-floating-format-toolbar-title"
                  checked={props.appSettings.richTextEditorEnabled && props.appSettings.showFloatingFormatToolbar}
                  className={styles.switchInput}
                  disabled={!props.appSettings.richTextEditorEnabled}
                  type="checkbox"
                  onChange={handleShowFloatingFormatToolbarChange}
                />
                <span className={styles.switchTrack} aria-hidden="true">
                  <span className={styles.switchThumb} />
                </span>
                <span className={styles.visuallyHidden}>{t("showFloatingFormatToolbar")}</span>
              </label>
            </div>
          </Tooltip>
          <div className={styles.settingsRow}>
            <label className={styles.settingsSectionTitle} htmlFor="note-size">
              {t("noteSize")}
            </label>
            <select
              className={styles.settingsSelect}
              id="note-size"
              value={props.appSettings.noteSize}
              onChange={handleNoteSizeChange}
            >
              <option value={NoteSizePreference.COMPACT}>{t("noteSizeOptions.compact")}</option>
              <option value={NoteSizePreference.DEFAULT}>{t("noteSizeOptions.default")}</option>
              <option value={NoteSizePreference.LARGE}>{t("noteSizeOptions.large")}</option>
              <option value={NoteSizePreference.WIDE}>{t("noteSizeOptions.wide")}</option>
            </select>
          </div>
          <div className={styles.settingsRow}>
            <div className={styles.settingsRowText}>
              <h3 className={styles.settingsSectionTitle}>{t("newNoteDefaultColor")}</h3>
            </div>
            <fieldset className={styles.colorSwatchGroup}>
              <legend className={styles.visuallyHidden}>{t("newNoteDefaultColor")}</legend>
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
                <span className={styles.colorSwatchLabel}>{t("noteColors.auto")}</span>
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
                    {t(`noteColors.${colorKey}`)}
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
