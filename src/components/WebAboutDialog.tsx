/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { Button, Dialog, DialogActions, DialogContent, Theme, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";
import logo from "../logo.svg";
import { getAppColors } from "../theme/AppColors";
import { SystemTheme } from "../theme/SystemTheme";
import { AppColorStyleProps } from "../types/appColorTypes";
import { AppVersionConfig } from "../utils/app-version/AppVersionConfig";
import { AppVersionResolver } from "../utils/app-version/AppVersionResolver";

type WebAboutDialogProps = {
  theme: SystemTheme;
  open: boolean;
  onLicenseClick: () => void;
  onClose: () => void;
};

const useStyles = makeStyles<Theme, AppColorStyleProps>((_theme: Theme) => ({
  dialogPaper: {
    width: 320,
    backgroundColor: ({ appColors }) => appColors.DIALOG_BACKGROUND,
  },
  content: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    paddingTop: "28px !important",
    textAlign: "center"
  },
  logo: {
    backgroundColor: "#282c34",
    borderRadius: "50%",
    height: 72,
    marginBottom: 12,
    padding: 12,
    width: 72
  },
  appName: {
    color: ({ appColors }) => appColors.DIALOG_TITLE_TEXT,
    fontWeight: "bold !important",
    marginBottom: "8px !important"
  },
  version: {
    marginBottom: "10px !important"
  },
  text: {
    color: ({ appColors }) => appColors.DIALOG_TEXT,
    lineHeight: "1.35 !important"
  },
  licenseButton: {
    marginTop: "14px !important",
    textTransform: "none !important"
  },
  actions: {
    justifyContent: "center",
    paddingBottom: "16px !important"
  }
}));

function getVersionLabel(): string {
  const appVersionConfig = process.env.REACT_APP_APP_VERSION_CONFIG;

  if (!appVersionConfig) {
    return window.api.version.getShortDisplayVersion().replace(/^v/, "");
  }

  const parsedAppVersionConfig = JSON.parse(appVersionConfig) as AppVersionConfig;
  const version = AppVersionResolver.getCombinedVersion(parsedAppVersionConfig);
  const aboutVersion = AppVersionResolver.getAboutVersion(parsedAppVersionConfig);

  return aboutVersion ? `${version} (${aboutVersion})` : version;
}

function WebAboutDialog(props: WebAboutDialogProps) {
  const appColors = getAppColors(props.theme);
  const classes = useStyles({ appColors });

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      classes={{ paper: classes.dialogPaper }}
    >
      <DialogContent className={classes.content}>
        <img className={classes.logo} src={logo} alt="" />
        <Typography className={classes.appName} variant="h6">
          X-NoTES
        </Typography>
        <Typography className={`${classes.text} ${classes.version}`} variant="body2">
          Version {getVersionLabel()}
        </Typography>
        <Typography className={classes.text} variant="body2">
          Copyright © 2023-2026 SolisWare.
        </Typography>
        <Typography className={classes.text} variant="body2">
          All rights reserved.
        </Typography>
        <Button className={classes.licenseButton} onClick={props.onLicenseClick}>
          View License
        </Button>
      </DialogContent>
      <DialogActions className={classes.actions}>
        <Button onClick={props.onClose} variant="contained">
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default WebAboutDialog;
