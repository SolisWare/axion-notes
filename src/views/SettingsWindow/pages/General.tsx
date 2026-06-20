/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { ChangeEvent } from "react";
import SyncIcon from "@mui/icons-material/Sync";
import { useTranslation } from "react-i18next";
import { AppSettings } from "../../../settings/AppSettings";
import { SUPPORTED_LANGUAGES, SupportedLanguageCode } from "../../../i18n/languages";
import { NoteSortOrder } from "../../../settings/NoteSortOrder";
import { UserAgent } from "../../../utils/UserAgent";
import styles from "./SettingsPages.module.css";

type GeneralProps = {
  appSettings: AppSettings;
  onAppSettingsChange: (settings: AppSettings) => void;
};

function General(props: GeneralProps) {
  const { t } = useTranslation();

  function handleKeepNotesOnTopChange(event: ChangeEvent<HTMLInputElement>) {
    props.onAppSettingsChange({
      ...props.appSettings,
      keepNotesMainWindowOnTop: event.target.checked
    });
  }

  function handleNoteSortOrderChange(event: ChangeEvent<HTMLSelectElement>) {
    props.onAppSettingsChange({
      ...props.appSettings,
      notesSortOrder: event.target.value as NoteSortOrder
    });

    event.currentTarget.blur();
  }

  function handleLanguageChange(event: ChangeEvent<HTMLSelectElement>) {
    props.onAppSettingsChange({
      ...props.appSettings,
      language: event.target.value as SupportedLanguageCode
    });

    event.currentTarget.blur();
  }

  return (
    <div className={styles.generalPage}>
      <section className={styles.settingsSection} aria-labelledby="note-sort-order-title">
        <div className={styles.settingsRows}>
          <div className={styles.settingsRow}>
            <label className={styles.settingsSectionTitle} id="note-sort-order-title" htmlFor="note-sort-order">{t("settingsWindow.general.sortNotesBy")}</label>
            <div className={styles.sortControls}>
              <select
                className={styles.settingsSelect}
                id="note-sort-order"
                value={props.appSettings.notesSortOrder}
                onChange={handleNoteSortOrderChange}
              >
                <option value={NoteSortOrder.DATE_CREATED_ASC}>{t("settingsWindow.general.sortOptions.dateCreatedAsc")}</option>
                <option value={NoteSortOrder.DATE_CREATED_DESC}>{t("settingsWindow.general.sortOptions.dateCreatedDesc")}</option>
                <option value={NoteSortOrder.LAST_MODIFIED}>{t("settingsWindow.general.sortOptions.lastModified")}</option>
                <option value={NoteSortOrder.TITLE_ASC}>{t("settingsWindow.general.sortOptions.titleAsc")}</option>
                <option value={NoteSortOrder.TITLE_DESC}>{t("settingsWindow.general.sortOptions.titleDesc")}</option>
              </select>
              <button className={styles.linkButton} type="button" onClick={window.api.noteSort.requestSort}>
                <SyncIcon fontSize="small" />
                <span>{t("settingsWindow.general.resortNotes")}</span>
              </button>
            </div>
          </div>
          {UserAgent.isElectron && (
            <div className={styles.settingsRow}>
              <div className={styles.settingsRowText}>
                <h3 className={styles.settingsSectionTitle} id="keep-notes-on-top-title">{t("settingsWindow.general.keepNotesOnTop")}</h3>
                <p className={styles.settingsSectionDescription}>{t("settingsWindow.general.keepNotesOnTopDescription")}</p>
              </div>
              <label className={styles.switchControl}>
                <input
                  checked={props.appSettings.keepNotesMainWindowOnTop}
                  className={styles.switchInput}
                  type="checkbox"
                  onChange={handleKeepNotesOnTopChange}
                />
                <span className={styles.switchTrack} aria-hidden="true">
                  <span className={styles.switchThumb} />
                </span>
                <span className={styles.visuallyHidden}>{t("settingsWindow.general.keepNotesOnTop")}</span>
              </label>
            </div>
          )}
          <div className={styles.settingsRow}>
            <label className={styles.settingsSectionTitle} id="language-title" htmlFor="language">
              {t("settingsWindow.general.language")}
            </label>
            <div className={styles.sortControls}>
              <select
                className={styles.settingsSelect}
                id="language"
                value={props.appSettings.language}
                onChange={handleLanguageChange}
              >
                {SUPPORTED_LANGUAGES.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.nativeLabel}
                  </option>
                ))}
              </select>
              {UserAgent.isElectron && (
                <span className={styles.settingsLanguageSwitcherNote}>{t("settingsWindow.general.requiresRestart")}</span>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default General;
