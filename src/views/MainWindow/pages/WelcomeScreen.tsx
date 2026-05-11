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
import { useState } from "react";
import { getAppColors } from "../../../theme/AppColors";
import { SystemTheme } from "../../../theme/SystemTheme";
import { AppColorStyleProps } from "../../../types/appColorTypes";

type WelcomeProps = {
  theme: SystemTheme;
  onGetStarted: () => void;
  onNeverShowAgainChange?: (checked: boolean) => void;
}

const useStyles = makeStyles<Theme, AppColorStyleProps>((theme: Theme) => ({
  root: {
    minHeight: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px"
  },
  content: {
    width: "100%",
    maxWidth: 1040,
    display: "grid",
    gridTemplateColumns: "minmax(520px, 1.2fr) minmax(240px, 0.8fr)",
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
    width: 76,
    height: 76,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 36,
    backgroundColor: ({ appColors }) => appColors.MAIN,
    color: ({ appColors }) => appColors.MAIN_TEXT,
    boxShadow: ({ appColors }) => "0 14px 32px " + appColors.WELCOME_BRAND_MARK_SHADOW
  },
  title: {
    color: ({ appColors }) => appColors.MAIN_DARK,
    marginBottom: "14px !important",
    lineHeight: "1.05 !important",
    whiteSpace: "nowrap",
    [theme.breakpoints.down("sm")]: {
      fontSize: "40px !important",
      whiteSpace: "normal"
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
    marginTop: 24
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
    marginLeft: "-10px !important",
    color: ({ appColors }) => appColors.NOTE_FOOTER_TEXT + " !important"
  },
  checkbox: {
    color: ({ appColors }) => appColors.MAIN + " !important",
    "&.Mui-checked": {
      color: ({ appColors }) => appColors.SECONDARY + " !important"
    }
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
    padding: 18,
    boxShadow: ({ appColors }) => "0 18px 36px " + appColors.WELCOME_NOTE_PREVIEW_SHADOW,
    border: ({ appColors }) => "1px solid " + appColors.WELCOME_NOTE_PREVIEW_BORDER
  },
  primaryNote: {
    top: 24,
    left: 12,
    zIndex: 3,
    backgroundColor: ({ appColors }) => appColors.WELCOME_NOTE_PREVIEW_PRIMARY_BACKGROUND,
    color: ({ appColors }) => appColors.WELCOME_NOTE_PREVIEW_TEXT
  },
  secondaryNote: {
    top: 86,
    right: 18,
    zIndex: 2,
    backgroundColor: ({ appColors }) => appColors.WELCOME_NOTE_PREVIEW_SECONDARY_BACKGROUND,
    color: ({ appColors }) => appColors.WELCOME_NOTE_PREVIEW_TEXT
  },
  tertiaryNote: {
    bottom: 0,
    left: 78,
    zIndex: 1,
    backgroundColor: ({ appColors }) => appColors.WELCOME_NOTE_PREVIEW_TERTIARY_BACKGROUND,
    color: ({ appColors }) => appColors.WELCOME_NOTE_PREVIEW_TEXT
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
  const appColors = getAppColors(props.theme);
  const classes = useStyles({ appColors });
  const [neverShowAgain, setNeverShowAgain] = useState(false);

  const handleNeverShowAgainChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;

    setNeverShowAgain(checked);
    props.onNeverShowAgainChange?.(checked);
  };

  return (
    <section className={classes.root}>
      <div className={classes.content}>
        <div>
          <div className={classes.brandMark}>
            <PushPinOutlinedIcon fontSize="large" />
          </div>
          <Typography className={classes.title} variant="h2" fontWeight="bold">
            Welcome to X-NoTES
          </Typography>
          <Typography className={classes.intro} variant="body1">
            Keep quick thoughts close, tidy, and ready whenever you need them.
          </Typography>
          <div className={classes.actions}>
            <Button className={classes.getStartedButton} variant="contained" onClick={props.onGetStarted}>
              Get Started
              <ArrowForwardIcon className={classes.buttonIcon} fontSize="small" />
            </Button>
            <FormControlLabel
              className={classes.checkboxLabel}
              control={
                <Checkbox
                  className={classes.checkbox}
                  checked={neverShowAgain}
                  onChange={handleNeverShowAgainChange}
                />
              }
              label="Do not show this welcome screen again"
            />
          </div>
        </div>
        <div className={classes.preview} aria-hidden="true">
          <div className={`${classes.notePreview} ${classes.primaryNote}`}>
            <Typography className={classes.noteTitle} variant="body1">Today</Typography>
            <div className={classes.noteLine} />
            <div className={classes.noteLine} />
            <div className={`${classes.noteLine} ${classes.shortLine}`} />
            <div className={classes.featureRow}>
              <AutoAwesomeOutlinedIcon className={classes.featureIcon} />
              <Typography variant="body2">Fresh workspace</Typography>
            </div>
          </div>
          <div className={`${classes.notePreview} ${classes.secondaryNote}`}>
            <Typography className={classes.noteTitle} variant="body1">Ideas</Typography>
            <div className={classes.noteLine} />
            <div className={`${classes.noteLine} ${classes.shortLine}`} />
            <div className={classes.featureRow}>
              <ColorLensOutlinedIcon className={classes.featureIcon} />
              <Typography variant="body2">Colorful notes</Typography>
            </div>
          </div>
          <div className={`${classes.notePreview} ${classes.tertiaryNote}`}>
            <Typography className={classes.noteTitle} variant="body1">Next</Typography>
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
