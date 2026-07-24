/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { Divider } from "@mui/material";
import { CSSProperties, PointerEvent, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { RichTextFormatAction, RichTextFormatCommand } from "../models/RichTextFormatCommand";
import { RichTextFormatState } from "../models/RichTextFormatState";
import { NOTE_FONT_CATEGORIES, NOTE_FONT_OPTIONS, NoteFontPreference } from "../settings/NoteFontPreference";
import { DEFAULT_NOTE_CONTENT_FONT_SIZE, NOTE_CONTENT_FONT_SIZE_OPTIONS } from "../settings/NoteFontSize";
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
  isSelectionMode?: boolean;
  isSelected?: boolean;
  isFolded?: boolean;
  onDeleteNote: () => void;
  onDuplicateNote: () => void;
  onOpenNoteWindow?: () => void;
  onTogglePin?: () => void;
  onSelectNote?: () => void;
  onToggleFold?: () => void;
  onFormatAction?: (command: RichTextFormatAction) => void;
  formatState?: RichTextFormatState;
  onMoveNoteToBottom: () => void;
  onMoveNoteToTop: () => void;
  onNoteColorChange: (colorKey: NoteColorKey) => void;
  onToggleTitleVisibility: () => void;
  showMoveActions?: boolean;
  showFormatActions?: boolean;
  showTitleVisibilityAction?: boolean;
};

const MENU_VIEWPORT_MARGIN = 8;
const SUBMENU_AIM_DELAY_MS = 320;

type SubmenuId = "format" | "fontSize" | "font";

type PointerPosition = {
  x: number;
  y: number;
};

type SubmenuPointerPath = {
  previous: PointerPosition;
  current: PointerPosition;
};

type SubmenuAim = {
  menuItemRect: DOMRect;
  submenuRect: DOMRect;
  opensLeft: boolean;
};

function updateSubmenuDirection(event: PointerEvent<HTMLDivElement>): SubmenuAim | null {
  const menuItem = event.currentTarget;
  const submenu = menuItem.querySelector(`:scope > .${styles.noteContextMenuSubmenu}`) as HTMLDivElement | null;

  if (!submenu) {
    return null;
  }

  const menuItemRect = menuItem.getBoundingClientRect();
  const previousDisplay = submenu.style.display;
  const previousPointerEvents = submenu.style.pointerEvents;
  const previousVisibility = submenu.style.visibility;

  submenu.style.display = "block";
  submenu.style.pointerEvents = "none";
  submenu.style.visibility = "hidden";

  const submenuRect = submenu.getBoundingClientRect();
  const shouldOpenLeft = menuItemRect.right + submenuRect.width + MENU_VIEWPORT_MARGIN > window.innerWidth
    && menuItemRect.left - submenuRect.width >= MENU_VIEWPORT_MARGIN;
  const shouldOpenUp = menuItemRect.top + submenuRect.height + MENU_VIEWPORT_MARGIN > window.innerHeight
    && menuItemRect.bottom - submenuRect.height >= MENU_VIEWPORT_MARGIN;

  submenu.dataset.openLeft = shouldOpenLeft ? "true" : "false";
  submenu.dataset.openUp = shouldOpenUp ? "true" : "false";
  menuItem.dataset.submenuOpensLeft = shouldOpenLeft ? "true" : "false";

  const positionedSubmenuRect = submenu.getBoundingClientRect();

  submenu.style.display = previousDisplay;
  submenu.style.pointerEvents = previousPointerEvents;
  submenu.style.visibility = previousVisibility;

  return {
    menuItemRect,
    submenuRect: positionedSubmenuRect,
    opensLeft: shouldOpenLeft
  };
}

function getTriangleArea(a: PointerPosition, b: PointerPosition, c: PointerPosition) {
  return Math.abs((a.x * (b.y - c.y)) + (b.x * (c.y - a.y)) + (c.x * (a.y - b.y))) / 2;
}

