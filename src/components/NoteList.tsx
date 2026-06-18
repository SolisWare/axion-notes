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
import { SystemTheme } from "../theme/SystemTheme";

type NoteListProps = {
  theme: SystemTheme;
  notes: NoteType[];
  handleDeleteNoteButton: (noteId: string) => void;
  handleNoteSave: (note: NoteType) => void;
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
  const isNoteListEmpty = props.notes.length <= 0;
  
  return (
    <div className={classes.wrapper}>
      {isNoteListEmpty ?
        <>
          <EmptyNoteList theme={props.theme} />
        </>
        :
        <>
          {props.notes.map((note) => (
            <Note key={note.id} theme={props.theme} note={note} handleNoteSave={props.handleNoteSave} handleDeleteNoteButton={props.handleDeleteNoteButton} />
            ))
          }
        </>
      }
    </div>
  );
}

export default NoteList;
