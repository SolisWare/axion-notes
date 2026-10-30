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
import { EncryptedNoteManifest } from "../../../../src/security/EncryptedNoteManifest";
import { EncryptedNoteRecord } from "../../../../src/security/EncryptedNoteRecord";
import { EncryptionRecord } from "../../../../src/security/EncryptionRecord";
import { NoteType } from "../../../../src/models/NoteType";
import { NoteColorKey } from "../../../../src/theme/NoteColors";

const password = "correct horse battery staple";
const manifestAad = new TextEncoder().encode("Axion Notes notes manifest");
const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => fs.promises.rm(directory, { force: true, recursive: true })));
});

describe("NoteService encrypted storage corruption handling", () => {
  it.each([
    ["encrypted manifest", async (context: TestContext) => tamperPayload(path.join(context.appDataDir, "notes.manifest"))],
    ["encrypted note payload", async (context: TestContext) => tamperPayload(await getFirstEncryptedNotePath(context))],
    ["missing encrypted note", async (context: TestContext) => fs.promises.unlink(await getFirstEncryptedNotePath(context))],
    ["missing encrypted manifest", async (context: TestContext) => fs.promises.unlink(path.join(context.appDataDir, "notes.manifest"))]
  ])("rejects unlock and exposes no plaintext for a %s", async (_name, corrupt) => {
    const context = await createEncryptedContext();
    await corrupt(context);

    const service = createEncryptedService(context);

    await expect(service.unlockEncryption(password)).rejects.toThrow();
    expect(service.isEncryptionUnlocked()).toBe(false);
    expect(service.hasPlaintextCache()).toBe(false);
    expect(await service.getNotes()).toEqual([]);
  });

  it("rejects encrypted note files swapped between note IDs", async () => {
    const context = await createEncryptedContext();
    const manifest = await readManifest(context);
    const firstPath = path.join(context.appDataDir, "notes", manifest.files["note-1"]);
    const secondPath = path.join(context.appDataDir, "notes", manifest.files["note-2"]);
    const firstContent = await fs.promises.readFile(firstPath, "utf-8");
    const secondContent = await fs.promises.readFile(secondPath, "utf-8");
    await fs.promises.writeFile(firstPath, secondContent, "utf-8");
    await fs.promises.writeFile(secondPath, firstContent, "utf-8");

    const service = createEncryptedService(context);

    await expect(service.unlockEncryption(password)).rejects.toThrow();
    expect(service.hasPlaintextCache()).toBe(false);
  });

  it("rejects an authenticated manifest with duplicate file references", async () => {
    const context = await createEncryptedContext();
    const manifest = await readManifest(context);
    await writeManifest(context, {
      ...manifest,
      files: {
        ...manifest.files,
        "note-2": manifest.files["note-1"]
      }
    });

    const service = createEncryptedService(context);

    await expect(service.unlockEncryption(password)).rejects.toThrow("Invalid encrypted note manifest");
    expect(service.hasPlaintextCache()).toBe(false);
  });

  it("rejects an authenticated manifest whose order and file mapping disagree", async () => {
    const context = await createEncryptedContext();
    const manifest = await readManifest(context);
    await writeManifest(context, {
      ...manifest,
      noteOrder: ["note-1"]
    });

    const service = createEncryptedService(context);

    await expect(service.unlockEncryption(password)).rejects.toThrow("Invalid encrypted note manifest");
    expect(service.hasPlaintextCache()).toBe(false);
  });
});

async function createEncryptedContext(): Promise<TestContext> {
  const rootDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "axion-notes-encryption-corruption-"));
  temporaryDirectories.push(rootDir);
  const context: TestContext = {
    rootDir,
    appDataDir: path.join(rootDir, "notes-data"),
    encryptionRecordPath: path.join(rootDir, "security", "encryption.json")
  };
  const notes = [
    createNote("note-1", "First private note", "first secret", new Date("2026-10-30T10:00:00.000Z")),
    createNote("note-2", "Second private note", "second secret", new Date("2026-10-30T11:00:00.000Z"))
  ];

  await fs.promises.mkdir(context.appDataDir, { recursive: true });
  await Promise.all(notes.map((note) => fs.promises.writeFile(path.join(context.appDataDir, `${note.id}.json`), JSON.stringify(note), "utf-8")));
  await fs.promises.writeFile(path.join(context.appDataDir, "note-order.json"), JSON.stringify(notes.map((note) => note.id)), "utf-8");
  await createService(context).enableEncryption(password);

  return context;
}

function createEncryptedService(context: TestContext): NoteService {
  const service = createService(context);
  service.applyEncryptionSetting(true);

  return service;
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

async function tamperPayload(filePath: string): Promise<void> {
  const record = JSON.parse(await fs.promises.readFile(filePath, "utf-8")) as EncryptedNoteRecord;
  record.ciphertext = `${record.ciphertext.slice(0, 2).toLowerCase() === "00" ? "01" : "00"}${record.ciphertext.slice(2)}`;
  await fs.promises.writeFile(filePath, JSON.stringify(record), "utf-8");
}

async function getFirstEncryptedNotePath(context: TestContext): Promise<string> {
  const manifest = await readManifest(context);

  return path.join(context.appDataDir, "notes", manifest.files["note-1"]);
}

async function readManifest(context: TestContext): Promise<EncryptedNoteManifest> {
  const { encryptionService, masterKey } = await getEncryptionMaterial(context);
  const record = JSON.parse(await fs.promises.readFile(path.join(context.appDataDir, "notes.manifest"), "utf-8")) as EncryptedNoteRecord;

  try {
    return JSON.parse(new TextDecoder().decode(encryptionService.decrypt(record, masterKey, manifestAad))) as EncryptedNoteManifest;
  } finally {
    masterKey.fill(0);
  }
}

async function writeManifest(context: TestContext, manifest: EncryptedNoteManifest): Promise<void> {
  const { encryptionService, masterKey } = await getEncryptionMaterial(context);

  try {
    const payload = encryptionService.encrypt(new TextEncoder().encode(JSON.stringify(manifest)), masterKey, manifestAad);
    const record: EncryptedNoteRecord = {
      version: 1,
      ...payload
    };
    await fs.promises.writeFile(path.join(context.appDataDir, "notes.manifest"), JSON.stringify(record), "utf-8");
  } finally {
    masterKey.fill(0);
  }
}

async function getEncryptionMaterial(context: TestContext): Promise<{ encryptionService: EncryptionService; masterKey: Uint8Array }> {
  const encryptionService = new EncryptionService();
  const encryptionKeyService = new EncryptionKeyService(encryptionService);
  const record = JSON.parse(await fs.promises.readFile(context.encryptionRecordPath, "utf-8")) as EncryptionRecord;

  return {
    encryptionService,
    masterKey: await encryptionKeyService.unlock(password, record)
  };
}

function createNote(id: string, title: string, content: string, createdOn: Date): NoteType {
  return {
    id,
    bgcolor: NoteColorKey.INDIGO,
    title,
    content,
    createdOn,
    lastModifiedOn: createdOn
  };
}

type TestContext = {
  rootDir: string;
  appDataDir: string;
  encryptionRecordPath: string;
};
