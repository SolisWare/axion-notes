/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { useTranslation } from "react-i18next";
import styles from "./SettingsPages.module.css";

function Backups() {
  const { t } = useTranslation();

  return (
    <div className={styles.backupsPage}>
      <section className={styles.settingsSection} aria-labelledby="backups-title">
        <h2 className={styles.settingsSubsectionHeader} id="backups-title">{t("backups")}</h2>
        <div className={styles.settingsRows}>
          <div className={styles.settingsRow}>
            <div className={styles.settingsRowText}>
              <h3 className={styles.settingsSectionTitle}>{t("noBackupCreated")}</h3>
              <p className={styles.settingsSectionDescription}>{t("noBackupCreatedHelp")}</p>
            </div>
            <button className={styles.settingsButton} disabled type="button">
              {t("setUpBackups")}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Backups;
