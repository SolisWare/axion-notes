/**
 * Copyright (c) 2023-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import NoteList from "../../../components/NoteList";
import { NoteType } from "../../../models/NoteType";
import { NoteSortOrder } from "../../../settings/NoteSortOrder";
import { SystemTheme } from "../../../theme/SystemTheme";

type HomeProps = {
  notes: NoteType[];
  notesSortOrder: NoteSortOrder;
  theme: SystemTheme;
  handleDeleteNoteButton: (noteId: string) => void;
  handleNoteSave: (note: NoteType) => void;
}

function Home(props: HomeProps) {
  return (
    <div>
      <NoteList
        theme={props.theme}
        notes={props.notes}
        notesSortOrder={props.notesSortOrder}
        handleDeleteNoteButton={props.handleDeleteNoteButton}
        handleNoteSave={props.handleNoteSave}
      />
    </div>
  );
}

export default Home;
