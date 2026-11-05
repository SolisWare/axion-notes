/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackupState } from "../../../types/BackupState";
import styles from "./SettingsPages.module.css";

function Backups() {
  const { t } = useTranslation();
  const [backupState, setBackupState] = useState<BackupState | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasInitializationError, setHasInitializationError] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    window.api.backup.getState()
      .then((state) => {
        if (isCurrent) {
          setBackupState(state);
        }
      })
      .catch((err: Error) => {
        console.error("Failed to load backup state:", err.message);
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const handleInitialize = async (): Promise<void> => {
    setIsInitializing(true);
    setHasInitializationError(false);

    try {
      const state = await window.api.backup.initialize();

      if (!state) {
        setHasInitializationError(true);
        return;
      }

      setBackupState(state);
    } catch (err) {
      console.error("Failed to initialize backups:", (err as Error).message);
      setHasInitializationError(true);
    } finally {
      setIsInitializing(false);
    }
  };

  const isInitialized = backupState !== undefined;

  return (
    <div className={styles.backupsPage}>
      <section className={styles.settingsSection} aria-labelledby="backups-title">
        <h2 className={styles.settingsSubsectionHeader} id="backups-title">{t("backups")}</h2>
        <div className={styles.settingsRows}>
          <div className={styles.settingsRow}>
            <div className={styles.settingsRowText}>
              <h3 className={styles.settingsSectionTitle}>{t(isInitialized ? "backupConfigurationCreated" : "noBackupCreated")}</h3>
              <p className={styles.settingsSectionDescription}>
                {t(isInitialized ? "backupConfigurationCreatedHelp" : "noBackupCreatedHelp")}
              </p>
            </div>
            {!isInitialized && (
              <button
                className={styles.settingsButton}
                disabled={isLoading || isInitializing}
                type="button"
                onClick={handleInitialize}
              >
                {t(isInitializing ? "settingUpBackups" : "setUpBackups")}
              </button>
            )}
          </div>
          {hasInitializationError && (
            <p className={styles.settingsSectionDescription} role="alert">{t("backupSetupFailed")}</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default Backups;
