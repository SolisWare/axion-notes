/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import FormatBoldRoundedIcon from "@mui/icons-material/FormatBoldRounded";
import FormatItalicRoundedIcon from "@mui/icons-material/FormatItalicRounded";
import FormatUnderlinedRoundedIcon from "@mui/icons-material/FormatUnderlinedRounded";
import StrikethroughSRoundedIcon from "@mui/icons-material/StrikethroughSRounded";
import { IconButton } from "@mui/material";
import { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { getAppColors } from "../theme/AppColors";
import { SystemTheme } from "../theme/SystemTheme";
import styles from "./NoteFormatToolbar.module.css";

type NoteFormatToolbarProps = {
  theme: SystemTheme;
};

function NoteFormatToolbar(props: NoteFormatToolbarProps) {
  const { t } = useTranslation();
  const appColors = getAppColors(props.theme);
  const toolbarStyle = {
    "--note-format-toolbar-button-hover-background": appColors.SETTINGS_NAV_HOVER_BACKGROUND,
    "--note-format-toolbar-button-hover-text": appColors.SETTINGS_NAV_HOVER_TEXT
  } as CSSProperties;

  return (
    <div className={styles.toolbar} role="toolbar" aria-label={t("electron.menu.format")} style={toolbarStyle}>
      <IconButton
        aria-label={t("electron.menu.bold")}
        className={styles.toolbarButton}
        disableRipple
        size="small"
        title={t("electron.menu.bold")}
        type="button"
      >
        <FormatBoldRoundedIcon fontSize="small" />
      </IconButton>
      <IconButton
        aria-label={t("electron.menu.italic")}
        className={styles.toolbarButton}
        disableRipple
        size="small"
        title={t("electron.menu.italic")}
        type="button"
      >
        <FormatItalicRoundedIcon fontSize="small" />
      </IconButton>
      <IconButton
        aria-label={t("electron.menu.underline")}
        className={styles.toolbarButton}
        disableRipple
        size="small"
        title={t("electron.menu.underline")}
        type="button"
      >
        <FormatUnderlinedRoundedIcon fontSize="small" />
      </IconButton>
      <IconButton
        aria-label={t("electron.menu.strikethrough")}
        className={styles.toolbarButton}
        disableRipple
        size="small"
        title={t("electron.menu.strikethrough")}
        type="button"
      >
        <StrikethroughSRoundedIcon fontSize="small" />
      </IconButton>
    </div>
  );
}

export default NoteFormatToolbar;
