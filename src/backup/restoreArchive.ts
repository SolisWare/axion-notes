/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { AppThemePreference } from "../settings/AppThemePreference";
import { AppSettings } from "../settings/AppSettings";
import { AppWindowState } from "../settings/AppWindowState";
import { defaultAppSettings } from "../settings/defaultSettings";
import { NoteFontPreference } from "../settings/NoteFontPreference";
import { NoteLayoutPreference } from "../settings/NoteLayoutPreference";
import { NOTE_CONTENT_FONT_SIZE_OPTIONS, NOTE_TITLE_FONT_SIZE_OPTIONS } from "../settings/NoteFontSize";
import { NoteSortOrder } from "../settings/noteSortOrder";
import { NoteColorPreference } from "../settings/noteColorPreference";
import { NoteSizePreference } from "../settings/noteSizePreference";
import { DateFormat } from "../utils/dt-formatter/DateFormat";
import { TimeFormat } from "../utils/dt-formatter/TimeFormat";
import { isSupportedLanguageCode } from "../i18n/languageConfig";
import { NoteColorKey } from "../theme/NoteColors";
import { BackupContentSelection } from "../types/BackupContentSelection";
import { NoteType } from "../types/NoteType";
import { BACKUP_MANIFEST_VERSION, BackupManifest, getBackupPreferences } from "./backupArchive";
import { isValidTimestamp } from "./backupValidation";

const manifestFileName = "manifest.json";
const notesFileName = "notes.json";
const noteOrderFileName = "note-order.json";
const appPreferencesFileName = "app-preferences.json";
const mainWindowStateFileName = "main-window-state.json";
const requiredFileNames = [manifestFileName, notesFileName, noteOrderFileName] as const;
const allowedFileNames = new Set<string>([...requiredFileNames, appPreferencesFileName, mainWindowStateFileName]);
const legacyBackupPreferenceKeys = ["noteContentFontSize", "noteTitleFont", "noteTitleFontSize", "showNoteTitles"] as const;
const noteIdPattern = /^[A-Za-z0-9_-]{1,128}$/;

export type BackupArchiveFile = {
  fileName: string;
  content: string;
};

export type BackupPreferences = ReturnType<typeof getBackupPreferences>;

export type ValidatedBackupArchive = {
  appSettings?: BackupPreferences;
  contentSelection: BackupContentSelection;
  createdAt: string;
  mainWindowState?: AppWindowState;
  noteOrder: string[];
  notes: NoteType[];
};

/**
 * Parses extracted backup archive files into a safe, typed restore payload.
 */
export function parseBackupArchive(files: readonly BackupArchiveFile[]): ValidatedBackupArchive {
  const contents = getArchiveContents(files);
  const manifest = parseManifest(contents.get(manifestFileName));
  const notes = parseNotes(contents.get(notesFileName));
  const noteOrder = parseNoteOrder(contents.get(noteOrderFileName), notes);
  const appSettings = parseOptionalPreferences(contents, manifest.contentSelection);
  const mainWindowState = parseOptionalMainWindowState(contents, manifest.contentSelection);

  return {
    appSettings,
    contentSelection: manifest.contentSelection,
    createdAt: manifest.createdAt,
    mainWindowState,
    noteOrder,
    notes
  };
}

function getArchiveContents(files: readonly BackupArchiveFile[]): Map<string, string> {
  const contents = new Map<string, string>();

  for (const file of files) {
    if (!allowedFileNames.has(file.fileName)) {
      throw new Error(`Backup archive contains an unsupported file: ${file.fileName}`);
    }

    if (contents.has(file.fileName)) {
      throw new Error(`Backup archive contains a duplicate file: ${file.fileName}`);
    }

    if (typeof file.content !== "string") {
      throw new Error(`Backup archive file is not text: ${file.fileName}`);
    }

    contents.set(file.fileName, file.content);
  }

  for (const fileName of requiredFileNames) {
    if (!contents.has(fileName)) {
      throw new Error(`Backup archive is missing required file: ${fileName}`);
    }
  }

  return contents;
}

