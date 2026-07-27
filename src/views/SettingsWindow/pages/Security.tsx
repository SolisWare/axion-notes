/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { ChangeEvent, useState } from "react";
import { Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import ConfirmationDialog from "../../../components/ConfirmationDialog";
import SecurityPasswordDialog, { SecurityPasswordDialogMode, SecurityPasswordDialogValues } from "../../../components/SecurityPasswordDialog";
import { AppSettings } from "../../../settings/AppSettings";
import { LockScreenIdleTimeout } from "../../../settings/LockScreenIdleTimeout";
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
  const [isDisableBruteForceProtectionDialogOpen, setDisableBruteForceProtectionDialogOpen] = useState(false);
  const isBruteForceProtectionRowDisabled = !props.appSettings.lockScreenEnabled;
  const isPasswordRowDisabled = !props.appSettings.lockScreenEnabled;
  const isIdleTimeoutRowDisabled = !props.appSettings.lockScreenEnabled;
  const isLockOnSystemSleepRowDisabled = !props.appSettings.lockScreenEnabled;
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

  function handleLockScreenIdleTimeoutChange(event: ChangeEvent<HTMLSelectElement>) {
    props.onAppSettingsChange({
      ...props.appSettings,
      lockScreenIdleTimeout: Number(event.target.value) as LockScreenIdleTimeout
    });

    event.currentTarget.blur();
  }

  function handleLockOnSystemSleepEnabledChange(event: ChangeEvent<HTMLInputElement>) {
    props.onAppSettingsChange({
      ...props.appSettings,
      lockScreenOnSystemSleepEnabled: event.target.checked
    });

    event.currentTarget.blur();
  }

  function handleBruteForceProtectionEnabledChange(event: ChangeEvent<HTMLInputElement>) {
    event.currentTarget.blur();

    if (!event.target.checked) {
      setDisableBruteForceProtectionDialogOpen(true);
      return;
    }

    props.onAppSettingsChange({
      ...props.appSettings,
      bruteForceProtectionEnabled: true
    });
  }

  function handleDisableBruteForceProtectionConfirm() {
    setDisableBruteForceProtectionDialogOpen(false);
    props.onAppSettingsChange({
      ...props.appSettings,
      bruteForceProtectionEnabled: false
    });
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
      <ConfirmationDialog
        theme={props.theme}
        open={isDisableBruteForceProtectionDialogOpen}
        title={t("settingsWindow.security.disableBruteForceProtectionDialog.title")}
        message={t("settingsWindow.security.disableBruteForceProtectionDialog.message")}
        confirmLabel={t("settingsWindow.security.disableBruteForceProtectionDialog.confirmLabel")}
        onConfirm={handleDisableBruteForceProtectionConfirm}
        onCancel={() => setDisableBruteForceProtectionDialogOpen(false)}
      />
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
                  <option value={LockScreenRequirePasswordDelay.IMMEDIATELY}>{t("common.time.immediately")}</option>
                  <option value={LockScreenRequirePasswordDelay.FIVE_SECONDS}>{t("common.time.fiveSeconds")}</option>
                  <option value={LockScreenRequirePasswordDelay.TEN_SECONDS}>{t("common.time.tenSeconds")}</option>
                  <option value={LockScreenRequirePasswordDelay.THIRTY_SECONDS}>{t("common.time.thirtySeconds")}</option>
                  <option value={LockScreenRequirePasswordDelay.ONE_MINUTE}>{t("common.time.oneMinute")}</option>
                  <option value={LockScreenRequirePasswordDelay.FIVE_MINUTES}>{t("common.time.fiveMinutes")}</option>
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
          <Tooltip
            arrow
            disableFocusListener={!isLockOnSystemSleepRowDisabled}
            disableHoverListener={!isLockOnSystemSleepRowDisabled}
            disableTouchListener={!isLockOnSystemSleepRowDisabled}
            enterDelay={300}
            enterNextDelay={300}
            title={t("settingsWindow.security.disabledPasswordTooltip")}
          >
            <div className={`${styles.settingsRow} ${isLockOnSystemSleepRowDisabled ? styles.settingsRowDisabled : ""}`}>
              <div className={styles.settingsRowText}>
                <h3 className={styles.settingsSectionTitle} id="lock-screen-on-system-sleep-enabled-title">{t("settingsWindow.security.lockOnSystemSleep")}</h3>
                <p className={styles.settingsSectionDescription}>{t("settingsWindow.security.lockOnSystemSleepDescription")}</p>
              </div>
              <label className={styles.switchControl}>
                <input
                  aria-labelledby="lock-screen-on-system-sleep-enabled-title"
                  checked={props.appSettings.lockScreenOnSystemSleepEnabled}
                  className={styles.switchInput}
                  disabled={isLockOnSystemSleepRowDisabled}
                  type="checkbox"
                  onChange={handleLockOnSystemSleepEnabledChange}
                />
                <span className={styles.switchTrack} aria-hidden="true">
                  <span className={styles.switchThumb} />
                </span>
                <span className={styles.visuallyHidden}>{t("settingsWindow.security.lockOnSystemSleep")}</span>
              </label>
            </div>
          </Tooltip>
          <Tooltip
            arrow
            disableFocusListener={!isIdleTimeoutRowDisabled}
            disableHoverListener={!isIdleTimeoutRowDisabled}
            disableTouchListener={!isIdleTimeoutRowDisabled}
            enterDelay={300}
            enterNextDelay={300}
            title={t("settingsWindow.security.disabledPasswordTooltip")}
          >
            <div className={`${styles.settingsRow} ${isIdleTimeoutRowDisabled ? styles.settingsRowDisabled : ""}`}>
              <div className={styles.settingsRowText}>
                <label className={styles.settingsSectionTitle} htmlFor="lock-screen-idle-timeout">
                  {t("settingsWindow.security.lockAfterIdle")}
                </label>
                <p className={styles.settingsSectionDescription}>{t("settingsWindow.security.lockAfterIdleDescription")}</p>
              </div>
              <select
                className={styles.settingsSelect}
                disabled={isIdleTimeoutRowDisabled}
                id="lock-screen-idle-timeout"
                value={props.appSettings.lockScreenIdleTimeout}
                onChange={handleLockScreenIdleTimeoutChange}
              >
                <option value={LockScreenIdleTimeout.NEVER}>{t("common.time.never")}</option>
                <option value={LockScreenIdleTimeout.ONE_MINUTE}>{t("common.time.oneMinute")}</option>
                <option value={LockScreenIdleTimeout.FIVE_MINUTES}>{t("common.time.fiveMinutes")}</option>
                <option value={LockScreenIdleTimeout.TEN_MINUTES}>{t("common.time.tenMinutes")}</option>
                <option value={LockScreenIdleTimeout.TWENTY_MINUTES}>{t("common.time.twentyMinutes")}</option>
                <option value={LockScreenIdleTimeout.FORTY_FIVE_MINUTES}>{t("common.time.fortyFiveMinutes")}</option>
                <option value={LockScreenIdleTimeout.SIXTY_MINUTES}>{t("common.time.sixtyMinutes")}</option>
              </select>
            </div>
          </Tooltip>
          <Tooltip
            arrow
            disableFocusListener={!isBruteForceProtectionRowDisabled}
            disableHoverListener={!isBruteForceProtectionRowDisabled}
            disableTouchListener={!isBruteForceProtectionRowDisabled}
            enterDelay={300}
            enterNextDelay={300}
            title={t("settingsWindow.security.disabledPasswordTooltip")}
          >
            <div className={`${styles.settingsRow} ${isBruteForceProtectionRowDisabled ? styles.settingsRowDisabled : ""}`}>
              <div className={styles.settingsRowText}>
                <h3 className={styles.settingsSectionTitle} id="brute-force-protection-enabled-title">{t("settingsWindow.security.bruteForceProtection")}</h3>
                <p className={styles.settingsSectionDescription}>{t("settingsWindow.security.bruteForceProtectionDescription")}</p>
              </div>
              <label className={styles.switchControl}>
                <input
                  aria-labelledby="brute-force-protection-enabled-title"
                  checked={props.appSettings.bruteForceProtectionEnabled}
                  className={styles.switchInput}
                  disabled={isBruteForceProtectionRowDisabled}
                  type="checkbox"
                  onChange={handleBruteForceProtectionEnabledChange}
                />
                <span className={styles.switchTrack} aria-hidden="true">
                  <span className={styles.switchThumb} />
                </span>
                <span className={styles.visuallyHidden}>{t("settingsWindow.security.bruteForceProtection")}</span>
              </label>
            </div>
          </Tooltip>
        </div>
      </section>
    </div>
  );
}

export default Security;
