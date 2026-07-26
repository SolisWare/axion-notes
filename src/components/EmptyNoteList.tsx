/**
 * Copyright (c) 2023-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { Theme, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";
import clsx from 'clsx';
import { useTranslation } from "react-i18next";
import { getAppColors } from "../theme/AppColors";
import { SystemTheme } from "../theme/SystemTheme";
import { AppColorStyleProps } from "../types/appColorTypes";

type EmptyNoteListProps = {
  isLocked?: boolean;
  theme: SystemTheme;
}

const useStyles = makeStyles<Theme, AppColorStyleProps>((theme: Theme) => ({
  wrapper: {
    width: "100%",
    boxSizing: "border-box",
    padding: "30px 30px",
    display: "flex",
    justifyContent: "center"
  },
  content: {
    width: "100%",
    maxWidth: 420,
    textAlign: "center"
  },
  text: {
    paddingBottom: 7,
    color: ({ appColors }) => appColors.DISABLED_TEXT
  },
  text2: {
    fontStyle: "italic"
  }
}));
 
function EmptyNoteList(props: EmptyNoteListProps) {
  const { t } = useTranslation();
  const appColors = getAppColors(props.theme);
  const classes = useStyles({ appColors });
  const isMac = window.api.os.isMac;
  const platform = isMac ? "Cmd" : "Ctrl";
  const title = props.isLocked
    ? t("mainWindow.emptyNotes.lockedTitle", { appName: "Axion Notes" })
    : t("mainWindow.emptyNotes.title");
  const message = props.isLocked
    ? t("mainWindow.emptyNotes.lockedMessage")
    : t("mainWindow.emptyNotes.addFirstNote", { shortcut: `${platform}+N` });
  
  return (
    <div className={classes.wrapper}>
      <div className={classes.content}>
        <Typography className={classes.text} style={{ color: appColors.DISABLED_TEXT }} fontSize="large">{title}</Typography>
        <Typography className={clsx(classes.text, classes.text2)} style={{ color: appColors.DISABLED_TEXT }}>{message}</Typography>
      </div>
    </div>
  );
}

export default EmptyNoteList;
