/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { ChangeEvent, useState } from "react";
import { Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import SecurityPasswordDialog, { SecurityPasswordDialogMode, SecurityPasswordDialogValues } from "../../../components/SecurityPasswordDialog";
import { AppSettings } from "../../../settings/AppSettings";
import { LockScreenRequirePasswordDelay } from "../../../settings/LockScreenRequirePasswordDelay";
import { SystemTheme } from "../../../theme/SystemTheme";
import styles from "./SettingsPages.module.css";

type SecurityProps = {
  appSettings: AppSettings;
  theme: SystemTheme;
  onAppSettingsChange: (settings: AppSettings) => void;
};

function Security(props: SecurityProps) {
  const { t } = useTranslation();
  const [passwordDialogMode, setPasswordDialogMode] = useState<SecurityPasswordDialogMode | null>(null);
  const isPasswordRowDisabled = !props.appSettings.lockScreenEnabled;
  const isRequirePasswordDelayRowDisabled = !props.appSettings.lockScreenEnabled;
  const shouldShowRequirePasswordDelay = window.api.os.isMac;

  async function handleLockScreenEnabledChange(event: ChangeEvent<HTMLInputElement>) {
    event.currentTarget.blur();

    if (event.target.checked) {
      setPasswordDialogMode(
        await window.api.security.hasPassword()
          ? SecurityPasswordDialogMode.ENABLE
          : SecurityPasswordDialogMode.SET
      );
      return;
    }

    setPasswordDialogMode(SecurityPasswordDialogMode.DISABLE);
  }

  function handleRequirePasswordDelayChange(event: ChangeEvent<HTMLSelectElement>) {
    props.onAppSettingsChange({
      ...props.appSettings,
      lockScreenRequirePasswordDelay: Number(event.target.value) as LockScreenRequirePasswordDelay
    });

    event.currentTarget.blur();
  }

  async function handlePasswordDialogSubmit(values: SecurityPasswordDialogValues): Promise<boolean> {
    switch (passwordDialogMode) {
      case SecurityPasswordDialogMode.SET: {
        const didSetPassword = await window.api.security.setPassword(values.newPassword);

        if (didSetPassword) {
          props.onAppSettingsChange({
            ...props.appSettings,
            lockScreenEnabled: true
          });
          setPasswordDialogMode(null);
        }

        return didSetPassword;
      }
      case SecurityPasswordDialogMode.ENABLE: {
        const isPasswordValid = await window.api.security.verifyPassword(values.currentPassword);

        if (isPasswordValid) {
          props.onAppSettingsChange({
            ...props.appSettings,
            lockScreenEnabled: true
          });
          setPasswordDialogMode(null);
        }

        return isPasswordValid;
      }
      case SecurityPasswordDialogMode.DISABLE: {
        const isPasswordValid = await window.api.security.verifyPassword(values.currentPassword);

        if (!isPasswordValid) {
          return false;
        }

        const didClearPassword = await window.api.security.clearPassword();

        if (didClearPassword) {
          props.onAppSettingsChange({
            ...props.appSettings,
            lockScreenEnabled: false
          });
          setPasswordDialogMode(null);
        }

        return didClearPassword;
      }
      case SecurityPasswordDialogMode.CHANGE: {
        const didChangePassword = await window.api.security.changePassword(values.currentPassword, values.newPassword);

        if (didChangePassword) {
          setPasswordDialogMode(null);
        }

        return didChangePassword;
      }
      default:
        return false;
    }
  }

  return (
    <div className={styles.securityPage}>
      {passwordDialogMode && (
        <SecurityPasswordDialog
          mode={passwordDialogMode}
          open={true}
          theme={props.theme}
          onCancel={() => {
            setPasswordDialogMode(null);
          }}
          onSubmit={handlePasswordDialogSubmit}
        />
      )}
      <section className={styles.settingsSection} aria-labelledby="lock-screen-enabled-title">
        <div className={styles.settingsRows}>
          <div className={styles.settingsRow}>
            <div className={styles.settingsRowText}>
              <h3 className={styles.settingsSectionTitle} id="lock-screen-enabled-title">{t("settingsWindow.security.lockScreen")}</h3>
              <p className={styles.settingsSectionDescription}>{t("settingsWindow.security.lockScreenDescription")}</p>
            </div>
            <label className={styles.switchControl}>
              <input
                aria-labelledby="lock-screen-enabled-title"
                checked={props.appSettings.lockScreenEnabled}
                className={styles.switchInput}
                type="checkbox"
                onChange={handleLockScreenEnabledChange}
              />
              <span className={styles.switchTrack} aria-hidden="true">
                <span className={styles.switchThumb} />
              </span>
              <span className={styles.visuallyHidden}>{t("settingsWindow.security.lockScreen")}</span>
            </label>
          </div>
          {shouldShowRequirePasswordDelay && (
            <Tooltip
              arrow
              disableFocusListener={!isRequirePasswordDelayRowDisabled}
              disableHoverListener={!isRequirePasswordDelayRowDisabled}
              disableTouchListener={!isRequirePasswordDelayRowDisabled}
              enterDelay={300}
              enterNextDelay={300}
              title={t("settingsWindow.security.disabledPasswordTooltip")}
            >
              <div className={`${styles.settingsRow} ${isRequirePasswordDelayRowDisabled ? styles.settingsRowDisabled : ""}`}>
                <div className={styles.settingsRowText}>
                  <label className={styles.settingsSectionTitle} htmlFor="lock-screen-require-password-delay">
                    {t("settingsWindow.security.requirePasswordDelay")}
                  </label>
                  <p className={styles.settingsSectionDescription}>{t("settingsWindow.security.requirePasswordDelayDescription")}</p>
                </div>
                <select
                  className={styles.settingsSelect}
                  disabled={isRequirePasswordDelayRowDisabled}
                  id="lock-screen-require-password-delay"
                  value={props.appSettings.lockScreenRequirePasswordDelay}
                  onChange={handleRequirePasswordDelayChange}
                >
                  <option value={LockScreenRequirePasswordDelay.IMMEDIATELY}>{t("settingsWindow.security.requirePasswordDelayOptions.immediately")}</option>
                  <option value={LockScreenRequirePasswordDelay.FIVE_SECONDS}>{t("settingsWindow.security.requirePasswordDelayOptions.fiveSeconds")}</option>
                  <option value={LockScreenRequirePasswordDelay.TEN_SECONDS}>{t("settingsWindow.security.requirePasswordDelayOptions.tenSeconds")}</option>
                  <option value={LockScreenRequirePasswordDelay.THIRTY_SECONDS}>{t("settingsWindow.security.requirePasswordDelayOptions.thirtySeconds")}</option>
                  <option value={LockScreenRequirePasswordDelay.ONE_MINUTE}>{t("settingsWindow.security.requirePasswordDelayOptions.oneMinute")}</option>
                  <option value={LockScreenRequirePasswordDelay.FIVE_MINUTES}>{t("settingsWindow.security.requirePasswordDelayOptions.fiveMinutes")}</option>
                </select>
              </div>
            </Tooltip>
          )}
          <Tooltip
            arrow
            disableFocusListener={!isPasswordRowDisabled}
            disableHoverListener={!isPasswordRowDisabled}
            disableTouchListener={!isPasswordRowDisabled}
            enterDelay={300}
            enterNextDelay={300}
            title={t("settingsWindow.security.disabledPasswordTooltip")}
          >
            <div className={`${styles.settingsRow} ${isPasswordRowDisabled ? styles.settingsRowDisabled : ""}`}>
              <div className={styles.settingsRowText}>
                <h3 className={styles.settingsSectionTitle}>{t("settingsWindow.security.password")}</h3>
                <p className={styles.settingsSectionDescription}>{t("settingsWindow.security.passwordDescription")}</p>
              </div>
              <button
                className={styles.settingsButton}
                disabled={isPasswordRowDisabled}
                type="button"
                onClick={(event) => {
                  event.currentTarget.blur();
                  setPasswordDialogMode(SecurityPasswordDialogMode.CHANGE);
                }}
              >
                {t("settingsWindow.security.changePassword")}
              </button>
            </div>
          </Tooltip>
        </div>
      </section>
    </div>
  );
}

export default Security;
