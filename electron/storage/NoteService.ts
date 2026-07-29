/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { EncryptedNoteRecord } from "../../src/security/EncryptedNoteRecord";
import { EncryptionRecord } from "../../src/security/EncryptionRecord";
import { NoteType } from "../../src/models/NoteType";
import { Formatter } from "../../src/utils/dt-formatter/Formatter";
import { EncryptionKeyService } from "../security/EncryptionKeyService";
import { EncryptionService } from "../security/EncryptionService";

const NOTE_ORDER_FILE_NAME = "note-order.json";
const ENCRYPTED_NOTE_RECORD_VERSION = 1;
const NOTE_AAD_PREFIX = "Axion Notes note";

type PlaintextCacheStateListener = (hasPlaintextCache: boolean) => void;

/**
 * Provides cached note access for the Electron main process.
 *
 * Notes are cached as plaintext in memory after unlock. When note encryption
 * is enabled, disk files are always written as encrypted records.
 */
export class NoteService {
  
  private notes: NoteType[] | undefined;
  private notesEncryptionEnabled = false;
  private encryptionRecord: EncryptionRecord | undefined;
  private masterKey: Uint8Array | undefined;
  private readonly plaintextCacheStateListeners = new Set<PlaintextCacheStateListener>();

  public constructor(
    private readonly appDataDir: string,
    private readonly encryptionRecordPath: string,
    private readonly encryptionService: EncryptionService,
    private readonly encryptionKeyService: EncryptionKeyService
  ) {
  }

  /**
   * Applies whether note encryption should be active.
   */
  public applyEncryptionSetting(enabled: boolean): void {
    this.notesEncryptionEnabled = enabled;
    this.emitPlaintextCacheStateChange();
  }

  /**
   * Returns whether encrypted notes can currently be read.
   */
  public isEncryptionUnlocked(): boolean {
    return !this.notesEncryptionEnabled || Boolean(this.masterKey);
  }

  /**
   * Returns whether encrypted plaintext note/key material is currently cached.
   */
  public hasPlaintextCache(): boolean {
    return this.notesEncryptionEnabled && (this.notes !== undefined || this.masterKey !== undefined);
  }

  /**
   * Subscribes to changes in decrypted note/key material availability.
   *
   * @param listener Listener called with the latest plaintext cache state.
   * @returns Unsubscribe function.
   */
  public onPlaintextCacheStateChange(listener: PlaintextCacheStateListener): () => void {
    this.plaintextCacheStateListeners.add(listener);

    return () => {
      this.plaintextCacheStateListeners.delete(listener);
    };
  }

  /**
   * Clears plaintext notes and unlocked key material from memory.
   */
  public clearPlaintextCache(): void {
    this.notes = undefined;
    this.masterKey = undefined;
    this.emitPlaintextCacheStateChange();
  }

