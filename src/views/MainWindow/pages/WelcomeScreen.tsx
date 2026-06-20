/**
 * Copyright (c) 2023-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { Button, Checkbox, FormControlLabel, Theme, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import ColorLensOutlinedIcon from '@mui/icons-material/ColorLensOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import { useTranslation } from "react-i18next";
import { getAppColors } from "../../../theme/AppColors";
import { SystemTheme } from "../../../theme/SystemTheme";
import { AppColorStyleProps } from "../../../types/appColorTypes";

type WelcomeProps = {
  theme: SystemTheme;
  neverShowAgain: boolean;
  onGetStarted: () => void;
  onNeverShowAgainChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const useStyles = makeStyles<Theme, AppColorStyleProps>((theme: Theme) => ({
  root: {
    minHeight: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px",
    boxSizing: "border-box",
    textAlign: "left"
  },
  content: {
    width: "100%",
    maxWidth: 1040,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.2fr) minmax(240px, 0.8fr)",
    gap: 48,
    alignItems: "center",
    [theme.breakpoints.down("md")]: {
      maxWidth: 620,
      gridTemplateColumns: "1fr",
      gap: 32
    },
    [theme.breakpoints.down("sm")]: {
      gap: 24
    }
  },
  brandMark: {
    width: 48,
    height: 48,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 36
  },
  title: {
    color: ({ appColors }) => appColors.MAIN,
    marginBottom: "14px !important",
    lineHeight: "1.05 !important",
    overflowWrap: "break-word",
    [theme.breakpoints.down("sm")]: {
      fontSize: "40px !important"
    }
  },
  intro: {
    maxWidth: 520,
    color: ({ appColors }) => appColors.NOTE_TEXT,
    lineHeight: "1.7 !important",
    marginBottom: "52px !important"
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 14,
    marginTop: 0
  },
  getStartedButton: {
    minWidth: 178,
    height: "44px",
    borderRadius: 6,
    backgroundColor: ({ appColors }) => appColors.SECONDARY,
    color: ({ appColors }) => appColors.SECONDARY_TEXT,
    boxShadow: "none",
    textTransform: "none",
    fontWeight: 700,
    "&:hover": {
      backgroundColor: ({ appColors }) => appColors.SECONDARY_DARK
    }
  },
  buttonIcon: {
    marginLeft: 8
  },
  checkboxLabel: {
    color: ({ appColors }) => appColors.NOTE_FOOTER_TEXT + " !important"
  },
  checkbox: {
  },
  preview: {
    position: "relative",
    minHeight: 340,
    [theme.breakpoints.down("md")]: {
      minHeight: 260
    }
  },
  notePreview: {
    position: "absolute",
    width: 220,
    minHeight: 180,
    borderRadius: 8,
    padding: 18
  },
  primaryNote: {
    top: 24,
    left: 12,
    zIndex: 3
  },
  secondaryNote: {
    top: 86,
    right: 18,
    zIndex: 2
  },
  tertiaryNote: {
    bottom: 0,
    left: 78,
    zIndex: 1
  },
  noteTitle: {
    fontWeight: "700 !important",
    marginBottom: "12px !important"
  },
  noteLine: {
    height: 8,
    borderRadius: 999,
    marginBottom: 10,
    backgroundColor: "currentColor",
    opacity: 0.24
  },
  shortLine: {
    width: "58%"
  },
  featureRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginTop: 18,
    color: "currentColor",
    opacity: 0.78
  },
  featureIcon: {
    fontSize: "18px !important"
  }
}));

function WelcomeScreen(props: WelcomeProps) {
  const { t } = useTranslation();
  const appColors = getAppColors(props.theme);
  const classes = useStyles({ appColors });

  return (
    <section className={classes.root}>
      <div className={classes.content}>
        <div>
          <div className={classes.brandMark}>
            <PushPinOutlinedIcon fontSize="large" htmlColor={appColors.NOTE_FOOTER_TEXT} />
          </div>
          <Typography
            className={classes.title}
            variant="h2"
            fontWeight="bold"
            style={{ color: appColors.MAIN }}
          >
            {t("mainWindow.welcome.title")}
          </Typography>
          <Typography className={classes.intro} variant="body1">
            {t("mainWindow.welcome.intro")}
          </Typography>
          <div className={classes.actions}>
            <Button className={classes.getStartedButton} variant="contained" onClick={props.onGetStarted}>
              {t("mainWindow.welcome.getStarted")}
              <ArrowForwardIcon className={classes.buttonIcon} fontSize="small" />
            </Button>
            <FormControlLabel
              className={classes.checkboxLabel}
              control={
                <Checkbox
                  checked={props.neverShowAgain}
                  className={classes.checkbox}
                  onChange={props.onNeverShowAgainChange}
                  sx={{
                    color: appColors.MAIN,
                    "&.Mui-checked": {
                      color: (props.theme === SystemTheme.DARK ? appColors.MAIN_LIGHT : appColors.MAIN) + " !important"
                    }
                  }}
                />
              }
              label={t("mainWindow.welcome.doNotShowAgain")}
            />
          </div>
        </div>
        <div className={classes.preview} aria-hidden="true">
          <div
            className={`${classes.notePreview} ${classes.primaryNote}`}
            style={{
              backgroundColor: appColors.WELCOME_NOTE_PREVIEW_PRIMARY_BACKGROUND,
              color: appColors.WELCOME_NOTE_PREVIEW_TEXT,
              boxShadow: "0 18px 36px " + appColors.WELCOME_NOTE_PREVIEW_SHADOW,
              border: "1px solid " + appColors.WELCOME_NOTE_PREVIEW_BORDER
            }}
          >
            <Typography className={classes.noteTitle} variant="body1">{t("mainWindow.welcome.preview.today")}</Typography>
            <div className={classes.noteLine} />
            <div className={classes.noteLine} />
            <div className={`${classes.noteLine} ${classes.shortLine}`} />
            <div className={classes.featureRow}>
              <AutoAwesomeOutlinedIcon className={classes.featureIcon} />
              <Typography variant="body2">{t("mainWindow.welcome.preview.freshWorkspace")}</Typography>
            </div>
          </div>
          <div
            className={`${classes.notePreview} ${classes.secondaryNote}`}
            style={{
              backgroundColor: appColors.WELCOME_NOTE_PREVIEW_SECONDARY_BACKGROUND,
              color: appColors.WELCOME_NOTE_PREVIEW_TEXT,
              boxShadow: "0 18px 36px " + appColors.WELCOME_NOTE_PREVIEW_SHADOW,
              border: "1px solid " + appColors.WELCOME_NOTE_PREVIEW_BORDER
            }}
          >
            <Typography className={classes.noteTitle} variant="body1">{t("mainWindow.welcome.preview.ideas")}</Typography>
            <div className={classes.noteLine} />
            <div className={`${classes.noteLine} ${classes.shortLine}`} />
            <div className={classes.featureRow}>
              <ColorLensOutlinedIcon className={classes.featureIcon} />
              <Typography variant="body2">{t("mainWindow.welcome.preview.colorfulNotes")}</Typography>
            </div>
          </div>
          <div
            className={`${classes.notePreview} ${classes.tertiaryNote}`}
            style={{
              backgroundColor: appColors.WELCOME_NOTE_PREVIEW_TERTIARY_BACKGROUND,
              color: appColors.WELCOME_NOTE_PREVIEW_TEXT,
              boxShadow: "0 18px 36px " + appColors.WELCOME_NOTE_PREVIEW_SHADOW,
              border: "1px solid " + appColors.WELCOME_NOTE_PREVIEW_BORDER
            }}
          >
            <Typography className={classes.noteTitle} variant="body1">{t("mainWindow.welcome.preview.next")}</Typography>
            <div className={classes.noteLine} />
            <div className={classes.noteLine} />
            <div className={`${classes.noteLine} ${classes.shortLine}`} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default WelcomeScreen;
