/**
 * Copyright (c) 2023-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { CssBaseline, Theme } from "@mui/material";
import { ThemeProvider } from "@mui/system";
import { useTranslation } from "react-i18next";
import WebNoteWindowDialog from "../../components/WebNoteWindowDialog";
import WebSettingsDialog from "../../components/WebSettingsDialog";
import WebToolbar from "../../components/WebToolbar";
import { AppTheme } from "../../theme/AppTheme";
import { makeStyles } from "@mui/styles";
import { AppView } from "../../App";
import Home from "./pages/Home";
import WelcomeScreen from "./pages/WelcomeScreen";
import { SystemTheme } from "../../theme/SystemTheme";
import { useCallback, useEffect, useRef, useState } from "react";
import { NoteType } from "../../models/NoteType";
import { NotesChangeEvent } from "../../models/NotesChangeEvent";
import { getRandomNoteColor } from "../../theme/NoteColors";
import { nanoid } from "nanoid";
import ConfirmationDialog from "../../components/ConfirmationDialog";
import { useNavigate } from "react-router-dom";
import { AppSettings } from "../../settings/AppSettings";
import { NoteColorPreference } from "../../settings/noteColorPreference";
import { NoteSortOrder } from "../../settings/NoteSortOrder";
import { UserAgent } from "../../utils/UserAgent";
import { Formatter } from "../../utils/dt-formatter/Formatter";
import { getNotesWithPinnedNote, getNotesWithUnpinnedNote, isPinnedNote } from "../../utils/notePinning";
import { sortNotes } from "../../utils/noteSorting";

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
    overflowX: "hidden",
    overflowY: "auto"
  },
  menu: {
    
  }
}));

function MainWindow(props: MainWindowProps) {
  const { t } = useTranslation();
  const classes = useStyles();
  const navigate = useNavigate();
  const appSettings = props.appSettings;

  const [notes, setNotes] = useState<NoteType[]>([]);
  const [isDeleteAllNotesDialogOpen, setDeleteAllNotesDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [webNoteWindowNoteId, setWebNoteWindowNoteId] = useState<string | null>(null);
  const currentNotesSortOrder = useRef(appSettings.notesSortOrder);
  const previousShowNoteTitles = useRef(appSettings.showNoteTitles);
    
  const isDeleteAllButtonDisabled = notes.length === 0;
  const appTheme = props.theme === SystemTheme.DARK ? AppTheme.DarkTheme : AppTheme.LightTheme;
  const shouldShowToolbar = !UserAgent.isElectron && props.view !== AppView.welcome;

  const handleAddNote = useCallback(() => {
    const noteColor = appSettings.defaultNoteColor === NoteColorPreference.AUTO
      ? getRandomNoteColor()
      : appSettings.defaultNoteColor;

    const newNote = {
      id: nanoid(),
      bgcolor: noteColor,
      isTitleHidden: !appSettings.showNoteTitles,
      isFolded: true,
      content: "",
      createdOn: new Date(),
      lastModifiedOn: new Date()
    };

    setNotes((prevNotes) => [newNote, ...prevNotes]);
  }, [appSettings.defaultNoteColor, appSettings.showNoteTitles]);

  useEffect(() => {
    window.api.storage.getNotes()
      .then((notes: NoteType[]) => {
        setNotes(sortNotes(notes, currentNotesSortOrder.current));
      })
      .catch((err: Error) => {
        console.error('Unexpected error loading notes:', err.message);
      });

  }, []);

  useEffect(() => {
    return window.api.storage.onNotesChange((event) => {
      applyNotesChange(event);
    });
  }, []);

  useEffect(() => {
    if (currentNotesSortOrder.current === appSettings.notesSortOrder) {
      return;
    }

    currentNotesSortOrder.current = appSettings.notesSortOrder;
    setNotes((prevNotes) => sortNotes(prevNotes, appSettings.notesSortOrder));
  }, [appSettings.notesSortOrder]);

  useEffect(() => {
    if (previousShowNoteTitles.current === appSettings.showNoteTitles) {
      return;
    }

    previousShowNoteTitles.current = appSettings.showNoteTitles;
    setNotes((prevNotes) => prevNotes.map((note) => {
      const updatedNote = {
        ...note,
        isTitleHidden: !appSettings.showNoteTitles
      };

      window.api.storage.setNote(updatedNote);

      return updatedNote;
    }));
  }, [appSettings.showNoteTitles]);

  useEffect(() => {
    return window.api.noteSort.onSortRequest(() => {
      setNotes((prevNotes) => sortNotes(prevNotes, currentNotesSortOrder.current));
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

  useEffect(() => {
    if (UserAgent.isElectron) {
      window.api.appWindow.setLayout(appSettings.noteLayout);
    }
  }, [appSettings.noteLayout]);
  
  function handleDeleteNote(noteId: string) {
    window.api.storage.deleteNote(noteId);
    setNotes(
      notes.filter(({ id }) => id !== noteId)
    );
  }

  function handleSaveNote(note: NoteType) {
    window.api.storage.setNote(note);
    setNotes((prevNotes) =>
      prevNotes.map((prevNote) => prevNote.id === note.id ? note : prevNote)
    );
  }

  function handleDuplicateNote(note: NoteType) {
    const now = new Date();
    const duplicatedNote = {
      ...note,
      id: nanoid(),
      pinnedOn: isPinnedNote(note) ? now : note.pinnedOn,
      pinnedFromNoteIds: undefined,
      createdOn: now,
      lastModifiedOn: now
    };

    window.api.storage.setNote(duplicatedNote);
    setNotes((prevNotes) => {
      const noteIndex = prevNotes.findIndex((prevNote) => prevNote.id === note.id);

      if (noteIndex < 0) {
        return [duplicatedNote, ...prevNotes];
      }

      const nextNotes = [...prevNotes];
      nextNotes.splice(noteIndex + 1, 0, duplicatedNote);

      if (currentNotesSortOrder.current === NoteSortOrder.CUSTOM || isPinnedNote(duplicatedNote)) {
        window.api.storage.setNoteOrder(nextNotes.map((nextNote) => nextNote.id));
      }

      return nextNotes;
    });
  }

  function applyNotesChange(event: NotesChangeEvent) {
    switch (event.type) {
      case "setNote":
        setNotes((prevNotes) => {
          const updatedNote = {
            ...event.note,
            createdOn: Formatter.toDate(event.note.createdOn),
            lastModifiedOn: Formatter.toDate(event.note.lastModifiedOn),
            pinnedOn: Formatter.toOptionalDate(event.note.pinnedOn)
          };
          const noteIndex = prevNotes.findIndex((note) => note.id === updatedNote.id);

          if (noteIndex < 0) {
            return sortNotes([...prevNotes, updatedNote], currentNotesSortOrder.current);
          }

          return prevNotes.map((note) => note.id === updatedNote.id ? updatedNote : note);
        });
        break;
      case "setNoteOrder":
        setNotes((prevNotes) => {
          const noteOrderIndexes = new Map(event.noteIds.map((noteId, index) => [noteId, index]));

          return [...prevNotes].sort((firstNote, secondNote) => {
            const firstNoteOrderIndex = noteOrderIndexes.get(firstNote.id);
            const secondNoteOrderIndex = noteOrderIndexes.get(secondNote.id);

            if (firstNoteOrderIndex !== undefined && secondNoteOrderIndex !== undefined) {
              return firstNoteOrderIndex - secondNoteOrderIndex;
            }

            if (firstNoteOrderIndex !== undefined) {
              return -1;
            }

            if (secondNoteOrderIndex !== undefined) {
              return 1;
            }

            return 0;
          });
        });
        break;
      case "deleteNote":
        setNotes((prevNotes) => prevNotes.filter((note) => note.id !== event.noteId));
        break;
      case "deleteAllNotes":
        setNotes([]);
        break;
    }
  }

  function handleOpenNoteWindow(noteId: string) {
    if (UserAgent.isElectron) {
      window.api.noteWindow.open(noteId, {
        offsetFromCurrentWindow: true
      });
      return;
    }

    setWebNoteWindowNoteId(noteId);
  }

  function applyCustomNoteOrder(reorderNotes: (notes: NoteType[]) => NoteType[]) {
    setNotes((prevNotes) => {
      const reorderedNotes = reorderNotes(prevNotes);

      if (reorderedNotes === prevNotes) {
        return prevNotes;
      }

      currentNotesSortOrder.current = NoteSortOrder.CUSTOM;
      window.api.storage.setNoteOrder(reorderedNotes.map((note) => note.id));

      if (appSettings.notesSortOrder !== NoteSortOrder.CUSTOM) {
        props.onAppSettingsChange({
          ...appSettings,
          notesSortOrder: NoteSortOrder.CUSTOM
        });
      }

      return reorderedNotes;
    });
  }

  function handleToggleNotePin(note: NoteType) {
    if (isPinnedNote(note)) {
      handleUnpinNote(note);
      return;
    }

    handlePinNote(note);
  }

  function handlePinNote(note: NoteType) {
    setNotes((prevNotes) => {
      const nextNotes = getNotesWithPinnedNote(prevNotes, note);
      const pinnedNote = nextNotes.find((nextNote) => nextNote.id === note.id);

      queueMicrotask(() => {
        if (pinnedNote) {
          window.api.storage.setNote(pinnedNote);
        }
        window.api.storage.setNoteOrder(nextNotes.map((nextNote) => nextNote.id));
      });

      return nextNotes;
    });
  }

  function handleUnpinNote(note: NoteType) {
    setNotes((prevNotes) => {
      const nextNotes = getNotesWithUnpinnedNote(prevNotes, note, currentNotesSortOrder.current);
      const unpinnedNote = nextNotes.find((nextNote) => nextNote.id === note.id);

      queueMicrotask(() => {
        if (unpinnedNote) {
          window.api.storage.setNote(unpinnedNote);
        }
        window.api.storage.setNoteOrder(nextNotes.map((nextNote) => nextNote.id));
      });

      return nextNotes;
    });
  }

  function handleNoteReorder(activeNoteId: string, overNoteId: string) {
    if (activeNoteId === overNoteId) {
      return;
    }

    applyCustomNoteOrder((prevNotes) => {
      const activeNoteIndex = prevNotes.findIndex((note) => note.id === activeNoteId);
      const overNoteIndex = prevNotes.findIndex((note) => note.id === overNoteId);

      if (activeNoteIndex < 0 || overNoteIndex < 0) {
        return prevNotes;
      }

      const reorderedNotes = [...prevNotes];
      const [activeNote] = reorderedNotes.splice(activeNoteIndex, 1);
      const overNote = prevNotes[overNoteIndex];

      if (isPinnedNote(activeNote) === isPinnedNote(overNote)) {
        reorderedNotes.splice(overNoteIndex, 0, activeNote);
        return reorderedNotes;
      }

      if (isPinnedNote(activeNote)) {
        const firstUnpinnedNoteIndex = reorderedNotes.findIndex((note) => !isPinnedNote(note));

        reorderedNotes.splice(firstUnpinnedNoteIndex < 0 ? reorderedNotes.length : firstUnpinnedNoteIndex, 0, activeNote);
        return reorderedNotes;
      }

      const lastPinnedNoteIndex = reorderedNotes.reduce((lastIndex, note, index) => {
        return isPinnedNote(note) ? index : lastIndex;
      }, -1);

      reorderedNotes.splice(lastPinnedNoteIndex + 1, 0, activeNote);

      return reorderedNotes;
    });
  }

  function handleMoveNoteToTop(noteId: string) {
    applyCustomNoteOrder((prevNotes) => {
      const noteIndex = prevNotes.findIndex((note) => note.id === noteId);

      if (noteIndex <= 0) {
        return prevNotes;
      }

      const reorderedNotes = [...prevNotes];
      const [note] = reorderedNotes.splice(noteIndex, 1);
      const firstSameSectionIndex = reorderedNotes.findIndex((prevNote) => isPinnedNote(prevNote) === isPinnedNote(note));

      reorderedNotes.splice(Math.max(0, firstSameSectionIndex), 0, note);

      return reorderedNotes;
    });
  }

  function handleMoveNoteToBottom(noteId: string) {
    applyCustomNoteOrder((prevNotes) => {
      const noteIndex = prevNotes.findIndex((note) => note.id === noteId);

      if (noteIndex < 0 || noteIndex === prevNotes.length - 1) {
        return prevNotes;
      }

      const reorderedNotes = [...prevNotes];
      const [note] = reorderedNotes.splice(noteIndex, 1);
      const lastSameSectionIndex = reorderedNotes.reduce((lastIndex, prevNote, index) => {
        return isPinnedNote(prevNote) === isPinnedNote(note) ? index : lastIndex;
      }, -1);

      reorderedNotes.splice(lastSameSectionIndex + 1, 0, note);

      return reorderedNotes;
    });
  }
  
  function handleDeleteAllNotes() {
    setNotes([]);
    setDeleteAllNotesDialogOpen(false);
    setTimeout(() => {
      window.api.storage.deleteAllNotes();
    }, 500);
  }

  function handleGetStarted() {
    navigate(AppView.home);
  }

  function handleNeverShowAgainChange(event: React.ChangeEvent<HTMLInputElement>) {
    props.onAppSettingsChange({
      ...appSettings,
      showWelcomeScreenOnLaunch: !event.target.checked
    });
  };

  function handleMainWindowContextMenu(event: React.MouseEvent) {
    if (UserAgent.isElectron && !event.defaultPrevented) {
      event.preventDefault();
    }
  }
  
  let page = <></>;
  switch (props.view) {
    case AppView.welcome:
      page = <WelcomeScreen theme={props.theme} neverShowAgain={!appSettings.showWelcomeScreenOnLaunch} onGetStarted={handleGetStarted}
                            onNeverShowAgainChange={handleNeverShowAgainChange} />
      break;
    case AppView.home:
      page = <Home theme={props.theme} notes={notes} dateFormat={appSettings.dateFormat} timeFormat={appSettings.timeFormat} noteFont={appSettings.noteFont}
                   noteLayout={appSettings.noteLayout} noteSize={appSettings.noteSize} showNoteTitles={appSettings.showNoteTitles} showNoteFooters={appSettings.showNoteFooters}
                   showFloatingFormatToolbar={appSettings.showFloatingFormatToolbar} handleDeleteNoteButton={handleDeleteNote} handleDuplicateNote={handleDuplicateNote}
                   handleOpenNoteWindow={handleOpenNoteWindow} handleMoveNoteToBottom={handleMoveNoteToBottom} handleMoveNoteToTop={handleMoveNoteToTop}
                   handleNoteSave={handleSaveNote} handleNoteReorder={handleNoteReorder} handleToggleNotePin={handleToggleNotePin} />
      break;
    default:
      page = <Home theme={props.theme} notes={notes} dateFormat={appSettings.dateFormat} timeFormat={appSettings.timeFormat} noteFont={appSettings.noteFont}
                   noteLayout={appSettings.noteLayout} noteSize={appSettings.noteSize} showNoteTitles={appSettings.showNoteTitles} showNoteFooters={appSettings.showNoteFooters}
                   showFloatingFormatToolbar={appSettings.showFloatingFormatToolbar} handleDeleteNoteButton={handleDeleteNote} handleDuplicateNote={handleDuplicateNote}
                   handleOpenNoteWindow={handleOpenNoteWindow} handleMoveNoteToBottom={handleMoveNoteToBottom} handleMoveNoteToTop={handleMoveNoteToTop}
                   handleNoteSave={handleSaveNote} handleNoteReorder={handleNoteReorder} handleToggleNotePin={handleToggleNotePin} />
  }
  
  return (
    <ThemeProvider theme={appTheme}>
      <div
        className={classes.root}
        style={{ backgroundColor: appTheme.palette.background.default }}
        onContextMenu={handleMainWindowContextMenu}
      >
        <CssBaseline/>
        <ConfirmationDialog theme={props.theme}
                            open={isDeleteAllNotesDialogOpen}
                            title={t("mainWindow.deleteAllNotesDialog.title")}
                            message={t("mainWindow.deleteAllNotesDialog.message")}
                            confirmLabel={t("mainWindow.deleteAllNotesDialog.confirmLabel")}
                            onConfirm={handleDeleteAllNotes}
                            onCancel={() => setDeleteAllNotesDialogOpen(false)} />
        <WebSettingsDialog theme={props.theme}
                           appSettings={appSettings}
                           open={isSettingsDialogOpen}
                           onClose={() => setSettingsDialogOpen(false)}
                           onAppSettingsChange={props.onAppSettingsChange} />
        {!UserAgent.isElectron && (
          <WebNoteWindowDialog
            theme={props.theme}
            appSettings={appSettings}
            noteId={webNoteWindowNoteId}
            open={webNoteWindowNoteId !== null}
            onClose={() => setWebNoteWindowNoteId(null)}
            onOpenNote={setWebNoteWindowNoteId}
          />
        )}
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
