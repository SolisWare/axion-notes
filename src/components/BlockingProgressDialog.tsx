/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { CSSProperties } from "react";
import { Dialog, DialogContent, LinearProgress, Typography } from "@mui/material";
import { getAppColors } from "../theme/AppColors";
import { SystemTheme } from "../theme/SystemTheme";
import styles from "./BlockingProgressDialog.module.css";

type BlockingProgressDialogProps = {
  max?: number;
  min?: number;
  open: boolean;
  status: string;
  theme: SystemTheme;
  title: string;
  value: number;
};

type BlockingProgressDialogCssProperties = CSSProperties & {
  "--progress-dialog-background": string;
  "--progress-dialog-backdrop": string;
  "--progress-dialog-muted-text": string;
  "--progress-dialog-primary": string;
  "--progress-dialog-text": string;
  "--progress-dialog-title": string;
  "--progress-dialog-track": string;
};

function getNormalizedProgress(value: number, min: number, max: number): number {
  if (max <= min) {
    return 0;
  }

  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}

function BlockingProgressDialog(props: BlockingProgressDialogProps) {
  const appColors = getAppColors(props.theme);
  const min = props.min ?? 0;
  const max = props.max ?? 100;
  const progress = getNormalizedProgress(props.value, min, max);
  const rootStyle: BlockingProgressDialogCssProperties = {
    "--progress-dialog-background": appColors.DIALOG_BACKGROUND,
    "--progress-dialog-backdrop": appColors.DIALOG_BACKDROP,
    "--progress-dialog-muted-text": appColors.NOTE_FOOTER_TEXT,
    "--progress-dialog-primary": appColors.MAIN,
    "--progress-dialog-text": appColors.DIALOG_TEXT,
    "--progress-dialog-title": appColors.DIALOG_TITLE_TEXT,
    "--progress-dialog-track": appColors.SETTINGS_DIVIDER
  };

  return (
    <Dialog
      BackdropProps={{ className: styles.backdrop }}
      classes={{ paper: styles.paper }}
      disableEscapeKeyDown
      open={props.open}
      style={rootStyle}
    >
      <Typography className={styles.title} component="h2" variant="h6">
        {props.title}
      </Typography>
      <DialogContent className={styles.content}>
        <div className={styles.statusRow}>
          <Typography className={styles.status} component="p" variant="body2">
            {props.status}
          </Typography>
          <Typography className={styles.percentage} component="p" variant="caption">
            {Math.round(progress)}%
          </Typography>
        </div>
        <LinearProgress
          aria-label={props.title}
          className={styles.progressBar}
          value={progress}
          variant="determinate"
        />
      </DialogContent>
    </Dialog>
  );
}

export default BlockingProgressDialog;
