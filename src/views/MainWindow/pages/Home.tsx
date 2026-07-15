/**
 * Copyright (c) 2023-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import NoteGrid from "../../../components/NoteGrid";
import NoteList from "../../../components/NoteList";
import { NoteType } from "../../../models/NoteType";
import { NoteFontPreference } from "../../../settings/NoteFontPreference";
import { NoteLayoutPreference } from "../../../settings/NoteLayoutPreference";
import { NoteSizePreference } from "../../../settings/noteSizePreference";
import { SystemTheme } from "../../../theme/SystemTheme";
import { DateFormat } from "../../../utils/dt-formatter/DateFormat";
import { TimeFormat } from "../../../utils/dt-formatter/TimeFormat";

type HomeProps = {
  notes: NoteType[];
  theme: SystemTheme;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  noteFont: NoteFontPreference;
  noteLayout: NoteLayoutPreference;
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

function Home(props: HomeProps) {
  return (
    <div>
      {props.noteLayout === NoteLayoutPreference.LIST ?
        <NoteList
          theme={props.theme}
          notes={props.notes}
          dateFormat={props.dateFormat}
          timeFormat={props.timeFormat}
          noteFont={props.noteFont}
          noteSize={props.noteSize}
          showNoteTitles={props.showNoteTitles}
          showNoteFooters={props.showNoteFooters}
          handleDeleteNoteButton={props.handleDeleteNoteButton}
          handleDuplicateNote={props.handleDuplicateNote}
          handleMoveNoteToBottom={props.handleMoveNoteToBottom}
          handleMoveNoteToTop={props.handleMoveNoteToTop}
          handleNoteSave={props.handleNoteSave}
          handleNoteReorder={props.handleNoteReorder}
        />
        :
        <NoteGrid
          theme={props.theme}
          notes={props.notes}
          dateFormat={props.dateFormat}
          timeFormat={props.timeFormat}
          noteFont={props.noteFont}
          noteSize={props.noteSize}
          showNoteTitles={props.showNoteTitles}
          showNoteFooters={props.showNoteFooters}
          handleDeleteNoteButton={props.handleDeleteNoteButton}
          handleDuplicateNote={props.handleDuplicateNote}
          handleMoveNoteToBottom={props.handleMoveNoteToBottom}
          handleMoveNoteToTop={props.handleMoveNoteToTop}
          handleNoteSave={props.handleNoteSave}
          handleNoteReorder={props.handleNoteReorder}
        />
      }
    </div>
  );
}

export default Home;
