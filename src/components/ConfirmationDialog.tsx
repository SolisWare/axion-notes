/**
 * Copyright (c) 2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogProps, DialogTitle, Theme } from "@mui/material";
import { makeStyles } from "@mui/styles";
import { useTranslation } from "react-i18next";
import { getAppColors } from "../theme/AppColors";
import { SystemTheme } from "../theme/SystemTheme";
import { AppColorStyleProps } from "../types/appColorTypes";

type ConfirmationDialogProps = {
  theme: SystemTheme;
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

enum DialogCloseReason {
  backdropClick = "backdropClick",
  escapeKeyDown = "escapeKeyDown"
}

const useStyles = makeStyles<Theme, AppColorStyleProps>((_theme: Theme) => ({
  backdrop: {
    backgroundColor: ({ appColors }) => appColors.DIALOG_BACKDROP + " !important",
  },
  dialogPaper: {
    backgroundColor: ({ appColors }) => appColors.DIALOG_BACKGROUND,
  },
  title: {
    backgroundColor: ({ appColors }) => appColors.DIALOG_BACKGROUND,
    color: ({ appColors }) => appColors.DIALOG_TITLE_TEXT,
  },
  content: {
    backgroundColor: ({ appColors }) => appColors.DIALOG_BACKGROUND,
  },
  actions: {
    backgroundColor: ({ appColors }) => appColors.DIALOG_BACKGROUND,
  },
  message: {
    color: ({ appColors }) => appColors.DIALOG_TEXT + " !important",
  },
  cancelButton: {
    color: ({ appColors }) => appColors.DIALOG_CANCEL_TEXT + " !important",
  },
}));

function ConfirmationDialog(props: ConfirmationDialogProps) {
  const { t } = useTranslation();
  const appColors = getAppColors(props.theme);
  const classes = useStyles({ appColors });

  const handleClose: DialogProps["onClose"] = (_event, reason) => {
    if (reason === DialogCloseReason.backdropClick) {
      return;
    }
    props.onCancel();
  };

  return(
    <Dialog
      open={props.open}
      onClose={handleClose}
      classes={{ paper: classes.dialogPaper }}
      BackdropProps={{ classes: { root: classes.backdrop } }}
    >
      <DialogTitle className={classes.title}>{props.title}</DialogTitle>
      <DialogContent className={classes.content}>
        <DialogContentText className={classes.message}>{props.message}</DialogContentText>
      </DialogContent>
      <DialogActions className={classes.actions}>
        <Button className={classes.cancelButton} onClick={props.onCancel}>
          {props.cancelLabel ?? t("common.cancel")}
        </Button>
        <Button onClick={props.onConfirm} color="error" variant="contained">
          {props.confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmationDialog;