function isPointInTriangle(point: PointerPosition, a: PointerPosition, b: PointerPosition, c: PointerPosition) {
  const totalArea = getTriangleArea(a, b, c);
  const area1 = getTriangleArea(point, b, c);
  const area2 = getTriangleArea(a, point, c);
  const area3 = getTriangleArea(a, b, point);

  return Math.abs(totalArea - (area1 + area2 + area3)) < 0.5;
}

function isPointerMovingTowardSubmenu(path: SubmenuPointerPath, aim: SubmenuAim) {
  const submenuEdgeX = aim.opensLeft ? aim.submenuRect.right : aim.submenuRect.left;
  const isMovingHorizontallyTowardSubmenu = aim.opensLeft
    ? path.current.x < path.previous.x
    : path.current.x > path.previous.x;

  if (!isMovingHorizontallyTowardSubmenu) {
    return false;
  }

  return isPointInTriangle(
    path.current,
    path.previous,
    {
      x: submenuEdgeX,
      y: aim.submenuRect.top - 12
    },
    {
      x: submenuEdgeX,
      y: aim.submenuRect.bottom + 12
    }
  );
}

function NoteContextMenu(props: NoteContextMenuProps) {
  const { t } = useTranslation();
  const appColors = getAppColors(props.theme);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const submenuCloseTimersRef = useRef<Partial<Record<SubmenuId, number>>>({});
  const submenuAimsRef = useRef<Partial<Record<SubmenuId, SubmenuAim>>>({});
  const pointerPathRef = useRef<SubmenuPointerPath>({
    previous: { x: props.position.mouseX, y: props.position.mouseY },
    current: { x: props.position.mouseX, y: props.position.mouseY }
  });

  const [hoveredNoteColor, setHoveredNoteColor] = useState<NoteColorKey | null>(null);
  const [menuPosition, setMenuPosition] = useState(props.position);
  const [shouldOpenSubmenuLeft, setShouldOpenSubmenuLeft] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<SubmenuId[]>([]);
  const [isSubmenuAimActive, setIsSubmenuAimActive] = useState(false);

  const noteColorKeys = Object.values(NoteColorKey);
  const isFormattingEnabled = props.formatState?.canFormat === true && props.onFormatAction !== undefined;
  const activeFontSize = props.formatState?.activeFontSize ?? DEFAULT_NOTE_CONTENT_FONT_SIZE;
  const activeFont = props.formatState?.activeFont ?? NoteFontPreference.SYSTEM;
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
    "--note-context-menu-background": appColors.DIALOG_BACKGROUND,
    "--note-context-menu-text": appColors.DIALOG_TEXT,
    "--note-context-menu-label-text": appColors.DIALOG_TEXT
  } as CSSProperties;

  const openSubmenu = (submenuId: SubmenuId, event: PointerEvent<HTMLDivElement>) => {
    const closeTimer = submenuCloseTimersRef.current[submenuId];

    if (closeTimer !== undefined) {
      window.clearTimeout(closeTimer);
      delete submenuCloseTimersRef.current[submenuId];
    }

    if (submenuId === "fontSize" || submenuId === "font") {
      const formatCloseTimer = submenuCloseTimersRef.current.format;

      if (formatCloseTimer !== undefined) {
        window.clearTimeout(formatCloseTimer);
        delete submenuCloseTimersRef.current.format;
      }
    }

    const submenuAim = updateSubmenuDirection(event);

    if (submenuAim) {
      submenuAimsRef.current[submenuId] = submenuAim;
    }

    setIsSubmenuAimActive(false);
    setOpenSubmenus((currentOpenSubmenus) => {
      const nextOpenSubmenus = currentOpenSubmenus.filter((openSubmenuId) => (
        submenuId === "fontSize" || submenuId === "font"
          ? openSubmenuId !== (submenuId === "fontSize" ? "font" : "fontSize")
          : true
      ));

      return nextOpenSubmenus.includes(submenuId)
        ? nextOpenSubmenus
        : [...nextOpenSubmenus, submenuId];
    });
  };

  const closeSubmenu = (submenuId: SubmenuId) => {
    const closeTimer = submenuCloseTimersRef.current[submenuId];

    if (closeTimer !== undefined) {
      window.clearTimeout(closeTimer);
    }

    submenuCloseTimersRef.current[submenuId] = window.setTimeout(() => {
      setIsSubmenuAimActive(false);
      setOpenSubmenus((currentOpenSubmenus) => currentOpenSubmenus.filter((openSubmenuId) => (
        submenuId === "format"
          ? false
          : openSubmenuId !== submenuId
      )));
      delete submenuCloseTimersRef.current[submenuId];
    }, SUBMENU_AIM_DELAY_MS);
  };

  const closeSubmenusWithAim = (...submenuIds: SubmenuId[]) => {
    const submenusToDelay = submenuIds.filter((submenuId) => {
      const submenuAim = submenuAimsRef.current[submenuId];

      return submenuAim !== undefined && isPointerMovingTowardSubmenu(pointerPathRef.current, submenuAim);
    });
    const submenusToCloseImmediately = submenuIds.filter((submenuId) => !submenusToDelay.includes(submenuId));

    if (submenusToCloseImmediately.length > 0) {
      submenusToCloseImmediately.forEach((submenuId) => {
        const closeTimer = submenuCloseTimersRef.current[submenuId];

        if (closeTimer !== undefined) {
          window.clearTimeout(closeTimer);
          delete submenuCloseTimersRef.current[submenuId];
        }
      });

      setOpenSubmenus((currentOpenSubmenus) => currentOpenSubmenus.filter((openSubmenuId) => (
        !submenusToCloseImmediately.includes(openSubmenuId)
      )));
    }

    if (submenusToDelay.length === 0) {
      setIsSubmenuAimActive(false);
      return;
    }

    setIsSubmenuAimActive(true);
    submenusToDelay.forEach(closeSubmenu);
  };

  const closeAllSubmenusWithAim = () => {
    closeSubmenusWithAim("format", "fontSize", "font");
  };

  const closeChildSubmenusWithAim = () => {
    closeSubmenusWithAim("fontSize", "font");
  };

  const openChildSubmenu = (submenuId: "fontSize" | "font", event: PointerEvent<HTMLDivElement>) => {
    const otherSubmenuId = submenuId === "fontSize" ? "font" : "fontSize";
    const otherSubmenuAim = submenuAimsRef.current[otherSubmenuId];

    if (
      openSubmenus.includes(otherSubmenuId)
      && otherSubmenuAim !== undefined
      && isPointerMovingTowardSubmenu(pointerPathRef.current, otherSubmenuAim)
    ) {
      setIsSubmenuAimActive(true);
      closeSubmenu(otherSubmenuId);
      return;
    }

    openSubmenu(submenuId, event);
  };

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

      setShouldOpenSubmenuLeft(left + (menuRect.width * 2) + MENU_VIEWPORT_MARGIN > window.innerWidth);
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

  useLayoutEffect(() => {
    const submenuCloseTimers = submenuCloseTimersRef.current;

    return () => {
      Object.values(submenuCloseTimers).forEach((closeTimer) => {
        if (closeTimer !== undefined) {
          window.clearTimeout(closeTimer);
        }
      });
    };
  }, []);

  return (
    <div
      className={styles.noteContextMenu}
      data-note-context-menu="true"
      data-submenu-aim-active={isSubmenuAimActive}
      ref={menuRef}
      style={menuStyle}
      onContextMenu={(event) => event.preventDefault()}
      onMouseDown={(event) => event.preventDefault()}
      onPointerMove={(event) => {
        pointerPathRef.current = {
          previous: pointerPathRef.current.current,
          current: {
            x: event.clientX,
            y: event.clientY
          }
        };
      }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {props.onTogglePin && (
        <div
          className={styles.noteContextMenuItem}
          onClick={props.onTogglePin}
          onPointerEnter={closeAllSubmenusWithAim}
        >
          {props.isPinned
            ? t("mainWindow.note.contextMenu.unpin")
            : t("mainWindow.note.contextMenu.pin")}
        </div>
      )}
      {props.onSelectNote && (
        <div
          className={styles.noteContextMenuItem}
          onClick={props.onSelectNote}
          onPointerEnter={closeAllSubmenusWithAim}
        >
          {props.isSelectionMode && props.isSelected
            ? t("mainWindow.note.deselect")
            : t("mainWindow.note.select")}
        </div>
      )}
      {(props.onTogglePin || props.onSelectNote) && !props.onOpenNoteWindow && (
        <Divider className={styles.noteContextMenuDivider} />
      )}
      {props.onOpenNoteWindow && (
        <>
          {(props.onTogglePin || props.onSelectNote) && (
            <Divider className={styles.noteContextMenuDivider} />
          )}
          <div
            className={styles.noteContextMenuItem}
            onClick={props.onOpenNoteWindow}
            onPointerEnter={closeAllSubmenusWithAim}
          >
            {t("mainWindow.note.contextMenu.openInNewWindow")}
          </div>
          {props.onToggleFold && (
            <div
              className={styles.noteContextMenuItem}
              onClick={props.onToggleFold}
              onPointerEnter={closeAllSubmenusWithAim}
            >
              {props.isFolded
                ? t("mainWindow.note.unfold")
                : t("mainWindow.note.fold")}
            </div>
          )}
          <Divider className={styles.noteContextMenuDivider} />
        </>
      )}
      {!props.onOpenNoteWindow && props.onToggleFold && (
        <>
          <div
            className={styles.noteContextMenuItem}
            onClick={props.onToggleFold}
            onPointerEnter={closeAllSubmenusWithAim}
          >
            {props.isFolded
              ? t("mainWindow.note.unfold")
              : t("mainWindow.note.fold")}
          </div>
          <Divider className={styles.noteContextMenuDivider} />
        </>
      )}
      {props.showMoveActions !== false && (
        <>
          <div
            className={styles.noteContextMenuItem}
            onClick={props.onMoveNoteToTop}
            onPointerEnter={closeAllSubmenusWithAim}
          >
            {t("mainWindow.note.contextMenu.moveToTop")}
          </div>
          <div
            className={styles.noteContextMenuItem}
            onClick={props.onMoveNoteToBottom}
            onPointerEnter={closeAllSubmenusWithAim}
          >
            {t("mainWindow.note.contextMenu.moveToBottom")}
          </div>
          <Divider className={styles.noteContextMenuDivider} />
        </>
      )}
      {props.showFormatActions !== false && (
        <div
          className={`${styles.noteContextMenuItem} ${!isFormattingEnabled ? styles.noteContextMenuItemDisabled : ""}`}
          data-submenu-open={openSubmenus.includes("format")}
          onPointerEnter={(event) => openSubmenu("format", event)}
          onPointerLeave={() => closeSubmenu("format")}
        >
          <span className={styles.noteContextMenuItemText}>
            {t("electron.menu.format")}
          </span>
          <span className={styles.noteContextMenuSubmenuArrow} aria-hidden="true">›</span>
          {isFormattingEnabled && (
            <div
              className={styles.noteContextMenuSubmenu}
              data-open-left={shouldOpenSubmenuLeft}
              data-open-up="false"
              onPointerEnter={(event) => openSubmenu("format", event)}
              onPointerLeave={() => closeSubmenu("format")}
            >
              <div
                className={`${styles.noteContextMenuItem} ${props.formatState?.isBoldActive ? styles.noteContextMenuItemActive : ""}`}
                onClick={() => props.onFormatAction?.(RichTextFormatCommand.BOLD)}
                onPointerEnter={closeChildSubmenusWithAim}
              >
                {t("electron.menu.bold")}
              </div>
              <div
                className={`${styles.noteContextMenuItem} ${props.formatState?.isItalicActive ? styles.noteContextMenuItemActive : ""}`}
                onClick={() => props.onFormatAction?.(RichTextFormatCommand.ITALIC)}
                onPointerEnter={closeChildSubmenusWithAim}
              >
                {t("electron.menu.italic")}
              </div>
              <div
                className={`${styles.noteContextMenuItem} ${props.formatState?.isUnderlineActive ? styles.noteContextMenuItemActive : ""}`}
                onClick={() => props.onFormatAction?.(RichTextFormatCommand.UNDERLINE)}
                onPointerEnter={closeChildSubmenusWithAim}
              >
                {t("electron.menu.underline")}
              </div>
              <div
                className={`${styles.noteContextMenuItem} ${props.formatState?.isStrikethroughActive ? styles.noteContextMenuItemActive : ""}`}
                onClick={() => props.onFormatAction?.(RichTextFormatCommand.STRIKETHROUGH)}
                onPointerEnter={closeChildSubmenusWithAim}
              >
                {t("electron.menu.strikethrough")}
              </div>
              <div
                className={`${styles.noteContextMenuItem} ${props.formatState?.isHighlightActive ? styles.noteContextMenuItemActive : ""}`}
                onClick={() => props.onFormatAction?.(RichTextFormatCommand.HIGHLIGHT)}
                onPointerEnter={closeChildSubmenusWithAim}
              >
                {t("electron.menu.highlight")}
              </div>
              <div
                className={`${styles.noteContextMenuItem} ${props.formatState?.isInlineCodeActive ? styles.noteContextMenuItemActive : ""}`}
                onClick={() => props.onFormatAction?.(RichTextFormatCommand.INLINE_CODE)}
                onPointerEnter={closeChildSubmenusWithAim}
              >
                {t("electron.menu.inlineCode")}
              </div>
              <Divider className={styles.noteContextMenuDivider} />
              <div
                className={`${styles.noteContextMenuItem} ${props.formatState?.isSuperscriptActive ? styles.noteContextMenuItemActive : ""}`}
                onClick={() => props.onFormatAction?.(RichTextFormatCommand.SUPERSCRIPT)}
                onPointerEnter={closeChildSubmenusWithAim}
              >
                {t("electron.menu.superscript")}
              </div>
              <div
                className={`${styles.noteContextMenuItem} ${props.formatState?.isSubscriptActive ? styles.noteContextMenuItemActive : ""}`}
                onClick={() => props.onFormatAction?.(RichTextFormatCommand.SUBSCRIPT)}
                onPointerEnter={closeChildSubmenusWithAim}
              >
                {t("electron.menu.subscript")}
              </div>
              <Divider className={styles.noteContextMenuDivider} />
              <div
                className={`${styles.noteContextMenuItem} ${props.formatState?.isBulletListActive ? styles.noteContextMenuItemActive : ""}`}
                onClick={() => props.onFormatAction?.(RichTextFormatCommand.BULLET_LIST)}
                onPointerEnter={closeChildSubmenusWithAim}
              >
                {t("electron.menu.bulletList")}
              </div>
              <div
                className={`${styles.noteContextMenuItem} ${props.formatState?.isDashedListActive ? styles.noteContextMenuItemActive : ""}`}
                onClick={() => props.onFormatAction?.(RichTextFormatCommand.DASHED_LIST)}
                onPointerEnter={closeChildSubmenusWithAim}
              >
                {t("electron.menu.dashedList")}
              </div>
              <div
                className={`${styles.noteContextMenuItem} ${props.formatState?.isNumberedListActive ? styles.noteContextMenuItemActive : ""}`}
                onClick={() => props.onFormatAction?.(RichTextFormatCommand.NUMBERED_LIST)}
                onPointerEnter={closeChildSubmenusWithAim}
              >
                {t("electron.menu.numberedList")}
              </div>
              <div
                className={`${styles.noteContextMenuItem} ${props.formatState?.isChecklistActive ? styles.noteContextMenuItemActive : ""}`}
                onClick={() => props.onFormatAction?.(RichTextFormatCommand.CHECKLIST)}
                onPointerEnter={closeChildSubmenusWithAim}
              >
                {t("electron.menu.checklist")}
              </div>
              <Divider className={styles.noteContextMenuDivider} />
              <div
                className={styles.noteContextMenuItem}
                data-submenu-open={openSubmenus.includes("fontSize")}
                onPointerEnter={(event) => openChildSubmenu("fontSize", event)}
              >
                <span className={styles.noteContextMenuItemText}>
                  {t("electron.menu.fontSize")}
                </span>
                <span className={styles.noteContextMenuSubmenuArrow} aria-hidden="true">›</span>
                <div
                  className={`${styles.noteContextMenuSubmenu} ${styles.noteContextMenuFontSizeSubmenu}`}
                  data-open-left="false"
                  data-open-up="false"
                  onPointerEnter={(event) => openSubmenu("fontSize", event)}
                >
                  {NOTE_CONTENT_FONT_SIZE_OPTIONS.map((fontSize) => (
                    <div
                      className={`${styles.noteContextMenuItem} ${activeFontSize === fontSize ? styles.noteContextMenuItemActive : ""}`}
                      key={fontSize}
                      onClick={() => props.onFormatAction?.({
                        command: RichTextFormatCommand.FONT_SIZE,
                        fontSize
                      })}
                    >
                      {fontSize}
                    </div>
                  ))}
                </div>
              </div>
              <div
                className={styles.noteContextMenuItem}
                data-submenu-open={openSubmenus.includes("font")}
                onPointerEnter={(event) => openChildSubmenu("font", event)}
              >
                <span className={styles.noteContextMenuItemText}>
                  {t("electron.menu.font")}
                </span>
                <span className={styles.noteContextMenuSubmenuArrow} aria-hidden="true">›</span>
                <div
                  className={styles.noteContextMenuSubmenu}
                  data-open-left="false"
                  data-open-up="false"
                  onPointerEnter={(event) => openSubmenu("font", event)}
                >
                  {NOTE_FONT_CATEGORIES.map((fontCategory) => (
                    <div className={styles.noteContextMenuFontCategory} key={fontCategory}>
                      <div className={styles.noteContextMenuLabelItem}>
                        {t(`settingsWindow.editor.noteFontCategories.${fontCategory}`)}
                      </div>
                      {NOTE_FONT_OPTIONS
                        .filter((fontOption) => fontOption.category === fontCategory)
                        .map((fontOption) => (
                          <div
                            className={`${styles.noteContextMenuItem} ${activeFont === fontOption.value ? styles.noteContextMenuItemActive : ""}`}
                            key={fontOption.value}
                            onClick={() => props.onFormatAction?.({
                              command: RichTextFormatCommand.FONT_FAMILY,
                              noteFont: fontOption.value
                            })}
                          >
                            {t(fontOption.labelKey)}
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
              </div>
              <Divider className={styles.noteContextMenuDivider} />
              <div
                className={styles.noteContextMenuItem}
                onClick={() => props.onFormatAction?.(RichTextFormatCommand.CLEAR_FORMATTING)}
                onPointerEnter={closeChildSubmenusWithAim}
              >
                {t("electron.menu.clearFormatting")}
              </div>
            </div>
          )}
        </div>
      )}
      <div
        className={styles.noteContextMenuItem}
        onClick={props.onDuplicateNote}
        onPointerEnter={closeAllSubmenusWithAim}
      >
        {t("mainWindow.note.contextMenu.duplicate")}
      </div>
      {props.showTitleVisibilityAction !== false && (
        <>
          <div
            className={styles.noteContextMenuItem}
            onClick={props.onToggleTitleVisibility}
            onPointerEnter={closeAllSubmenusWithAim}
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
        onPointerEnter={closeAllSubmenusWithAim}
      >
        {t("mainWindow.note.contextMenu.delete")}
      </div>
    </div>
  );
}

export default NoteContextMenu;
