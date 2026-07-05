/**
 * Copyright (c) 2023-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { Theme } from "@mui/material";
import { makeStyles } from "@mui/styles";
import { useLayoutEffect, useRef, useState } from "react";
import Note from "./Note";
import EmptyNoteList from "./EmptyNoteList";
import { NoteType } from "../models/NoteType";
import { NoteFontPreference } from "../settings/NoteFontPreference";
import { getNoteSizeDefinition, NoteSizePreference } from "../settings/noteSizePreference";
import { SystemTheme } from "../theme/SystemTheme";
import { DateFormat } from "../utils/dt-formatter/DateFormat";
import { TimeFormat } from "../utils/dt-formatter/TimeFormat";

type NoteListProps = {
  theme: SystemTheme;
  notes: NoteType[];
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  noteFont: NoteFontPreference;
  noteSize: NoteSizePreference;
  handleDeleteNoteButton: (noteId: string) => void;
  handleNoteSave: (note: NoteType) => void;
}

const NOTE_GRID_GAP = 25;
const NOTE_GRID_HORIZONTAL_PADDING = 60;

const useStyles = makeStyles((theme: Theme) => ({
  wrapper: {
    padding: "30px 30px",
    display: "flex",
    justifyContent: "center"
  },
  noteGrid: {
    display: "grid",
    gap: NOTE_GRID_GAP
  }
}));

function NoteList (props: NoteListProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const noteSizeDefinition = getNoteSizeDefinition(props.noteSize);
  const classes = useStyles();
  const isNoteListEmpty = props.notes.length <= 0;
  const [columnCount, setColumnCount] = useState(1);
  const noteGridStyle = {
    gridTemplateColumns: `repeat(${columnCount}, ${noteSizeDefinition.width}px)`
  };

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;

    if (!wrapper) {
      return;
    }

    function updateColumnCount() {
      const availableWidth = Math.max(0, wrapper!.getBoundingClientRect().width - NOTE_GRID_HORIZONTAL_PADDING);
      const maxColumnCount = Math.max(1, Math.floor((availableWidth + NOTE_GRID_GAP) / (noteSizeDefinition.width + NOTE_GRID_GAP)));
      const nextColumnCount = Math.max(1, Math.min(maxColumnCount, props.notes.length || 1));

      setColumnCount(nextColumnCount);
    }

    updateColumnCount();

    window.addEventListener("resize", updateColumnCount);

    return () => window.removeEventListener("resize", updateColumnCount);
  }, [noteSizeDefinition.width, props.notes.length]);
  
  return (
    <div className={classes.wrapper} ref={wrapperRef}>
      {isNoteListEmpty ?
        <>
          <EmptyNoteList theme={props.theme} />
        </>
        :
        <div className={classes.noteGrid} style={noteGridStyle}>
          {props.notes.map((note) => (
            <Note
              key={note.id}
              theme={props.theme}
              note={note}
              dateFormat={props.dateFormat}
              timeFormat={props.timeFormat}
              noteFont={props.noteFont}
              noteSize={props.noteSize}
              handleNoteSave={props.handleNoteSave}
              handleDeleteNoteButton={props.handleDeleteNoteButton}
            />
            ))
          }
        </div>
      }
    </div>
  );
}

export default NoteList;
