/**
 * Copyright (c) 2023-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import NoteList from "../../../components/NoteList";
import { NoteType } from "../../../models/NoteType";
import { SystemTheme } from "../../../theme/SystemTheme";
import { DateFormat } from "../../../utils/dt-formatter/DateFormat";
import { TimeFormat } from "../../../utils/dt-formatter/TimeFormat";

type HomeProps = {
  notes: NoteType[];
  theme: SystemTheme;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  handleDeleteNoteButton: (noteId: string) => void;
  handleNoteSave: (note: NoteType) => void;
}

function Home(props: HomeProps) {
  return (
    <div>
      <NoteList
        theme={props.theme}
        notes={props.notes}
        dateFormat={props.dateFormat}
        timeFormat={props.timeFormat}
        handleDeleteNoteButton={props.handleDeleteNoteButton}
        handleNoteSave={props.handleNoteSave}
      />
    </div>
  );
}

export default Home;
