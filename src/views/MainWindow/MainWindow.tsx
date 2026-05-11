/**
 * Copyright (c) 2023-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { CssBaseline, Theme } from "@mui/material";
import { ThemeProvider } from "@mui/system";
import WindowToolbar from "../../components/WindowToolbar";
import { AppTheme } from "../../theme/AppTheme";
import { makeStyles } from "@mui/styles";
import { AppView } from "../../App";
import Home from "./pages/Home";
import WelcomeScreen from "./pages/WelcomeScreen";
import { SystemTheme } from "../../theme/SystemTheme";
import { useEffect, useState } from "react";
import { NoteType } from "../../models/NoteType";
import { getRandomNoteColor } from "../../theme/NoteColors";
import { nanoid } from "nanoid";
import ConfirmationDialog from "../../components/ConfirmationDialog";
import { useNavigate } from "react-router-dom";

type MainWindowProps = {
  view: AppView;
  theme: SystemTheme;
}

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    minWidth: "100%",
    minHeight: "100vh",
    width: "100%",
    height: "100vh",
    zIndex: 1,
    overflow: "hidden"
  },
  app: {
    display: "flex",
    flexDirection: "column",
    height: "100%"
  },
  content: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto"
  },
  menu: {
    
  }
}));

function MainWindow(props: MainWindowProps) {
  const classes = useStyles();
  const navigate = useNavigate();

  const [notes, setNotes] = useState<NoteType[]>([]);
  const [isDeleteAllNotesDialogOpen, setDeleteAllNotesDialogOpen] = useState(false);
  const [versionLabel, setVersionLabel] = useState("");
  const [hideWelcomeOnNextLaunch, setHideWelcomeOnNextLaunch] = useState(false);
  
  
  const isDeleteAllButtonDisabled = notes.length === 0;
  const appTheme = props.theme === SystemTheme.DARK ? AppTheme.DarkTheme : AppTheme.LightTheme;

  useEffect(() => {
    window.api.storage.getNotes()
      .then((notes: NoteType[]) => {
        setNotes(notes);
      })
      .catch((err: Error) => {
        console.error('Unexpected error loading notes:', err.message);
      });

    setVersionLabel(window.api.version.getShortDisplayVersion());

    // menu
    window.api.menu.onMenuNewNote(handleAddNote);
  }, []);
  
  function handleAddNote() {
    setNotes((prevNotes) => [
      ...prevNotes,
      {
        id: nanoid(),
        bgcolor: getRandomNoteColor(),
        content: "",
        createdOn: new Date(),
        lastModifiedOn: new Date()
      },
    ]);
  }
  
  function handleDeleteNote(noteId: string) {
    window.api.storage.deleteNote(noteId);
    setNotes(
      notes.filter(({ id }) => id !== noteId)
    );
  }
  
  function handleDeleteAllNotes() {
    setNotes([]);
    setDeleteAllNotesDialogOpen(false);
    setTimeout(() => {
      window.api.storage.deleteAllNotes();
    }, 500);
  }

  function handleGetStarted() {
    if (hideWelcomeOnNextLaunch) {
      // TODO: Persist this preference once app settings storage is available.
    }

    navigate(AppView.home);
  }
  
  let page = <></>;
  switch (props.view) {
    case AppView.welcome:
      page = <WelcomeScreen theme={props.theme} onGetStarted={handleGetStarted} onNeverShowAgainChange={setHideWelcomeOnNextLaunch} />
      break;
    case AppView.home:
      page = <Home theme={props.theme} notes={notes} handleDeleteNoteButton={handleDeleteNote} />
      break;
    default:
      page = <Home theme={props.theme} notes={notes} handleDeleteNoteButton={handleDeleteNote} />
  }
  
  return (
    <ThemeProvider theme={appTheme}>
      <div className={classes.root} style={{ backgroundColor: appTheme.palette.background.default }}>
        <CssBaseline/>
        <ConfirmationDialog theme={props.theme}
                            open={isDeleteAllNotesDialogOpen}
                            title="Delete All Notes"
                            message="Are you sure you want to delete all notes? This action cannot be undone."
                            confirmLabel="Delete All"
                            onConfirm={handleDeleteAllNotes}
                            onCancel={() => setDeleteAllNotesDialogOpen(false)} />
        <nav className={classes.menu}>
          {/* In-app menu goes here. */}
        </nav>
        <div className={classes.app}>
          <WindowToolbar theme={props.theme} title="X-NoTES" versionLabel={versionLabel} handleAddNoteButton={handleAddNote}
                         isDeleteAllButtonDisabled={isDeleteAllButtonDisabled} handleDeleteAllNotesButton={() => setDeleteAllNotesDialogOpen(true)} />
          <main className={classes.content}>
            { page }
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default MainWindow;
