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
import ConfirmationDialog from "../../../components/ConfirmationDialog";
import SecurityPasswordDialog, { SecurityPasswordDialogMode, SecurityPasswordDialogValues } from "../../../components/SecurityPasswordDialog";
import { SystemTheme } from "../../../theme/SystemTheme";
import { AppSettings } from "../../../settings/AppSettings";
import { BackupContentSelection } from "../../../types/BackupContentSelection";
import { BackupCreateStatus } from "../../../types/BackupCreateResult";
import { BackupDeleteStatus } from "../../../types/BackupDeleteResult";
import { BackupSaveStatus } from "../../../types/BackupSaveResult";
import { BackupState } from "../../../types/BackupState";
import { Formatter } from "../../../utils/dt-formatter/Formatter";
import { UserAgent } from "../../../utils/UserAgent";
import styles from "./SettingsPages.module.css";

type BackupsProps = {
  appSettings: AppSettings;
  theme: SystemTheme;
};

function Backups(props: BackupsProps) {
  const { t } = useTranslation();
  const isElectron = UserAgent.isElectron;
  const [backupState, setBackupState] = useState<BackupState | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasInitializationError, setHasInitializationError] = useState(false);
  const [isOptionsDialogOpen, setOptionsDialogOpen] = useState(false);
  const [isBackupPasswordDialogOpen, setBackupPasswordDialogOpen] = useState(false);
  const [isCreatingBackup, setCreatingBackup] = useState(false);
  const [isSavingBackupCopy, setSavingBackupCopy] = useState(false);
  const [isDeleteBackupDialogOpen, setDeleteBackupDialogOpen] = useState(false);
  const [isDeletingBackup, setDeletingBackup] = useState(false);
  const [hasBackupCreationError, setHasBackupCreationError] = useState(false);
  const [hasBackupCopySaveError, setHasBackupCopySaveError] = useState(false);
  const [hasBackupDeletionError, setHasBackupDeletionError] = useState(false);
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
      setToastMessage(t(isElectron ? "backupCreated" : "backupDownloadStarted"));
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

  const handleSaveCopy = async (): Promise<void> => {
    setSavingBackupCopy(true);
    setHasBackupCopySaveError(false);

    try {
      const result = await window.api.backup.saveCopy();

      if (result.status === BackupSaveStatus.SAVED) {
        setToastMessage(t("backupCopySaved"));
      } else if (result.status === BackupSaveStatus.FAILED) {
        setHasBackupCopySaveError(true);
      }
    } catch (err) {
      console.error("Failed to save a backup copy:", (err as Error).message);
      setHasBackupCopySaveError(true);
    } finally {
      setSavingBackupCopy(false);
    }
  };

  const handleDeleteBackup = async (): Promise<void> => {
    setDeletingBackup(true);
    setHasBackupDeletionError(false);

    try {
      const result = await window.api.backup.deleteArchive();

      if (result.status !== BackupDeleteStatus.DELETED || !result.state) {
        setHasBackupDeletionError(true);
        return;
      }

      setBackupState(result.state);
      setDeleteBackupDialogOpen(false);
      setToastMessage(t("backupDeleted"));
    } catch (err) {
      console.error("Failed to delete backup:", (err as Error).message);
      setHasBackupDeletionError(true);
    } finally {
      setDeletingBackup(false);
    }
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
      <section className={styles.settingsSection}>
        <div className={styles.backupCard}>
          <div className={styles.backupStatus}>
            <div className={styles.settingsRowText}>
              <h3 className={styles.settingsSectionTitle}>{t(lastBackupCreatedAt ? isElectron ? "lastBackupCreated" : "lastBackupDownloadStarted" : isInitialized ? "backupConfigurationCreated" : isElectron ? "noBackupCreated" : "noBackupDownloaded")}</h3>
              {lastBackupDate && lastBackupTime && (
                <p className={styles.settingsSectionDescription}>{t("lastBackupCreatedHelp", { date: lastBackupDate, time: lastBackupTime })}</p>
              )}
              {!isInitialized && (
                <p className={styles.settingsSectionDescription}>{t(isElectron ? "noBackupCreatedHelp" : "noBackupDownloadedHelp")}</p>
              )}
              {isInitialized && !lastBackupCreatedAt && (
                <p className={styles.settingsSectionDescription}>{t("backupConfigurationCreatedHelp")}</p>
              )}
            </div>
          </div>
          {hasInitializationError && (
            <p className={styles.backupError} role="alert">{t("backupSetupFailed")}</p>
          )}
          {hasBackupCreationError && (
            <p className={styles.backupError} role="alert">{t("backupCreateFailed")}</p>
          )}
          {isElectron && hasBackupCopySaveError && (
            <p className={styles.backupError} role="alert">{t("backupCopySaveFailed")}</p>
          )}
          {isElectron && hasBackupDeletionError && (
            <p className={styles.backupError} role="alert">{t("backupDeleteFailed")}</p>
          )}
          <div className={styles.backupCardActions}>
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
              <>
                <button className={styles.settingsButton} disabled={isCreatingBackup || isSavingBackupCopy || isDeletingBackup} type="button" onClick={() => void createBackup()}>
                  {t(backupState.lastBackupCreatedAt ? isElectron ? "createNewBackup" : "downloadNewBackup" : isElectron ? "createBackup" : "downloadBackup")}
                </button>
                {isElectron && lastBackupCreatedAt && (
                  <>
                    <button className={styles.settingsButton} disabled={isCreatingBackup || isSavingBackupCopy || isDeletingBackup} type="button" onClick={() => void handleSaveCopy()}>
                      {t(isSavingBackupCopy ? "savingBackupCopy" : "saveBackupCopy")}
                    </button>
                    <button className={styles.settingsButton} disabled={isCreatingBackup || isSavingBackupCopy || isDeletingBackup} type="button" onClick={() => setDeleteBackupDialogOpen(true)}>
                      {t("deleteBackup")}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
        {isInitialized && (
          <div className={styles.backupOptionsAction}>
            <button className={`${styles.settingsButton} ${styles.backupOptionsButton}`} type="button" onClick={() => setOptionsDialogOpen(true)}>
              {t("options")}
            </button>
          </div>
        )}
      </section>
      {backupState && (
        <BackupOptionsDialog
          contentSelection={backupState.contentSelection}
          open={isOptionsDialogOpen}
          showMainWindowStateOption={isElectron}
          theme={props.theme}
          onClose={() => setOptionsDialogOpen(false)}
          onSave={handleSaveOptions}
        />
      )}
      {isElectron && (
        <SecurityPasswordDialog
          mode={SecurityPasswordDialogMode.BACKUP}
          open={isBackupPasswordDialogOpen}
          theme={props.theme}
          onCancel={() => setBackupPasswordDialogOpen(false)}
          onSubmit={handleBackupPasswordSubmit}
        />
      )}
      {isElectron && (
        <ConfirmationDialog
          confirmLabel={t(isDeletingBackup ? "deletingBackup" : "deleteBackup")}
          message={t("deleteBackupWarning")}
          open={isDeleteBackupDialogOpen}
          theme={props.theme}
          title={t("deleteBackupHeading")}
          onCancel={() => setDeleteBackupDialogOpen(false)}
          onConfirm={() => void handleDeleteBackup()}
        />
      )}
      <BlockingProgressDialog
        open={isCreatingBackup}
        status={t(isElectron ? "creatingBackup" : "downloadingBackup")}
        theme={props.theme}
        title={t(isElectron ? "createBackup" : "downloadBackup")}
        value={50}
      />
      <AppToast message={toastMessage} open={Boolean(toastMessage)} theme={props.theme} onClose={() => setToastMessage("")} />
    </div>
  );
}

export default Backups;
