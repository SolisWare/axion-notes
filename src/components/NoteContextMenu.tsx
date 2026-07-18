/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { Divider } from "@mui/material";
import { CSSProperties, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getAppColors } from "../theme/AppColors";
import { NoteColorKey, NoteColors } from "../theme/NoteColors";
import { SystemTheme } from "../theme/SystemTheme";
import styles from "./NoteContextMenu.module.css";

export type NoteContextMenuPosition = {
  mouseX: number;
  mouseY: number;
};

type NoteContextMenuProps = {
  theme: SystemTheme;
  position: NoteContextMenuPosition;
  selectedColor: NoteColorKey;
  isTitleHidden: boolean;
  isPinned: boolean;
  onDeleteNote: () => void;
  onDuplicateNote: () => void;
  onOpenNoteWindow?: () => void;
  onTogglePin?: () => void;
  onMoveNoteToBottom: () => void;
  onMoveNoteToTop: () => void;
  onNoteColorChange: (colorKey: NoteColorKey) => void;
  onToggleTitleVisibility: () => void;
  showMoveActions?: boolean;
  showTitleVisibilityAction?: boolean;
};

const MENU_VIEWPORT_MARGIN = 8;

function NoteContextMenu(props: NoteContextMenuProps) {
  const { t } = useTranslation();
  const appColors = getAppColors(props.theme);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [hoveredNoteColor, setHoveredNoteColor] = useState<NoteColorKey | null>(null);
  const [menuPosition, setMenuPosition] = useState(props.position);

  const noteColorKeys = Object.values(NoteColorKey);
  const noteContextColorLabel = hoveredNoteColor === null
    ? t("mainWindow.note.contextMenu.noteColor")
    : t(`settingsWindow.appearance.noteColors.${hoveredNoteColor}`);
  const menuStyle = {
    backgroundColor: appColors.DIALOG_BACKGROUND,
    color: appColors.DIALOG_TEXT,
    top: menuPosition.mouseY,
    left: menuPosition.mouseX,
    "--note-context-menu-item-hover-background": appColors.SETTINGS_NAV_HOVER_BACKGROUND,
    "--note-context-menu-item-hover-text": appColors.SETTINGS_NAV_HOVER_TEXT,
    "--note-context-menu-label-text": appColors.DIALOG_TEXT
  } as CSSProperties;

  useLayoutEffect(() => {
    const menu = menuRef.current;

    if (!menu) {
      return;
    }

    const updateMenuPosition = () => {
      const menuRect = menu.getBoundingClientRect();
      const shouldOpenLeft = props.position.mouseX + menuRect.width + MENU_VIEWPORT_MARGIN > window.innerWidth;
      const shouldOpenUp = props.position.mouseY + menuRect.height + MENU_VIEWPORT_MARGIN > window.innerHeight;
      const left = shouldOpenLeft
        ? Math.max(MENU_VIEWPORT_MARGIN, props.position.mouseX - menuRect.width)
        : Math.min(props.position.mouseX, window.innerWidth - menuRect.width - MENU_VIEWPORT_MARGIN);
      const top = shouldOpenUp
        ? Math.max(MENU_VIEWPORT_MARGIN, props.position.mouseY - menuRect.height)
        : Math.min(props.position.mouseY, window.innerHeight - menuRect.height - MENU_VIEWPORT_MARGIN);

      setMenuPosition((currentPosition) => (
        currentPosition.mouseX === left && currentPosition.mouseY === top
          ? currentPosition
          : { mouseX: left, mouseY: top }
      ));
    };

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
    };
  }, [props.position]);

  return (
    <div
      className={styles.noteContextMenu}
      ref={menuRef}
      style={menuStyle}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {props.onTogglePin && (
        <div
          className={styles.noteContextMenuItem}
          onClick={props.onTogglePin}
        >
          {props.isPinned
            ? t("mainWindow.note.contextMenu.unpin")
            : t("mainWindow.note.contextMenu.pin")}
        </div>
      )}
      {props.onTogglePin && !props.onOpenNoteWindow && (
        <Divider className={styles.noteContextMenuDivider} />
      )}
      {props.onOpenNoteWindow && (
        <>
          {props.onTogglePin && (
            <Divider className={styles.noteContextMenuDivider} />
          )}
          <div
            className={styles.noteContextMenuItem}
            onClick={props.onOpenNoteWindow}
          >
            {t("mainWindow.note.contextMenu.openInNewWindow")}
          </div>
          <Divider className={styles.noteContextMenuDivider} />
        </>
      )}
      {props.showMoveActions !== false && (
        <>
          <div
            className={styles.noteContextMenuItem}
            onClick={props.onMoveNoteToTop}
          >
            {t("mainWindow.note.contextMenu.moveToTop")}
          </div>
          <div
            className={styles.noteContextMenuItem}
            onClick={props.onMoveNoteToBottom}
          >
            {t("mainWindow.note.contextMenu.moveToBottom")}
          </div>
          <Divider className={styles.noteContextMenuDivider} />
        </>
      )}
      <div
        className={styles.noteContextMenuItem}
        onClick={props.onDuplicateNote}
      >
        {t("mainWindow.note.contextMenu.duplicate")}
      </div>
      {props.showTitleVisibilityAction !== false && (
        <>
          <div
            className={styles.noteContextMenuItem}
            onClick={props.onToggleTitleVisibility}
          >
            {props.isTitleHidden
              ? t("mainWindow.note.contextMenu.showTitle")
              : t("mainWindow.note.contextMenu.hideTitle")}
          </div>
          <Divider className={styles.noteContextMenuDivider} />
        </>
      )}
      {props.showTitleVisibilityAction === false && (
        <Divider className={styles.noteContextMenuDivider} />
      )}
      <div
        className={styles.noteContextColorRow}
        role="radiogroup"
        aria-label={t("mainWindow.note.contextMenu.noteColorAriaLabel")}
      >
        <div className={styles.noteContextColorStrip} onMouseLeave={() => setHoveredNoteColor(null)}>
          {noteColorKeys.map((colorKey) => {
            const isSelected = props.selectedColor === colorKey;
            const isHovered = hoveredNoteColor === colorKey;

            return (
              <button
                aria-checked={isSelected}
                aria-label={t(`settingsWindow.appearance.noteColors.${colorKey}`)}
                className={styles.noteContextColorButton}
                key={colorKey}
                role="radio"
                title={t(`settingsWindow.appearance.noteColors.${colorKey}`)}
                type="button"
                onClick={() => props.onNoteColorChange(colorKey)}
                onMouseEnter={() => setHoveredNoteColor(colorKey)}
              >
                <span
                  aria-hidden="true"
                  className={styles.noteContextColorSwatch}
                  style={{
                    backgroundColor: NoteColors.light[colorKey],
                    borderColor: isHovered ? appColors.MAIN : "rgba(0, 0, 0, 0.3)",
                    boxShadow: isHovered ? "inset 0 0 0 1px rgba(255, 255, 255, 0.65)" : undefined,
                    transform: isHovered ? "scale(1.24)" : undefined
                  }}
                >
                  {isSelected && (
                    <span
                      className={styles.noteContextColorSelectionDot}
                      style={{ backgroundColor: "#FFFFFF" }}
                    />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className={styles.noteContextMenuLabelItem}>
        {noteContextColorLabel}
      </div>
      <Divider className={styles.noteContextMenuDivider} />
      <div
        className={styles.noteContextMenuItem}
        onClick={props.onDeleteNote}
      >
        {t("mainWindow.note.contextMenu.delete")}
      </div>
    </div>
  );
}

export default NoteContextMenu;
