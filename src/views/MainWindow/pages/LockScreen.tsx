/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { ChangeEvent, CSSProperties, FormEvent, useEffect, useRef, useState } from "react";
import { Button, IconButton, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ComputerOutlinedIcon from "@mui/icons-material/ComputerOutlined";
import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AppView } from "../../../App";
import { getAppColors } from "../../../theme/AppColors";
import { SystemTheme } from "../../../theme/SystemTheme";
import styles from "./LockScreen.module.css";

type LockScreenProps = {
  theme: SystemTheme;
};

type LockScreenCssProperties = CSSProperties & {
  "--lock-background": string;
  "--lock-text": string;
  "--lock-muted-text": string;
  "--lock-primary": string;
  "--lock-primary-hover": string;
  "--lock-field-background": string;
  "--lock-field-border": string;
  "--lock-error": string;
};

function LockScreen(props: LockScreenProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const appColors = getAppColors(props.theme);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isRecoveryRequired, setRecoveryRequired] = useState(false);
  const version = window.api.version.getShortDisplayVersion();

  const isDark = props.theme === SystemTheme.DARK;
  const rootStyle: LockScreenCssProperties = {
    "--lock-background": appColors.ACCENT,
    "--lock-text": appColors.NOTE_TEXT,
    "--lock-muted-text": appColors.NOTE_FOOTER_TEXT,
    "--lock-primary": appColors.MAIN,
    "--lock-primary-hover": appColors.MAIN_DARK,
    "--lock-field-background": isDark ? appColors.DIALOG_BACKGROUND : "#FFFFFF",
    "--lock-field-border": appColors.SETTINGS_DIVIDER,
    "--lock-error": appColors.ERROR
  };

  useEffect(() => {
    window.api.security.getLockState()
      .then((lockState) => {
        setRecoveryRequired(lockState.isRecoveryRequired);
        if (!lockState.isRecoveryRequired) {
          passwordInputRef.current?.focus();
        }
      })
      .catch((err: Error) => {
        console.error("Failed to load lock state:", err.message);
      });

    return window.api.security.onLockStateChange((lockState) => {
      setRecoveryRequired(lockState.isRecoveryRequired);
    });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!password) {
      setErrorMessage(t("mainWindow.lockScreen.passwordRequired"));
      passwordInputRef.current?.focus();
      return;
    }

    setErrorMessage("");
    const didUnlock = await window.api.security.unlock(password);

    if (didUnlock) {
      navigate(AppView.home);
      return;
    }

    setPassword("");
    setErrorMessage(t("mainWindow.lockScreen.invalidPassword"));
    passwordInputRef.current?.focus();
  }

  function handlePasswordChange(event: ChangeEvent<HTMLInputElement>) {
    setPassword(event.target.value);
    setErrorMessage("");
  }

  return (
    <main className={styles.root} style={rootStyle}>
      <div className={styles.content}>
        <LockOutlinedIcon className={styles.lockIcon} aria-hidden="true" />

        <Typography className={styles.title} variant="h1">
          {t("mainWindow.lockScreen.title")}
        </Typography>
        {!isRecoveryRequired && (
          <Typography className={styles.description} variant="body2">
            {t("mainWindow.lockScreen.description")}
          </Typography>
        )}

        {isRecoveryRequired ? (
          <Typography className={styles.recoveryMessage} variant="body2" component="p" role="alert">
            <span>{t("mainWindow.lockScreen.recoveryRequiredLine1")}</span>
            <span>{t("mainWindow.lockScreen.recoveryRequiredLine2", { appName: "Axion Notes" })}</span>
          </Typography>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.field}>
              <div className={styles.inputContainer}>
                <input
                  ref={passwordInputRef}
                  id="unlock-password"
                  className={styles.input}
                  type={isPasswordVisible ? "text" : "password"}
                  value={password}
                  placeholder={t("mainWindow.lockScreen.passwordPlaceholder")}
                  autoComplete="current-password"
                  aria-invalid={Boolean(errorMessage)}
                  aria-describedby={errorMessage ? "unlock-password-error" : undefined}
                  onChange={handlePasswordChange}
                />
                <IconButton
                  className={styles.visibilityButton}
                  aria-label={t(isPasswordVisible
                    ? "mainWindow.lockScreen.hidePassword"
                    : "mainWindow.lockScreen.showPassword")}
                  onClick={() => setPasswordVisible((currentValue) => !currentValue)}
                >
                  {isPasswordVisible
                    ? <VisibilityOutlinedIcon />
                    : <VisibilityOffOutlinedIcon />}
                </IconButton>
              </div>
              <Typography
                id="unlock-password-error"
                className={styles.message}
                variant="caption"
                component="p"
                role={errorMessage ? "alert" : undefined}
                aria-live="polite"
              >
                {errorMessage}
              </Typography>
            </div>

            <Button className={styles.unlockButton} type="submit" variant="contained">
              <span className={styles.buttonContent}>
                {t("mainWindow.lockScreen.unlock")}
                <ArrowForwardIcon aria-hidden="true" />
              </span>
            </Button>
          </form>
        )}

        <ul className={styles.disclosures}>
          <li className={styles.disclosure}>
            <ComputerOutlinedIcon aria-hidden="true" />
            <span>{t("mainWindow.lockScreen.offlineDisclosure")}</span>
          </li>
          <li className={styles.disclosure}>
            <LockOpenRoundedIcon aria-hidden="true" />
            <span>{t("mainWindow.lockScreen.encryptionDisclosure")}</span>
          </li>
        </ul>
      </div>
      <div className={styles.footer}>
        <Typography variant="caption" component="p">Axion Notes {version}</Typography>
        <Typography variant="caption" component="p">Copyright © 2023-2026 SolisWare.</Typography>
      </div>
    </main>
  );
}

export default LockScreen;
