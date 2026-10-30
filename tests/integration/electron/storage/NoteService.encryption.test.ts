/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { EncryptionKeyService } from "../../../../electron/security/EncryptionKeyService";
import { EncryptionService } from "../../../../electron/security/EncryptionService";
import { NoteService } from "../../../../electron/storage/NoteService";
import { NoteType } from "../../../../src/models/NoteType";
import { NoteColorKey } from "../../../../src/theme/NoteColors";

const password = "correct horse battery staple";
const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => fs.promises.rm(directory, { force: true, recursive: true })));
});

describe("NoteService encrypted storage", () => {
  it("encrypts a complete plaintext vault and restores it exactly after restart and unlock", async () => {
    const context = await createContext();
    const notes = createNotes();
    await writePlaintextNotes(context.appDataDir, notes);
    const service = createService(context);

    await service.enableEncryption(password);

    expect(await service.hasEncryptionRecord()).toBe(true);
    expect(await fs.promises.readdir(context.appDataDir)).toEqual(["notes", "notes.manifest"]);
    expect(await readTree(context.rootDir)).not.toContain("Highly confidential title");
    expect(await readTree(context.rootDir)).not.toContain("sensitive checklist item");

    const restartedService = createService(context);
    restartedService.applyEncryptionSetting(true);
    expect(await restartedService.getNotes()).toEqual([]);

    await restartedService.unlockEncryption(password);
    expect(serializeNotes(await restartedService.getNotes())).toEqual(serializeNotes(notes));
  });

  it("decrypts back to the original plaintext layout without changing notes", async () => {
    const context = await createEncryptedContext();
    const unlockedService = createService(context);
    unlockedService.applyEncryptionSetting(true);
    await unlockedService.unlockEncryption(password);

    const decryptedNotes = await unlockedService.disableEncryption(password);

    expect(serializeNotes(decryptedNotes)).toEqual(serializeNotes(context.notes));
    expect(await fs.promises.readdir(context.appDataDir)).toEqual(["note-1.json", "note-2.json", "note-order.json"]);
    await expect(fs.promises.access(context.encryptionRecordPath)).rejects.toMatchObject({ code: "ENOENT" });

    const restartedService = createService(context);
    expect(serializeNotes(await restartedService.getNotes())).toEqual(serializeNotes(context.notes));
  });

  it("persists encrypted updates, additions, order changes, and deletion across restart", async () => {
    const context = await createEncryptedContext();
    const service = createService(context);
    service.applyEncryptionSetting(true);
    await service.unlockEncryption(password);

    const updatedFirstNote = {
      ...context.notes[0],
      content: "Updated encrypted note content"
    };
    const addedNote = createNote("note-3", "New encrypted note", "Added encrypted note content", new Date("2026-10-29T13:00:00.000Z"));
    service.setNote(updatedFirstNote);
    await waitForEncryptedNotes(context, [updatedFirstNote, context.notes[1]]);

    service.setNote(addedNote);
    await waitForEncryptedNotes(context, [updatedFirstNote, context.notes[1], addedNote]);

    service.setNoteOrder([addedNote.id, updatedFirstNote.id, context.notes[1].id]);
    await waitForEncryptedNotes(context, [addedNote, updatedFirstNote, context.notes[1]]);

    service.deleteNote(context.notes[1].id);
    await waitForEncryptedNotes(context, [addedNote, updatedFirstNote]);
  });

  it("keeps encrypted data unchanged when an incorrect password is used", async () => {
    const context = await createEncryptedContext();
    const before = await readTree(context.rootDir);
    const service = createService(context);
    service.applyEncryptionSetting(true);

    await expect(service.unlockEncryption("wrong password")).rejects.toThrow();

    expect(await readTree(context.rootDir)).toBe(before);
    expect(service.hasPlaintextCache()).toBe(false);
    expect(await service.getNotes()).toEqual([]);
  });

  it("retains encrypted notes when the encryption password changes", async () => {
    const context = await createEncryptedContext();
    const service = createService(context);
    service.applyEncryptionSetting(true);
    await service.unlockEncryption(password);

    await service.changeEncryptionPassword(password, "new secure password");

    const restartedService = createService(context);
    restartedService.applyEncryptionSetting(true);
    await expect(restartedService.unlockEncryption(password)).rejects.toThrow();
    await restartedService.unlockEncryption("new secure password");
    expect(serializeNotes(await restartedService.getNotes())).toEqual(serializeNotes(context.notes));
  });

  it("clears decrypted notes and key material until a subsequent successful unlock", async () => {
    const context = await createEncryptedContext();
    const service = createService(context);
    service.applyEncryptionSetting(true);
    await service.unlockEncryption(password);
    expect(service.hasPlaintextCache()).toBe(true);

    service.clearPlaintextCache();

    expect(service.hasPlaintextCache()).toBe(false);
    expect(service.isEncryptionUnlocked()).toBe(false);
    expect(await service.getNotes()).toEqual([]);

    await service.unlockEncryption(password);
    expect(serializeNotes(await service.getNotes())).toEqual(serializeNotes(context.notes));
  });
});

