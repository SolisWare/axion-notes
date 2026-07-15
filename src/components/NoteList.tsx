/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { CSSProperties, useState } from "react";
import { useTranslation } from "react-i18next";
import { NoteType } from "../models/NoteType";
import { getNoteFontFamily, NoteFontPreference } from "../settings/NoteFontPreference";
import { NoteSizePreference } from "../settings/noteSizePreference";
import { getAppColors } from "../theme/AppColors";
import { getNoteColor } from "../theme/NoteColors";
import { SystemTheme } from "../theme/SystemTheme";
import { DateFormat } from "../utils/dt-formatter/DateFormat";
import { TimeFormat } from "../utils/dt-formatter/TimeFormat";
import Note from "./Note";
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

type FoldedNoteContent = {
  body: string;
  title?: string;
};

function getFirstContentLine(note: NoteType): string {
  return note.content.split(/\r?\n/).find((line) => line.trim().length > 0)?.trim() ?? "";
}

function getFoldedNoteContent(note: NoteType, showNoteTitles: boolean): FoldedNoteContent {
  const isTitleHidden = note.isTitleHidden ?? !showNoteTitles;
  const title = note.title?.trim();
  const body = getFirstContentLine(note);

  if (!isTitleHidden && title) {
    return {
      title,
      body
    };
  }

  return { body };
}

function NoteList(props: NoteListProps) {
  const { t } = useTranslation();
  
  const [expandedNoteIds, setExpandedNoteIds] = useState<Set<string>>(new Set());
  
  const appColors = getAppColors(props.theme);
  const noteFontFamily = getNoteFontFamily(props.noteFont);
  const noteListStyle = {
    "--note-list-text": appColors.NOTE_TEXT
  } as CSSProperties;

  function handleUnfoldNote(noteId: string) {
    setExpandedNoteIds((currentExpandedNoteIds) => {
      const nextExpandedNoteIds = new Set(currentExpandedNoteIds);
      nextExpandedNoteIds.add(noteId);

      return nextExpandedNoteIds;
    });
  }

  return (
    <div className={styles.wrapper} style={noteListStyle}>
      <div className={styles.list}>
        {props.notes.map((note) => {
          const foldedNoteContent = getFoldedNoteContent(note, props.showNoteTitles);

          if (expandedNoteIds.has(note.id)) {
            return (
              <div className={styles.expandedListItem} key={note.id}>
                <Note
                  theme={props.theme}
                  note={note}
                  dateFormat={props.dateFormat}
                  timeFormat={props.timeFormat}
                  noteFont={props.noteFont}
                  noteSize={NoteSizePreference.WIDE}
                  showNoteTitles={props.showNoteTitles}
                  showNoteFooters={props.showNoteFooters}
                  handleDeleteNoteButton={props.handleDeleteNoteButton}
                  handleDuplicateNote={props.handleDuplicateNote}
                  handleMoveNoteToBottom={props.handleMoveNoteToBottom}
                  handleMoveNoteToTop={props.handleMoveNoteToTop}
                  handleNoteSave={props.handleNoteSave}
                />
              </div>
            );
          }

          return (
            <div
              className={styles.listItem}
              key={note.id}
              style={{ backgroundColor: getNoteColor(note.bgcolor, props.theme) }}
            >
              <div className={styles.listItemContent} style={{ fontFamily: noteFontFamily }}>
                {foldedNoteContent.title && (
                  <span className={styles.listItemTitle}>{foldedNoteContent.title}</span>
                )}
                <span className={foldedNoteContent.title ? styles.listItemBody : styles.listItemBodyPrimary}>
                  {foldedNoteContent.body}
                </span>
              </div>
              <button
                aria-label={t("mainWindow.note.list.unfold")}
                className={styles.unfoldButton}
                onClick={() => handleUnfoldNote(note.id)}
                title={t("mainWindow.note.list.unfold")}
                type="button"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default NoteList;
