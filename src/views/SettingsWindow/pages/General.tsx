/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { ChangeEvent } from "react";
import SyncIcon from "@mui/icons-material/Sync";
import { AppSettings } from "../../../settings/AppSettings";
import { NoteSortOrder } from "../../../settings/NoteSortOrder";
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

  function handleNoteSortOrderChange(event: ChangeEvent<HTMLSelectElement>) {
    props.onAppSettingsChange({
      ...props.appSettings,
      notesSortOrder: event.target.value as NoteSortOrder
    });

    event.currentTarget.blur();
  }

  return (
    <div className={styles.generalPage}>
      <section className={styles.settingsSection} aria-labelledby="note-sort-order-title">
        <div className={styles.settingsRows}>
          <div className={styles.settingsRow}>
            <label className={styles.settingsSectionTitle} id="note-sort-order-title" htmlFor="note-sort-order">Sort notes by</label>
            <div className={styles.sortControls}>
              <select
                className={styles.settingsSelect}
                id="note-sort-order"
                value={props.appSettings.notesSortOrder}
                onChange={handleNoteSortOrderChange}
              >
                <option value={NoteSortOrder.DATE_CREATED_ASC}>Date created (oldest first)</option>
                <option value={NoteSortOrder.DATE_CREATED_DESC}>Date created (newest first)</option>
                <option value={NoteSortOrder.LAST_MODIFIED}>Last modified</option>
                <option value={NoteSortOrder.TITLE_ASC}>Title A-Z</option>
                <option value={NoteSortOrder.TITLE_DESC}>Title Z-A</option>
              </select>
              <button className={styles.linkButton} type="button" onClick={window.api.noteSort.requestSort}>
                <SyncIcon fontSize="small" />
                <span>Re-sort notes</span>
              </button>
            </div>
          </div>
          {UserAgent.isElectron && (
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
          )}
        </div>
      </section>
    </div>
  );
}

export default General;
