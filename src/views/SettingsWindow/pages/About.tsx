/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { Theme, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";
import { useTranslation } from "react-i18next";
import { getAppColors } from "../../../theme/AppColors";
import { SystemTheme } from "../../../theme/SystemTheme";
import { AppColorStyleProps } from "../../../types/appColorTypes";
import { AppVersionResolver } from "../../../utils/app-version/AppVersionResolver";
import styles from "./SettingsPages.module.css";

type AboutProps = {
  theme: SystemTheme;
};

const useStyles = makeStyles<Theme, AppColorStyleProps>(() => ({
  content: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    textAlign: "center"
  },
  logo: {
    height: 72,
    marginBottom: 14,
    width: 72
  },
  appName: {
    color: ({ appColors }) => appColors.DIALOG_TITLE_TEXT,
    fontWeight: "bold !important",
    marginBottom: "10px !important"
  },
  version: {
    marginBottom: "12px !important"
  },
  text: {
    color: ({ appColors }) => appColors.DIALOG_TEXT,
    lineHeight: "1.35 !important"
  }
}));

function getVersionLabel(): string {
  const appVersionConfig = process.env.REACT_APP_APP_VERSION_CONFIG;

  if (!appVersionConfig) {
    return window.api.version.getShortDisplayVersion().replace(/^v/, "");
  }

  return AppVersionResolver.getAboutDisplayVersion(JSON.parse(appVersionConfig));
}

function About(props: AboutProps) {
  const { t } = useTranslation();
  const appColors = getAppColors(props.theme);
  const classes = useStyles({ appColors });
  const appIcon = `${process.env.PUBLIC_URL}/axion_notes_icon1024.png`;

  return (
    <div className={styles.aboutPage}>
      <div className={styles.aboutPanel}>
        <div className={classes.content}>
          <img className={classes.logo} src={appIcon} alt="" />
          <Typography className={classes.appName} variant="h6">
            {t("app.name")}
          </Typography>
          <Typography className={`${classes.text} ${classes.version}`} variant="body2">
            {t("settingsWindow.about.version", { version: getVersionLabel() })}
          </Typography>
          <Typography className={classes.text} variant="body2">
            Copyright © 2023-2026 SolisWare.
          </Typography>
          <Typography className={classes.text} variant="body2">
            {t("settingsWindow.about.rights")}
          </Typography>
        </div>
      </div>
    </div>
  );
}

export default About;
