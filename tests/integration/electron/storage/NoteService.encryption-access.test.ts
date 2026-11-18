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
import { NoteType } from "../../../../src/types/NoteType";
import { NoteColorKey } from "../../../../src/theme/NoteColors";

const password = "correct horse battery staple";
const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => fs.promises.rm(directory, { force: true, recursive: true })));
});

describe("NoteService encrypted access", () => {
  it("reads a locked encrypted library for backup without unlocking the live note cache", async () => {
    const context = await createEncryptedContext();
    const service = createService(context);
    service.applyEncryptionSetting(true);

    await expect(service.getNotesForBackup()).rejects.toThrow("encryption password is required for backup");
    await expect(service.getNotesForBackup(password)).resolves.toEqual(context.notes);

    expect(service.isEncryptionUnlocked()).toBe(false);
    expect(service.hasPlaintextCache()).toBe(false);
    await expect(service.getNotes()).resolves.toEqual([]);
  });

  it("verifies passwords without unlocking an encrypted library", async () => {
    const context = await createEncryptedContext();
    const service = createService(context);
    service.applyEncryptionSetting(true);

    await expect(service.verifyEncryptionPassword("wrong password")).resolves.toBe(false);
    await expect(service.verifyEncryptionPassword(password)).resolves.toBe(true);

    expect(service.isEncryptionUnlocked()).toBe(false);
    expect(service.hasPlaintextCache()).toBe(false);
  });

  it("reports encrypted plaintext-cache availability and supports listener removal", async () => {
    const context = await createEncryptedContext();
    const service = createService(context);
    const cacheStates: boolean[] = [];
    const unsubscribe = service.onPlaintextCacheStateChange((hasPlaintextCache) => cacheStates.push(hasPlaintextCache));

    service.applyEncryptionSetting(true);
    await service.unlockEncryption(password);
    service.clearPlaintextCache();
    unsubscribe();
    service.applyEncryptionSetting(false);

    expect(cacheStates).toEqual([false, true, false]);
  });

  it("migrates legacy encrypted JSON notes to the encrypted manifest format after unlock", async () => {
    const context = await createLegacyEncryptedContext();
    const service = createService(context);
    service.applyEncryptionSetting(true);

    await service.unlockEncryption(password);

    await expect(service.getNotes()).resolves.toEqual(context.notes);
    await expect(fs.promises.readdir(context.appDataDir)).resolves.toEqual(["notes", "notes.manifest"]);
    await expect(fs.promises.access(path.join(context.appDataDir, "note-1.json"))).rejects.toMatchObject({ code: "ENOENT" });
  });
});

async function createEncryptedContext(): Promise<{ appDataDir: string; encryptionRecordPath: string; notes: NoteType[] }> {
  const rootDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "axion-notes-encryption-access-"));
  temporaryDirectories.push(rootDir);
  const appDataDir = path.join(rootDir, "data");
  const encryptionRecordPath = path.join(rootDir, "security", "encryption.json");
  const notes = [
    createNote("note-1", "First", "First encrypted note", 1),
    createNote("note-2", "Second", "Second encrypted note", 2)
  ];
  await fs.promises.mkdir(appDataDir, { recursive: true });
  await Promise.all(notes.map((note) => fs.promises.writeFile(path.join(appDataDir, `${note.id}.json`), JSON.stringify(note), "utf-8")));
  await fs.promises.writeFile(path.join(appDataDir, "note-order.json"), JSON.stringify(notes.map((note) => note.id)), "utf-8");
  await createService({ appDataDir, encryptionRecordPath }).enableEncryption(password);

  return { appDataDir, encryptionRecordPath, notes };
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

async function createLegacyEncryptedContext(): Promise<{ appDataDir: string; encryptionRecordPath: string; notes: NoteType[] }> {
  const rootDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "axion-notes-legacy-encryption-"));
  temporaryDirectories.push(rootDir);
  const appDataDir = path.join(rootDir, "data");
  const encryptionRecordPath = path.join(rootDir, "security", "encryption.json");
  const notes = [createNote("note-1", "Legacy", "Legacy encrypted note", 1)];
  const encryptionService = new EncryptionService();
  const encryptionKeyService = new EncryptionKeyService(encryptionService);
  const { record, masterKey } = await encryptionKeyService.createRecord(password);
  const payload = encryptionService.encrypt(
    new TextEncoder().encode(JSON.stringify(notes[0])),
    masterKey,
    new TextEncoder().encode("Axion Notes note:note-1")
  );

  try {
    await fs.promises.mkdir(appDataDir, { recursive: true });
    await fs.promises.mkdir(path.dirname(encryptionRecordPath), { recursive: true });
    await fs.promises.writeFile(encryptionRecordPath, JSON.stringify(record), "utf-8");
    await fs.promises.writeFile(path.join(appDataDir, "note-1.json"), JSON.stringify({ version: 1, ...payload }), "utf-8");
    await fs.promises.writeFile(path.join(appDataDir, "note-order.json"), JSON.stringify(["note-1"]), "utf-8");
  } finally {
    masterKey.fill(0);
  }

  return { appDataDir, encryptionRecordPath, notes };
}

function createNote(id: string, title: string, content: string, seconds: number): NoteType {
  const createdOn = new Date(Date.UTC(2026, 10, 18, 12, 0, seconds));

  return {
    id,
    bgcolor: NoteColorKey.INDIGO,
    title,
    content,
    createdOn,
    lastModifiedOn: createdOn
  };
}
