/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { CssBaseline, IconButton } from "@mui/material";
import { ThemeProvider } from "@mui/system";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Note from "../../components/Note";
import { NoteType } from "../../models/NoteType";
import { AppSettings } from "../../settings/AppSettings";
import { NoteSizePreference } from "../../settings/noteSizePreference";
import { AppTheme } from "../../theme/AppTheme";
import { SystemTheme } from "../../theme/SystemTheme";
import { Formatter } from "../../utils/dt-formatter/Formatter";
import { getNotesWithPinnedNote, getNotesWithUnpinnedNote, isPinnedNote } from "../../utils/notePinning";
import styles from "./NoteWindow.module.css";

type NoteWindowProps = {
  theme: SystemTheme;
  appSettings: AppSettings;
  embedded?: boolean;
  noteId?: string | null;
  onClose?: () => void;
  onOpenNote?: (noteId: string) => void;
};

function NoteWindow(props: NoteWindowProps) {
  const { t } = useTranslation();
  const noteId = props.noteId ?? new URLSearchParams(window.location.search).get("noteId");
  const appTheme = props.theme === SystemTheme.DARK ? AppTheme.DarkTheme : AppTheme.LightTheme;
  const [note, setNote] = useState<NoteType | null>(null);

  useEffect(() => {
    if (!noteId) {
      return;
    }

    window.api.storage.getNotes()
      .then((notes) => {
        setNote(notes.find((note) => note.id === noteId) ?? null);
      })
      .catch((err: Error) => {
        console.error("Unexpected error loading note window:", err.message);
      });
  }, [noteId]);

  useEffect(() => {
    if (!noteId) {
      return;
    }

    return window.api.storage.onNotesChange((event) => {
      switch (event.type) {
        case "setNote":
          if (event.note.id === noteId) {
            setNote({
              ...event.note,
              createdOn: Formatter.toDate(event.note.createdOn),
              lastModifiedOn: Formatter.toDate(event.note.lastModifiedOn),
              pinnedOn: Formatter.toOptionalDate(event.note.pinnedOn)
            });
          }
          break;
        case "deleteNote":
          if (event.noteId === noteId) {
            setNote(null);
          }
          break;
        case "deleteAllNotes":
          setNote(null);
          break;
        case "setNoteOrder":
          break;
      }
    });
  }, [noteId]);

  function handleNoteSave(updatedNote: NoteType) {
    window.api.storage.setNote(updatedNote);
    setNote(updatedNote);
  }

  function handleDeleteNote(noteId: string) {
    window.api.storage.deleteNote(noteId);
    setNote(null);
    props.onClose?.() ?? window.api.appWindow.close();
  }

  function handleDuplicateNote(note: NoteType) {
    const now = new Date();
    const duplicatedNote = {
      ...note,
      id: nanoid(),
      createdOn: now,
      lastModifiedOn: now
    };

    window.api.storage.setNote(duplicatedNote);
    if (props.onOpenNote) {
      props.onOpenNote(duplicatedNote.id);
      return;
    }

    window.api.noteWindow.open(duplicatedNote.id, {
      offsetFromCurrentWindow: true
    });
  }

  function handleToggleNotePin(note: NoteType) {
    window.api.storage.getNotes()
      .then((notes) => {
        const storedNote = notes.find((storedNote) => storedNote.id === note.id) ?? note;
        const nextNotes = isPinnedNote(storedNote)
          ? getNotesWithUnpinnedNote(notes, storedNote, props.appSettings.notesSortOrder)
          : getNotesWithPinnedNote(notes, storedNote);
        const updatedNote = nextNotes.find((nextNote) => nextNote.id === note.id);

        if (!updatedNote) {
          return;
        }

        window.api.storage.setNote(updatedNote);
        window.api.storage.setNoteOrder(nextNotes.map((nextNote) => nextNote.id));
        setNote(updatedNote);
      })
      .catch((err: Error) => {
        console.error("Unexpected error toggling note pin:", err.message);
      });
  }

  return (
    <ThemeProvider theme={appTheme}>
      <div
        className={`${styles.root} ${props.embedded ? styles.embeddedRoot : ""}`}
        style={{ backgroundColor: appTheme.palette.background.default }}
      >
        <CssBaseline />
        {note && (
          <>
            <Note
              theme={props.theme}
              note={note}
              dateFormat={props.appSettings.dateFormat}
              timeFormat={props.appSettings.timeFormat}
              noteFont={props.appSettings.noteFont}
              noteTitleFont={props.appSettings.noteTitleFont}
              noteContentFontSize={props.appSettings.noteContentFontSize}
              noteTitleFontSize={props.appSettings.noteTitleFontSize}
              noteSize={NoteSizePreference.DEFAULT}
              showNoteTitles={props.appSettings.showNoteTitles}
              showNoteFooters={props.appSettings.showNoteFooters}
              handleDeleteNoteButton={handleDeleteNote}
              handleDuplicateNote={handleDuplicateNote}
              handleMoveNoteToBottom={() => {}}
              handleMoveNoteToTop={() => {}}
              handleNoteSave={handleNoteSave}
              handleToggleNotePin={handleToggleNotePin}
              showDragIndicator={false}
              showMoveContextActions={false}
              showOpenNoteWindowContextAction={false}
              showTitleVisibilityContextAction={false}
              showFormatToolbar
              reserveCloseButtonSpace={props.embedded}
              style={{
                width: "100%",
                height: "100%",
                marginBottom: 0
              }}
            />
            {props.embedded && props.onClose && (
              <IconButton
                aria-label={t("common.close")}
                className={styles.closeButton}
                onClick={props.onClose}
                size="small"
              >
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            )}
          </>
        )}
      </div>
    </ThemeProvider>
  );
}

export default NoteWindow;
