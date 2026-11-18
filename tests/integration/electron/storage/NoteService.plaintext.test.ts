/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EncryptionKeyService } from "../../../../electron/security/EncryptionKeyService";
import { EncryptionService } from "../../../../electron/security/EncryptionService";
import { NoteService } from "../../../../electron/storage/NoteService";
import { NoteType } from "../../../../src/types/NoteType";
import { NoteColorKey } from "../../../../src/theme/NoteColors";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(temporaryDirectories.splice(0).map((directory) => fs.promises.rm(directory, { force: true, recursive: true })));
});

describe("NoteService plaintext storage", () => {
  it("persists rapid plaintext changes in call order across a restart", async () => {
    const context = await createContext();
    const original = createNote("note-1", "Original", "Original content", 1);
    const updated = { ...original, content: "Updated content", lastModifiedOn: new Date("2026-11-18T12:05:00.000Z") };
    const second = createNote("note-2", "Second", "Second content", 2);
    const service = createService(context);

    service.setNote(original);
    service.setNote(updated);
    service.setNote(second);
    service.setNoteOrder([second.id, updated.id]);
    service.deleteNote(original.id);

    await expectPersistedNotes(context, [second]);
  });

  it("keeps only the final rapid update for the same plaintext note", async () => {
    const context = await createContext();
    const service = createService(context);
    const note = createNote("note-1", "Rapid", "Version 0", 0);

    for (let version = 0; version < 20; version += 1) {
      service.setNote({
        ...note,
        content: `Version ${version}`,
        lastModifiedOn: new Date(Date.UTC(2026, 10, 18, 12, 0, version))
      });
    }

    await expectPersistedNotes(context, [{
      ...note,
      content: "Version 19",
      lastModifiedOn: new Date(Date.UTC(2026, 10, 18, 12, 0, 19))
    }]);
  });

  it("returns an empty library for a missing directory and skips corrupt plaintext notes", async () => {
    const context = await createContext();
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    await expect(createService(context).getNotes()).resolves.toEqual([]);
    await fs.promises.mkdir(context.appDataDir, { recursive: true });
    const validNote = createNote("valid-note", "Valid", "Valid content", 1);
    await fs.promises.writeFile(path.join(context.appDataDir, "valid-note.json"), JSON.stringify(validNote), "utf-8");
    await fs.promises.writeFile(path.join(context.appDataDir, "corrupt-note.json"), "not JSON", "utf-8");
    await fs.promises.writeFile(path.join(context.appDataDir, "note-order.json"), JSON.stringify(["valid-note", "corrupt-note"]), "utf-8");

    await expect(createService(context).getNotes()).resolves.toEqual([validNote]);
    expect(warning).toHaveBeenCalledWith("Skipping corrupt note file: corrupt-note.json");
  });

  it("deletes every plaintext note while retaining unrelated files", async () => {
    const context = await createContext();
    const service = createService(context);
    service.setNote(createNote("note-1", "First", "First content", 1));
    service.setNote(createNote("note-2", "Second", "Second content", 2));
    await expectPersistedNotes(context, [
      createNote("note-1", "First", "First content", 1),
      createNote("note-2", "Second", "Second content", 2)
    ]);
    await fs.promises.writeFile(path.join(context.appDataDir, "keep.txt"), "keep", "utf-8");

    service.deleteAllNotes();

    await expect.poll(async () => fs.promises.readdir(context.appDataDir)).toEqual(["keep.txt"]);
    await expect(createService(context).getNotes()).resolves.toEqual([]);
  });
});

async function createContext(): Promise<{ appDataDir: string; encryptionRecordPath: string }> {
  const rootDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "axion-notes-plaintext-storage-"));
  temporaryDirectories.push(rootDir);

  return {
    appDataDir: path.join(rootDir, "data"),
    encryptionRecordPath: path.join(rootDir, "security", "encryption.json")
  };
}

function createService(context: { appDataDir: string; encryptionRecordPath: string }): NoteService {
  const encryptionService = new EncryptionService();

  return new NoteService(
    context.appDataDir,
    context.encryptionRecordPath,
    encryptionService,
    new EncryptionKeyService(encryptionService)
  );
}

function createNote(id: string, title: string, content: string, seconds: number): NoteType {
  const createdOn = new Date(Date.UTC(2026, 10, 18, 12, 0, seconds));

  return {
    id,
    bgcolor: NoteColorKey.TEAL,
    title,
    content,
    createdOn,
    lastModifiedOn: createdOn
  };
}

async function expectPersistedNotes(
  context: { appDataDir: string; encryptionRecordPath: string },
  expectedNotes: NoteType[]
): Promise<void> {
  await expect.poll(async () => serializeNotes(await createService(context).getNotes())).toEqual(serializeNotes(expectedNotes));
}

function serializeNotes(notes: NoteType[]): unknown[] {
  return notes.map((note) => ({
    ...note,
    createdOn: note.createdOn.toISOString(),
    lastModifiedOn: note.lastModifiedOn.toISOString(),
    pinnedOn: note.pinnedOn?.toISOString()
  }));
}
