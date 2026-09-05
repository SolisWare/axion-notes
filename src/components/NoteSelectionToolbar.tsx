/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import RemoveDoneRoundedIcon from "@mui/icons-material/RemoveDoneRounded";
import { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { getAppColors } from "../theme/AppColors";
import { SystemTheme } from "../theme/SystemTheme";
import styles from "./NoteSelectionToolbar.module.css";

type NoteSelectionToolbarProps = {
  theme: SystemTheme;
  selectedCount: number;
  onDeleteSelectedNotes: () => void;
  onDuplicateSelectedNotes: () => void;
  onClearSelection: () => void;
  onCancelSelection: () => void;
};

function NoteSelectionToolbar(props: NoteSelectionToolbarProps) {
  const { t } = useTranslation();
  const appColors = getAppColors(props.theme);
  const hasSelectedNotes = props.selectedCount > 0;
  const toolbarStyle = {
    "--note-selection-toolbar-background": appColors.DIALOG_BACKGROUND,
    "--note-selection-toolbar-border": appColors.SETTINGS_DIVIDER,
    "--note-selection-toolbar-text": appColors.DIALOG_TEXT,
    "--note-selection-toolbar-shadow": "rgba(31, 41, 51, 0.2)",
    "--note-selection-toolbar-disabled-text": appColors.DISABLED_TEXT,
    "--note-selection-toolbar-button-hover-background": appColors.SETTINGS_NAV_HOVER_BACKGROUND,
    "--note-selection-toolbar-button-hover-border": appColors.SETTINGS_NAV_HOVER_BORDER,
    "--note-selection-toolbar-button-hover-text": appColors.SETTINGS_NAV_HOVER_TEXT,
    "--note-selection-toolbar-delete-hover-background": appColors.TOOLBAR_DELETE_BUTTON_HOVER_BACKGROUND,
    "--note-selection-toolbar-delete-hover-border": appColors.TOOLBAR_DELETE_BUTTON_HOVER_BORDER,
    "--note-selection-toolbar-delete-hover-text": appColors.TOOLBAR_DELETE_BUTTON_HOVER_TEXT
  } as CSSProperties;

  return (
    <div className={styles.toolbar} role="toolbar" aria-label={t("mainWindow.noteSelectionToolbar.label")} style={toolbarStyle}>
      <span className={styles.count}>
        {t("mainWindow.noteSelectionToolbar.selectedCount", { count: props.selectedCount })}
      </span>
      <div className={styles.divider} aria-hidden="true" />
      <button
        className={`${styles.button} ${styles.deleteButton}`}
        disabled={!hasSelectedNotes}
        type="button"
        onClick={props.onDeleteSelectedNotes}
      >
        <DeleteOutlineRoundedIcon className={styles.buttonIcon} />
        {t("mainWindow.noteSelectionToolbar.delete")}
      </button>
      <button
        className={styles.button}
        disabled={!hasSelectedNotes}
        type="button"
        onClick={props.onDuplicateSelectedNotes}
      >
        <ContentCopyRoundedIcon className={styles.buttonIcon} />
        {t("mainWindow.noteSelectionToolbar.duplicate")}
      </button>
      <button
        className={styles.button}
        disabled={!hasSelectedNotes}
        type="button"
        onClick={props.onClearSelection}
      >
        <RemoveDoneRoundedIcon className={styles.buttonIcon} />
        {t("mainWindow.noteSelectionToolbar.clear")}
      </button>
      <div className={styles.divider} aria-hidden="true" />
      <button className={styles.button} type="button" onClick={props.onCancelSelection}>
        <CloseRoundedIcon className={styles.buttonIcon} />
        {t("mainWindow.noteSelectionToolbar.cancel")}
      </button>
    </div>
  );
}

export default NoteSelectionToolbar;
