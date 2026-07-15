/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { CSSProperties } from "react";
import EmptyNoteList from "./EmptyNoteList";
import { NoteType } from "../models/NoteType";
import { getNoteFontFamily, NoteFontPreference } from "../settings/NoteFontPreference";
import { NoteSizePreference } from "../settings/noteSizePreference";
import { getAppColors } from "../theme/AppColors";
import { getNoteColor } from "../theme/NoteColors";
import { SystemTheme } from "../theme/SystemTheme";
import { DateFormat } from "../utils/dt-formatter/DateFormat";
import { TimeFormat } from "../utils/dt-formatter/TimeFormat";
import styles from "./NoteList.module.css";

type NoteListProps = {
  theme: SystemTheme;
  notes: NoteType[];
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  noteFont: NoteFontPreference;
  noteSize: NoteSizePreference;
  showNoteTitles: boolean;
  showNoteFooters: boolean;
  handleDeleteNoteButton: (noteId: string) => void;
  handleDuplicateNote: (note: NoteType) => void;
  handleMoveNoteToBottom: (noteId: string) => void;
  handleMoveNoteToTop: (noteId: string) => void;
  handleNoteSave: (note: NoteType) => void;
  handleNoteReorder: (activeNoteId: string, overNoteId: string) => void;
}

function getFoldedNoteText(note: NoteType, showNoteTitles: boolean): string {
  const isTitleHidden = note.isTitleHidden ?? !showNoteTitles;
  const title = note.title?.trim();

  if (!isTitleHidden && title) {
    return title;
  }

  return note.content.split(/\r?\n/).find((line) => line.trim().length > 0)?.trim() ?? "";
}

function NoteList(props: NoteListProps) {
  const appColors = getAppColors(props.theme);
  const noteFontFamily = getNoteFontFamily(props.noteFont);
  const isNoteListEmpty = props.notes.length <= 0;
  const noteListStyle = {
    "--note-list-text": appColors.NOTE_TEXT
  } as CSSProperties;

  return (
    <div className={styles.wrapper} style={noteListStyle}>
      {isNoteListEmpty ?
        <EmptyNoteList theme={props.theme} />
        :
        <div className={styles.list}>
          {props.notes.map((note) => (
            <div
              className={styles.listItem}
              key={note.id}
              style={{ backgroundColor: getNoteColor(note.bgcolor, props.theme) }}
            >
              <span
                className={styles.listItemText}
                style={{ fontFamily: noteFontFamily }}
              >
                {getFoldedNoteText(note, props.showNoteTitles)}
              </span>
            </div>
          ))}
        </div>
      }
    </div>
  );
}

export default NoteList;
