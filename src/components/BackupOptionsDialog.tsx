/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { CSSProperties, useId } from "react";
import { Button, Dialog, DialogActions, DialogProps, DialogTitle } from "@mui/material";
import { useTranslation } from "react-i18next";
import { getAppColors } from "../theme/AppColors";
import { SystemTheme } from "../theme/SystemTheme";
import styles from "./BackupOptionsDialog.module.css";

type BackupOptionsDialogProps = {
  open: boolean;
  theme: SystemTheme;
  onClose: () => void;
};

type BackupOptionsDialogCssProperties = CSSProperties & {
  "--backup-options-dialog-background": string;
  "--backup-options-dialog-backdrop": string;
  "--backup-options-dialog-title": string;
};

enum DialogCloseReason {
  BACKDROP_CLICK = "backdropClick"
}

function BackupOptionsDialog(props: BackupOptionsDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const appColors = getAppColors(props.theme);
  const rootStyle: BackupOptionsDialogCssProperties = {
    "--backup-options-dialog-background": appColors.DIALOG_BACKGROUND,
    "--backup-options-dialog-backdrop": appColors.DIALOG_BACKDROP,
    "--backup-options-dialog-title": appColors.DIALOG_TITLE_TEXT
  };

  const handleClose: DialogProps["onClose"] = (_event, reason) => {
    if (reason === DialogCloseReason.BACKDROP_CLICK) {
      return;
    }

    props.onClose();
  };

  return (
    <Dialog
      BackdropProps={{ className: styles.backdrop }}
      aria-labelledby={titleId}
      classes={{ paper: styles.paper }}
      open={props.open}
      style={rootStyle}
      onClose={handleClose}
    >
      <DialogTitle className={styles.title} id={titleId}>{t("backupOptions")}</DialogTitle>
      <DialogActions className={styles.actions}>
        <Button autoFocus onClick={props.onClose} variant="contained">{t("close")}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default BackupOptionsDialog;
