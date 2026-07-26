/**
 * Copyright (c) 2023-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import EmptyNoteList from "../../../components/EmptyNoteList";
import NoteGrid from "../../../components/NoteGrid";
import NoteList from "../../../components/NoteList";
import { NoteType } from "../../../models/NoteType";
import { NoteFontPreference } from "../../../settings/NoteFontPreference";
import { NoteFontSize } from "../../../settings/NoteFontSize";
import { NoteLayoutPreference } from "../../../settings/NoteLayoutPreference";
import { NoteSizePreference } from "../../../settings/noteSizePreference";
import { SystemTheme } from "../../../theme/SystemTheme";
import { DateFormat } from "../../../utils/dt-formatter/DateFormat";
import { TimeFormat } from "../../../utils/dt-formatter/TimeFormat";

type HomeProps = {
  notes: NoteType[];
  hasLoadedNotes: boolean;
  theme: SystemTheme;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  noteFont: NoteFontPreference;
  noteTitleFont: NoteFontPreference;
  noteContentFontSize: NoteFontSize;
  noteTitleFontSize: NoteFontSize;
  richTextEditorEnabled: boolean;
  noteLayout: NoteLayoutPreference;
  noteSize: NoteSizePreference;
  showNoteTitles: boolean;
  showNoteFooters: boolean;
  showFloatingFormatToolbar: boolean;
  handleDeleteNoteButton: (noteId: string) => void;
  handleDuplicateNote: (note: NoteType) => void;
  handleOpenNoteWindow?: (noteId: string) => void;
  handleMoveNoteToBottom: (noteId: string) => void;
  handleMoveNoteToTop: (noteId: string) => void;
  handleNoteSave: (note: NoteType) => void;
  handleNoteReorder: (activeNoteId: string, overNoteId: string) => void;
  handleToggleNotePin: (note: NoteType) => void;
  isSelectionMode: boolean;
  selectedNoteIds: Set<string>;
  onEnterSelectionMode: () => void;
  onSelectNoteSelection: (noteId: string) => void;
  onDeselectNoteSelection: (noteId: string) => void;
  onToggleNoteSelection: (noteId: string) => void;
}

function Home(props: HomeProps) {
  const isNoteListEmpty = props.notes.length <= 0;

  if (!props.hasLoadedNotes) {
    return <></>;
  }

  return (
    <div>
      {isNoteListEmpty ?
        <EmptyNoteList theme={props.theme} />
        :
        props.noteLayout === NoteLayoutPreference.LIST ?
        <NoteList
          theme={props.theme}
          notes={props.notes}
          dateFormat={props.dateFormat}
          timeFormat={props.timeFormat}
          noteFont={props.noteFont}
          noteTitleFont={props.noteTitleFont}
          noteContentFontSize={props.noteContentFontSize}
          noteTitleFontSize={props.noteTitleFontSize}
          richTextEditorEnabled={props.richTextEditorEnabled}
          noteSize={props.noteSize}
          showNoteTitles={props.showNoteTitles}
          showNoteFooters={props.showNoteFooters}
          showFloatingFormatToolbar={props.showFloatingFormatToolbar}
          handleDeleteNoteButton={props.handleDeleteNoteButton}
          handleDuplicateNote={props.handleDuplicateNote}
          handleOpenNoteWindow={props.handleOpenNoteWindow}
          handleMoveNoteToBottom={props.handleMoveNoteToBottom}
          handleMoveNoteToTop={props.handleMoveNoteToTop}
          handleNoteSave={props.handleNoteSave}
          handleNoteReorder={props.handleNoteReorder}
          handleToggleNotePin={props.handleToggleNotePin}
          isSelectionMode={props.isSelectionMode}
          selectedNoteIds={props.selectedNoteIds}
          onEnterSelectionMode={props.onEnterSelectionMode}
          onSelectNoteSelection={props.onSelectNoteSelection}
          onDeselectNoteSelection={props.onDeselectNoteSelection}
          onToggleNoteSelection={props.onToggleNoteSelection}
        />
          :
        <NoteGrid
          theme={props.theme}
          notes={props.notes}
          dateFormat={props.dateFormat}
          timeFormat={props.timeFormat}
          noteFont={props.noteFont}
          noteTitleFont={props.noteTitleFont}
          noteContentFontSize={props.noteContentFontSize}
          noteTitleFontSize={props.noteTitleFontSize}
          richTextEditorEnabled={props.richTextEditorEnabled}
          noteSize={props.noteSize}
          showNoteTitles={props.showNoteTitles}
          showNoteFooters={props.showNoteFooters}
          showFloatingFormatToolbar={props.showFloatingFormatToolbar}
          handleDeleteNoteButton={props.handleDeleteNoteButton}
          handleDuplicateNote={props.handleDuplicateNote}
          handleOpenNoteWindow={props.handleOpenNoteWindow}
          handleMoveNoteToBottom={props.handleMoveNoteToBottom}
          handleMoveNoteToTop={props.handleMoveNoteToTop}
          handleNoteSave={props.handleNoteSave}
          handleNoteReorder={props.handleNoteReorder}
          handleToggleNotePin={props.handleToggleNotePin}
          isSelectionMode={props.isSelectionMode}
          selectedNoteIds={props.selectedNoteIds}
          onEnterSelectionMode={props.onEnterSelectionMode}
          onSelectNoteSelection={props.onSelectNoteSelection}
          onDeselectNoteSelection={props.onDeselectNoteSelection}
          onToggleNoteSelection={props.onToggleNoteSelection}
        />
      }
    </div>
  );
}

export default Home;
