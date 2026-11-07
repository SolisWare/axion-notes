/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { CSSProperties, useEffect, useId, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogProps, DialogTitle, FormControlLabel, Radio, RadioGroup } from "@mui/material";
import { useTranslation } from "react-i18next";
import { AppSettings } from "../settings/AppSettings";
import { getAppColors } from "../theme/AppColors";
import { SystemTheme } from "../theme/SystemTheme";
import { RestoreNotesMode } from "../types/RestoreNotesMode";
import { RestorePlan } from "../types/RestorePlan";
import { RestoreSettingsMode } from "../types/RestoreSettingsMode";
import { Formatter } from "../utils/dt-formatter/Formatter";
import styles from "./RestoreBackupDialog.module.css";

type RestoreBackupDialogCssProperties = CSSProperties & {
  "--restore-backup-dialog-background": string;
  "--restore-backup-dialog-backdrop": string;
  "--restore-backup-dialog-cancel-text": string;
  "--restore-backup-dialog-divider": string;
  "--restore-backup-dialog-muted-text": string;
  "--restore-backup-dialog-primary": string;
  "--restore-backup-dialog-text": string;
  "--restore-backup-dialog-title": string;
};

type RestoreBackupDialogProps = {
  appSettings: AppSettings;
  open: boolean;
  plan: RestorePlan;
  theme: SystemTheme;
  onCancel: () => void;
  onRestore: (notesMode: RestoreNotesMode, settingsMode: RestoreSettingsMode) => void;
};

enum DialogCloseReason {
  BACKDROP_CLICK = "backdropClick"
}

function RestoreBackupDialog(props: RestoreBackupDialogProps) {
  const { t } = useTranslation();
  const appColors = getAppColors(props.theme);
  const titleId = useId();
  const summaryId = useId();
  const notesGroupId = useId();
  const preferencesGroupId = useId();
  const [notesMode, setNotesMode] = useState<RestoreNotesMode | undefined>(props.plan.defaultNotesMode);
  const [settingsMode, setSettingsMode] = useState<RestoreSettingsMode | undefined>(props.plan.defaultSettingsMode);
  const canRestoreBackupPreferences = props.plan.hasBackupPreferences && props.plan.preferencesCanBeRestored;
  const createdAt = Formatter.toDate(props.plan.archiveCreatedAt);
  const rootStyle: RestoreBackupDialogCssProperties = {
    "--restore-backup-dialog-background": appColors.DIALOG_BACKGROUND,
    "--restore-backup-dialog-backdrop": appColors.DIALOG_BACKDROP,
    "--restore-backup-dialog-cancel-text": appColors.DIALOG_CANCEL_TEXT,
    "--restore-backup-dialog-divider": appColors.SETTINGS_DIVIDER,
    "--restore-backup-dialog-muted-text": appColors.SETTINGS_SECTION_TEXT,
    "--restore-backup-dialog-primary": appColors.MAIN,
    "--restore-backup-dialog-text": appColors.DIALOG_TEXT,
    "--restore-backup-dialog-title": appColors.DIALOG_TITLE_TEXT
  };

  useEffect(() => {
    if (props.open) {
      setNotesMode(props.plan.defaultNotesMode);
      setSettingsMode(props.plan.defaultSettingsMode);
    }
  }, [props.open, props.plan]);

  const handleClose: DialogProps["onClose"] = (_event, reason) => {
    if (reason === DialogCloseReason.BACKDROP_CLICK) {
      return;
    }

    props.onCancel();
  };
  const canRestore = (!props.plan.requiresNotesModeSelection || notesMode !== undefined)
    && (!props.plan.requiresSettingsModeSelection || settingsMode !== undefined);

  return (
    <Dialog
      BackdropProps={{ className: styles.backdrop }}
      aria-describedby={summaryId}
      aria-labelledby={titleId}
      classes={{ paper: styles.paper }}
      maxWidth={false}
      open={props.open}
      style={rootStyle}
      onClose={handleClose}
    >
      <DialogTitle className={styles.title} id={titleId}>{t("restoreBackup")}</DialogTitle>
      <DialogContent className={styles.content}>
        <p className={styles.summary} id={summaryId}>{t("restoreBackupSummary", { count: props.plan.incomingNotesCount })}</p>
        <p className={styles.createdAt}>
          {t("restoreBackupCreatedAt", {
            date: Formatter.getFormattedDate(createdAt, props.appSettings.dateFormat),
            time: Formatter.getFormattedTimestamp(createdAt, props.appSettings.timeFormat)
          })}
        </p>

        <fieldset className={styles.optionGroup}>
          <legend className={styles.optionGroupTitle} id={notesGroupId}>{t("restoreBackupNotes")}</legend>
          <p className={styles.optionGroupDescription}>{t("restoreBackupNotesHelp")}</p>
          <RadioGroup aria-labelledby={notesGroupId} className={styles.radioGroup} value={notesMode ?? ""} onChange={(event) => setNotesMode(event.target.value as RestoreNotesMode)}>
            <FormControlLabel className={styles.radioOption} value={RestoreNotesMode.REPLACE_CURRENT} control={<Radio />} label={t("replaceCurrentNotes")} />
            <FormControlLabel className={styles.radioOption} value={RestoreNotesMode.ADD_TO_CURRENT} control={<Radio />} label={t("addBackupNotes")} />
          </RadioGroup>
        </fieldset>

        <fieldset className={styles.optionGroup}>
          <legend className={styles.optionGroupTitle} id={preferencesGroupId}>{t("restoreBackupPreferencesTitle")}</legend>
          <p className={styles.optionGroupDescription}>
            {t(props.plan.hasBackupPreferences
              ? canRestoreBackupPreferences ? "restoreBackupPreferencesHelp" : "restoreBackupPreferencesUnavailable"
              : "restoreBackupNoPreferences")}
          </p>
          <RadioGroup
            aria-labelledby={preferencesGroupId}
            className={styles.radioGroup}
            disabled={!canRestoreBackupPreferences}
            value={settingsMode ?? ""}
            onChange={(event) => setSettingsMode(event.target.value as RestoreSettingsMode)}
          >
            <FormControlLabel className={styles.radioOption} disabled={!canRestoreBackupPreferences} value={RestoreSettingsMode.KEEP_CURRENT} control={<Radio />} label={t("keepCurrentPreferences")} />
            <FormControlLabel className={styles.radioOption} disabled={!canRestoreBackupPreferences} value={RestoreSettingsMode.RESTORE_BACKUP} control={<Radio />} label={t("restoreBackupPreferences")} />
          </RadioGroup>
        </fieldset>
      </DialogContent>
      <DialogActions className={styles.actions}>
        <Button autoFocus className={styles.cancelButton} onClick={props.onCancel}>{t("cancel")}</Button>
        <Button color="error" disabled={!canRestore} variant="contained" onClick={() => props.onRestore(notesMode ?? RestoreNotesMode.REPLACE_CURRENT, settingsMode ?? RestoreSettingsMode.KEEP_CURRENT)}>{t("restoreBackup")}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default RestoreBackupDialog;