async function createEncryptedContext(): Promise<TestContext & { notes: NoteType[] }> {
  const context = await createContext();
  const notes = createNotes();
  await writePlaintextNotes(context.appDataDir, notes);
  await createService(context).enableEncryption(password);

  return {
    ...context,
    notes
  };
}

async function createContext(): Promise<TestContext> {
  const rootDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "axion-notes-encryption-storage-"));
  temporaryDirectories.push(rootDir);

  return {
    rootDir,
    appDataDir: path.join(rootDir, "notes-data"),
    encryptionRecordPath: path.join(rootDir, "security", "encryption.json")
  };
}

function createService(context: TestContext): NoteService {
  const encryptionService = new EncryptionService();

  return new NoteService(
    context.appDataDir,
    context.encryptionRecordPath,
    encryptionService,
    new EncryptionKeyService(encryptionService)
  );
}

async function writePlaintextNotes(appDataDir: string, notes: NoteType[]): Promise<void> {
  await fs.promises.mkdir(appDataDir, { recursive: true });
  await Promise.all(notes.map((note) => fs.promises.writeFile(path.join(appDataDir, `${note.id}.json`), JSON.stringify(note), "utf-8")));
  await fs.promises.writeFile(path.join(appDataDir, "note-order.json"), JSON.stringify(notes.map((note) => note.id)), "utf-8");
}

async function waitForEncryptedNotes(context: TestContext, expectedNotes: NoteType[]): Promise<void> {
  const timeoutAt = Date.now() + 5_000;
  let lastError: unknown;

  while (Date.now() < timeoutAt) {
    try {
      const service = createService(context);
      service.applyEncryptionSetting(true);
      await service.unlockEncryption(password);

      if (JSON.stringify(serializeNotes(await service.getNotes())) === JSON.stringify(serializeNotes(expectedNotes))) {
        return;
      }
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 25));
  }

  throw lastError ?? new Error("Encrypted note update did not persist before the timeout.");
}

async function readTree(directory: string): Promise<string> {
  const entries = await fs.promises.readdir(directory, { withFileTypes: true });
  const contents = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);

    return entry.isDirectory() ? readTree(entryPath) : fs.promises.readFile(entryPath, "utf-8");
  }));

  return contents.join("\n");
}

function createNotes(): NoteType[] {
  return [
    createNote("note-1", "Highly confidential title", "sensitive checklist item\n🔐 Zażółć gęślą jaźń", new Date("2026-10-29T10:00:00.000Z")),
    {
      ...createNote("note-2", "Second title", "", new Date("2026-10-29T11:00:00.000Z")),
      isPinned: true,
      pinnedOn: new Date("2026-10-29T12:00:00.000Z"),
      pinnedFromNoteIds: ["note-1"],
      isTitleHidden: true,
      isFolded: true,
      richContent: {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "Rich encrypted content" }] }]
      }
    }
  ];
}

function createNote(id: string, title: string, content: string, createdOn: Date): NoteType {
  return {
    id,
    bgcolor: NoteColorKey.TEAL,
    title,
    content,
    createdOn,
    lastModifiedOn: new Date(createdOn.getTime() + 1_000)
  };
}

function serializeNotes(notes: NoteType[]): unknown[] {
  return notes.map((note) => ({
    ...note,
    createdOn: note.createdOn.toISOString(),
    lastModifiedOn: note.lastModifiedOn.toISOString(),
    pinnedOn: note.pinnedOn?.toISOString()
  }));
}

type TestContext = {
  rootDir: string;
  appDataDir: string;
  encryptionRecordPath: string;
};
