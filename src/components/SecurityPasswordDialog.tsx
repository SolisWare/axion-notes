/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { ChangeEvent, CSSProperties, FormEvent, useEffect, useRef, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogProps, DialogTitle, IconButton } from "@mui/material";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useTranslation } from "react-i18next";
import { getAppColors } from "../theme/AppColors";
import { SystemTheme } from "../theme/SystemTheme";
import styles from "./SecurityPasswordDialog.module.css";

export enum SecurityPasswordDialogMode {
  SET = "set",
  ENABLE = "enable",
  DISABLE = "disable",
  CHANGE = "change"
}

export type SecurityPasswordDialogValues = {
  currentPassword: string;
  newPassword: string;
};

type SecurityPasswordDialogCssProperties = CSSProperties & {
  "--dialog-backdrop": string;
  "--dialog-background": string;
  "--dialog-cancel-text": string;
  "--dialog-text": string;
  "--dialog-title-text": string;
  "--settings-content-background": string;
  "--settings-divider": string;
  "--settings-nav-selected-border": string;
  "--settings-nav-text": string;
  "--settings-section-text": string;
};

type SecurityPasswordDialogProps = {
  mode: SecurityPasswordDialogMode;
  open: boolean;
  theme: SystemTheme;
  onCancel: () => void;
  onSubmit: (values: SecurityPasswordDialogValues) => Promise<boolean>;
};

enum DialogCloseReason {
  BACKDROP_CLICK = "backdropClick"
}

