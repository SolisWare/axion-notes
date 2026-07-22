/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { AppSettings } from "../../../settings/AppSettings";
import { getNoteFontFamily, NOTE_FONT_CATEGORIES, NOTE_FONT_OPTIONS, NoteFontPreference } from "../../../settings/NoteFontPreference";
import { NOTE_CONTENT_FONT_SIZE_OPTIONS, NOTE_TITLE_FONT_SIZE_OPTIONS, NoteFontSize } from "../../../settings/NoteFontSize";
import styles from "./SettingsPages.module.css";

type EditorProps = {
  appSettings: AppSettings;
  onAppSettingsChange: (settings: AppSettings) => void;
};

function Editor(props: EditorProps) {
  const { t } = useTranslation();
  const noteFontPreviewFontFamily = getNoteFontFamily(props.appSettings.noteFont);
  const noteTitleFontPreviewFontFamily = getNoteFontFamily(props.appSettings.noteTitleFont);
  const noteFontPreview = t("settingsWindow.editor.noteFontPreview");

  function handleNoteFontChange(event: ChangeEvent<HTMLSelectElement>) {
    props.onAppSettingsChange({
      ...props.appSettings,
      noteFont: event.target.value as NoteFontPreference
    });

    event.currentTarget.blur();
  }

  function handleNoteTitleFontChange(event: ChangeEvent<HTMLSelectElement>) {
    props.onAppSettingsChange({
      ...props.appSettings,
      noteTitleFont: event.target.value as NoteFontPreference
    });

    event.currentTarget.blur();
  }

  function handleNoteContentFontSizeChange(event: ChangeEvent<HTMLSelectElement>) {
    props.onAppSettingsChange({
      ...props.appSettings,
      noteContentFontSize: Number(event.target.value) as NoteFontSize
    });

    event.currentTarget.blur();
  }

  function handleNoteTitleFontSizeChange(event: ChangeEvent<HTMLSelectElement>) {
    props.onAppSettingsChange({
      ...props.appSettings,
      noteTitleFontSize: Number(event.target.value) as NoteFontSize
    });

    event.currentTarget.blur();
  }

  function getNoteFontOptionsByCategory(fontCategory: typeof NOTE_FONT_CATEGORIES[number]) {
    return NOTE_FONT_OPTIONS.filter((fontOption) => fontOption.category === fontCategory);
  }

  return (
    <div className={styles.editorPage}>
      <section className={styles.settingsSection} aria-labelledby="editor-note-text-title">
        <h3 className={`${styles.settingsSubsectionHeader} ${styles.settingsSubsectionHeaderFirst}`}>
          {t("settingsWindow.editor.titleSection")}
        </h3>
        <div className={styles.settingsRows}>
          <div className={`${styles.settingsRow} ${styles.noteFontRow}`}>
            <div>
              <label className={styles.settingsSectionTitle} htmlFor="note-title-font">
                {t("settingsWindow.editor.noteTitleFont")}
              </label>
              <p className={styles.settingsSectionDescription}>{t("settingsWindow.editor.noteTitleFontDescription")}</p>
            </div>
            <div className={styles.noteFontControls}>
              <select
                className={styles.settingsSelect}
                id="note-title-font"
                style={{ fontFamily: noteTitleFontPreviewFontFamily }}
                value={props.appSettings.noteTitleFont}
                onChange={handleNoteTitleFontChange}
              >
                {NOTE_FONT_CATEGORIES.map((fontCategory) => (
                  <optgroup
                    key={fontCategory}
                    label={t(`settingsWindow.editor.noteFontCategories.${fontCategory}`)}
                  >
                    {getNoteFontOptionsByCategory(fontCategory).map((fontOption) => (
                      <option
                        key={fontOption.value}
                        style={{ fontFamily: fontOption.fontFamily }}
                        value={fontOption.value}
                      >
                        {t(fontOption.labelKey)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <span
              className={styles.noteFontPreview}
              style={{ fontFamily: noteTitleFontPreviewFontFamily }}
            >
              {noteFontPreview}
            </span>
          </div>
          <div className={styles.settingsRow}>
            <div className={styles.settingsRowText}>
              <label className={styles.settingsSectionTitle} htmlFor="note-title-font-size">
                {t("settingsWindow.editor.noteTitleFontSize")}
              </label>
              <p className={styles.settingsSectionDescription}>{t("settingsWindow.editor.noteTitleFontSizeDescription")}</p>
            </div>
            <select
              className={styles.settingsSelect}
              id="note-title-font-size"
              value={props.appSettings.noteTitleFontSize}
              onChange={handleNoteTitleFontSizeChange}
            >
              {NOTE_TITLE_FONT_SIZE_OPTIONS.map((fontSize) => (
                <option key={fontSize} value={fontSize}>{fontSize}px</option>
              ))}
            </select>
          </div>
        </div>
        <h3 className={`${styles.settingsSubsectionHeader} ${styles.settingsSubsectionHeaderSpaced}`}>
          {t("settingsWindow.editor.contentSection")}
        </h3>
        <div className={styles.settingsRows}>
          <div className={`${styles.settingsRow} ${styles.noteFontRow}`}>
            <div>
              <label className={styles.settingsSectionTitle} id="editor-note-text-title" htmlFor="note-font">
                {t("settingsWindow.editor.noteFont")}
              </label>
              <p className={styles.settingsSectionDescription}>{t("settingsWindow.editor.noteFontDescription")}</p>
            </div>
            <div className={styles.noteFontControls}>
              <select
                className={styles.settingsSelect}
                id="note-font"
                style={{ fontFamily: noteFontPreviewFontFamily }}
                value={props.appSettings.noteFont}
                onChange={handleNoteFontChange}
              >
                {NOTE_FONT_CATEGORIES.map((fontCategory) => (
                  <optgroup
                    key={fontCategory}
                    label={t(`settingsWindow.editor.noteFontCategories.${fontCategory}`)}
                  >
                    {getNoteFontOptionsByCategory(fontCategory).map((fontOption) => (
                      <option
                        key={fontOption.value}
                        style={{ fontFamily: fontOption.fontFamily }}
                        value={fontOption.value}
                      >
                        {t(fontOption.labelKey)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <span
              className={styles.noteFontPreview}
              style={{ fontFamily: noteFontPreviewFontFamily }}
            >
              {noteFontPreview}
            </span>
          </div>
          <div className={styles.settingsRow}>
            <div className={styles.settingsRowText}>
              <label className={styles.settingsSectionTitle} htmlFor="note-content-font-size">
                {t("settingsWindow.editor.noteContentFontSize")}
              </label>
              <p className={styles.settingsSectionDescription}>{t("settingsWindow.editor.noteContentFontSizeDescription")}</p>
            </div>
            <select
              className={styles.settingsSelect}
              id="note-content-font-size"
              value={props.appSettings.noteContentFontSize}
              onChange={handleNoteContentFontSizeChange}
            >
              {NOTE_CONTENT_FONT_SIZE_OPTIONS.map((fontSize) => (
                <option key={fontSize} value={fontSize}>{fontSize}px</option>
              ))}
            </select>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Editor;
