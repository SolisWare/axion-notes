/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { CSSProperties, useEffect } from "react";
import { getAppColors } from "../theme/AppColors";
import { SystemTheme } from "../theme/SystemTheme";
import styles from "./AppToast.module.css";

type AppToastCssProperties = CSSProperties & {
  "--toast-background": string;
  "--toast-text": string;
};

type AppToastProps = {
  message: string;
  open: boolean;
  theme: SystemTheme;
  onClose: () => void;
};

function AppToast(props: AppToastProps) {
  const appColors = getAppColors(props.theme);
  const toastStyle: AppToastCssProperties = {
    "--toast-background": appColors.NOTE_TEXT,
    "--toast-text": appColors.MAIN_TEXT
  };

  useEffect(() => {
    if (!props.open) {
      return;
    }

    const timeoutId = window.setTimeout(props.onClose, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [props.open, props.onClose]);

  if (!props.open) {
    return null;
  }

  return (
    <div className={styles.toast} role="status" aria-live="polite" style={toastStyle}>
      {props.message}
    </div>
  );
}

export default AppToast;
