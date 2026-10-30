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
import { EncryptionProgressEvent, EncryptionProgressOperation } from "../../../../src/types/EncryptionProgressEvent";
import { NoteType } from "../../../../src/types/NoteType";
import { NoteColorKey } from "../../../../src/theme/NoteColors";

const password = "correct horse battery staple";
const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => fs.promises.rm(directory, { force: true, recursive: true })));
});

describe("NoteService encryption migrations", () => {
  it("keeps the plaintext vault recoverable when installing encrypted storage fails, then allows a retry", async () => {
    const context = await createPlaintextContext();
    const encryptionStagingNotesDir = path.join(context.appDataDir, ".notes-encryption-staging", "notes");
    const failingRename: RenamePath = async (oldPath, newPath) => {
      if (oldPath === encryptionStagingNotesDir) {
        throw createIoError();
      }

      await fs.promises.rename(oldPath, newPath);
    };
    const service = createService(context, failingRename);

    await expect(service.enableEncryption(password)).rejects.toThrow();

    expect(service.getIsStorageMigrationInProgress()).toBe(false);
    expect(serializeNotes(await createService(context).getNotes())).toEqual(serializeNotes(context.notes));
    await expect(fs.promises.access(context.encryptionRecordPath)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(fs.promises.access(path.join(context.appDataDir, "notes.manifest"))).rejects.toMatchObject({ code: "ENOENT" });

    await createService(context).enableEncryption(password);

    expect(serializeNotes(await unlockAfterRestart(context))).toEqual(serializeNotes(context.notes));
  });

  it("keeps the encrypted vault recoverable when installing plaintext storage fails, then allows a retry", async () => {
    const context = await createEncryptedContext();
    const decryptionStagingNotePath = path.join(context.appDataDir, ".notes-decryption-staging", "note-2.json");
    const failingRename: RenamePath = async (oldPath, newPath) => {
      if (oldPath === decryptionStagingNotePath) {
        throw createIoError();
      }

      await fs.promises.rename(oldPath, newPath);
    };
    const service = createService(context, failingRename);
    service.applyEncryptionSetting(true);
    await service.unlockEncryption(password);

    await expect(service.disableEncryption(password)).rejects.toThrow();

    expect(service.getIsStorageMigrationInProgress()).toBe(false);
    expect(serializeNotes(await unlockAfterRestart(context))).toEqual(serializeNotes(context.notes));

    const retryService = createService(context);
    retryService.applyEncryptionSetting(true);
    await retryService.unlockEncryption(password);
    await retryService.disableEncryption(password);

    expect(serializeNotes(await createService(context).getNotes())).toEqual(serializeNotes(context.notes));
  });

  it("keeps the plaintext vault recoverable when writing the encryption record fails", async () => {
    const context = await createPlaintextContext();
    const failingRename: RenamePath = async (oldPath, newPath) => {
      if (newPath === context.encryptionRecordPath) {
        throw createIoError();
      }

      await fs.promises.rename(oldPath, newPath);
    };
    const service = createService(context, failingRename);

    await expect(service.enableEncryption(password)).rejects.toThrow();

    expect(service.getIsStorageMigrationInProgress()).toBe(false);
    expect(serializeNotes(await createService(context).getNotes())).toEqual(serializeNotes(context.notes));
    await expect(fs.promises.access(context.encryptionRecordPath)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("emits ordered migration progress and always reports that migration has finished", async () => {
    const context = await createPlaintextContext();
    const service = createService(context);
    const migrationStates: boolean[] = [];
    const progress: EncryptionProgressEvent[] = [];
    service.onStorageMigrationStateChange((isMigrationInProgress) => migrationStates.push(isMigrationInProgress));

    await service.enableEncryption(password, (event) => progress.push(event));

    expect(migrationStates).toEqual([true, false]);
    expect(progress.map((event) => event.progress)).toEqual([5, 5, 42.5, 80, 95, 100]);
    expect(progress.every((event) => event.operation === EncryptionProgressOperation.ENCRYPT)).toBe(true);
    expect(progress.map((event) => event.progress)).toEqual([...progress].map((event) => event.progress).sort((first, second) => first - second));
  });
});

async function createPlaintextContext(): Promise<TestContext> {
  const rootDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "axion-notes-encryption-migration-"));
  temporaryDirectories.push(rootDir);
  const context: TestContext = {
    appDataDir: path.join(rootDir, "notes-data"),
    encryptionRecordPath: path.join(rootDir, "security", "encryption.json"),
    notes: [
      createNote("note-1", "First note", "first content", new Date("2026-10-30T10:00:00.000Z")),
      createNote("note-2", "Second note", "second content", new Date("2026-10-30T11:00:00.000Z"))
    ]
  };

  await fs.promises.mkdir(context.appDataDir, { recursive: true });
  await Promise.all(context.notes.map((note) => fs.promises.writeFile(path.join(context.appDataDir, `${note.id}.json`), JSON.stringify(note), "utf-8")));
  await fs.promises.writeFile(path.join(context.appDataDir, "note-order.json"), JSON.stringify(context.notes.map((note) => note.id)), "utf-8");

  return context;
}

async function createEncryptedContext(): Promise<TestContext> {
  const context = await createPlaintextContext();
  await createService(context).enableEncryption(password);

  return context;
}

function createService(context: TestContext, renamePath?: RenamePath): NoteService {
  const encryptionService = new EncryptionService();

  return new NoteService(
    context.appDataDir,
    context.encryptionRecordPath,
    encryptionService,
    new EncryptionKeyService(encryptionService),
    renamePath
  );
}

async function unlockAfterRestart(context: TestContext): Promise<NoteType[]> {
  const service = createService(context);
  service.applyEncryptionSetting(true);
  await service.unlockEncryption(password);

  return service.getNotes();
}

function createIoError(): NodeJS.ErrnoException {
  const error = new Error("Injected filesystem failure") as NodeJS.ErrnoException;
  error.code = "EIO";

  return error;
}

function createNote(id: string, title: string, content: string, createdOn: Date): NoteType {
  return {
    id,
    bgcolor: NoteColorKey.GREEN,
    title,
    content,
    createdOn,
    lastModifiedOn: createdOn
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
  appDataDir: string;
  encryptionRecordPath: string;
  notes: NoteType[];
};

type RenamePath = (oldPath: string, newPath: string) => Promise<void>;
