/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { Button, Dialog, DialogActions, DialogContent, Theme } from "@mui/material";
import { makeStyles } from "@mui/styles";
import LicenseWindow from "../views/LicenseWindow/LicenseWindow";
import { getAppColors } from "../theme/AppColors";
import { SystemTheme } from "../theme/SystemTheme";
import { AppColorStyleProps } from "../types/appColorTypes";

type WebLicenseDialogProps = {
  theme: SystemTheme;
  open: boolean;
  onClose: () => void;
};

const useStyles = makeStyles<Theme, AppColorStyleProps>(() => ({
  dialogPaper: {
    backgroundColor: ({ appColors }) => appColors.DIALOG_BACKGROUND,
    width: 560
  },
  content: {
    maxHeight: "72vh",
    overflowY: "auto",
    padding: "0 !important"
  },
  actions: {
    justifyContent: "center",
    paddingBottom: "16px !important"
  }
}));

function WebLicenseDialog(props: WebLicenseDialogProps) {
  const appColors = getAppColors(props.theme);
  const classes = useStyles({ appColors });

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      maxWidth="sm"
      fullWidth
      classes={{ paper: classes.dialogPaper }}
    >
      <DialogContent className={classes.content}>
        <LicenseWindow theme={props.theme} embedded />
      </DialogContent>
      <DialogActions className={classes.actions}>
        <Button onClick={props.onClose} variant="contained">
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default WebLicenseDialog;
