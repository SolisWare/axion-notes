/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/system";
import { AppSettings } from "../../settings/AppSettings";
import { AppTheme } from "../../theme/AppTheme";
import { SystemTheme } from "../../theme/SystemTheme";
import styles from "./NoteWindow.module.css";

type NoteWindowProps = {
  theme: SystemTheme;
  appSettings: AppSettings;
};

function NoteWindow(props: NoteWindowProps) {
  const appTheme = props.theme === SystemTheme.DARK ? AppTheme.DarkTheme : AppTheme.LightTheme;
  void props.appSettings;

  return (
    <ThemeProvider theme={appTheme}>
      <div className={styles.root} style={{ backgroundColor: appTheme.palette.background.default }}>
        <CssBaseline />
      </div>
    </ThemeProvider>
  );
}

export default NoteWindow;
