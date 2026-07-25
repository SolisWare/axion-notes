/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { CSSProperties, FormEvent, useEffect, useRef, useState } from "react";
import { Button, IconButton } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ComputerOutlinedIcon from "@mui/icons-material/ComputerOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PushPinRoundedIcon from "@mui/icons-material/PushPinRounded";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { Trans, useTranslation } from "react-i18next";
import { getAppColors } from "../../../theme/AppColors";
import { SystemTheme } from "../../../theme/SystemTheme";
import styles from "./LockScreen.module.css";

type LockScreenProps = {
  theme: SystemTheme;
  onUnlock?: (password: string) => void | Promise<void>;
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
  const appColors = getAppColors(props.theme);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
    passwordInputRef.current?.focus();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!password) {
      setErrorMessage(t("mainWindow.lockScreen.passwordRequired"));
      passwordInputRef.current?.focus();
      return;
    }

    setErrorMessage("");
    await props.onUnlock?.(password);
  }

  return (
    <main className={styles.root} style={rootStyle}>
      <div className={styles.content}>
        <LockOutlinedIcon className={styles.lockIcon} aria-hidden="true" />

        <div className={styles.brand} aria-label="Axion Notes">
          <PushPinRoundedIcon className={styles.brandIcon} aria-hidden="true" />
          <span>Axion Notes</span>
        </div>

        <h1 className={styles.title}>
          {t("mainWindow.lockScreen.title")}
        </h1>
        <p className={styles.description}>
          {t("mainWindow.lockScreen.description")}
        </p>

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
                onChange={(event) => {
                  setPassword(event.target.value);
                  setErrorMessage("");
                }}
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
            <p
              id="unlock-password-error"
              className={styles.message}
              role={errorMessage ? "alert" : undefined}
              aria-live="polite"
            >
              {errorMessage}
            </p>
          </div>

          <Button className={styles.unlockButton} type="submit" variant="contained">
            <span className={styles.buttonContent}>
              {t("mainWindow.lockScreen.unlock")}
              <ArrowForwardIcon aria-hidden="true" />
            </span>
          </Button>
        </form>

        <ul className={styles.disclosures}>
          <li className={styles.disclosure}>
            <ComputerOutlinedIcon aria-hidden="true" />
            <span>{t("mainWindow.lockScreen.offlineDisclosure")}</span>
          </li>
          <li className={styles.disclosure}>
            <LockOpenOutlinedIcon aria-hidden="true" />
            <span>
              <Trans
                i18nKey="mainWindow.lockScreen.encryptionDisclosure"
                components={{ strong: <strong /> }}
              />
            </span>
          </li>
        </ul>
      </div>
    </main>
  );
}

export default LockScreen;