function parseManifest(content: string | undefined): BackupManifest {
  const manifest = parseJson(content, manifestFileName);

  if (!isRecord(manifest)
    || manifest.version !== BACKUP_MANIFEST_VERSION
    || !isValidTimestamp(manifest.createdAt)
    || !isBackupContentSelection(manifest.contentSelection)
    || !hasOnlyKeys(manifest, ["version", "createdAt", "contentSelection"])) {
    throw new Error("Backup archive manifest has an unsupported format.");
  }

  return manifest as BackupManifest;
}

function parseNotes(content: string | undefined): NoteType[] {
  const serializedNotes = parseJson(content, notesFileName);

  if (!Array.isArray(serializedNotes)) {
    throw new Error("Backup archive notes have an unsupported format.");
  }

  const noteIds = new Set<string>();
  return serializedNotes.map((serializedNote) => {
    const note = parseNote(serializedNote);

    if (noteIds.has(note.id)) {
      throw new Error(`Backup archive contains duplicate note ID: ${note.id}`);
    }

    noteIds.add(note.id);
    return note;
  });
}

function parseNoteOrder(content: string | undefined, notes: readonly NoteType[]): string[] {
  const noteOrder = parseJson(content, noteOrderFileName);

  if (!Array.isArray(noteOrder) || noteOrder.some((noteId) => !isNoteId(noteId))) {
    throw new Error("Backup archive note order has an unsupported format.");
  }

  const noteIds = new Set(notes.map((note) => note.id));
  const orderedIds = new Set(noteOrder);

  if (orderedIds.size !== noteOrder.length
    || orderedIds.size !== noteIds.size
    || noteOrder.some((noteId) => !noteIds.has(noteId))) {
    throw new Error("Backup archive note order does not match its notes.");
  }

  return noteOrder;
}

function parseOptionalPreferences(contents: ReadonlyMap<string, string>, selection: BackupContentSelection): BackupPreferences | undefined {
  const content = contents.get(appPreferencesFileName);

  if (selection.appSettings !== contents.has(appPreferencesFileName)) {
    throw new Error("Backup archive preferences do not match its manifest.");
  }

  if (content === undefined) {
    return undefined;
  }

  const preferences = parseJson(content, appPreferencesFileName);

  if (!isBackupPreferences(preferences)) {
    throw new Error("Backup archive preferences have an unsupported format.");
  }

  return getBackupPreferences({ ...defaultAppSettings, ...preferences } as AppSettings);
}

function parseOptionalMainWindowState(contents: ReadonlyMap<string, string>, selection: BackupContentSelection): AppWindowState | undefined {
  const content = contents.get(mainWindowStateFileName);

  if (selection.mainWindowState !== contents.has(mainWindowStateFileName)) {
    throw new Error("Backup archive main-window state does not match its manifest.");
  }

  if (content === undefined) {
    return undefined;
  }

  const state = parseJson(content, mainWindowStateFileName);

  if (!isAppWindowState(state)) {
    throw new Error("Backup archive main-window state has an unsupported format.");
  }

  return state;
}

function parseNote(value: unknown): NoteType {
  if (!isRecord(value)
    || !isNoteId(value.id)
    || !isEnumValue(NoteColorKey, value.bgcolor)
    || typeof value.content !== "string"
    || !isValidTimestamp(value.createdOn)
    || !isValidTimestamp(value.lastModifiedOn)
    || (value.title !== undefined && typeof value.title !== "string")
    || (value.isPinned !== undefined && typeof value.isPinned !== "boolean")
    || (value.pinnedOn !== undefined && !isValidTimestamp(value.pinnedOn))
    || (value.pinnedFromNoteIds !== undefined && (!Array.isArray(value.pinnedFromNoteIds) || value.pinnedFromNoteIds.some((noteId) => !isNoteId(noteId))))
    || (value.isTitleHidden !== undefined && typeof value.isTitleHidden !== "boolean")
    || (value.isFolded !== undefined && typeof value.isFolded !== "boolean")
    || (value.richContent !== undefined && !isRecord(value.richContent))
    || !hasOnlyAllowedKeys(value, ["id", "bgcolor", "title", "isPinned", "pinnedOn", "pinnedFromNoteIds", "isTitleHidden", "isFolded", "content", "richContent", "createdOn", "lastModifiedOn"])) {
    throw new Error("Backup archive contains a note with an unsupported format.");
  }

  return {
    ...value,
    createdOn: new Date(value.createdOn),
    lastModifiedOn: new Date(value.lastModifiedOn),
    pinnedOn: typeof value.pinnedOn === "string" ? new Date(value.pinnedOn) : undefined
  } as NoteType;
}

