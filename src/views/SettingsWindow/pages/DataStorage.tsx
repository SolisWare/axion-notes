/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./SettingsPages.module.css";

function DataStorage() {
  const { t } = useTranslation();
  const [notesLocation, setNotesFolderLocation] = useState("");
  const [passwordEncryptionDataLocation, setSecurityFolderLocation] = useState("");
  const [settingsLocation, setSettingsFolderLocation] = useState("");

  useEffect(() => {
    window.api.storage.getNotesFolderLocation()
      .then(setNotesFolderLocation)
      .catch((err: Error) => {
        console.error("Failed to load notes folder location:", err.message);
      });

    window.api.settings.getSettingsFolderLocation()
      .then(setSettingsFolderLocation)
      .catch((err: Error) => {
        console.error("Failed to load settings folder location:", err.message);
      });

    window.api.security.getSecurityFolderLocation()
      .then(setSecurityFolderLocation)
      .catch((err: Error) => {
        console.error("Failed to load security folder location:", err.message);
      });
  }, []);

  return (
    <div className={styles.dataStoragePage}>
      <section className={styles.settingsSection} aria-labelledby="notes-folder-location-title">
        <div className={styles.settingsRows}>
          <div className={styles.settingsRow}>
            <div className={styles.settingsRowText}>
              <h3 className={styles.settingsSectionTitle} id="notes-folder-location-title">{t("notesLocation")}</h3>
              <p className={styles.settingsSectionDescription}>{notesLocation}</p>
            </div>
          </div>
          <div className={styles.settingsRow}>
            <div className={styles.settingsRowText}>
              <h3 className={styles.settingsSectionTitle}>{t("settingsLocation")}</h3>
              <p className={styles.settingsSectionDescription}>{settingsLocation}</p>
            </div>
          </div>
          <div className={styles.settingsRow}>
            <div className={styles.settingsRowText}>
              <h3 className={styles.settingsSectionTitle}>{t("passwordEncryptionDataLocation")}</h3>
              <p className={styles.settingsSectionDescription}>{passwordEncryptionDataLocation}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default DataStorage;
