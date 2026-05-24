/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { CssBaseline, Theme, Typography } from "@mui/material";
import { ThemeProvider } from "@mui/system";
import { makeStyles } from "@mui/styles";
import { AppTheme } from "../../theme/AppTheme";
import { getAppColors } from "../../theme/AppColors";
import { SystemTheme } from "../../theme/SystemTheme";
import { AppColorStyleProps } from "../../types/appColorTypes";

type LicenseWindowProps = {
  theme: SystemTheme;
  embedded?: boolean;
}

type LicenseWindowStyleProps = AppColorStyleProps & {
  embedded?: boolean;
};

const useStyles = makeStyles<Theme, LicenseWindowStyleProps>(() => ({
  root: {
    minHeight: ({ embedded }) => embedded ? "auto" : "100vh",
    boxSizing: "border-box",
    padding: "28px 32px",
    textAlign: "left",
    backgroundColor: ({ appColors }) => appColors.DIALOG_BACKGROUND
  },
  title: {
    fontWeight: "700 !important",
    marginBottom: "18px !important"
  },
  body: {
    color: ({ appColors }) => appColors.NOTE_TEXT,
    lineHeight: "1.7 !important",
    whiteSpace: "pre-line"
  }
}));

function LicenseWindow(props: LicenseWindowProps) {
  const appTheme = props.theme === SystemTheme.DARK ? AppTheme.DarkTheme : AppTheme.LightTheme;
  const appColors = getAppColors(props.theme);
  const classes = useStyles({ appColors, embedded: props.embedded });

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <main className={classes.root}>
        <Typography className={classes.title} variant="h6" style={{ color: appColors.MAIN }}>
          MIT License
        </Typography>
        <Typography className={classes.body} variant="body2" style={{ fontWeight: "600" }}>
          Copyright (c) 2023 - present SolisWare
        </Typography>
        <br />
        <Typography className={classes.body} variant="body2">
          Permission is hereby granted, free of charge, to any person obtaining a copy
          of this software and associated documentation files (the "Software"), to deal
          in the Software without restriction, including without limitation the rights
          to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
          copies of the Software, and to permit persons to whom the Software is
          furnished to do so, subject to the following conditions:
        </Typography>
        <br />
        <Typography className={classes.body} variant="body2">
          The above copyright notice and this permission notice shall be included in all
          copies or substantial portions of the Software.
        </Typography>
        <br />
        <Typography className={classes.body} variant="body2">
          THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
          IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
          FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
          AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
          LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
          OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
          SOFTWARE.
        </Typography>
      </main>
    </ThemeProvider>
  );
}

export default LicenseWindow;
