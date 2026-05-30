/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { ChangeEvent } from "react";
import { AppSettings } from "../../../settings/AppSettings";
import { UserAgent } from "../../../utils/UserAgent";
import styles from "./SettingsPages.module.css";

type GeneralProps = {
  appSettings: AppSettings;
  onAppSettingsChange: (settings: AppSettings) => void;
};

function General(props: GeneralProps) {
  function handleKeepNotesOnTopChange(event: ChangeEvent<HTMLInputElement>) {
    props.onAppSettingsChange({
      ...props.appSettings,
      keepNotesMainWindowOnTop: event.target.checked
    });
  }

  if (!UserAgent.isElectron) {
    return <></>;
  }

  return (
    <div className={styles.generalPage}>
      <section className={styles.settingsSection} aria-labelledby="keep-notes-on-top-title">
        <div className={styles.settingsRows}>
          <div className={styles.settingsRow}>
            <div className={styles.settingsRowText}>
              <h3 className={styles.settingsSectionTitle} id="keep-notes-on-top-title">Keep notes on top</h3>
              <p className={styles.settingsSectionDescription}>Notes stays above all other windows</p>
            </div>
            <label className={styles.switchControl}>
              <input
                checked={props.appSettings.keepNotesMainWindowOnTop}
                className={styles.switchInput}
                type="checkbox"
                onChange={handleKeepNotesOnTopChange}
              />
              <span className={styles.switchTrack} aria-hidden="true">
                <span className={styles.switchThumb} />
              </span>
              <span className={styles.visuallyHidden}>Keep notes on top</span>
            </label>
          </div>
        </div>
      </section>
    </div>
  );
}

export default General;
