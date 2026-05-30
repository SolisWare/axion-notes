/**
 * Copyright (c) 2023-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { CssBaseline, Theme } from "@mui/material";
import { ThemeProvider } from "@mui/system";
import WebSettingsDialog from "../../components/WebSettingsDialog";
import WebToolbar from "../../components/WebToolbar";
import { AppTheme } from "../../theme/AppTheme";
import { makeStyles } from "@mui/styles";
import { AppView } from "../../App";
import Home from "./pages/Home";
import WelcomeScreen from "./pages/WelcomeScreen";
import { SystemTheme } from "../../theme/SystemTheme";
import { useCallback, useEffect, useState } from "react";
import { NoteType } from "../../models/NoteType";
import { getRandomNoteColor } from "../../theme/NoteColors";
import { nanoid } from "nanoid";
import ConfirmationDialog from "../../components/ConfirmationDialog";
import { useNavigate } from "react-router-dom";
import { AppSettings } from "../../settings/AppSettings";
import { NoteColorPreference } from "../../settings/noteColorPreference";
import { UserAgent } from "../../utils/UserAgent";

type MainWindowProps = {
  view: AppView;
  theme: SystemTheme;
  appSettings: AppSettings;
  onAppSettingsChange: (settings: AppSettings) => void;
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
  const [isSettingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [hideWelcomeOnNextLaunch, setHideWelcomeOnNextLaunch] = useState(false);
    
  const isDeleteAllButtonDisabled = notes.length === 0;
  const appTheme = props.theme === SystemTheme.DARK ? AppTheme.DarkTheme : AppTheme.LightTheme;
  const appSettings = props.appSettings;
  const shouldShowToolbar = !UserAgent.isElectron && props.view !== AppView.welcome;

  const handleAddNote = useCallback(() => {
    const noteColor = appSettings.defaultNoteColor === NoteColorPreference.AUTO
      ? getRandomNoteColor()
      : appSettings.defaultNoteColor;

    setNotes((prevNotes) => [
      ...prevNotes,
      {
        id: nanoid(),
        bgcolor: noteColor,
        content: "",
        createdOn: new Date(),
        lastModifiedOn: new Date()
      },
    ]);
  }, [appSettings.defaultNoteColor]);

  useEffect(() => {
    window.api.storage.getNotes()
      .then((notes: NoteType[]) => {
        setNotes(notes);
      })
      .catch((err: Error) => {
        console.error('Unexpected error loading notes:', err.message);
      });

  }, []);

  useEffect(() => {
    const offMenuNewNote = window.api.menu.onMenuNewNote(handleAddNote);
    const offMenuShowWelcome = window.api.menu.onMenuShowWelcome(() => navigate(AppView.welcome));
    const offMenuDeleteAllNotes = window.api.menu.onMenuDeleteAllNotes(() => setDeleteAllNotesDialogOpen(true));

    return () => {
      offMenuNewNote();
      offMenuShowWelcome();
      offMenuDeleteAllNotes();
    };
  }, [handleAddNote, navigate]);

  useEffect(() => {
    window.api.menu.setDeleteAllNotesEnabled(notes.length > 0);
  }, [notes.length]);

  useEffect(() => {
    window.api.menu.setNewNoteEnabled(props.view !== AppView.welcome);
  }, [props.view]);

  useEffect(() => {
    if (UserAgent.isElectron) {
      window.api.appWindow.setAlwaysOnTop(appSettings.keepNotesMainWindowOnTop);
    }
  }, [appSettings.keepNotesMainWindowOnTop]);
  
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
      props.onAppSettingsChange({
        ...appSettings,
        showWelcomeScreenOnLaunch: false
      });
    }
    navigate(AppView.home);
  }

  function handleNeverShowAgainChange(event: React.ChangeEvent<HTMLInputElement>) {
    const checked = event.target.checked;
    setHideWelcomeOnNextLaunch(checked);
  };
  
  let page = <></>;
  switch (props.view) {
    case AppView.welcome:
      page = <WelcomeScreen theme={props.theme} onGetStarted={handleGetStarted} onNeverShowAgainChange={handleNeverShowAgainChange} />
      break;
    case AppView.home:
      page = <Home theme={props.theme} notes={notes} notesSortOrder={appSettings.notesSortOrder} handleDeleteNoteButton={handleDeleteNote} />
      break;
    default:
      page = <Home theme={props.theme} notes={notes} notesSortOrder={appSettings.notesSortOrder} handleDeleteNoteButton={handleDeleteNote} />
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
        <WebSettingsDialog theme={props.theme}
                           appSettings={appSettings}
                           open={isSettingsDialogOpen}
                           onClose={() => setSettingsDialogOpen(false)}
                           onAppSettingsChange={props.onAppSettingsChange} />
        <nav className={classes.menu}>
          {/* In-app menu goes here. */}
        </nav>
        <div className={classes.app}>
          {shouldShowToolbar &&
            <WebToolbar theme={props.theme} title="Axion Notes" handleAddNoteButton={handleAddNote}
                        isDeleteAllButtonDisabled={isDeleteAllButtonDisabled}
                        handleDeleteAllNotesButton={() => setDeleteAllNotesDialogOpen(true)}
                        handleSettingsButton={() => setSettingsDialogOpen(true)} />
          }
          <main className={classes.content}>
            { page }
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default MainWindow;
