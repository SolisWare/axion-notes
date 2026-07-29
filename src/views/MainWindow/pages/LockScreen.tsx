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
import GppGoodOutlinedIcon from "@mui/icons-material/GppGoodOutlined";
import GppMaybeOutlinedIcon from "@mui/icons-material/GppMaybeOutlined";
import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AppView } from "../../../App";
import { UnlockResultStatus } from "../../../models/UnlockResultStatus";
import { getAppColors } from "../../../theme/AppColors";
import { SystemTheme } from "../../../theme/SystemTheme";
import styles from "./LockScreen.module.css";

type LockScreenProps = {
  theme: SystemTheme;
  onReady?: () => void;
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
  const onReady = props.onReady;
  const appColors = getAppColors(props.theme);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [cooldownUntil, setCooldownUntil] = useState<string | undefined>();
  const [cooldownTick, setCooldownTick] = useState(0);
  const [isBruteForceProtectionEnabled, setBruteForceProtectionEnabled] = useState(true);
  const [isNotesEncryptionEnabled, setNotesEncryptionEnabled] = useState(false);
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
    Promise.all([
      window.api.security.getLockState(),
      window.api.settings.getSettings()
    ])
      .then(([lockState, settings]) => {
        setBruteForceProtectionEnabled(settings?.bruteForceProtectionEnabled ?? true);
        setNotesEncryptionEnabled(settings?.notesEncryptionEnabled ?? false);
        return lockState;
      })
      .then((lockState) => {
        setRecoveryRequired(lockState.isRecoveryRequired);
        setCooldownUntil(lockState.unlockCooldownUntil);
        if (!lockState.isRecoveryRequired) {
          passwordInputRef.current?.focus();
        }
      })
      .catch((err: Error) => {
        console.error("Failed to load lock state:", err.message);
      })
      .finally(() => {
        onReady?.();
      });

    const offLockStateChange = window.api.security.onLockStateChange((lockState) => {
      setRecoveryRequired(lockState.isRecoveryRequired);
      setCooldownUntil(lockState.unlockCooldownUntil);
    });
    const offSettingsChange = window.api.settings.onSettingsChange((settings) => {
      setBruteForceProtectionEnabled(settings.bruteForceProtectionEnabled);
      setNotesEncryptionEnabled(settings.notesEncryptionEnabled);
    });

    return () => {
      offLockStateChange();
      offSettingsChange();
    };
  }, [onReady]);

  useEffect(() => {
    if (!cooldownUntil) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setCooldownTick((currentTick) => currentTick + 1);
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [cooldownUntil]);

  const cooldownMessage = cooldownTick >= 0 ? getCooldownMessage(cooldownUntil) : "";
  const isCooldownActive = Boolean(cooldownMessage);
  const canSubmit = Boolean(password) && !isCooldownActive;
  const displayMessage = cooldownMessage || errorMessage;
  const displayMessageLines = displayMessage.split("\n");

  useEffect(() => {
    if (!cooldownUntil || cooldownMessage) {
      return;
    }

    setCooldownUntil(undefined);
    setErrorMessage("");
    passwordInputRef.current?.focus();
  }, [cooldownMessage, cooldownUntil]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isCooldownActive) {
      return;
    }

    if (!password) {
      setErrorMessage(t("mainWindow.lockScreen.passwordRequired"));
      passwordInputRef.current?.focus();
      return;
    }

    setErrorMessage("");
    const unlockResult = await window.api.security.unlock(password);

    if (unlockResult.status === UnlockResultStatus.UNLOCKED) {
      setCooldownUntil(undefined);
      navigate(AppView.home);
      return;
    }

    setPassword("");

    if (unlockResult.status === UnlockResultStatus.COOLDOWN_ACTIVE && unlockResult.cooldownUntil) {
      setCooldownUntil(unlockResult.cooldownUntil);
      setErrorMessage("");
      return;
    }

    setErrorMessage(t("mainWindow.lockScreen.invalidPassword"));
    passwordInputRef.current?.focus();
  }

  function getCooldownMessage(cooldownEnd: string | undefined): string {
    if (!cooldownEnd) {
      return "";
    }

    const remainingMs = Date.parse(cooldownEnd) - Date.now();

    if (remainingMs <= 0) {
      return "";
    }

    const totalSeconds = Math.ceil(remainingMs / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const countdown = `${totalMinutes}:${seconds.toString().padStart(2, "0")}`;

    return [
      t("mainWindow.lockScreen.cooldownMessageLine1"),
      t("mainWindow.lockScreen.cooldownMessageLine2", { countdown })
    ].join("\n");
  }

  function handlePasswordChange(event: ChangeEvent<HTMLInputElement>) {
    if (isCooldownActive) {
      return;
    }

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
                  disabled={isCooldownActive}
                  aria-invalid={Boolean(displayMessage)}
                  aria-describedby={displayMessage ? "unlock-password-error" : undefined}
                  onChange={handlePasswordChange}
                />
                <IconButton
                  className={styles.visibilityButton}
                  disabled={isCooldownActive}
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
                role={displayMessage ? "alert" : undefined}
                aria-live="polite"
              >
                {displayMessageLines.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </Typography>
            </div>

            <Button className={styles.unlockButton} disabled={!canSubmit} disableElevation={!canSubmit} type="submit" variant="contained">
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
            {isBruteForceProtectionEnabled
              ? <GppGoodOutlinedIcon aria-hidden="true" />
              : <GppMaybeOutlinedIcon aria-hidden="true" />}
            <span>{t(isBruteForceProtectionEnabled
              ? "mainWindow.lockScreen.bruteForceProtectionEnabledDisclosure"
              : "mainWindow.lockScreen.bruteForceProtectionDisabledDisclosure")}</span>
          </li>
          <li className={styles.disclosure}>
            {isNotesEncryptionEnabled
              ? <LockOutlinedIcon aria-hidden="true" />
              : <LockOpenRoundedIcon aria-hidden="true" />}
            <span>{t(isNotesEncryptionEnabled
              ? "mainWindow.lockScreen.encryptionEnabledDisclosure"
              : "mainWindow.lockScreen.encryptionDisabledDisclosure")}</span>
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
