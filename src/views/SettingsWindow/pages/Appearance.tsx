/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import styles from "./SettingsPages.module.css";

function Appearance() {
  return (
    <div className={styles.appearancePage}>
      <header className={styles.linksHeader}>
        <h1 className={styles.pageTitle}>Appearance</h1>
      </header>
      <section className={styles.settingsSection} aria-labelledby="appearance-theme-title">
        <div className={styles.themeRow}>
          <h3 className={styles.settingsSectionTitle} id="appearance-theme-title">Application Theme</h3>
          <fieldset className={styles.radioGroup}>
            <legend className={styles.visuallyHidden}>Application Theme</legend>
            <label className={styles.radioOption}>
              <input className={styles.radioInput} type="radio" name="app-theme" value="auto" defaultChecked />
              <span className={styles.radioLabel}>Auto</span>
              <span className={styles.radioControl} aria-hidden="true" />
            </label>
            <label className={styles.radioOption}>
              <input className={styles.radioInput} type="radio" name="app-theme" value="light" />
              <span className={styles.radioLabel}>Light</span>
              <span className={styles.radioControl} aria-hidden="true" />
            </label>
            <label className={styles.radioOption}>
              <input className={styles.radioInput} type="radio" name="app-theme" value="dark" />
              <span className={styles.radioLabel}>Dark</span>
              <span className={styles.radioControl} aria-hidden="true" />
            </label>
          </fieldset>
        </div>
      </section>
    </div>
  );
}

export default Appearance;
