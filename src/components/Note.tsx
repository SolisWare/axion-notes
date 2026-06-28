/**
 * Copyright (c) 2023-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { Button, Divider, Paper, Theme, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';
import { useTranslation } from "react-i18next";
import { Formatter } from "../utils/dt-formatter/Formatter";
import NoteTextarea from "./NoteTextarea";
import { getAppColors } from "../theme/AppColors";
import { NoteType } from "../models/NoteType";
import { Autosave } from "react-autosave";
import { SystemTheme } from "../theme/SystemTheme";
import { ChangeEvent, CSSProperties, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AppColorStyleProps } from "../types/appColorTypes";
import { getNoteColor } from "../theme/NoteColors";
import { DateFormat } from "../utils/dt-formatter/DateFormat";
import { TimeFormat } from "../utils/dt-formatter/TimeFormat";

type NoteProps = {
  theme: SystemTheme;
  note: NoteType;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  handleDeleteNoteButton: (noteId: string) => void;
  handleNoteSave: (note: NoteType) => void;
};

type NoteDateLabelProps = {
  className: string;
  text: string;
};

const useStyles = makeStyles<Theme, AppColorStyleProps>((theme: Theme) => ({
  note: {
    width: "275px",
    height: "250px",
    marginBottom: "10px",
  },
  noteInnerContainer: {
    width: "100%",
    height: "100%",
    maxWidth: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between"
  },
  noteContentWrapper: {
    height: "100%",
    padding: "15px 10px 5px 10px",
    wordBreak: "keep-all",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between"
  },
  noteBody: {
    height: "192px",
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
    marginRight: "8px !important",
    minWidth: 0,
    paddingTop: "5px",
    fontStyle: "italic",
    color: ({ appColors }) => appColors.NOTE_FOOTER_TEXT,
    overflow: "hidden",
    textAlign: "left",
    whiteSpace: "nowrap"
  },
  noteFooterUtilBarDeleteBtn: {
    flex: "0 0 auto",
    width: 30,
    height: 30,
  }
}));

function Note(props: NoteProps) {
  const { t } = useTranslation();
  const appColors = getAppColors(props.theme);
  const classes = useStyles({ appColors });
  
  const [note, setNote] = useState<NoteType>(props.note);

  const isDeleting = useRef(false);
  const latestNote = useRef<NoteType>(props.note);
  const hasUnsavedChanges = useRef(false);

  const isDarkTheme = props.theme === SystemTheme.DARK;
  const color = getNoteColor(note.bgcolor, props.theme);
  const noteFooterDateText = `${t("mainWindow.note.lastModified")} ${Formatter.getFormattedDate(note.lastModifiedOn, props.dateFormat)} ${t("mainWindow.note.at")} ${Formatter.getFormattedTimestamp(note.lastModifiedOn, props.timeFormat)}`;

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

  const handleDeleteNote = () => {
    isDeleting.current = true;
    props.handleDeleteNoteButton(note.id);
  };
  
  return (
    <Paper
      elevation={4}
      className={classes.note}
      style={isDarkTheme ? {
        boxShadow: [
          "0px 2px 4px -1px rgba(118, 137, 156, 0.2)",
          "0px 4px 5px 0px rgba(118, 137, 156, 0.14)",
          "0px 1px 10px 0px rgba(118, 137, 156, 0.12)"
        ].join(",")
      } : undefined}
    >
      <div className={classes.noteInnerContainer} style={{backgroundColor: color}}>
        <div className={classes.noteContentWrapper}>
          <div className={classes.noteBody}>
            <div className={classes.noteTitleWrapper}>
              <input
                key={props.theme}
                className={classes.noteTitleInput}
                style={{
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
            <div className={classes.noteContent}>
              <NoteTextarea theme={props.theme} placeholder={t("mainWindow.note.contentPlaceholder")} content={note.content} onChange={handleNoteChange} />
            </div>
            <Autosave data={note} onSave={(note) => {
              if (!isDeleting.current) {
                props.handleNoteSave(note);
                hasUnsavedChanges.current = false;
              }
            }} />
          </div>
          <div className={classes.noteFooter}>
            <Divider />
            <div className={classes.noteFooterUtilBar}>
              <NoteDateLabel className={classes.noteFooterUtilBarDate} text={noteFooterDateText} />
              <Button
                className={classes.noteFooterUtilBarDeleteBtn}
                onClick={handleDeleteNote}
                sx={{
                  color: appColors.NOTE_DELETE_BUTTON_COLOR,
                  "&:hover": {
                    color: appColors.NOTE_DELETE_BUTTON_HOVER_TEXT,
                    backgroundColor: appColors.NOTE_DELETE_BUTTON_HOVER_BACKGROUND
                  }
                }}
              >
                <DeleteForeverOutlinedIcon />
              </Button>
            </div>
          </div>
        </div>
      </div>
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
