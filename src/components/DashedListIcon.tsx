/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import styles from "./DashedListIcon.module.css";

function DashedListIcon() {
  return (
    <span className={styles.icon} aria-hidden="true">
      <span className={styles.row}>
        <span className={styles.marker} />
        <span className={styles.line} />
      </span>
      <span className={styles.row}>
        <span className={styles.marker} />
        <span className={styles.line} />
      </span>
      <span className={styles.row}>
        <span className={styles.marker} />
        <span className={styles.line} />
      </span>
    </span>
  );
}

export default DashedListIcon;
