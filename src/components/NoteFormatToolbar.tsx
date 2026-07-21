/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import FormatBoldRoundedIcon from "@mui/icons-material/FormatBoldRounded";
import FormatItalicRoundedIcon from "@mui/icons-material/FormatItalicRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import FormatListNumberedRoundedIcon from "@mui/icons-material/FormatListNumberedRounded";
import FormatUnderlinedRoundedIcon from "@mui/icons-material/FormatUnderlinedRounded";
import StrikethroughSRoundedIcon from "@mui/icons-material/StrikethroughSRounded";
import SubscriptRoundedIcon from "@mui/icons-material/SubscriptRounded";
import SuperscriptRoundedIcon from "@mui/icons-material/SuperscriptRounded";
import { IconButton } from "@mui/material";
import { CSSProperties, useState } from "react";
import { useTranslation } from "react-i18next";
import DashedListIcon from "./DashedListIcon";
import { RichTextFormatCommand } from "../models/RichTextFormatCommand";
import { RichTextFormatState } from "../models/RichTextFormatState";
import { getAppColors } from "../theme/AppColors";
import { SystemTheme } from "../theme/SystemTheme";
import styles from "./NoteFormatToolbar.module.css";

type NoteFormatToolbarProps = {
  theme: SystemTheme;
  formatState: RichTextFormatState;
  onFormatAction: (command: RichTextFormatCommand) => void;
  className?: string;
  surfaceColor?: string;
  compactInlineStyles?: boolean;
};

