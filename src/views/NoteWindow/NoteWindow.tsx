/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/system";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import Note from "../../components/Note";
import { NoteType } from "../../models/NoteType";
import { AppSettings } from "../../settings/AppSettings";
import { NoteSizePreference } from "../../settings/noteSizePreference";
import { AppTheme } from "../../theme/AppTheme";
import { SystemTheme } from "../../theme/SystemTheme";
import { Formatter } from "../../utils/dt-formatter/Formatter";
import styles from "./NoteWindow.module.css";

type NoteWindowProps = {
  theme: SystemTheme;
  appSettings: AppSettings;
};

function NoteWindow(props: NoteWindowProps) {
  const noteId = new URLSearchParams(window.location.search).get("noteId");
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
              lastModifiedOn: Formatter.toDate(event.note.lastModifiedOn)
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
    window.api.appWindow.close();
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
    window.api.noteWindow.open(duplicatedNote.id, {
      offsetFromCurrentWindow: true
    });
  }

  return (
    <ThemeProvider theme={appTheme}>
      <div className={styles.root} style={{ backgroundColor: appTheme.palette.background.default }}>
        <CssBaseline />
        {note && (
          <Note
            theme={props.theme}
            note={note}
            dateFormat={props.appSettings.dateFormat}
            timeFormat={props.appSettings.timeFormat}
            noteFont={props.appSettings.noteFont}
            noteSize={NoteSizePreference.DEFAULT}
            showNoteTitles={props.appSettings.showNoteTitles}
            showNoteFooters={props.appSettings.showNoteFooters}
            handleDeleteNoteButton={handleDeleteNote}
            handleDuplicateNote={handleDuplicateNote}
            handleMoveNoteToBottom={() => {}}
            handleMoveNoteToTop={() => {}}
            handleNoteSave={handleNoteSave}
            showMoveContextActions={false}
            showOpenNoteWindowContextAction={false}
            showTitleVisibilityContextAction={false}
            style={{
              width: "100%",
              height: "100%",
              marginBottom: 0
            }}
          />
        )}
      </div>
    </ThemeProvider>
  );
}

export default NoteWindow;
