/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppToast from "../../../components/AppToast";
import BackupOptionsDialog from "../../../components/BackupOptionsDialog";
import BlockingProgressDialog from "../../../components/BlockingProgressDialog";
import SecurityPasswordDialog, { SecurityPasswordDialogMode, SecurityPasswordDialogValues } from "../../../components/SecurityPasswordDialog";
import { SystemTheme } from "../../../theme/SystemTheme";
import { AppSettings } from "../../../settings/AppSettings";
import { BackupContentSelection } from "../../../types/BackupContentSelection";
import { BackupCreateStatus } from "../../../types/BackupCreateResult";
import { BackupState } from "../../../types/BackupState";
import { Formatter } from "../../../utils/dt-formatter/Formatter";
import styles from "./SettingsPages.module.css";

type BackupsProps = {
  appSettings: AppSettings;
  theme: SystemTheme;
};

function Backups(props: BackupsProps) {
  const { t } = useTranslation();
  const [backupState, setBackupState] = useState<BackupState | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasInitializationError, setHasInitializationError] = useState(false);
  const [isOptionsDialogOpen, setOptionsDialogOpen] = useState(false);
  const [isBackupPasswordDialogOpen, setBackupPasswordDialogOpen] = useState(false);
  const [isCreatingBackup, setCreatingBackup] = useState(false);
  const [hasBackupCreationError, setHasBackupCreationError] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

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

  const handleSaveOptions = async (contentSelection: BackupContentSelection): Promise<boolean> => {
    try {
      const state = await window.api.backup.updateContentSelection(contentSelection);

      if (!state) {
        return false;
      }

      setBackupState(state);
      return true;
    } catch (err) {
      console.error("Failed to update backup options:", (err as Error).message);
      return false;
    }
  };

  const createBackup = async (password?: string): Promise<boolean> => {
    setCreatingBackup(true);
    setHasBackupCreationError(false);

    try {
      const result = await window.api.backup.createArchive(password);

      if (result.status === BackupCreateStatus.PASSWORD_REQUIRED) {
        setBackupPasswordDialogOpen(true);
        return false;
      }

      if (result.status !== BackupCreateStatus.CREATED || !result.state) {
        setHasBackupCreationError(true);
        return false;
      }

      setBackupState(result.state);
      setBackupPasswordDialogOpen(false);
      setToastMessage(t("backupCreated"));
      return true;
    } catch (err) {
      console.error("Failed to create backup:", (err as Error).message);
      setHasBackupCreationError(true);
      return false;
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleBackupPasswordSubmit = async (values: SecurityPasswordDialogValues): Promise<boolean> => {
    return createBackup(values.currentPassword);
  };

  const isInitialized = backupState !== undefined;
  const lastBackupCreatedAt = backupState?.lastBackupCreatedAt;
  const lastBackupDate = lastBackupCreatedAt
    ? Formatter.getFormattedDate(Formatter.toDate(lastBackupCreatedAt), props.appSettings.dateFormat)
    : undefined;
  const lastBackupTime = lastBackupCreatedAt
    ? Formatter.getFormattedTimestamp(Formatter.toDate(lastBackupCreatedAt), props.appSettings.timeFormat)
    : undefined;

  return (
    <div className={styles.backupsPage}>
      <section className={styles.settingsSection} aria-labelledby="backups-title">
        <h2 className={styles.settingsSubsectionHeader} id="backups-title">{t("backups")}</h2>
        <div className={styles.settingsRows}>
          <div className={styles.settingsRow}>
            <div className={styles.settingsRowText}>
              <h3 className={styles.settingsSectionTitle}>{t(lastBackupCreatedAt ? "lastBackupCreated" : isInitialized ? "backupConfigurationCreated" : "noBackupCreated")}</h3>
              <p className={styles.settingsSectionDescription}>
                {lastBackupDate && lastBackupTime
                  ? t("lastBackupCreatedHelp", { date: lastBackupDate, time: lastBackupTime })
                  : t(isInitialized ? "backupConfigurationCreatedHelp" : "noBackupCreatedHelp")}
              </p>
            </div>
            {!isInitialized ? (
              <button
                className={styles.settingsButton}
                disabled={isLoading || isInitializing}
                type="button"
                onClick={handleInitialize}
              >
                {t(isInitializing ? "settingUpBackups" : "setUpBackups")}
              </button>
            ) : (
              <button className={styles.settingsButton} disabled={isCreatingBackup} type="button" onClick={() => void createBackup()}>
                {t(backupState.lastBackupCreatedAt ? "createNewBackup" : "createBackup")}
              </button>
            )}
          </div>
          {hasInitializationError && (
            <p className={styles.settingsSectionDescription} role="alert">{t("backupSetupFailed")}</p>
          )}
          {hasBackupCreationError && (
            <p className={styles.settingsSectionDescription} role="alert">{t("backupCreateFailed")}</p>
          )}
        </div>
        {isInitialized && (
          <div className={styles.backupActions}>
            <button className={styles.settingsButton} type="button" onClick={() => setOptionsDialogOpen(true)}>
              {t("options")}
            </button>
          </div>
        )}
      </section>
      {backupState && (
        <BackupOptionsDialog
          contentSelection={backupState.contentSelection}
          open={isOptionsDialogOpen}
          theme={props.theme}
          onClose={() => setOptionsDialogOpen(false)}
          onSave={handleSaveOptions}
        />
      )}
      <SecurityPasswordDialog
        mode={SecurityPasswordDialogMode.BACKUP}
        open={isBackupPasswordDialogOpen}
        theme={props.theme}
        onCancel={() => setBackupPasswordDialogOpen(false)}
        onSubmit={handleBackupPasswordSubmit}
      />
      <BlockingProgressDialog
        open={isCreatingBackup}
        status={t("creatingBackup")}
        theme={props.theme}
        title={t("createBackup")}
        value={50}
      />
      <AppToast message={toastMessage} open={Boolean(toastMessage)} theme={props.theme} onClose={() => setToastMessage("")} />
    </div>
  );
}

export default Backups;
