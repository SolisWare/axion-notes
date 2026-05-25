/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { CSSProperties } from "react";
import { Button, Dialog, DialogActions, DialogContent } from "@mui/material";
import SettingsWindow from "../views/SettingsWindow/SettingsWindow";
import { getAppColors } from "../theme/AppColors";
import { SystemTheme } from "../theme/SystemTheme";
import styles from "./WebSettingsDialog.module.css";

type WebSettingsDialogProps = {
  theme: SystemTheme;
  open: boolean;
  onClose: () => void;
};

function WebSettingsDialog(props: WebSettingsDialogProps) {
  const appColors = getAppColors(props.theme);
  const themeVariables = {
    "--settings-dialog-background": appColors.SETTINGS_CONTENT_BACKGROUND
  } as CSSProperties;

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      maxWidth={false}
      PaperProps={{
        className: styles.dialogPaper,
        style: themeVariables
      }}
    >
      <DialogContent className={styles.content}>
        <SettingsWindow theme={props.theme} embedded />
      </DialogContent>
      <DialogActions className={styles.actions}>
        <Button onClick={props.onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default WebSettingsDialog;
