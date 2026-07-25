/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { ChangeEvent } from "react";
import { Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { AppSettings } from "../../../settings/AppSettings";
import styles from "./SettingsPages.module.css";

type SecurityProps = {
  appSettings: AppSettings;
  onAppSettingsChange: (settings: AppSettings) => void;
};

function Security(props: SecurityProps) {
  const { t } = useTranslation();
  const isPasswordRowDisabled = !props.appSettings.lockScreenEnabled;

  function handleLockScreenEnabledChange(event: ChangeEvent<HTMLInputElement>) {
    props.onAppSettingsChange({
      ...props.appSettings,
      lockScreenEnabled: event.target.checked
    });
  }

  return (
    <div className={styles.securityPage}>
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
          <Tooltip
            arrow
            disableHoverListener={!isPasswordRowDisabled}
            enterDelay={300}
            enterNextDelay={300}
            title={t("settingsWindow.security.disabledPasswordTooltip")}
          >
            <div className={`${styles.settingsRow} ${isPasswordRowDisabled ? styles.settingsRowDisabled : ""}`}>
              <div className={styles.settingsRowText}>
                <h3 className={styles.settingsSectionTitle}>{t("settingsWindow.security.password")}</h3>
                <p className={styles.settingsSectionDescription}>{t("settingsWindow.security.passwordDescription")}</p>
              </div>
              <button className={styles.settingsButton} disabled={isPasswordRowDisabled} type="button">
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
