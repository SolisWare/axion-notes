/**
 * Copyright (c) 2023-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { Theme, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";
import clsx from 'clsx';
import { getAppColors } from "../theme/AppColors";
import { SystemTheme } from "../theme/SystemTheme";
import { AppColorStyleProps } from "../types/appColorTypes";

type EmptyNoteListProps = {
  theme: SystemTheme;
}

const useStyles = makeStyles<Theme, AppColorStyleProps>((theme: Theme) => ({
  wrapper: {
    position: "fixed",
    width: "95%"
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
  const appColors = getAppColors(props.theme);
  const classes = useStyles({ appColors });
  const isMac = window.api.os.isMac;
  const platform = isMac ? "Cmd" : "Ctrl";
  
  return (
    <div className={classes.wrapper}>
      <Typography className={classes.text} style={{ color: appColors.DISABLED_TEXT }} fontSize="large">You don't have any notes yet!</Typography>
      <Typography className={clsx(classes.text, classes.text2)} style={{ color: appColors.DISABLED_TEXT }}>Press {platform}+N to add your first note</Typography>
    </div>
  );
}

export default EmptyNoteList;