  /**
   * Checks whether encryption metadata exists on disk.
   */
  public async hasEncryptionRecord(): Promise<boolean> {
    try {
      await fs.promises.access(this.encryptionRecordPath, fs.constants.F_OK);
      return true;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return false;
      }

      throw err;
    }
  }

  /**
   * Encrypts existing plaintext notes on disk and stores encryption metadata.
   */
  public async enableEncryption(password: string): Promise<void> {
    const notes = await this.getNotes();
    const { record, masterKey } = await this.encryptionKeyService.createRecord(password);

    this.notesEncryptionEnabled = true;
    this.encryptionRecord = record;
    this.masterKey = masterKey;
    this.notes = notes;
    this.emitPlaintextCacheStateChange();

    await this.writeEncryptionRecord(record);
    await this.writeAllNotes(notes);
  }

  /**
   * Unlocks encrypted notes and loads plaintext notes into memory.
   */
  public async unlockEncryption(password: string): Promise<void> {
    const record = await this.readEncryptionRecord();
    const masterKey = await this.encryptionKeyService.unlock(password, record);

    this.notesEncryptionEnabled = true;
    this.encryptionRecord = record;
    this.masterKey = masterKey;

    if (this.notes) {
      this.emitPlaintextCacheStateChange();
      return;
    }

    this.notes = await this.readEncryptedNotes(masterKey);
    this.emitPlaintextCacheStateChange();
  }

  /**
   * Verifies whether a password can unwrap the current encryption master key.
   */
  public async verifyEncryptionPassword(password: string): Promise<boolean> {
    try {
      const record = this.encryptionRecord ?? await this.readEncryptionRecord();
      await this.encryptionKeyService.unlock(password, record);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Decrypts notes back to plaintext disk files and removes encryption metadata.
   */
  public async disableEncryption(password: string): Promise<NoteType[]> {
    if (!this.masterKey) {
      await this.unlockEncryption(password);
    } else {
      const isPasswordValid = await this.verifyEncryptionPassword(password);

      if (!isPasswordValid) {
        throw new Error("Invalid encryption password.");
      }
    }

    const notes = await this.getNotes();

    this.notesEncryptionEnabled = false;
    this.encryptionRecord = undefined;
    this.masterKey = undefined;
    this.notes = notes;
    this.emitPlaintextCacheStateChange();

    await this.removeEncryptionRecord();
    await this.writeAllNotes(notes);

    return notes;
  }

  /**
   * Rewraps the encryption master key with a new password.
   */
  public async changeEncryptionPassword(currentPassword: string, newPassword: string): Promise<void> {
    const record = this.encryptionRecord ?? await this.readEncryptionRecord();
    const nextRecord = await this.encryptionKeyService.changePassword(currentPassword, newPassword, record);

    this.encryptionRecord = nextRecord;
    await this.writeEncryptionRecord(nextRecord);
  }

  /**
   * Returns all notes, loading them from disk only when the cache is empty.
   */
  public async getNotes(): Promise<NoteType[]> {
    if (!this.notes) {
      if (this.notesEncryptionEnabled) {
        if (!this.masterKey) {
          return [];
        }

        this.notes = await this.readEncryptedNotes(this.masterKey);
        this.emitPlaintextCacheStateChange();
      } else {
        this.notes = await this.readPlaintextNotes();
      }
    }

    return [...this.notes];
  }

  /**
   * Stores a note and updates the in-memory cache.
   */
  public setNote(note: NoteType): void {
    this.writeNote(note);

    if (!this.notes) {
      return;
    }

    const existingNoteIndex = this.notes.findIndex((storedNote) => storedNote.id === note.id);

    if (existingNoteIndex === -1) {
      this.notes = [...this.notes, note];
      void this.writeNoteOrder([...this.readNoteOrder(), note.id]);
      return;
    }

    this.notes = this.notes.map((storedNote, index) => (
      index === existingNoteIndex ? note : storedNote
    ));
  }

  /**
   * Stores note order and reorders the in-memory cache.
   */
  public setNoteOrder(noteIds: string[]): void {
    void this.writeNoteOrder(noteIds);

    if (!this.notes) {
      return;
    }

    const noteOrderIndexes = new Map(noteIds.map((noteId, index) => [noteId, index]));

    this.notes = this.sortNotes(this.notes, noteOrderIndexes);
  }

  /**
   * Deletes a note and removes it from the in-memory cache.
   */
  public deleteNote(noteId: string): void {
    const filePath = this.getNoteFilePath(noteId);

    void this.writeNoteOrder(this.readNoteOrder().filter((storedNoteId) => storedNoteId !== noteId));
    fs.promises.unlink(filePath).catch((err) => {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        console.error(err);
      }
    });
    this.notes = this.notes?.filter((note) => note.id !== noteId);
  }

  /**
   * Deletes all notes and clears the in-memory cache.
   */
  public deleteAllNotes(): void {
    fs.promises.readdir(this.appDataDir)
      .then((files) => Promise.all(files.map((file) => fs.promises.unlink(path.join(this.appDataDir, file)))))
      .catch((err) => console.error(err));
    this.notes = [];
    this.emitPlaintextCacheStateChange();
  }

  private emitPlaintextCacheStateChange(): void {
    const hasPlaintextCache = this.hasPlaintextCache();

    this.plaintextCacheStateListeners.forEach((listener) => listener(hasPlaintextCache));
  }

  private async readPlaintextNotes(): Promise<NoteType[]> {
    const files = await this.getNoteFiles();
    const noteOrderIndexes = new Map(this.readNoteOrder().map((noteId, index) => [noteId, index]));
    const notes = await Promise.all(files.map((file) => this.readPlaintextNote(file)));

    return this.sortNotes(notes.filter((note): note is NoteType => note !== null), noteOrderIndexes);
  }

  private async readEncryptedNotes(masterKey: Uint8Array): Promise<NoteType[]> {
    const files = await this.getNoteFiles();
    const noteOrderIndexes = new Map(this.readNoteOrder().map((noteId, index) => [noteId, index]));
    const notes = await Promise.all(files.map((file) => this.readEncryptedNote(file, masterKey)));

    return this.sortNotes(notes.filter((note): note is NoteType => note !== null), noteOrderIndexes);
  }

  private async readPlaintextNote(file: string): Promise<NoteType | null> {
    try {
      const content = await fs.promises.readFile(path.join(this.appDataDir, file), "utf-8");
      return this.hydrateNote(JSON.parse(content) as NoteType);
    } catch {
      console.warn(`Skipping corrupt note file: ${file}`);
      return null;
    }
  }

  private async readEncryptedNote(file: string, masterKey: Uint8Array): Promise<NoteType | null> {
    try {
      const content = await fs.promises.readFile(path.join(this.appDataDir, file), "utf-8");
      const record = JSON.parse(content) as EncryptedNoteRecord;
      const noteId = path.basename(file, ".json");
      const plaintext = this.encryptionService.decrypt(record, masterKey, this.getNoteAad(noteId));
      const serializedNote = new TextDecoder().decode(plaintext);

      return this.hydrateNote(JSON.parse(serializedNote) as NoteType);
    } catch {
      console.warn(`Skipping corrupt encrypted note file: ${file}`);
      return null;
    }
  }

  private hydrateNote(note: NoteType): NoteType {
    return {
      ...note,
      createdOn: new Date(note.createdOn),
      lastModifiedOn: new Date(note.lastModifiedOn),
      pinnedOn: Formatter.toOptionalDate(note.pinnedOn)
    };
  }

  private writeNote(note: NoteType): void {
    const noteOrder = this.readNoteOrder();

    if (!noteOrder.includes(note.id)) {
      void this.writeNoteOrder([...noteOrder, note.id]);
    }

    const serializedNote = JSON.stringify(this.notesEncryptionEnabled ? this.encryptNote(note) : note);

    fs.promises.writeFile(this.getNoteFilePath(note.id), serializedNote, "utf-8").catch((err) => console.error(err));
  }

  private async writeAllNotes(notes: NoteType[]): Promise<void> {
    await Promise.all(notes.map((note) => fs.promises.writeFile(
      this.getNoteFilePath(note.id),
      JSON.stringify(this.notesEncryptionEnabled ? this.encryptNote(note) : note),
      "utf-8"
    )));
  }

  private encryptNote(note: NoteType): EncryptedNoteRecord {
    if (!this.masterKey) {
      throw new Error("Cannot encrypt note before encryption has been unlocked.");
    }

    const payload = this.encryptionService.encrypt(
      new TextEncoder().encode(JSON.stringify(note)),
      this.masterKey,
      this.getNoteAad(note.id)
    );

    return {
      version: ENCRYPTED_NOTE_RECORD_VERSION,
      ...payload
    };
  }

  private async getNoteFiles(): Promise<string[]> {
    const files = await fs.promises.readdir(this.appDataDir);
    return files.filter((file) => file !== NOTE_ORDER_FILE_NAME && file.endsWith(".json"));
  }

  private getNoteFilePath(noteId: string): string {
    return path.join(this.appDataDir, `${noteId}.json`);
  }

  private getNoteOrderFilePath(): string {
    return path.join(this.appDataDir, NOTE_ORDER_FILE_NAME);
  }

  private readNoteOrder(): string[] {
    try {
      const content = fs.readFileSync(this.getNoteOrderFilePath(), "utf-8");
      const noteIds = JSON.parse(content);

      return Array.isArray(noteIds) ? noteIds.filter((noteId): noteId is string => typeof noteId === "string") : [];
    } catch {
      return [];
    }
  }

  private async writeNoteOrder(noteIds: string[]): Promise<void> {
    await fs.promises.writeFile(this.getNoteOrderFilePath(), JSON.stringify(noteIds), "utf-8");
  }

  private sortNotes(notes: NoteType[], noteOrderIndexes: Map<string, number>): NoteType[] {
    return [...notes].sort((firstNote, secondNote) => {
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

      return firstNote.createdOn.getTime() - secondNote.createdOn.getTime();
    });
  }

  private async readEncryptionRecord(): Promise<EncryptionRecord> {
    const content = await fs.promises.readFile(this.encryptionRecordPath, "utf-8");
    return JSON.parse(content) as EncryptionRecord;
  }

  private async writeEncryptionRecord(record: EncryptionRecord): Promise<void> {
    await fs.promises.mkdir(path.dirname(this.encryptionRecordPath), { recursive: true });
    await fs.promises.writeFile(this.encryptionRecordPath, JSON.stringify(record, null, 2), "utf-8");
  }

  private async removeEncryptionRecord(): Promise<void> {
    try {
      await fs.promises.unlink(this.encryptionRecordPath);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        throw err;
      }
    }
  }

  private getNoteAad(noteId: string): Uint8Array {
    return new TextEncoder().encode(`${NOTE_AAD_PREFIX}:${noteId}`);
  }
}