function SecurityPasswordDialog(props: SecurityPasswordDialogProps) {
  const { t } = useTranslation();
  const appColors = getAppColors(props.theme);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isCurrentPasswordVisible, setCurrentPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setNewPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);

  const firstInputRef = useRef<HTMLInputElement>(null);

  const dialogStyle: SecurityPasswordDialogCssProperties = {
    "--dialog-backdrop": appColors.DIALOG_BACKDROP,
    "--dialog-background": appColors.DIALOG_BACKGROUND,
    "--dialog-cancel-text": appColors.DIALOG_CANCEL_TEXT,
    "--dialog-text": appColors.DIALOG_TEXT,
    "--dialog-title-text": appColors.DIALOG_TITLE_TEXT,
    "--settings-content-background": appColors.DIALOG_BACKGROUND,
    "--settings-divider": appColors.SETTINGS_DIVIDER,
    "--settings-nav-selected-border": appColors.SETTINGS_NAV_SELECTED_BORDER,
    "--settings-nav-text": appColors.DIALOG_TEXT,
    "--settings-section-text": appColors.SETTINGS_SECTION_TEXT
  };

  const needsCurrentPassword = props.mode !== SecurityPasswordDialogMode.SET;
  const needsNewPassword = props.mode === SecurityPasswordDialogMode.SET || props.mode === SecurityPasswordDialogMode.CHANGE;

  useEffect(() => {
    if (!props.open) {
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setCurrentPasswordVisible(false);
    setNewPasswordVisible(false);
    setErrorMessage("");
    setSubmitting(false);

    window.setTimeout(() => firstInputRef.current?.focus(), 0);
  }, [props.open, props.mode]);

  function getTitle(): string {
    switch (props.mode) {
      case SecurityPasswordDialogMode.ENABLE:
        return t("settingsWindow.security.dialog.enableTitle");
      case SecurityPasswordDialogMode.DISABLE:
        return t("settingsWindow.security.dialog.disableTitle");
      case SecurityPasswordDialogMode.CHANGE:
        return t("settingsWindow.security.dialog.changeTitle");
      case SecurityPasswordDialogMode.SET:
      default:
        return t("settingsWindow.security.dialog.setTitle");
    }
  }

  function getDescription(): string {
    switch (props.mode) {
      case SecurityPasswordDialogMode.ENABLE:
        return t("settingsWindow.security.dialog.enableDescription");
      case SecurityPasswordDialogMode.DISABLE:
        return t("settingsWindow.security.dialog.disableDescription");
      case SecurityPasswordDialogMode.CHANGE:
        return t("settingsWindow.security.dialog.changeDescription");
      case SecurityPasswordDialogMode.SET:
      default:
        return t("settingsWindow.security.dialog.setDescription");
    }
  }

  function getConfirmLabel(): string {
    switch (props.mode) {
      case SecurityPasswordDialogMode.ENABLE:
        return t("settingsWindow.security.dialog.enableConfirm");
      case SecurityPasswordDialogMode.DISABLE:
        return t("settingsWindow.security.dialog.disableConfirm");
      case SecurityPasswordDialogMode.CHANGE:
        return t("settingsWindow.security.dialog.changeConfirm");
      case SecurityPasswordDialogMode.SET:
      default:
        return t("settingsWindow.security.dialog.setConfirm");
    }
  }

  const handleClose: DialogProps["onClose"] = (_event, reason) => {
    if (reason === DialogCloseReason.BACKDROP_CLICK) {
      return;
    }

    props.onCancel();
  };

  function handlePasswordChange(event: ChangeEvent<HTMLInputElement>, setter: (value: string) => void) {
    setter(event.target.value);
    setErrorMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (needsCurrentPassword && !currentPassword) {
      setErrorMessage(t("settingsWindow.security.dialog.passwordRequired"));
      return;
    }

    if (needsNewPassword && !newPassword) {
      setErrorMessage(t("settingsWindow.security.dialog.newPasswordRequired"));
      return;
    }

    if (needsNewPassword && !confirmPassword) {
      setErrorMessage(t("settingsWindow.security.dialog.confirmPasswordRequired"));
      return;
    }

    if (needsNewPassword && newPassword !== confirmPassword) {
      setErrorMessage(t("settingsWindow.security.dialog.passwordMismatch"));
      return;
    }

    setSubmitting(true);
    const didSubmit = await props.onSubmit({
      currentPassword,
      newPassword
    });
    setSubmitting(false);

    if (!didSubmit) {
      setErrorMessage(t("settingsWindow.security.dialog.invalidPassword"));
    }
  }

  return (
    <Dialog
      open={props.open}
      onClose={handleClose}
      classes={{ paper: styles.securityPasswordDialogPaper }}
      PaperProps={{ style: dialogStyle }}
      BackdropProps={{ classes: { root: styles.securityPasswordDialogBackdrop }, style: dialogStyle }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle className={styles.securityPasswordDialogTitle}>{getTitle()}</DialogTitle>
        <DialogContent className={styles.securityPasswordDialogContent}>
          <DialogContentText className={styles.securityPasswordDialogMessage}>{getDescription()}</DialogContentText>
          <div className={styles.passwordDialogFields}>
            {needsCurrentPassword && (
              <label className={styles.passwordDialogField}>
                <span className={styles.passwordDialogLabel}>{t("settingsWindow.security.dialog.currentPassword")}</span>
                <span className={styles.passwordDialogInputWrapper}>
                  <input
                    ref={firstInputRef}
                    className={styles.passwordDialogInput}
                    type={isCurrentPasswordVisible ? "text" : "password"}
                    value={currentPassword}
                    onChange={(event) => handlePasswordChange(event, setCurrentPassword)}
                  />
                  <IconButton
                    className={styles.passwordDialogVisibilityButton}
                    aria-label={t(isCurrentPasswordVisible
                      ? "mainWindow.lockScreen.hidePassword"
                      : "mainWindow.lockScreen.showPassword")}
                    onClick={() => setCurrentPasswordVisible((currentValue) => !currentValue)}
                  >
                    {isCurrentPasswordVisible
                      ? <VisibilityOutlinedIcon />
                      : <VisibilityOffOutlinedIcon />}
                  </IconButton>
                </span>
              </label>
            )}
            {needsNewPassword && (
              <>
                <label className={styles.passwordDialogField}>
                  <span className={styles.passwordDialogLabel}>{t("settingsWindow.security.dialog.newPassword")}</span>
                  <span className={styles.passwordDialogInputWrapper}>
                    <input
                      ref={needsCurrentPassword ? undefined : firstInputRef}
                      className={styles.passwordDialogInput}
                      type={isNewPasswordVisible ? "text" : "password"}
                      value={newPassword}
                      onChange={(event) => handlePasswordChange(event, setNewPassword)}
                    />
                    <IconButton
                      className={styles.passwordDialogVisibilityButton}
                      aria-label={t(isNewPasswordVisible
                        ? "mainWindow.lockScreen.hidePassword"
                        : "mainWindow.lockScreen.showPassword")}
                      onClick={() => setNewPasswordVisible((currentValue) => !currentValue)}
                    >
                      {isNewPasswordVisible
                        ? <VisibilityOutlinedIcon />
                        : <VisibilityOffOutlinedIcon />}
                    </IconButton>
                  </span>
                </label>
                <label className={styles.passwordDialogField}>
                  <span className={styles.passwordDialogLabel}>{t("settingsWindow.security.dialog.confirmPassword")}</span>
                  <span className={styles.passwordDialogInputWrapper}>
                    <input
                      className={styles.passwordDialogInput}
                      type={isNewPasswordVisible ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => handlePasswordChange(event, setConfirmPassword)}
                    />
                  </span>
                </label>
              </>
            )}
            <p className={styles.passwordDialogError} role={errorMessage ? "alert" : undefined} aria-live="polite">
              {errorMessage}
            </p>
          </div>
        </DialogContent>
        <DialogActions className={styles.securityPasswordDialogActions}>
          <Button className={styles.securityPasswordDialogCancelButton} disabled={isSubmitting} onClick={props.onCancel}>
            {t("common.cancel")}
          </Button>
          <Button disabled={isSubmitting} type="submit" variant="contained">
            {getConfirmLabel()}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default SecurityPasswordDialog;
