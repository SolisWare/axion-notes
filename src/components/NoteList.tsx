/**
 * Copyright (c) 2023-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { Theme } from "@mui/material";
import { makeStyles } from "@mui/styles";
import Note from "./Note";
import EmptyNoteList from "./EmptyNoteList";
import { NoteType } from "../models/NoteType";
import { NoteSortOrder } from "../settings/NoteSortOrder";
import { SystemTheme } from "../theme/SystemTheme";

type NoteListProps = {
  theme: SystemTheme;
  notes: NoteType[];
  notesSortOrder: NoteSortOrder;
  handleDeleteNoteButton: (noteId: string) => void;
}
 
const useStyles = makeStyles((theme: Theme) => ({
  wrapper: {
    padding: "30px 30px",
    display: "grid",
    gridGap: "25px",
    gridTemplateColumns: "repeat(auto-fill, minmax(275px, 275px))",
    justifyContent: "center"
  }
}));

function NoteList (props: NoteListProps) {
  const classes = useStyles();
  
  const notes = [...props.notes].sort((firstNote, secondNote) => {
    switch (props.notesSortOrder) {
      case NoteSortOrder.TITLE_ASC:
        return getNoteTitle(firstNote).localeCompare(getNoteTitle(secondNote), undefined, { sensitivity: "base" });
      case NoteSortOrder.TITLE_DESC:
        return getNoteTitle(secondNote).localeCompare(getNoteTitle(firstNote), undefined, { sensitivity: "base" });
      case NoteSortOrder.LAST_MODIFIED:
        return secondNote.lastModifiedOn.getTime() - firstNote.lastModifiedOn.getTime();
      case NoteSortOrder.DATE_CREATED_DESC:
        return secondNote.createdOn.getTime() - firstNote.createdOn.getTime();
      case NoteSortOrder.DATE_CREATED_ASC:
      default:
        return firstNote.createdOn.getTime() - secondNote.createdOn.getTime();
    }
  });
  const isNoteListEmpty = notes.length <= 0;
  
  const handleSaveNote = (note: NoteType) => {
    window.api.storage.setNote(note);
  };
  
  return (
    <div className={classes.wrapper}>
      {isNoteListEmpty ?
        <>
          <EmptyNoteList theme={props.theme} />
        </>
        :
        <>
          {notes.map((note) => (
            <Note key={note.id} theme={props.theme} note={note} handleNoteSave={handleSaveNote} handleDeleteNoteButton={props.handleDeleteNoteButton} />
            ))
          }
        </>
      }
    </div>
  );
}

function getNoteTitle(note: NoteType): string {
  return note.title?.trim() || note.content.trim();
}

export default NoteList;
