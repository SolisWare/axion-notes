/**
 * Copyright (c) 2023-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { Divider, Paper, Theme, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";
import { useTranslation } from "react-i18next";
import { Formatter } from "../utils/dt-formatter/Formatter";
import NoteTextarea from "./NoteTextarea";
import NoteContextMenu, { NoteContextMenuPosition } from "./NoteContextMenu";
import { getAppColors } from "../theme/AppColors";
import { NoteType } from "../models/NoteType";
import { Autosave } from "react-autosave";
import { SystemTheme } from "../theme/SystemTheme";
import { ChangeEvent, CSSProperties, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AppColorStyleProps } from "../types/appColorTypes";
import { getNoteColor, NoteColorKey } from "../theme/NoteColors";
import { getNoteFontFamily, NoteFontPreference } from "../settings/NoteFontPreference";
import { getNoteSizeDefinition, NoteSizePreference } from "../settings/noteSizePreference";
import { DateFormat } from "../utils/dt-formatter/DateFormat";
import { TimeFormat } from "../utils/dt-formatter/TimeFormat";

type NoteProps = {
  theme: SystemTheme;
  note: NoteType;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  noteFont: NoteFontPreference;
  noteSize: NoteSizePreference;
  showNoteTitles: boolean;
  showNoteFooters: boolean;
  handleDeleteNoteButton: (noteId: string) => void;
  handleDuplicateNote: (note: NoteType) => void;
  handleOpenNoteWindow?: (noteId: string) => void;
  handleMoveNoteToBottom: (noteId: string) => void;
  handleMoveNoteToTop: (noteId: string) => void;
  handleNoteSave: (note: NoteType) => void;
  style?: CSSProperties;
};

type NoteDateLabelProps = {
  className: string;
  text: string;
};

const useStyles = makeStyles<Theme, AppColorStyleProps>((theme: Theme) => ({
  note: {
    marginBottom: "10px"
  },
  noteInnerContainer: {
    width: "100%",
    height: "100%",
    maxWidth: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between"
  },
  noteDragIndicatorRow: {
    flex: "0 0 auto",
    height: 15,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingTop: 7,
    boxSizing: "border-box",
    cursor: "grab",
    "&:active": {
      cursor: "grabbing"
    }
  },
  noteDragIndicator: {
    width: 34,
    height: 3,
    borderRadius: 999
  },
  noteContentWrapper: {
    flex: "1 1 auto",
    minHeight: 0,
    padding: "0 10px 5px 10px",
    wordBreak: "keep-all",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between"
  },
  noteBody: {
    flex: "1 1 auto",
    minHeight: 0,
    display: "flex",
    flexDirection: "column"
  },
  noteTitleWrapper: {
    flex: "0 0 auto",
    marginBottom: "4px",
    padding: "0 2px"
  },
  noteTitleInput: {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    WebkitAppearance: "none",
    appearance: "none",
    background: "transparent",
    border: "none",
    borderRadius: 0,
    outline: "none",
    padding: 0,
    fontSize: 17,
    fontWeight: 700,
    lineHeight: "22px",
    color: ({ appColors }) => appColors.NOTE_TEXT + " !important",
    caretColor: ({ appColors }) => appColors.NOTE_TEXT,
    WebkitTextFillColor: ({ appColors }) => appColors.NOTE_TEXT + " !important",
    '&::placeholder': {
      color: ({ appColors }) => appColors.NOTE_PLACEHOLDER_TEXT,
      WebkitTextFillColor: ({ appColors }) => appColors.NOTE_PLACEHOLDER_TEXT,
      opacity: 1
    }
  },
  noteTitleUnderline: {
    height: 1,
    marginTop: 4,
    width: "100%"
  },
  noteContent: {
    paddingLeft: "2px",
    paddingRight: "2px",
    flex: "1 1 auto",
    minHeight: 0
  },
  noteFooter: {
    
  },
  noteFooterUtilBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "4px",
    padding: "0 3px"
  },
  noteFooterUtilBarDate: {
    flex: "1 1 auto",
    minWidth: 0,
    paddingTop: "5px",
    fontStyle: "italic",
    color: ({ appColors }) => appColors.NOTE_FOOTER_TEXT,
    overflow: "hidden",
    textAlign: "left",
    whiteSpace: "nowrap"
  }
}));

function Note(props: NoteProps) {
  const { t } = useTranslation();
  const appColors = getAppColors(props.theme);
  const classes = useStyles({ appColors });
  
  const [note, setNote] = useState<NoteType>(props.note);
  const [noteContextMenuPosition, setNoteContextMenuPosition] = useState<NoteContextMenuPosition | null>(null);
  const [isNoteHovered, setIsNoteHovered] = useState(false);

  const isDeleting = useRef(false);
  const latestNote = useRef<NoteType>(props.note);
  const hasUnsavedChanges = useRef(false);

  const isDarkTheme = props.theme === SystemTheme.DARK;
  const color = getNoteColor(note.bgcolor, props.theme);
  const noteFontFamily = getNoteFontFamily(props.noteFont);
  const noteSizeDefinition = getNoteSizeDefinition(props.noteSize);
  const isTitleHidden = note.isTitleHidden ?? !props.showNoteTitles;
  const noteFooterModifiedLabel = props.noteSize === NoteSizePreference.COMPACT ? t("mainWindow.note.lastModifiedCompact") : t("mainWindow.note.lastModified");
  const noteFooterDateText = `${noteFooterModifiedLabel} ${Formatter.getFormattedDate(note.lastModifiedOn, props.dateFormat)} ${t("mainWindow.note.at")} ${Formatter.getFormattedTimestamp(note.lastModifiedOn, props.timeFormat)}`;

  const updateNote = (updatedNote: NoteType) => {
    latestNote.current = updatedNote;
    hasUnsavedChanges.current = true;
    setNote(updatedNote);
  };

  const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateNote({
      ...note,
      title: event.target.value,
      lastModifiedOn: new Date()
    });
  };
  
  const handleNoteChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const updatedContent = event.target.value;
    updateNote({
      ...note,
      content: updatedContent,
      lastModifiedOn: new Date()
    });
  };

  useEffect(() => {
    setNote((currentNote) => {
      if (currentNote.isTitleHidden === props.note.isTitleHidden) {
        return currentNote;
      }

      const updatedNote = {
        ...currentNote,
        isTitleHidden: props.note.isTitleHidden
      };

      latestNote.current = updatedNote;

      return updatedNote;
    });
  }, [props.note.isTitleHidden]);

  useEffect(() => {
    const flushUnsavedNote = () => {
      if (!isDeleting.current && hasUnsavedChanges.current) {
        props.handleNoteSave(latestNote.current);
        hasUnsavedChanges.current = false;
      }
    };

    window.addEventListener("beforeunload", flushUnsavedNote);

    return () => {
      window.removeEventListener("beforeunload", flushUnsavedNote);
      flushUnsavedNote();
    };
  }, [props]);

  const handleNoteContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    setNoteContextMenuPosition({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6
    });
  };

  const handleCloseNoteContextMenu = () => {
    setNoteContextMenuPosition(null);
  };

  const handleContextMenuDuplicateNote = () => {
    handleCloseNoteContextMenu();
    props.handleDuplicateNote(latestNote.current);
  };

  const handleContextMenuOpenNoteWindow = props.handleOpenNoteWindow
    ? () => {
      handleCloseNoteContextMenu();

      if (hasUnsavedChanges.current) {
        props.handleNoteSave(latestNote.current);
        hasUnsavedChanges.current = false;
      }

      props.handleOpenNoteWindow?.(note.id);
    }
    : undefined;

  const handleContextMenuMoveNoteToTop = () => {
    handleCloseNoteContextMenu();
    props.handleMoveNoteToTop(note.id);
  };

  const handleContextMenuMoveNoteToBottom = () => {
    handleCloseNoteContextMenu();
    props.handleMoveNoteToBottom(note.id);
  };

  const handleContextMenuDeleteNote = () => {
    handleCloseNoteContextMenu();
    isDeleting.current = true;
    props.handleDeleteNoteButton(note.id);
  };

  const handleContextMenuNoteColorChange = (colorKey: NoteColorKey) => {
    handleCloseNoteContextMenu();

    if (note.bgcolor === colorKey) {
      return;
    }

    const updatedNote = {
      ...note,
      bgcolor: colorKey
    };

    latestNote.current = updatedNote;
    hasUnsavedChanges.current = false;
    setNote(updatedNote);
    props.handleNoteSave(updatedNote);
  };

  const handleContextMenuToggleTitleVisibility = () => {
    handleCloseNoteContextMenu();

    const updatedNote = {
      ...latestNote.current,
      isTitleHidden: !isTitleHidden
    };

    latestNote.current = updatedNote;
    hasUnsavedChanges.current = false;
    setNote(updatedNote);
    props.handleNoteSave(updatedNote);
  };

  useEffect(() => {
    if (noteContextMenuPosition === null) {
      return;
    }

    const handleDocumentPointerDown = () => handleCloseNoteContextMenu();
    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCloseNoteContextMenu();
      }
    };

    document.addEventListener("pointerdown", handleDocumentPointerDown);
    document.addEventListener("keydown", handleDocumentKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointerDown);
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [noteContextMenuPosition]);
  
  return (
    <Paper
      elevation={4}
      className={classes.note}
      onContextMenu={handleNoteContextMenu}
      onMouseEnter={() => setIsNoteHovered(true)}
      onMouseLeave={() => setIsNoteHovered(false)}
      style={{
        width: noteSizeDefinition.width,
        height: noteSizeDefinition.height,
        ...(isDarkTheme ? {
          boxShadow: [
            "0px 2px 4px -1px rgba(118, 137, 156, 0.2)",
            "0px 4px 5px 0px rgba(118, 137, 156, 0.14)",
            "0px 1px 10px 0px rgba(118, 137, 156, 0.12)"
          ].join(",")
        } : {}),
        ...props.style
      }}
    >
      <div className={classes.noteInnerContainer} style={{backgroundColor: color}}>
        <div className={classes.noteDragIndicatorRow} aria-hidden="true">
          <div
            className={classes.noteDragIndicator}
            style={{
              backgroundColor: appColors.NOTE_FOOTER_TEXT,
              opacity: isNoteHovered ? 0.24 : 0,
              transition: "opacity 120ms ease"
            }}
          />
        </div>
        <div className={classes.noteContentWrapper}>
          <div className={classes.noteBody}>
            {!isTitleHidden && (
              <div className={classes.noteTitleWrapper}>
                <input
                  key={props.theme}
                  className={classes.noteTitleInput}
                  style={{
                    fontFamily: noteFontFamily,
                    color: appColors.NOTE_TEXT,
                    caretColor: appColors.NOTE_TEXT,
                    WebkitTextFillColor: note.title ? appColors.NOTE_TEXT : appColors.NOTE_PLACEHOLDER_TEXT
                  }}
                  value={note.title ?? ""}
                  placeholder={t("mainWindow.note.titlePlaceholder")}
                  onChange={handleTitleChange}
                />
                <div
                  className={classes.noteTitleUnderline}
                  style={{ backgroundColor: appColors.NOTE_TITLE_UNDERLINE }}
                />
              </div>
            )}
            <div className={classes.noteContent}>
              <NoteTextarea theme={props.theme} fontFamily={noteFontFamily} placeholder={t("mainWindow.note.contentPlaceholder")} content={note.content} onChange={handleNoteChange} />
            </div>
            <Autosave data={note} onSave={(note) => {
              if (!isDeleting.current) {
                props.handleNoteSave(note);
                hasUnsavedChanges.current = false;
              }
            }} />
          </div>
          {props.showNoteFooters && (
            <div className={classes.noteFooter}>
              <Divider />
              <div className={classes.noteFooterUtilBar}>
                <NoteDateLabel className={classes.noteFooterUtilBarDate} text={noteFooterDateText} />
              </div>
            </div>
          )}
        </div>
      </div>
      {noteContextMenuPosition !== null && (
        <NoteContextMenu
          theme={props.theme}
          position={noteContextMenuPosition}
          selectedColor={note.bgcolor}
          isTitleHidden={isTitleHidden}
          onDeleteNote={handleContextMenuDeleteNote}
          onDuplicateNote={handleContextMenuDuplicateNote}
          onOpenNoteWindow={handleContextMenuOpenNoteWindow}
          onMoveNoteToBottom={handleContextMenuMoveNoteToBottom}
          onMoveNoteToTop={handleContextMenuMoveNoteToTop}
          onNoteColorChange={handleContextMenuNoteColorChange}
          onToggleTitleVisibility={handleContextMenuToggleTitleVisibility}
        />
      )}
    </Paper>
  );
}

function NoteDateLabel(props: NoteDateLabelProps) {
  const NOTE_FOOTER_MIN_FONT_SIZE = 10;
  
  const textRef = useRef<HTMLElement | null>(null);
  const [fontSize, setFontSize] = useState<number | undefined>();

  useLayoutEffect(() => {
    const element = textRef.current;

    if (!element) {
      return;
    }

    const measure = () => {
      const previousFontSize = element.style.fontSize;
      element.style.fontSize = "";

      const baseFontSize = parseFloat(window.getComputedStyle(element).fontSize);
      const nextFontSize = element.scrollWidth > element.clientWidth && element.clientWidth > 0
        ? Math.max(
            NOTE_FOOTER_MIN_FONT_SIZE,
            Math.floor((baseFontSize * element.clientWidth / element.scrollWidth) * 10) / 10
          )
        : undefined;

      element.style.fontSize = previousFontSize;
      setFontSize((currentFontSize) => currentFontSize === nextFontSize ? currentFontSize : nextFontSize);
    };

    measure();

    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : undefined;
    resizeObserver?.observe(element);
    window.addEventListener("resize", measure);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [props.text]);

  const style: CSSProperties | undefined = fontSize ? { fontSize } : undefined;

  return (
    <Typography
      className={props.className}
      ref={(element) => {
        textRef.current = element;
      }}
      style={style}
      variant="body2"
    >
      {props.text}
    </Typography>
  );
}

export default Note;