function NoteFormatToolbar(props: NoteFormatToolbarProps) {
  const { t } = useTranslation();
  const [isInlineStyleMenuOpen, setIsInlineStyleMenuOpen] = useState(false);
  const appColors = getAppColors(props.theme);
  const isInlineStyleActive = props.formatState.isBoldActive
    || props.formatState.isItalicActive
    || props.formatState.isUnderlineActive
    || props.formatState.isStrikethroughActive;
  const toolbarStyle = {
    "--note-format-toolbar-button-hover-background": appColors.SETTINGS_NAV_HOVER_BACKGROUND,
    "--note-format-toolbar-button-hover-text": appColors.SETTINGS_NAV_HOVER_TEXT,
    "--note-format-toolbar-background": props.surfaceColor
      ? `color-mix(in srgb, ${props.surfaceColor} 42%, rgba(255, 255, 255, 0.96))`
      : undefined
  } as CSSProperties;

  return (
    <div
      className={`${styles.toolbar} ${props.className ?? ""}`}
      role="toolbar"
      aria-label={t("electron.menu.format")}
      data-note-format-toolbar="true"
      onMouseDown={(event) => event.preventDefault()}
      style={toolbarStyle}
    >
      {props.compactInlineStyles ? (
        <div className={styles.compactGroup}>
          <IconButton
            aria-label={t("electron.menu.format")}
            aria-expanded={isInlineStyleMenuOpen}
            aria-haspopup="true"
            className={`${styles.toolbarButton} ${styles.inlineStyleMenuButton} ${isInlineStyleActive ? styles.toolbarButtonActive : ""}`}
            disableRipple
            disabled={!props.formatState.canFormat}
            onClick={() => setIsInlineStyleMenuOpen((isOpen) => !isOpen)}
            size="small"
            title={t("electron.menu.format")}
            type="button"
          >
            <FormatBoldRoundedIcon fontSize="small" />
            <FormatItalicRoundedIcon className={styles.inlineStyleMenuIcon} fontSize="small" />
          </IconButton>
          {isInlineStyleMenuOpen && (
            <div className={styles.inlineStyleSubtoolbar} role="toolbar" aria-label={t("electron.menu.format")}>
              <IconButton
                aria-label={t("electron.menu.bold")}
                className={`${styles.toolbarButton} ${props.formatState.isBoldActive ? styles.toolbarButtonActive : ""}`}
                disableRipple
                disabled={!props.formatState.canFormat}
                onClick={() => {
                  props.onFormatAction(RichTextFormatCommand.BOLD);
                  setIsInlineStyleMenuOpen(false);
                }}
                size="small"
                title={t("electron.menu.bold")}
                type="button"
              >
                <FormatBoldRoundedIcon fontSize="small" />
              </IconButton>
              <IconButton
                aria-label={t("electron.menu.italic")}
                className={`${styles.toolbarButton} ${props.formatState.isItalicActive ? styles.toolbarButtonActive : ""}`}
                disableRipple
                disabled={!props.formatState.canFormat}
                onClick={() => {
                  props.onFormatAction(RichTextFormatCommand.ITALIC);
                  setIsInlineStyleMenuOpen(false);
                }}
                size="small"
                title={t("electron.menu.italic")}
                type="button"
              >
                <FormatItalicRoundedIcon fontSize="small" />
              </IconButton>
              <IconButton
                aria-label={t("electron.menu.underline")}
                className={`${styles.toolbarButton} ${props.formatState.isUnderlineActive ? styles.toolbarButtonActive : ""}`}
                disableRipple
                disabled={!props.formatState.canFormat}
                onClick={() => {
                  props.onFormatAction(RichTextFormatCommand.UNDERLINE);
                  setIsInlineStyleMenuOpen(false);
                }}
                size="small"
                title={t("electron.menu.underline")}
                type="button"
              >
                <FormatUnderlinedRoundedIcon fontSize="small" />
              </IconButton>
              <IconButton
                aria-label={t("electron.menu.strikethrough")}
                className={`${styles.toolbarButton} ${props.formatState.isStrikethroughActive ? styles.toolbarButtonActive : ""}`}
                disableRipple
                disabled={!props.formatState.canFormat}
                onClick={() => {
                  props.onFormatAction(RichTextFormatCommand.STRIKETHROUGH);
                  setIsInlineStyleMenuOpen(false);
                }}
                size="small"
                title={t("electron.menu.strikethrough")}
                type="button"
              >
                <StrikethroughSRoundedIcon fontSize="small" />
              </IconButton>
            </div>
          )}
        </div>
      ) : (
        <>
          <IconButton
            aria-label={t("electron.menu.bold")}
            className={`${styles.toolbarButton} ${props.formatState.isBoldActive ? styles.toolbarButtonActive : ""}`}
            disableRipple
            disabled={!props.formatState.canFormat}
            onClick={() => props.onFormatAction(RichTextFormatCommand.BOLD)}
            size="small"
            title={t("electron.menu.bold")}
            type="button"
          >
            <FormatBoldRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton
            aria-label={t("electron.menu.italic")}
            className={`${styles.toolbarButton} ${props.formatState.isItalicActive ? styles.toolbarButtonActive : ""}`}
            disableRipple
            disabled={!props.formatState.canFormat}
            onClick={() => props.onFormatAction(RichTextFormatCommand.ITALIC)}
            size="small"
            title={t("electron.menu.italic")}
            type="button"
          >
            <FormatItalicRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton
            aria-label={t("electron.menu.underline")}
            className={`${styles.toolbarButton} ${props.formatState.isUnderlineActive ? styles.toolbarButtonActive : ""}`}
            disableRipple
            disabled={!props.formatState.canFormat}
            onClick={() => props.onFormatAction(RichTextFormatCommand.UNDERLINE)}
            size="small"
            title={t("electron.menu.underline")}
            type="button"
          >
            <FormatUnderlinedRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton
            aria-label={t("electron.menu.strikethrough")}
            className={`${styles.toolbarButton} ${props.formatState.isStrikethroughActive ? styles.toolbarButtonActive : ""}`}
            disableRipple
            disabled={!props.formatState.canFormat}
            onClick={() => props.onFormatAction(RichTextFormatCommand.STRIKETHROUGH)}
            size="small"
            title={t("electron.menu.strikethrough")}
            type="button"
          >
            <StrikethroughSRoundedIcon fontSize="small" />
          </IconButton>
        </>
      )}
      <span className={styles.toolbarDivider} aria-hidden="true" />
      <IconButton
        aria-label={t("mainWindow.note.formatToolbar.bulletList")}
        className={`${styles.toolbarButton} ${props.formatState.isBulletListActive ? styles.toolbarButtonActive : ""}`}
        disableRipple
        disabled={!props.formatState.canFormat}
        onClick={() => props.onFormatAction(RichTextFormatCommand.BULLET_LIST)}
        size="small"
        title={t("mainWindow.note.formatToolbar.bulletList")}
        type="button"
      >
        <FormatListBulletedRoundedIcon fontSize="small" />
      </IconButton>
      <IconButton
        aria-label={t("mainWindow.note.formatToolbar.dashedList")}
        className={`${styles.toolbarButton} ${props.formatState.isDashedListActive ? styles.toolbarButtonActive : ""}`}
        disableRipple
        disabled={!props.formatState.canFormat}
        onClick={() => props.onFormatAction(RichTextFormatCommand.DASHED_LIST)}
        size="small"
        title={t("mainWindow.note.formatToolbar.dashedList")}
        type="button"
      >
        <DashedListIcon />
      </IconButton>
      <IconButton
        aria-label={t("mainWindow.note.formatToolbar.numberedList")}
        className={`${styles.toolbarButton} ${props.formatState.isNumberedListActive ? styles.toolbarButtonActive : ""}`}
        disableRipple
        disabled={!props.formatState.canFormat}
        onClick={() => props.onFormatAction(RichTextFormatCommand.NUMBERED_LIST)}
        size="small"
        title={t("mainWindow.note.formatToolbar.numberedList")}
        type="button"
      >
        <FormatListNumberedRoundedIcon fontSize="small" />
      </IconButton>
      <span className={styles.toolbarDivider} aria-hidden="true" />
      <IconButton
        aria-label={t("mainWindow.note.formatToolbar.superscript")}
        className={`${styles.toolbarButton} ${props.formatState.isSuperscriptActive ? styles.toolbarButtonActive : ""}`}
        disableRipple
        disabled={!props.formatState.canFormat}
        onClick={() => props.onFormatAction(RichTextFormatCommand.SUPERSCRIPT)}
        size="small"
        title={t("mainWindow.note.formatToolbar.superscript")}
        type="button"
      >
        <SuperscriptRoundedIcon className={styles.superscriptIcon} fontSize="small" />
      </IconButton>
      <IconButton
        aria-label={t("mainWindow.note.formatToolbar.subscript")}
        className={`${styles.toolbarButton} ${props.formatState.isSubscriptActive ? styles.toolbarButtonActive : ""}`}
        disableRipple
        disabled={!props.formatState.canFormat}
        onClick={() => props.onFormatAction(RichTextFormatCommand.SUBSCRIPT)}
        size="small"
        title={t("mainWindow.note.formatToolbar.subscript")}
        type="button"
      >
        <SubscriptRoundedIcon className={styles.subscriptIcon} fontSize="small" />
      </IconButton>
    </div>
  );
}

export default NoteFormatToolbar;
