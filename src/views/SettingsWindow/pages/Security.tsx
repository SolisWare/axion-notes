/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { AppSettings } from "../../../settings/AppSettings";
import styles from "./SettingsPages.module.css";

type SecurityProps = {
  appSettings: AppSettings;
  onAppSettingsChange: (settings: AppSettings) => void;
};

function Security(props: SecurityProps) {
  const { t } = useTranslation();

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
        </div>
      </section>
    </div>
  );
}

export default Security;