function isBackupPreferences(value: unknown): value is BackupPreferences {
  if (!isRecord(value)
    || !hasOnlyAllowedKeys(value, [...getBackupPreferenceKeys(), ...legacyBackupPreferenceKeys])
    || !getBackupPreferenceKeys().every((key) => Object.hasOwn(value, key))) {
    return false;
  }

  return typeof value.showWelcomeScreenOnLaunch === "boolean"
    && typeof value.keepNotesMainWindowOnTop === "boolean"
    && isEnumValue(NoteSortOrder, value.notesSortOrder)
    && isEnumValue(AppThemePreference, value.theme)
    && (isEnumValue(NoteColorKey, value.defaultNoteColor) || value.defaultNoteColor === NoteColorPreference.AUTO)
    && typeof value.language === "string"
    && isSupportedLanguageCode(value.language)
    && isEnumValue(DateFormat, value.dateFormat)
    && isEnumValue(TimeFormat, value.timeFormat)
    && typeof value.richTextEditorEnabled === "boolean"
    && isEnumValue(NoteFontPreference, value.noteFont)
    && isEnumValue(NoteFontPreference, value.titleFont)
    && NOTE_CONTENT_FONT_SIZE_OPTIONS.includes(value.contentFontSize as never)
    && NOTE_TITLE_FONT_SIZE_OPTIONS.includes(value.titleFontSize as never)
    && isEnumValue(NoteSizePreference, value.noteSize)
    && typeof value.showTitles === "boolean"
    && typeof value.showNoteFooters === "boolean"
    && isEnumValue(NoteLayoutPreference, value.noteLayout)
    && typeof value.showFloatingFormatToolbar === "boolean";
}

function getBackupPreferenceKeys(): string[] {
  return Object.keys(getBackupPreferences(defaultAppSettings));
}

function isAppWindowState(value: unknown): value is AppWindowState {
  if (!isRecord(value) || !isRecord(value.bounds) || !hasOnlyKeys(value, ["bounds", "isMaximized"])) {
    return false;
  }

  return typeof value.isMaximized === "boolean"
    && typeof value.bounds.width === "number"
    && Number.isFinite(value.bounds.width)
    && value.bounds.width > 0
    && typeof value.bounds.height === "number"
    && Number.isFinite(value.bounds.height)
    && value.bounds.height > 0
    && (value.bounds.x === undefined || (typeof value.bounds.x === "number" && Number.isFinite(value.bounds.x)))
    && (value.bounds.y === undefined || (typeof value.bounds.y === "number" && Number.isFinite(value.bounds.y)))
    && hasOnlyAllowedKeys(value.bounds, ["x", "y", "width", "height"]);
}

function isBackupContentSelection(value: unknown): value is BackupContentSelection {
  return isRecord(value)
    && typeof value.appSettings === "boolean"
    && typeof value.mainWindowState === "boolean"
    && hasOnlyKeys(value, ["appSettings", "mainWindowState"]);
}

function isNoteId(value: unknown): value is string {
  return typeof value === "string" && noteIdPattern.test(value);
}

function isEnumValue<T extends Record<string, string | number>>(values: T, value: unknown): value is T[keyof T] {
  return Object.values(values).includes(value as T[keyof T]);
}

function parseJson(content: string | undefined, fileName: string): unknown {
  if (content === undefined) {
    throw new Error(`Backup archive is missing required file: ${fileName}`);
  }

  try {
    return JSON.parse(content);
  } catch {
    throw new Error(`Backup archive file is not valid JSON: ${fileName}`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}


function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return hasOnlyAllowedKeys(value, keys)
    && keys.every((key) => Object.hasOwn(value, key));
}

function hasOnlyAllowedKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const expectedKeys = new Set(keys);
  return Object.keys(value).every((key) => expectedKeys.has(key));
}
