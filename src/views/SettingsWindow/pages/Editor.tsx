/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { ChangeEvent } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import ConfirmationDialog from "../../../components/ConfirmationDialog";
import { AppSettings } from "../../../settings/AppSettings";
import { getNoteFontFamily, NOTE_FONT_CATEGORIES, NOTE_FONT_OPTIONS, NoteFontPreference } from "../../../settings/NoteFontPreference";
import { NOTE_CONTENT_FONT_SIZE_OPTIONS, NOTE_TITLE_FONT_SIZE_OPTIONS, NoteFontSize } from "../../../settings/NoteFontSize";
import { SystemTheme } from "../../../theme/SystemTheme";
import styles from "./SettingsPages.module.css";

type EditorProps = {
  theme: SystemTheme;
  appSettings: AppSettings;
  onAppSettingsChange: (settings: AppSettings) => void;
};

function Editor(props: EditorProps) {
  const { t } = useTranslation();
  const [isDisableRichTextEditorDialogOpen, setDisableRichTextEditorDialogOpen] = useState(false);
  const noteFontPreviewFontFamily = getNoteFontFamily(props.appSettings.noteFont);
  const titleFontPreviewFontFamily = getNoteFontFamily(props.appSettings.titleFont);
  const noteFontPreview = t("fontSampleText");

  function handleRichTextEditorEnabledChange(event: ChangeEvent<HTMLInputElement>) {
    if (!event.target.checked) {
      setDisableRichTextEditorDialogOpen(true);
      return;
    }

    props.onAppSettingsChange({
      ...props.appSettings,
      richTextEditorEnabled: true
    });
  }

  function handleDisableRichTextEditorConfirm() {
    setDisableRichTextEditorDialogOpen(false);
    props.onAppSettingsChange({
      ...props.appSettings,
      richTextEditorEnabled: false
    });
  }

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
      titleFont: event.target.value as NoteFontPreference
    });

    event.currentTarget.blur();
  }

  function handleNoteContentFontSizeChange(event: ChangeEvent<HTMLSelectElement>) {
    props.onAppSettingsChange({
      ...props.appSettings,
      contentFontSize: Number(event.target.value) as NoteFontSize
    });

    event.currentTarget.blur();
  }

  function handleNoteTitleFontSizeChange(event: ChangeEvent<HTMLSelectElement>) {
    props.onAppSettingsChange({
      ...props.appSettings,
      titleFontSize: Number(event.target.value) as NoteFontSize
    });

    event.currentTarget.blur();
  }

  function getNoteFontOptionsByCategory(fontCategory: typeof NOTE_FONT_CATEGORIES[number], hiddenFont: NoteFontPreference) {
    return NOTE_FONT_OPTIONS.filter((fontOption) => fontOption.category === fontCategory && fontOption.value !== hiddenFont);
  }

  function getVisibleNoteFontValue(noteFont: NoteFontPreference, hiddenFont: NoteFontPreference) {
    return noteFont === hiddenFont ? NoteFontPreference.SYSTEM : noteFont;
  }

  return (
    <div className={styles.editorPage}>
      <ConfirmationDialog
        theme={props.theme}
        open={isDisableRichTextEditorDialogOpen}
        title={t("turnOffRichTextEditor")}
        message={t("richTextEditorDisableWarning")}
        confirmLabel={t("turnOff")}
        onConfirm={handleDisableRichTextEditorConfirm}
        onCancel={() => setDisableRichTextEditorDialogOpen(false)}
      />
      <section className={styles.settingsSection} aria-labelledby="editor-note-text-title">
        <div className={styles.settingsRows}>
          <div className={styles.settingsRow}>
            <div className={styles.settingsRowText}>
              <h3 className={styles.settingsSectionTitle} id="rich-text-editor-enabled-title">{t("richTextEditor")}</h3>
              <p className={styles.settingsSectionDescription}>{t("richTextEditorHelp")}</p>
            </div>
            <label className={styles.switchControl}>
              <input
                aria-labelledby="rich-text-editor-enabled-title"
                checked={props.appSettings.richTextEditorEnabled}
                className={styles.switchInput}
                type="checkbox"
                onChange={handleRichTextEditorEnabledChange}
              />
              <span className={styles.switchTrack} aria-hidden="true">
                <span className={styles.switchThumb} />
              </span>
              <span className={styles.visuallyHidden}>{t("richTextEditor")}</span>
            </label>
          </div>
        </div>
        <h3 className={`${styles.settingsSubsectionHeader} ${styles.settingsSubsectionHeaderFirst}`}>
          {t("title")}
        </h3>
        <div className={styles.settingsRows}>
          <div className={`${styles.settingsRow} ${styles.noteFontRow}`}>
            <div>
              <label className={styles.settingsSectionTitle} htmlFor="note-title-font">
                {t("titleFont")}
              </label>
              <p className={styles.settingsSectionDescription}>{t("titleFontDescription")}</p>
            </div>
            <div className={styles.noteFontControls}>
              <select
                className={styles.settingsSelect}
                id="note-title-font"
                style={{ fontFamily: titleFontPreviewFontFamily }}
                value={getVisibleNoteFontValue(props.appSettings.titleFont, NoteFontPreference.SANS_SERIF)}
                onChange={handleNoteTitleFontChange}
              >
                {NOTE_FONT_CATEGORIES.map((fontCategory) => (
                  <optgroup
                    key={fontCategory}
                    label={t(`fontCategories.${fontCategory}`)}
                  >
                    {getNoteFontOptionsByCategory(fontCategory, NoteFontPreference.SANS_SERIF).map((fontOption) => (
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
              style={{ fontFamily: titleFontPreviewFontFamily }}
            >
              {noteFontPreview}
            </span>
          </div>
          <div className={styles.settingsRow}>
            <div className={styles.settingsRowText}>
              <label className={styles.settingsSectionTitle} htmlFor="note-title-font-size">
                {t("titleFontSize")}
              </label>
              <p className={styles.settingsSectionDescription}>{t("titleFontSizeDescription")}</p>
            </div>
            <select
              className={styles.settingsSelect}
              id="note-title-font-size"
              value={props.appSettings.titleFontSize}
              onChange={handleNoteTitleFontSizeChange}
            >
              {NOTE_TITLE_FONT_SIZE_OPTIONS.map((fontSize) => (
                <option key={fontSize} value={fontSize}>{fontSize}px</option>
              ))}
            </select>
          </div>
        </div>
        <h3 className={`${styles.settingsSubsectionHeader} ${styles.settingsSubsectionHeaderSpaced}`}>
          {t("content")}
        </h3>
        <div className={styles.settingsRows}>
          <div className={`${styles.settingsRow} ${styles.noteFontRow}`}>
            <div>
              <label className={styles.settingsSectionTitle} id="editor-note-text-title" htmlFor="note-font">
                {t("contentFont")}
              </label>
              <p className={styles.settingsSectionDescription}>{t("contentFontDescription")}</p>
            </div>
            <div className={styles.noteFontControls}>
              <select
                className={styles.settingsSelect}
                id="note-font"
                style={{ fontFamily: noteFontPreviewFontFamily }}
                value={getVisibleNoteFontValue(props.appSettings.noteFont, NoteFontPreference.MONOSPACE)}
                onChange={handleNoteFontChange}
              >
                {NOTE_FONT_CATEGORIES.map((fontCategory) => (
                  <optgroup
                    key={fontCategory}
                    label={t(`fontCategories.${fontCategory}`)}
                  >
                    {getNoteFontOptionsByCategory(fontCategory, NoteFontPreference.MONOSPACE).map((fontOption) => (
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
                {t("contentFontSize")}
              </label>
              <p className={styles.settingsSectionDescription}>{t("contentFontSizeDescription")}</p>
            </div>
            <select
              className={styles.settingsSelect}
              id="note-content-font-size"
              value={props.appSettings.contentFontSize}
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
