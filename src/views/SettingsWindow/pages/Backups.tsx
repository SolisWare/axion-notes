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
import RestoreBackupDialog from "../../../components/RestoreBackupDialog";
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
import { RestoreApplyStatus } from "../../../types/RestoreApplyResult";
import { RestoreChooseStatus } from "../../../types/RestoreChooseResult";
import { RestoreInspectStatus } from "../../../types/RestoreInspectResult";
import { RestoreNotesMode } from "../../../types/RestoreNotesMode";
import { RestorePlan } from "../../../types/RestorePlan";
import { RestoreSettingsMode } from "../../../types/RestoreSettingsMode";
import { RestoreState } from "../../../types/RestoreState";
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
  const [restoreState, setRestoreState] = useState<RestoreState | undefined>();
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
  const [restoreArchivePath, setRestoreArchivePath] = useState<string>();
  const [restorePassword, setRestorePassword] = useState<string>();
  const [restorePlan, setRestorePlan] = useState<RestorePlan>();
  const [isRestoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [isRestorePasswordDialogOpen, setRestorePasswordDialogOpen] = useState(false);
  const [isRestoreConfirmationOpen, setRestoreConfirmationOpen] = useState(false);
  const [restoreNotesMode, setRestoreNotesMode] = useState<RestoreNotesMode>(RestoreNotesMode.REPLACE_CURRENT);
  const [restoreSettingsMode, setRestoreSettingsMode] = useState<RestoreSettingsMode>(RestoreSettingsMode.KEEP_CURRENT);
  const [restoreErrorKey, setRestoreErrorKey] = useState<string>();

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

    if (isElectron) {
      window.api.restore.getState()
        .then((state) => {
          if (isCurrent) {
            setRestoreState(state);
          }
        })
        .catch((err: Error) => {
          console.error("Failed to load restore state:", err.message);
        });
    }

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

  const handleChooseRestoreArchive = async (): Promise<void> => {
    const selection = await window.api.restore.chooseArchive();

    if (selection.status !== RestoreChooseStatus.SELECTED || !selection.filePath) {
      return;
    }

    setRestoreArchivePath(selection.filePath);
    setRestorePassword(undefined);
    await inspectRestoreArchive(selection.filePath);
  };

  const inspectRestoreArchive = async (archivePath: string, password?: string): Promise<RestoreInspectStatus> => {
    const inspection = await window.api.restore.inspect(archivePath, password);

    switch (inspection.status) {
      case RestoreInspectStatus.READY:
        if (!inspection.plan) {
          setRestoreErrorKey("restoreBackupFailed");
          return RestoreInspectStatus.FAILED;
        }
        setRestoreErrorKey(undefined);
        setRestorePassword(password);
        setRestorePlan(inspection.plan);
        setRestorePasswordDialogOpen(false);
        setRestoreDialogOpen(true);
        return RestoreInspectStatus.READY;
      case RestoreInspectStatus.PASSWORD_REQUIRED:
        setRestorePasswordDialogOpen(true);
        return RestoreInspectStatus.PASSWORD_REQUIRED;
      case RestoreInspectStatus.INVALID_ARCHIVE:
        setRestorePasswordDialogOpen(false);
        setRestoreErrorKey("restoreBackupInvalidArchive");
        return RestoreInspectStatus.INVALID_ARCHIVE;
      case RestoreInspectStatus.INVALID_PASSWORD:
        return RestoreInspectStatus.INVALID_PASSWORD;
      case RestoreInspectStatus.FAILED:
      default:
        setRestorePasswordDialogOpen(false);
        setRestoreErrorKey("restoreBackupFailed");
        return RestoreInspectStatus.FAILED;
    }
  };

  const handleRestorePasswordSubmit = async (values: SecurityPasswordDialogValues): Promise<boolean> => {
    if (!restoreArchivePath) {
      setRestorePasswordDialogOpen(false);
      setRestoreErrorKey("restoreBackupFailed");
      return true;
    }

    const status = await inspectRestoreArchive(restoreArchivePath, values.currentPassword);
    return status !== RestoreInspectStatus.INVALID_PASSWORD;
  };

  const handleRestore = async (): Promise<void> => {
    if (!restoreArchivePath) {
      return;
    }

    const result = await window.api.restore.apply(restoreArchivePath, {
      notesMode: restoreNotesMode,
      password: restorePassword,
      settingsMode: restoreSettingsMode
    });

    if (result.status === RestoreApplyStatus.PASSWORD_REQUIRED || result.status === RestoreApplyStatus.INVALID_PASSWORD) {
      setRestoreConfirmationOpen(false);
      setRestorePassword(undefined);
      setRestorePasswordDialogOpen(true);
      return;
    }

    if (result.status === RestoreApplyStatus.INVALID_ARCHIVE) {
      setRestoreConfirmationOpen(false);
      setRestoreErrorKey("restoreBackupInvalidArchive");
      return;
    }

    if (result.status !== RestoreApplyStatus.APPLIED) {
      setRestoreConfirmationOpen(false);
      setRestoreErrorKey("restoreBackupFailed");
      return;
    }

    setRestoreErrorKey(undefined);
    window.api.appWindow.restart();
  };

  const isInitialized = backupState !== undefined;
  const lastBackupCreatedAt = backupState?.lastBackupCreatedAt;
  const lastBackupDate = lastBackupCreatedAt
    ? Formatter.getFormattedDate(Formatter.toDate(lastBackupCreatedAt), props.appSettings.dateFormat)
    : undefined;
  const lastBackupTime = lastBackupCreatedAt
    ? Formatter.getFormattedTimestamp(Formatter.toDate(lastBackupCreatedAt), props.appSettings.timeFormat)
    : undefined;
  const lastRestoredAt = restoreState?.lastRestoredAt;
  const lastRestoreDate = lastRestoredAt
    ? Formatter.getFormattedDate(Formatter.toDate(lastRestoredAt), props.appSettings.dateFormat)
    : undefined;
  const lastRestoreTime = lastRestoredAt
    ? Formatter.getFormattedTimestamp(Formatter.toDate(lastRestoredAt), props.appSettings.timeFormat)
    : undefined;
  return (
    <div className={styles.backupsPage}>
      <section className={styles.settingsSection}>
        <h2 className={styles.settingsSubsectionHeader}>{t("backups")}</h2>
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
        <h2 className={`${styles.settingsSubsectionHeader} ${styles.settingsSubsectionHeaderSpaced}`}>{t("restore")}</h2>
        <div className={styles.backupCard}>
          <div className={styles.backupStatus}>
            <div className={styles.settingsRowText}>
              <h3 className={styles.settingsSectionTitle}>{t(lastRestoredAt ? "lastBackupRestored" : "noBackupRestored")}</h3>
              <p className={restoreErrorKey ? styles.settingsSectionError : styles.settingsSectionDescription} role={restoreErrorKey ? "alert" : undefined}>
                {t(restoreErrorKey ?? (lastRestoreDate && lastRestoreTime ? "lastBackupRestoredHelp" : "noBackupRestoredHelp"), {
                  date: lastRestoreDate,
                  time: lastRestoreTime
                })}
              </p>
            </div>
          </div>
          <div className={styles.backupCardActions}>
            <button className={styles.settingsButton} disabled={!isElectron} type="button" onClick={() => void handleChooseRestoreArchive()}>
              {t("restoreBackup")}
            </button>
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
      {restorePlan && (
        <RestoreBackupDialog
          appSettings={props.appSettings}
          open={isRestoreDialogOpen}
          plan={restorePlan}
          theme={props.theme}
          onCancel={() => setRestoreDialogOpen(false)}
          onRestore={(notesMode, settingsMode) => {
            setRestoreNotesMode(notesMode);
            setRestoreSettingsMode(settingsMode);
            setRestoreDialogOpen(false);
            setRestoreConfirmationOpen(true);
          }}
        />
      )}
      <ConfirmationDialog
        confirmLabel={t("restoreBackup")}
        message={t("restoreBackupWarning")}
        open={isRestoreConfirmationOpen}
        theme={props.theme}
        title={t("restoreBackup")}
        onCancel={() => setRestoreConfirmationOpen(false)}
        onConfirm={() => void handleRestore()}
      />
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
        <SecurityPasswordDialog
          mode={SecurityPasswordDialogMode.RESTORE}
          open={isRestorePasswordDialogOpen}
          theme={props.theme}
          onCancel={() => setRestorePasswordDialogOpen(false)}
          onSubmit={handleRestorePasswordSubmit}
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
