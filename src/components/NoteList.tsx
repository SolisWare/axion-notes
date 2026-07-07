/**
 * Copyright (c) 2023-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { Theme } from "@mui/material";
import { makeStyles } from "@mui/styles";
import { useLayoutEffect, useRef, useState } from "react";
import { closestCenter, DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import EmptyNoteList from "./EmptyNoteList";
import SortableNote from "./SortableNote";
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
  handleDuplicateNote: (note: NoteType) => void;
  handleMoveNoteToBottom: (noteId: string) => void;
  handleMoveNoteToTop: (noteId: string) => void;
  handleNoteSave: (note: NoteType) => void;
  handleNoteReorder: (activeNoteId: string, overNoteId: string) => void;
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
  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8
    }
  }));
  const [columnCount, setColumnCount] = useState(1);
  const noteGridStyle = {
    gridTemplateColumns: `repeat(${columnCount}, ${noteSizeDefinition.width}px)`
  };
  const noteIds = props.notes.map((note) => note.id);

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
  
  function handleDragEnd(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) {
      return;
    }

    props.handleNoteReorder(String(event.active.id), String(event.over.id));
  }

  return (
    <div className={classes.wrapper} ref={wrapperRef}>
      {isNoteListEmpty ?
        <>
          <EmptyNoteList theme={props.theme} />
        </>
        :
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={noteIds} strategy={rectSortingStrategy}>
            <div className={classes.noteGrid} style={noteGridStyle}>
              {props.notes.map((note) => (
                <SortableNote
                  key={note.id}
                  note={note}
                  theme={props.theme}
                  dateFormat={props.dateFormat}
                  timeFormat={props.timeFormat}
                  noteFont={props.noteFont}
                  noteSize={props.noteSize}
                  handleNoteSave={props.handleNoteSave}
                  handleDeleteNoteButton={props.handleDeleteNoteButton}
                  handleDuplicateNote={props.handleDuplicateNote}
                  handleMoveNoteToBottom={props.handleMoveNoteToBottom}
                  handleMoveNoteToTop={props.handleMoveNoteToTop}
                />
                ))
              }
            </div>
          </SortableContext>
        </DndContext>
      }
    </div>
  );
}

export default NoteList;
