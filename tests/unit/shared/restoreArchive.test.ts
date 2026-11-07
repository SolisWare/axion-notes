/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { describe, expect, it } from "vitest";
import { BackupArchiveFile, parseBackupArchive } from "../../../src/backup/restoreArchive";
import { createBackupArchiveEntries } from "../../../src/backup/backupArchive";
import { defaultAppSettings } from "../../../src/settings/defaultSettings";

describe("restoreArchive", () => {
  it("parses a valid notes-only archive and hydrates note dates", () => {
    const archive = parseBackupArchive(createArchiveFiles());

    expect(archive).toMatchObject({
      contentSelection: { appSettings: false, mainWindowState: false },
      createdAt: "2026-11-07T12:00:00.000Z",
      noteOrder: ["note-1"],
      notes: [{ id: "note-1", content: "Restored note" }]
    });
    expect(archive.notes[0].createdOn).toEqual(new Date("2026-11-07T10:00:00.000Z"));
    expect(archive.appSettings).toBeUndefined();
    expect(archive.mainWindowState).toBeUndefined();
  });

  it("parses optional preferences and desktop window state only when declared", () => {
    const archive = parseBackupArchive(createArchiveFiles({
      appSettings: defaultAppSettings,
      contentSelection: { appSettings: true, mainWindowState: true },
      mainWindowState: {
        bounds: { height: 800, width: 1250, x: 40, y: 50 },
        isMaximized: false
      }
    }));

    expect(archive.appSettings).toMatchObject({ language: defaultAppSettings.language });
    expect(archive.appSettings).not.toHaveProperty("notesEncryptionEnabled");
    expect(archive.mainWindowState).toEqual({
      bounds: { height: 800, width: 1250, x: 40, y: 50 },
      isMaximized: false
    });
  });

  it("strips known legacy preference keys from an earlier backup writer", () => {
    const archiveFiles = createArchiveFiles({
      appSettings: defaultAppSettings,
      contentSelection: { appSettings: true, mainWindowState: false }
    });
    const preferences = getFile(archiveFiles, "app-preferences.json");
    preferences.content = JSON.stringify({
      ...JSON.parse(preferences.content),
      noteContentFontSize: 14,
      noteTitleFont: "system",
      noteTitleFontSize: 16,
      showNoteTitles: true
    });

    const archive = parseBackupArchive(archiveFiles);

    expect(archive.appSettings).toMatchObject({
      contentFontSize: defaultAppSettings.contentFontSize,
      showTitles: defaultAppSettings.showTitles,
      titleFont: defaultAppSettings.titleFont,
      titleFontSize: defaultAppSettings.titleFontSize
    });
    expect(archive.appSettings).not.toHaveProperty("noteContentFontSize");
    expect(archive.appSettings).not.toHaveProperty("noteTitleFont");
    expect(archive.appSettings).not.toHaveProperty("noteTitleFontSize");
    expect(archive.appSettings).not.toHaveProperty("showNoteTitles");
  });

  it("rejects missing, unknown, and duplicate archive entries", () => {
    const archive = createArchiveFiles();

    expect(() => parseBackupArchive(archive.filter((file) => file.fileName !== "notes.json"))).toThrow("missing required file: notes.json");
    expect(() => parseBackupArchive([...archive, { fileName: "other.json", content: "{}" }])).toThrow("unsupported file: other.json");
    expect(() => parseBackupArchive([...archive, archive[0]])).toThrow("duplicate file: manifest.json");
  });

  it("rejects a manifest that does not match optional archive entries", () => {
    const archive = createArchiveFiles();
    const manifest = getFile(archive, "manifest.json");
    manifest.content = JSON.stringify({
      ...JSON.parse(manifest.content),
      contentSelection: { appSettings: true, mainWindowState: false }
    });

    expect(() => parseBackupArchive(archive)).toThrow("preferences do not match its manifest");

    const unexpectedPreferencesArchive = createArchiveFiles();
    unexpectedPreferencesArchive.push({ fileName: "app-preferences.json", content: "" });

    expect(() => parseBackupArchive(unexpectedPreferencesArchive)).toThrow("preferences do not match its manifest");
  });

  it("rejects unsafe note IDs, duplicate note IDs, and mismatched note order", () => {
    const unsafeIdArchive = createArchiveFiles();
    getFile(unsafeIdArchive, "notes.json").content = JSON.stringify([{
      ...getSerializedNote(),
      id: "../unsafe"
    }]);

    expect(() => parseBackupArchive(unsafeIdArchive)).toThrow("note with an unsupported format");

    const duplicateIdArchive = createArchiveFiles();
    getFile(duplicateIdArchive, "notes.json").content = JSON.stringify([getSerializedNote(), getSerializedNote()]);

    expect(() => parseBackupArchive(duplicateIdArchive)).toThrow("duplicate note ID: note-1");

    const mismatchedOrderArchive = createArchiveFiles();
    getFile(mismatchedOrderArchive, "note-order.json").content = JSON.stringify(["missing-note"]);

    expect(() => parseBackupArchive(mismatchedOrderArchive)).toThrow("note order does not match its notes");
  });

  it("rejects security settings and malformed optional content", () => {
    const preferencesArchive = createArchiveFiles({
      appSettings: defaultAppSettings,
      contentSelection: { appSettings: true, mainWindowState: false }
    });
    getFile(preferencesArchive, "app-preferences.json").content = JSON.stringify({
      ...JSON.parse(getFile(preferencesArchive, "app-preferences.json").content),
      lockScreenEnabled: true
    });

    expect(() => parseBackupArchive(preferencesArchive)).toThrow("preferences have an unsupported format");

    const windowStateArchive = createArchiveFiles({
      contentSelection: { appSettings: false, mainWindowState: true },
      mainWindowState: {
        bounds: { height: 800, width: 1250 },
        isMaximized: false
      }
    });
    getFile(windowStateArchive, "main-window-state.json").content = JSON.stringify({
      bounds: { height: 800, width: -1 },
      isMaximized: false
    });

    expect(() => parseBackupArchive(windowStateArchive)).toThrow("main-window state has an unsupported format");
  });
});

function createArchiveFiles(overrides: Record<string, unknown> = {}): BackupArchiveFile[] {
  const content = {
    contentSelection: { appSettings: false, mainWindowState: false },
    createdAt: "2026-11-07T12:00:00.000Z",
    notes: [{
      bgcolor: "yellow" as const,
      content: "Restored note",
      createdOn: new Date("2026-11-07T10:00:00.000Z"),
      id: "note-1",
      lastModifiedOn: new Date("2026-11-07T11:00:00.000Z")
    }],
    ...overrides
  };

  return createBackupArchiveEntries(content).map((entry) => ({
    content: JSON.stringify(entry.value),
    fileName: entry.fileName
  }));
}

function getFile(archive: BackupArchiveFile[], fileName: string): BackupArchiveFile {
  const file = archive.find((entry) => entry.fileName === fileName);

  if (!file) {
    throw new Error(`Missing test archive file: ${fileName}`);
  }

  return file;
}

function getSerializedNote(): Record<string, unknown> {
  return {
    bgcolor: "yellow",
    content: "Restored note",
    createdOn: "2026-11-07T10:00:00.000Z",
    id: "note-1",
    lastModifiedOn: "2026-11-07T11:00:00.000Z"
  };
}
