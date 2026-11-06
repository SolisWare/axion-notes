/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { ChangeEvent, CSSProperties, useEffect, useId, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogProps, DialogTitle } from "@mui/material";
import { useTranslation } from "react-i18next";
import { BackupContentSelection } from "../types/BackupContentSelection";
import { getAppColors } from "../theme/AppColors";
import { SystemTheme } from "../theme/SystemTheme";
import styles from "./BackupOptionsDialog.module.css";

type BackupOptionsDialogProps = {
  contentSelection: BackupContentSelection;
  open: boolean;
  showMainWindowStateOption?: boolean;
  theme: SystemTheme;
  onClose: () => void;
  onSave: (contentSelection: BackupContentSelection) => Promise<boolean>;
};

type BackupOptionsDialogCssProperties = CSSProperties & {
  "--backup-options-dialog-background": string;
  "--backup-options-dialog-backdrop": string;
  "--backup-options-dialog-cancel-text": string;
  "--backup-options-dialog-divider": string;
  "--backup-options-dialog-error-text": string;
  "--backup-options-dialog-muted-text": string;
  "--backup-options-dialog-primary": string;
  "--backup-options-dialog-text": string;
  "--backup-options-dialog-title": string;
};

enum DialogCloseReason {
  BACKDROP_CLICK = "backdropClick"
}

function BackupOptionsDialog(props: BackupOptionsDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const appColors = getAppColors(props.theme);
  const [contentSelection, setContentSelection] = useState(props.contentSelection);
  const [hasSaveError, setHasSaveError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const rootStyle: BackupOptionsDialogCssProperties = {
    "--backup-options-dialog-background": appColors.DIALOG_BACKGROUND,
    "--backup-options-dialog-backdrop": appColors.DIALOG_BACKDROP,
    "--backup-options-dialog-cancel-text": appColors.DIALOG_CANCEL_TEXT,
    "--backup-options-dialog-divider": appColors.SETTINGS_DIVIDER,
    "--backup-options-dialog-error-text": appColors.ERROR,
    "--backup-options-dialog-muted-text": appColors.SETTINGS_SECTION_TEXT,
    "--backup-options-dialog-primary": appColors.MAIN,
    "--backup-options-dialog-text": appColors.DIALOG_TEXT,
    "--backup-options-dialog-title": appColors.DIALOG_TITLE_TEXT
  };

  useEffect(() => {
    if (!props.open) {
      return;
    }

    setContentSelection(props.contentSelection);
    setHasSaveError(false);
    setIsSaving(false);
  }, [props.contentSelection, props.open]);

  const handleClose: DialogProps["onClose"] = (_event, reason) => {
    if (reason === DialogCloseReason.BACKDROP_CLICK) {
      return;
    }

    props.onClose();
  };

  const handleSelectionChange = (key: keyof BackupContentSelection) => (event: ChangeEvent<HTMLInputElement>): void => {
    setContentSelection((currentSelection) => ({
      ...currentSelection,
      [key]: event.target.checked
    }));
  };

  const handleSave = async (): Promise<void> => {
    setIsSaving(true);
    setHasSaveError(false);

    try {
      if (await props.onSave(contentSelection)) {
        props.onClose();
        return;
      }
    } catch (err) {
      console.error("Failed to save backup options:", (err as Error).message);
    }

    setHasSaveError(true);
    setIsSaving(false);
  };

  return (
    <Dialog
      BackdropProps={{ className: styles.backdrop }}
      aria-labelledby={titleId}
      classes={{ paper: styles.paper }}
      open={props.open}
      style={rootStyle}
      onClose={handleClose}
    >
      <DialogTitle className={styles.title} id={titleId}>{t("backupOptions")}</DialogTitle>
      <DialogContent className={styles.content}>
        <fieldset className={styles.contentList}>
          <legend className={styles.contentLegend}>{t("includedInBackups")}</legend>
          <label className={styles.contentOption}>
            <input aria-label={t("notesAndNoteOrder")} checked disabled type="checkbox" />
            <span className={styles.contentOptionText}>
              <span className={styles.contentOptionTitle}>{t("notesAndNoteOrder")}</span>
              <span className={styles.contentOptionDescription}>{t("notesAndNoteOrderHelp")}</span>
            </span>
          </label>
          <label className={styles.contentOption}>
            <input aria-label={t("appPreferences")} checked={contentSelection.appSettings} type="checkbox" onChange={handleSelectionChange("appSettings")} />
            <span className={styles.contentOptionText}>
              <span className={styles.contentOptionTitle}>{t("appPreferences")}</span>
              <span className={styles.contentOptionDescription}>{t("appPreferencesHelp")}</span>
            </span>
          </label>
          {props.showMainWindowStateOption !== false && (
            <label className={styles.contentOption}>
              <input aria-label={t("mainWindowLayout")} checked={contentSelection.mainWindowState} type="checkbox" onChange={handleSelectionChange("mainWindowState")} />
              <span className={styles.contentOptionText}>
                <span className={styles.contentOptionTitle}>{t("mainWindowLayout")}</span>
                <span className={styles.contentOptionDescription}>{t("mainWindowLayoutHelp")}</span>
              </span>
            </label>
          )}
        </fieldset>
        {hasSaveError && <p className={styles.error} role="alert">{t("backupOptionsSaveFailed")}</p>}
      </DialogContent>
      <DialogActions className={styles.actions}>
        <Button autoFocus className={styles.cancelButton} disabled={isSaving} onClick={props.onClose}>{t("cancel")}</Button>
        <Button disabled={isSaving} onClick={handleSave} variant="contained">{t(isSaving ? "saving" : "save")}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default BackupOptionsDialog;
