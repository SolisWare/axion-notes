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
import NoteSelectionToolbar from "../../components/NoteSelectionToolbar";
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
  const [isDeleteSelectedNotesDialogOpen, setDeleteSelectedNotesDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [webNoteWindowNoteId, setWebNoteWindowNoteId] = useState<string | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());
  const currentNotesSortOrder = useRef(appSettings.notesSortOrder);
  const previousShowNoteTitles = useRef(appSettings.showNoteTitles);
  const openNoteWindowNoteIds = useRef<Set<string>>(new Set());
    
  const isDeleteAllButtonDisabled = notes.length === 0;
  const isSelectNotesButtonDisabled = notes.length === 0 || isSelectionMode;
  const selectedNoteCount = selectedNoteIds.size;
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

  const handleToggleSelectAllNotes = useCallback(() => {
    setSelectedNoteIds((currentSelectedNoteIds) => {
      if (notes.length > 0 && currentSelectedNoteIds.size === notes.length) {
        return new Set();
      }

      setIsSelectionMode(true);
      return new Set(notes.map((note) => note.id));
    });
  }, [notes]);

  const handleCancelNoteSelection = useCallback(() => {
    setSelectedNoteIds(new Set());
    setIsSelectionMode(false);
  }, []);

  const handleClearNoteSelection = useCallback(() => {
    setSelectedNoteIds(new Set());
  }, []);

  useEffect(() => {
    window.api.menu.setLockScreenActive(false);
  }, []);

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
    return window.api.noteWindow.onClosed((noteId) => {
      openNoteWindowNoteIds.current.delete(noteId);
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
    const offMenuLockNotes = window.api.menu.onMenuLockNotes(() => navigate(AppView.lock));
    const offMenuShowWelcome = window.api.menu.onMenuShowWelcome(() => navigate(AppView.welcome));
    const offMenuSelectNote = window.api.menu.onMenuSelectNote(() => setIsSelectionMode(true));
    const offMenuSelectAllNotes = window.api.menu.onMenuSelectAllNotes(handleToggleSelectAllNotes);
    const offMenuCancelNoteSelection = window.api.menu.onMenuCancelNoteSelection(handleCancelNoteSelection);
    const offMenuDeleteAllNotes = window.api.menu.onMenuDeleteAllNotes(() => setDeleteAllNotesDialogOpen(true));

    return () => {
      offMenuNewNote();
      offMenuLockNotes();
      offMenuShowWelcome();
      offMenuSelectNote();
      offMenuSelectAllNotes();
      offMenuCancelNoteSelection();
      offMenuDeleteAllNotes();
    };
  }, [handleAddNote, handleCancelNoteSelection, handleToggleSelectAllNotes, navigate]);

  useEffect(() => {
    window.api.menu.setDeleteAllNotesEnabled(notes.length > 0);
  }, [notes.length]);

  useEffect(() => {
    const availableNoteIds = new Set(notes.map((note) => note.id));

    if (notes.length === 0) {
      setIsSelectionMode(false);
    }

    setSelectedNoteIds((currentSelectedNoteIds) => {
      const nextSelectedNoteIds = new Set(
        [...currentSelectedNoteIds].filter((noteId) => availableNoteIds.has(noteId))
      );

      return nextSelectedNoteIds.size === currentSelectedNoteIds.size
        ? currentSelectedNoteIds
        : nextSelectedNoteIds;
    });
  }, [notes]);

  useEffect(() => {
    const hasNotes = notes.length > 0;

    window.api.menu.setNoteSelectionState({
      hasNotes,
      isSelectionMode,
      areAllNotesSelected: hasNotes && selectedNoteIds.size === notes.length
    });
  }, [isSelectionMode, notes.length, selectedNoteIds]);

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

  function handleEnterSelectionMode() {
    setIsSelectionMode(true);
  }

  function handleSelectNoteSelection(noteId: string) {
    setIsSelectionMode(true);
    setSelectedNoteIds((currentSelectedNoteIds) => {
      const nextSelectedNoteIds = new Set(currentSelectedNoteIds);
      nextSelectedNoteIds.add(noteId);

      return nextSelectedNoteIds;
    });
  }

  function handleDeselectNoteSelection(noteId: string) {
    setSelectedNoteIds((currentSelectedNoteIds) => {
      const nextSelectedNoteIds = new Set(currentSelectedNoteIds);
      nextSelectedNoteIds.delete(noteId);

      if (nextSelectedNoteIds.size === 0) {
        setIsSelectionMode(false);
      }

      return nextSelectedNoteIds;
    });
  }

  function handleToggleNoteSelection(noteId: string) {
    setIsSelectionMode(true);
    setSelectedNoteIds((currentSelectedNoteIds) => {
      const nextSelectedNoteIds = new Set(currentSelectedNoteIds);

      if (nextSelectedNoteIds.has(noteId)) {
        nextSelectedNoteIds.delete(noteId);
      } else {
        nextSelectedNoteIds.add(noteId);
      }

      return nextSelectedNoteIds;
    });
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

  const handleDuplicateSelectedNotes = useCallback(() => {
    if (selectedNoteIds.size === 0) {
      return;
    }

    const selectedNoteIdSet = new Set(selectedNoteIds);
    const now = new Date();

    setNotes((prevNotes) => {
      const nextNotes = prevNotes.flatMap((note) => {
        if (!selectedNoteIdSet.has(note.id)) {
          return [note];
        }

        const duplicatedNote = {
          ...note,
          id: nanoid(),
          pinnedOn: isPinnedNote(note) ? now : note.pinnedOn,
          pinnedFromNoteIds: undefined,
          createdOn: now,
          lastModifiedOn: now
        };

        window.api.storage.setNote(duplicatedNote);

        return [note, duplicatedNote];
      });

      if (currentNotesSortOrder.current === NoteSortOrder.CUSTOM || nextNotes.some((note) => selectedNoteIdSet.has(note.id) && isPinnedNote(note))) {
        window.api.storage.setNoteOrder(nextNotes.map((note) => note.id));
      }

      return nextNotes;
    });

    setSelectedNoteIds(new Set());
    setIsSelectionMode(false);
  }, [selectedNoteIds]);

  useEffect(() => {
    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (
        props.view !== AppView.home
        || isDeleteAllNotesDialogOpen
        || isDeleteSelectedNotesDialogOpen
        || isSettingsDialogOpen
        || webNoteWindowNoteId !== null
      ) {
        return;
      }

      const isModifierPressed = window.api.os.isMac ? event.metaKey : event.ctrlKey;
      const key = event.key.toLowerCase();

      if (event.key === "Escape" && isSelectionMode) {
        event.preventDefault();

        if (selectedNoteIds.size > 0) {
          setSelectedNoteIds(new Set());
          return;
        }

        setIsSelectionMode(false);
        return;
      }

      if (!isModifierPressed || event.altKey || notes.length === 0) {
        return;
      }

      if (event.shiftKey && key === "a" && !isSelectionMode) {
        event.preventDefault();
        setIsSelectionMode(true);
        return;
      }

      if (event.shiftKey && key === "d" && isSelectionMode && selectedNoteIds.size > 0) {
        event.preventDefault();
        handleDuplicateSelectedNotes();
        return;
      }

      if (!event.shiftKey && key === "a" && isSelectionMode) {
        event.preventDefault();
        setSelectedNoteIds(new Set(notes.map((note) => note.id)));
      }
    };

    document.addEventListener("keydown", handleDocumentKeyDown);

    return () => {
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [
    handleDuplicateSelectedNotes,
    isDeleteAllNotesDialogOpen,
    isDeleteSelectedNotesDialogOpen,
    isSelectionMode,
    isSettingsDialogOpen,
    notes,
    props.view,
    selectedNoteIds.size,
    webNoteWindowNoteId
  ]);

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
    if (openNoteWindowNoteIds.current.has(noteId)) {
      return;
    }

    openNoteWindowNoteIds.current.add(noteId);

    if (UserAgent.isElectron) {
      window.api.noteWindow.open(noteId, {
        offsetFromCurrentWindow: true
      });
      return;
    }

    setWebNoteWindowNoteId(noteId);
  }

  function handleCloseWebNoteWindow() {
    if (webNoteWindowNoteId) {
      openNoteWindowNoteIds.current.delete(webNoteWindowNoteId);
    }

    setWebNoteWindowNoteId(null);
  }

  function handleOpenWebNoteWindow(noteId: string) {
    if (webNoteWindowNoteId && webNoteWindowNoteId !== noteId) {
      openNoteWindowNoteIds.current.delete(webNoteWindowNoteId);
    }

    handleOpenNoteWindow(noteId);
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

  function handleDeleteSelectedNotes() {
    if (selectedNoteIds.size === 0) {
      return;
    }

    const selectedNoteIdSet = new Set(selectedNoteIds);

    setNotes((prevNotes) => prevNotes.filter((note) => !selectedNoteIdSet.has(note.id)));
    selectedNoteIdSet.forEach((noteId) => window.api.storage.deleteNote(noteId));
    setSelectedNoteIds(new Set());
    setIsSelectionMode(false);
    setDeleteSelectedNotesDialogOpen(false);
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
                   noteTitleFont={appSettings.noteTitleFont}
                   noteContentFontSize={appSettings.noteContentFontSize} noteTitleFontSize={appSettings.noteTitleFontSize}
                   richTextEditorEnabled={appSettings.richTextEditorEnabled}
                   noteLayout={appSettings.noteLayout} noteSize={appSettings.noteSize} showNoteTitles={appSettings.showNoteTitles} showNoteFooters={appSettings.showNoteFooters}
                   showFloatingFormatToolbar={appSettings.showFloatingFormatToolbar} handleDeleteNoteButton={handleDeleteNote} handleDuplicateNote={handleDuplicateNote}
                   handleOpenNoteWindow={handleOpenNoteWindow} handleMoveNoteToBottom={handleMoveNoteToBottom} handleMoveNoteToTop={handleMoveNoteToTop}
                   handleNoteSave={handleSaveNote} handleNoteReorder={handleNoteReorder} handleToggleNotePin={handleToggleNotePin}
                   isSelectionMode={isSelectionMode} selectedNoteIds={selectedNoteIds} onEnterSelectionMode={handleEnterSelectionMode}
                   onSelectNoteSelection={handleSelectNoteSelection} onDeselectNoteSelection={handleDeselectNoteSelection}
                   onToggleNoteSelection={handleToggleNoteSelection} />
      break;
    default:
      page = <Home theme={props.theme} notes={notes} dateFormat={appSettings.dateFormat} timeFormat={appSettings.timeFormat} noteFont={appSettings.noteFont}
                   noteTitleFont={appSettings.noteTitleFont}
                   noteContentFontSize={appSettings.noteContentFontSize} noteTitleFontSize={appSettings.noteTitleFontSize}
                   richTextEditorEnabled={appSettings.richTextEditorEnabled}
                   noteLayout={appSettings.noteLayout} noteSize={appSettings.noteSize} showNoteTitles={appSettings.showNoteTitles} showNoteFooters={appSettings.showNoteFooters}
                   showFloatingFormatToolbar={appSettings.showFloatingFormatToolbar} handleDeleteNoteButton={handleDeleteNote} handleDuplicateNote={handleDuplicateNote}
                   handleOpenNoteWindow={handleOpenNoteWindow} handleMoveNoteToBottom={handleMoveNoteToBottom} handleMoveNoteToTop={handleMoveNoteToTop}
                   handleNoteSave={handleSaveNote} handleNoteReorder={handleNoteReorder} handleToggleNotePin={handleToggleNotePin}
                   isSelectionMode={isSelectionMode} selectedNoteIds={selectedNoteIds} onEnterSelectionMode={handleEnterSelectionMode}
                   onSelectNoteSelection={handleSelectNoteSelection} onDeselectNoteSelection={handleDeselectNoteSelection}
                   onToggleNoteSelection={handleToggleNoteSelection} />
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
        <ConfirmationDialog theme={props.theme}
                            open={isDeleteSelectedNotesDialogOpen}
                            title={t("mainWindow.noteSelectionToolbar.deleteDialogTitle")}
                            message={t("mainWindow.noteSelectionToolbar.deleteDialogMessage")}
                            confirmLabel={t("mainWindow.noteSelectionToolbar.deleteDialogConfirmLabel")}
                            onConfirm={handleDeleteSelectedNotes}
                            onCancel={() => setDeleteSelectedNotesDialogOpen(false)} />
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
            onClose={handleCloseWebNoteWindow}
            onOpenNote={handleOpenWebNoteWindow}
          />
        )}
        <nav className={classes.menu}>
          {/* In-app menu goes here. */}
        </nav>
        <div className={classes.app}>
          {shouldShowToolbar &&
            <WebToolbar theme={props.theme} title="Axion Notes" handleAddNoteButton={handleAddNote}
                        isDeleteAllButtonDisabled={isDeleteAllButtonDisabled}
                        isSelectNotesButtonDisabled={isSelectNotesButtonDisabled}
                        handleSelectNotesButton={() => setIsSelectionMode(true)}
                        handleDeleteAllNotesButton={() => setDeleteAllNotesDialogOpen(true)}
                        handleSettingsButton={() => setSettingsDialogOpen(true)} />
          }
          <main className={classes.content}>
            { page }
          </main>
          {isSelectionMode && (
            <NoteSelectionToolbar
              theme={props.theme}
              selectedCount={selectedNoteCount}
              onDeleteSelectedNotes={() => setDeleteSelectedNotesDialogOpen(true)}
              onDuplicateSelectedNotes={handleDuplicateSelectedNotes}
              onClearSelection={handleClearNoteSelection}
              onCancelSelection={handleCancelNoteSelection}
            />
          )}
        </div>
      </div>
    </ThemeProvider>
  );
}

export default MainWindow;
