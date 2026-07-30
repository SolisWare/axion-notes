/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { EncryptionProgressEvent, EncryptionProgressOperation, EncryptionProgressPhase } from "../../src/models/EncryptionProgressEvent";
import { NoteType } from "../../src/models/NoteType";
import { EncryptedNoteManifest } from "../../src/security/EncryptedNoteManifest";
import { EncryptedNoteRecord } from "../../src/security/EncryptedNoteRecord";
import { EncryptionRecord } from "../../src/security/EncryptionRecord";
import { Formatter } from "../../src/utils/dt-formatter/Formatter";
import { EncryptionKeyService } from "../security/EncryptionKeyService";
import { EncryptionService } from "../security/EncryptionService";

const NOTE_ORDER_FILE_NAME = "note-order.json";
const ENCRYPTED_NOTES_DIR_NAME = "notes";
const ENCRYPTED_NOTES_MANIFEST_FILE_NAME = "notes.manifest";
const ENCRYPTED_NOTE_FILE_EXTENSION = ".note";
const ENCRYPTED_NOTE_RECORD_VERSION = 1;
const ENCRYPTED_NOTE_MANIFEST_VERSION = 1;
const ENCRYPTION_STAGING_DIR_NAME = ".notes-encryption-staging";
const DECRYPTION_STAGING_DIR_NAME = ".notes-decryption-staging";
const NOTE_AAD_PREFIX = "Axion Notes note";
const MANIFEST_AAD = "Axion Notes notes manifest";
const PREPARING_PROGRESS = 5;
const PROCESSING_START_PROGRESS = 5;
const PROCESSING_END_PROGRESS = 80;
const VERIFYING_PROGRESS = 95;
const CLEANING_UP_PROGRESS = 100;

type PlaintextCacheStateListener = (hasPlaintextCache: boolean) => void;
type EncryptionProgressListener = (progress: EncryptionProgressEvent) => void;
type StorageMigrationStateListener = (isMigrationInProgress: boolean) => void;

/**
 * Provides cached note access for the Electron main process.
 *
 * Notes are cached as plaintext in memory after unlock. When note encryption
 * is enabled, note content is written to opaque encrypted note files and the
 * note order / note-id-to-file mapping is stored in an encrypted manifest.
 */
export class NoteService {

  private notes: NoteType[] | undefined;
  private notesEncryptionEnabled = false;
  private encryptionRecord: EncryptionRecord | undefined;
  private encryptedManifest: EncryptedNoteManifest | undefined;
  private masterKey: Uint8Array | undefined;
  private storageMigrationInProgress = false;
  private readonly plaintextCacheStateListeners = new Set<PlaintextCacheStateListener>();
  private readonly storageMigrationStateListeners = new Set<StorageMigrationStateListener>();

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
   * Returns whether an encryption/decryption storage migration is active.
   */
  public getIsStorageMigrationInProgress(): boolean {
    return this.storageMigrationInProgress;
  }

  /**
   * Subscribes to encryption/decryption storage migration state changes.
   *
   * @param listener Listener called when migration starts or finishes.
   * @returns Unsubscribe function.
   */
  public onStorageMigrationStateChange(listener: StorageMigrationStateListener): () => void {
    this.storageMigrationStateListeners.add(listener);

    return () => {
      this.storageMigrationStateListeners.delete(listener);
    };
  }

  /**
   * Clears plaintext notes and unlocked key material from memory.
   */
  public clearPlaintextCache(): void {
    this.notes = undefined;
    this.clearMasterKey();
    this.encryptedManifest = undefined;
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
  public async enableEncryption(password: string, onProgress?: EncryptionProgressListener): Promise<void> {
    this.setStorageMigrationInProgress(true);

    try {
      const notes = await this.getNotes();
      const { record, masterKey } = await this.encryptionKeyService.createRecord(password);
      const operation = EncryptionProgressOperation.ENCRYPT;

      this.emitEncryptionProgress(onProgress, operation, EncryptionProgressPhase.PREPARING, PREPARING_PROGRESS);
      await this.writeEncryptedLayoutToStaging(notes, masterKey, operation, onProgress);
      this.emitEncryptionProgress(onProgress, operation, EncryptionProgressPhase.VERIFYING, VERIFYING_PROGRESS);
      await this.verifyEncryptedStaging(notes, masterKey);
      this.emitEncryptionProgress(onProgress, operation, EncryptionProgressPhase.CLEANING_UP, CLEANING_UP_PROGRESS);
      await this.installEncryptedStaging();
      await this.verifyFinalEncryptedLayout(notes, masterKey);
      await this.writeEncryptionRecord(record);
      await this.removePlaintextLayout();
      await this.verifyFinalEncryptedLayout(notes, masterKey);

      this.notesEncryptionEnabled = true;
      this.encryptionRecord = record;
      this.masterKey = masterKey;
      this.encryptedManifest = await this.readEncryptedManifest(masterKey);
      this.notes = notes;
      this.emitPlaintextCacheStateChange();
    } finally {
      this.setStorageMigrationInProgress(false);
    }
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
  public async disableEncryption(password: string, onProgress?: EncryptionProgressListener): Promise<NoteType[]> {
    const operation = EncryptionProgressOperation.DECRYPT;

    if (!this.masterKey) {
      await this.unlockEncryption(password);
    } else {
      const isPasswordValid = await this.verifyEncryptionPassword(password);

      if (!isPasswordValid) {
        throw new Error("Invalid encryption password.");
      }
    }

    const notes = await this.getNotes();

    this.setStorageMigrationInProgress(true);

    try {
      this.emitEncryptionProgress(onProgress, operation, EncryptionProgressPhase.PREPARING, PREPARING_PROGRESS);
      await this.writePlaintextLayoutToStaging(notes, operation, onProgress);
      this.emitEncryptionProgress(onProgress, operation, EncryptionProgressPhase.VERIFYING, VERIFYING_PROGRESS);
      await this.verifyPlaintextStaging(notes);
      this.emitEncryptionProgress(onProgress, operation, EncryptionProgressPhase.CLEANING_UP, CLEANING_UP_PROGRESS);
      await this.installPlaintextStaging();
      await this.verifyFinalPlaintextLayout(notes);
      await this.removeEncryptedLayout();
      await this.removeEncryptionRecord();
      await this.verifyFinalPlaintextLayout(notes);

      this.notesEncryptionEnabled = false;
      this.encryptionRecord = undefined;
      this.encryptedManifest = undefined;
      this.clearMasterKey();
      this.notes = notes;
      this.emitPlaintextCacheStateChange();

      return notes;
    } finally {
      this.setStorageMigrationInProgress(false);
    }
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
    if (this.notesEncryptionEnabled) {
      void this.writeEncryptedNote(note).catch((err) => console.error(err));
    } else {
      this.writePlaintextNote(note);
    }

    if (!this.notes) {
      return;
    }

    const existingNoteIndex = this.notes.findIndex((storedNote) => storedNote.id === note.id);

    if (existingNoteIndex === -1) {
      this.notes = [...this.notes, note];
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
    if (this.notesEncryptionEnabled) {
      void this.writeEncryptedNoteOrder(noteIds).catch((err) => console.error(err));
    } else {
      void this.writeNoteOrder(noteIds);
    }

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
    if (this.notesEncryptionEnabled) {
      void this.deleteEncryptedNote(noteId).catch((err) => console.error(err));
    } else {
      fs.promises.unlink(this.getPlaintextNoteFilePath(noteId)).catch((err) => {
        if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
          console.error(err);
        }
      });
      void this.writeNoteOrder(this.readNoteOrder().filter((storedNoteId) => storedNoteId !== noteId));
    }

    this.notes = this.notes?.filter((note) => note.id !== noteId);
  }

  /**
   * Deletes all notes and clears the in-memory cache.
   */
  public deleteAllNotes(): void {
    if (this.notesEncryptionEnabled) {
      void this.deleteAllEncryptedNotes().catch((err) => console.error(err));
    } else {
      fs.promises.readdir(this.appDataDir)
        .then((files) => Promise.all(files
          .filter((file) => file === NOTE_ORDER_FILE_NAME || file.endsWith(".json"))
          .map((file) => fs.promises.unlink(path.join(this.appDataDir, file)))))
        .catch((err) => console.error(err));
    }

    this.notes = [];
    this.emitPlaintextCacheStateChange();
  }

  private emitPlaintextCacheStateChange(): void {
    const hasPlaintextCache = this.hasPlaintextCache();

    this.plaintextCacheStateListeners.forEach((listener) => listener(hasPlaintextCache));
  }

  private clearMasterKey(): void {
    this.masterKey?.fill(0);
    this.masterKey = undefined;
  }

  private setStorageMigrationInProgress(inProgress: boolean): void {
    if (this.storageMigrationInProgress === inProgress) {
      return;
    }

    this.storageMigrationInProgress = inProgress;
    this.storageMigrationStateListeners.forEach((listener) => listener(inProgress));
  }

  private emitEncryptionProgress(
    listener: EncryptionProgressListener | undefined,
    operation: EncryptionProgressOperation,
    phase: EncryptionProgressPhase,
    progress: number,
    current?: number,
    total?: number
  ): void {
    listener?.({
      operation,
      phase,
      current,
      total,
      progress
    });
  }

  private getProcessingProgress(current: number, total: number): number {
    if (total === 0) {
      return PROCESSING_END_PROGRESS;
    }

    return PROCESSING_START_PROGRESS + ((PROCESSING_END_PROGRESS - PROCESSING_START_PROGRESS) * (current / total));
  }

  private async readPlaintextNotes(baseDir = this.appDataDir): Promise<NoteType[]> {
    const files = await this.getPlaintextNoteFiles(baseDir);
    const noteOrderIndexes = new Map(this.readNoteOrder(baseDir).map((noteId, index) => [noteId, index]));
    const notes = await Promise.all(files.map((file) => this.readPlaintextNote(baseDir, file)));

    return this.sortNotes(notes.filter((note): note is NoteType => note !== null), noteOrderIndexes);
  }

  private async readEncryptedNotes(masterKey: Uint8Array, baseDir = this.appDataDir): Promise<NoteType[]> {
    if (await this.hasEncryptedManifest(baseDir)) {
      const manifest = await this.readEncryptedManifest(masterKey, baseDir);
      const notes = await Promise.all(Object.entries(manifest.files).map(([noteId, fileName]) => (
        this.readEncryptedManifestNote(baseDir, noteId, fileName, masterKey)
      )));

      if (baseDir === this.appDataDir) {
        this.encryptedManifest = manifest;
      }

      return this.sortNotes(notes.filter((note): note is NoteType => note !== null), new Map(manifest.noteOrder.map((noteId, index) => [noteId, index])));
    }

    const notes = await this.readLegacyEncryptedNotes(masterKey, baseDir);

    if (baseDir === this.appDataDir && notes.length > 0) {
      await this.writeEncryptedLayoutToStaging(notes, masterKey);
      await this.verifyEncryptedStaging(notes, masterKey);
      await this.installEncryptedStaging();
      await this.removePlaintextLayout();
      this.encryptedManifest = await this.readEncryptedManifest(masterKey);
    }

    return notes;
  }

  private async readPlaintextNote(baseDir: string, file: string): Promise<NoteType | null> {
    try {
      const content = await fs.promises.readFile(path.join(baseDir, file), "utf-8");
      return this.hydrateNote(JSON.parse(content) as NoteType);
    } catch {
      console.warn(`Skipping corrupt note file: ${file}`);
      return null;
    }
  }

  private async readLegacyEncryptedNotes(masterKey: Uint8Array, baseDir: string): Promise<NoteType[]> {
    const files = await this.getPlaintextNoteFiles(baseDir);
    const noteOrderIndexes = new Map(this.readNoteOrder(baseDir).map((noteId, index) => [noteId, index]));
    const notes = await Promise.all(files.map((file) => this.readLegacyEncryptedNote(baseDir, file, masterKey)));

    return this.sortNotes(notes.filter((note): note is NoteType => note !== null), noteOrderIndexes);
  }

  private async readLegacyEncryptedNote(baseDir: string, file: string, masterKey: Uint8Array): Promise<NoteType | null> {
    try {
      const content = await fs.promises.readFile(path.join(baseDir, file), "utf-8");
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

  private async readEncryptedManifestNote(
    baseDir: string,
    noteId: string,
    fileName: string,
    masterKey: Uint8Array
  ): Promise<NoteType | null> {
    try {
      const content = await fs.promises.readFile(path.join(this.getEncryptedNotesDirPath(baseDir), fileName), "utf-8");
      const record = JSON.parse(content) as EncryptedNoteRecord;
      const plaintext = this.encryptionService.decrypt(record, masterKey, this.getNoteAad(noteId));
      const serializedNote = new TextDecoder().decode(plaintext);

      return this.hydrateNote(JSON.parse(serializedNote) as NoteType);
    } catch {
      console.warn(`Skipping corrupt encrypted note file: ${fileName}`);
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

  private writePlaintextNote(note: NoteType): void {
    const noteOrder = this.readNoteOrder();

    if (!noteOrder.includes(note.id)) {
      void this.writeNoteOrder([...noteOrder, note.id]);
    }

    this.writeFileAtomic(this.getPlaintextNoteFilePath(note.id), JSON.stringify(note)).catch((err) => console.error(err));
  }

  private async writeEncryptedNote(note: NoteType): Promise<void> {
    if (!this.masterKey) {
      throw new Error("Cannot write encrypted note before encryption has been unlocked.");
    }

    const manifest = await this.getOrCreateEncryptedManifest(this.masterKey);
    const nextManifest = {
      ...manifest,
      noteOrder: manifest.noteOrder.includes(note.id)
        ? manifest.noteOrder
        : [...manifest.noteOrder, note.id],
      files: {
        ...manifest.files,
        [note.id]: manifest.files[note.id] ?? await this.createEncryptedNoteFileName()
      }
    };

    await fs.promises.mkdir(this.getEncryptedNotesDirPath(), { recursive: true });
    await this.writeFileAtomic(
      path.join(this.getEncryptedNotesDirPath(), nextManifest.files[note.id]),
      JSON.stringify(this.encryptNote(note))
    );
    await this.writeEncryptedManifest(nextManifest, this.masterKey);
    this.encryptedManifest = nextManifest;
  }

  private async writeEncryptedNoteOrder(noteIds: string[]): Promise<void> {
    if (!this.masterKey) {
      throw new Error("Cannot write encrypted note order before encryption has been unlocked.");
    }

    const manifest = await this.getOrCreateEncryptedManifest(this.masterKey);
    const nextManifest = {
      ...manifest,
      noteOrder: noteIds
    };

    await this.writeEncryptedManifest(nextManifest, this.masterKey);
    this.encryptedManifest = nextManifest;
  }

  private async deleteEncryptedNote(noteId: string): Promise<void> {
    if (!this.masterKey) {
      throw new Error("Cannot delete encrypted note before encryption has been unlocked.");
    }

    const manifest = await this.getOrCreateEncryptedManifest(this.masterKey);
    const fileName = manifest.files[noteId];
    const { [noteId]: _deletedFile, ...files } = manifest.files;
    const nextManifest = {
      ...manifest,
      noteOrder: manifest.noteOrder.filter((storedNoteId) => storedNoteId !== noteId),
      files
    };

    if (fileName) {
      await this.removePathIfExists(path.join(this.getEncryptedNotesDirPath(), fileName));
    }

    await this.writeEncryptedManifest(nextManifest, this.masterKey);
    this.encryptedManifest = nextManifest;
  }

  private async deleteAllEncryptedNotes(): Promise<void> {
    if (!this.masterKey) {
      throw new Error("Cannot delete encrypted notes before encryption has been unlocked.");
    }

    await this.removePathIfExists(this.getEncryptedNotesDirPath());
    await fs.promises.mkdir(this.getEncryptedNotesDirPath(), { recursive: true });
    this.encryptedManifest = this.createEncryptedManifest([]);
    await this.writeEncryptedManifest(this.encryptedManifest, this.masterKey);
  }

  private async writeEncryptedLayoutToStaging(
    notes: NoteType[],
    masterKey: Uint8Array,
    progressOperation?: EncryptionProgressOperation,
    onProgress?: EncryptionProgressListener
  ): Promise<void> {
    const stagingDir = this.getEncryptionStagingDirPath();
    const stagingNotesDir = this.getEncryptedNotesDirPath(stagingDir);
    const manifest = this.createEncryptedManifest(notes);

    await this.removePathIfExists(stagingDir);
    await fs.promises.mkdir(stagingNotesDir, { recursive: true });

    this.emitProcessingProgress(progressOperation, onProgress, 0, notes.length);

    for (const [index, note] of notes.entries()) {
      const fileName = manifest.files[note.id];
      const record = this.encryptNoteWithKey(note, masterKey);

      await this.writeFileAtomic(path.join(stagingNotesDir, fileName), JSON.stringify(record));
      this.emitProcessingProgress(progressOperation, onProgress, index + 1, notes.length);
    }

    await this.writeEncryptedManifest(manifest, masterKey, stagingDir);
  }

  private async writePlaintextLayoutToStaging(
    notes: NoteType[],
    progressOperation?: EncryptionProgressOperation,
    onProgress?: EncryptionProgressListener
  ): Promise<void> {
    const stagingDir = this.getDecryptionStagingDirPath();

    await this.removePathIfExists(stagingDir);
    await fs.promises.mkdir(stagingDir, { recursive: true });
    await this.writeNoteOrder(notes.map((note) => note.id), stagingDir);
    this.emitProcessingProgress(progressOperation, onProgress, 0, notes.length);

    for (const [index, note] of notes.entries()) {
      await this.writeFileAtomic(path.join(stagingDir, `${note.id}.json`), JSON.stringify(note));
      this.emitProcessingProgress(progressOperation, onProgress, index + 1, notes.length);
    }
  }

  private emitProcessingProgress(
    progressOperation: EncryptionProgressOperation | undefined,
    onProgress: EncryptionProgressListener | undefined,
    current: number,
    total: number
  ): void {
    if (!progressOperation) {
      return;
    }

    this.emitEncryptionProgress(
      onProgress,
      progressOperation,
      EncryptionProgressPhase.PROCESSING_NOTES,
      this.getProcessingProgress(current, total),
      current,
      total
    );
  }

  private async verifyEncryptedStaging(notes: NoteType[], masterKey: Uint8Array): Promise<void> {
    const stagedNotes = await this.readEncryptedNotes(masterKey, this.getEncryptionStagingDirPath());

    if (!this.areNoteListsEqual(notes, stagedNotes)) {
      throw new Error("Encrypted note verification failed.");
    }
  }

  private async verifyFinalEncryptedLayout(notes: NoteType[], masterKey: Uint8Array): Promise<void> {
    const finalNotes = await this.readEncryptedNotes(masterKey);

    if (!this.areNoteListsEqual(notes, finalNotes)) {
      throw new Error("Final encrypted note verification failed.");
    }
  }

  private async verifyPlaintextStaging(notes: NoteType[]): Promise<void> {
    const stagedNotes = await this.readPlaintextNotes(this.getDecryptionStagingDirPath());

    if (!this.areNoteListsEqual(notes, stagedNotes)) {
      throw new Error("Decrypted note verification failed.");
    }
  }

  private async verifyFinalPlaintextLayout(notes: NoteType[]): Promise<void> {
    const finalNotes = await this.readPlaintextNotes();

    if (!this.areNoteListsEqual(notes, finalNotes)) {
      throw new Error("Final decrypted note verification failed.");
    }
  }

  private async installEncryptedStaging(): Promise<void> {
    const stagingDir = this.getEncryptionStagingDirPath();

    await this.removeEncryptedLayout();

    try {
      await fs.promises.rename(this.getEncryptedNotesManifestPath(stagingDir), this.getEncryptedNotesManifestPath());
      await fs.promises.rename(this.getEncryptedNotesDirPath(stagingDir), this.getEncryptedNotesDirPath());
      await this.removePathIfExists(stagingDir);
    } catch (err) {
      await this.removeEncryptedLayout();
      throw err;
    }
  }

  private async installPlaintextStaging(): Promise<void> {
    const stagingDir = this.getDecryptionStagingDirPath();
    const files = await fs.promises.readdir(stagingDir);

    await this.removePlaintextLayout();

    try {
      for (const file of files) {
        await fs.promises.rename(path.join(stagingDir, file), path.join(this.appDataDir, file));
      }

      await this.removePathIfExists(stagingDir);
    } catch (err) {
      await this.removePlaintextLayout();
      throw err;
    }
  }

  private encryptNote(note: NoteType): EncryptedNoteRecord {
    if (!this.masterKey) {
      throw new Error("Cannot encrypt note before encryption has been unlocked.");
    }

    return this.encryptNoteWithKey(note, this.masterKey);
  }

  private encryptNoteWithKey(note: NoteType, masterKey: Uint8Array): EncryptedNoteRecord {
    const payload = this.encryptionService.encrypt(
      new TextEncoder().encode(JSON.stringify(note)),
      masterKey,
      this.getNoteAad(note.id)
    );

    return {
      version: ENCRYPTED_NOTE_RECORD_VERSION,
      ...payload
    };
  }

  private async getOrCreateEncryptedManifest(masterKey: Uint8Array): Promise<EncryptedNoteManifest> {
    if (this.encryptedManifest) {
      return this.encryptedManifest;
    }

    if (await this.hasEncryptedManifest()) {
      this.encryptedManifest = await this.readEncryptedManifest(masterKey);
      return this.encryptedManifest;
    }

    this.encryptedManifest = this.createEncryptedManifest([]);
    return this.encryptedManifest;
  }

  private createEncryptedManifest(notes: NoteType[]): EncryptedNoteManifest {
    const files: Record<string, string> = {};

    notes.forEach((note) => {
      files[note.id] = this.createEncryptedNoteFileNameSync();
    });

    return {
      version: ENCRYPTED_NOTE_MANIFEST_VERSION,
      noteOrder: notes.map((note) => note.id),
      files
    };
  }

  private async readEncryptedManifest(masterKey: Uint8Array, baseDir = this.appDataDir): Promise<EncryptedNoteManifest> {
    const content = await fs.promises.readFile(this.getEncryptedNotesManifestPath(baseDir), "utf-8");
    const record = JSON.parse(content) as EncryptedNoteRecord;
    const plaintext = this.encryptionService.decrypt(record, masterKey, new TextEncoder().encode(MANIFEST_AAD));
    const manifest = JSON.parse(new TextDecoder().decode(plaintext)) as EncryptedNoteManifest;

    return {
      version: manifest.version,
      noteOrder: Array.isArray(manifest.noteOrder) ? manifest.noteOrder.filter((noteId): noteId is string => typeof noteId === "string") : [],
      files: manifest.files && typeof manifest.files === "object" ? manifest.files : {}
    };
  }

  private async writeEncryptedManifest(manifest: EncryptedNoteManifest, masterKey: Uint8Array, baseDir = this.appDataDir): Promise<void> {
    await fs.promises.mkdir(baseDir, { recursive: true });
    const payload = this.encryptionService.encrypt(
      new TextEncoder().encode(JSON.stringify(manifest)),
      masterKey,
      new TextEncoder().encode(MANIFEST_AAD)
    );

    await this.writeFileAtomic(
      this.getEncryptedNotesManifestPath(baseDir),
      JSON.stringify({
        version: ENCRYPTED_NOTE_RECORD_VERSION,
        ...payload
      })
    );
  }

  private async hasEncryptedManifest(baseDir = this.appDataDir): Promise<boolean> {
    try {
      await fs.promises.access(this.getEncryptedNotesManifestPath(baseDir), fs.constants.F_OK);
      return true;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return false;
      }

      throw err;
    }
  }

  private async getPlaintextNoteFiles(baseDir: string): Promise<string[]> {
    const files = await fs.promises.readdir(baseDir);

    return files.filter((file) => file !== NOTE_ORDER_FILE_NAME && file.endsWith(".json"));
  }

  private getPlaintextNoteFilePath(noteId: string): string {
    return path.join(this.appDataDir, `${noteId}.json`);
  }

  private getNoteOrderFilePath(baseDir = this.appDataDir): string {
    return path.join(baseDir, NOTE_ORDER_FILE_NAME);
  }

  private readNoteOrder(baseDir = this.appDataDir): string[] {
    try {
      const content = fs.readFileSync(this.getNoteOrderFilePath(baseDir), "utf-8");
      const noteIds = JSON.parse(content);

      return Array.isArray(noteIds) ? noteIds.filter((noteId): noteId is string => typeof noteId === "string") : [];
    } catch {
      return [];
    }
  }

  private async writeNoteOrder(noteIds: string[], baseDir = this.appDataDir): Promise<void> {
    await fs.promises.mkdir(baseDir, { recursive: true });
    await this.writeFileAtomic(this.getNoteOrderFilePath(baseDir), JSON.stringify(noteIds));
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
    await this.writeFileAtomic(this.encryptionRecordPath, JSON.stringify(record, null, 2));
  }

  private async removeEncryptionRecord(): Promise<void> {
    await this.removePathIfExists(this.encryptionRecordPath);
  }

  private async removePlaintextLayout(): Promise<void> {
    await this.removeLegacyJsonNoteFiles();
    await this.removePathIfExists(this.getNoteOrderFilePath());
  }

  private async removeLegacyJsonNoteFiles(): Promise<void> {
    const files = await this.getPlaintextNoteFiles(this.appDataDir);

    await Promise.all(files.map((file) => this.removePathIfExists(path.join(this.appDataDir, file))));
  }

  private async removeEncryptedLayout(): Promise<void> {
    await this.removePathIfExists(this.getEncryptedNotesManifestPath());
    await this.removePathIfExists(this.getEncryptedNotesDirPath());
  }

  private async removePathIfExists(filePath: string): Promise<void> {
    try {
      await fs.promises.rm(filePath, { force: true, recursive: true });
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        throw err;
      }
    }
  }

  private async writeFileAtomic(filePath: string, content: string): Promise<void> {
    const directory = path.dirname(filePath);
    const temporaryFilePath = path.join(directory, `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`);
    let fileHandle: fs.promises.FileHandle | undefined;

    await fs.promises.mkdir(directory, { recursive: true });

    try {
      fileHandle = await fs.promises.open(temporaryFilePath, "w");
      await fileHandle.writeFile(content, "utf-8");
      await fileHandle.sync();
      await fileHandle.close();
      fileHandle = undefined;
      await fs.promises.rename(temporaryFilePath, filePath);
      await this.syncDirectory(directory);
    } catch (err) {
      if (fileHandle) {
        await fileHandle.close().catch(() => undefined);
      }

      await this.removePathIfExists(temporaryFilePath);
      throw err;
    }
  }

  private async syncDirectory(directory: string): Promise<void> {
    let directoryHandle: fs.promises.FileHandle | undefined;

    try {
      directoryHandle = await fs.promises.open(directory, "r");
      await directoryHandle.sync();
    } catch {
      // Some filesystems do not allow syncing directories. The atomic rename
      // still protects against torn file contents in that case.
    } finally {
      await directoryHandle?.close().catch(() => undefined);
    }
  }

  private getEncryptedNotesDirPath(baseDir = this.appDataDir): string {
    return path.join(baseDir, ENCRYPTED_NOTES_DIR_NAME);
  }

  private getEncryptedNotesManifestPath(baseDir = this.appDataDir): string {
    return path.join(baseDir, ENCRYPTED_NOTES_MANIFEST_FILE_NAME);
  }

  private getEncryptionStagingDirPath(): string {
    return path.join(this.appDataDir, ENCRYPTION_STAGING_DIR_NAME);
  }

  private getDecryptionStagingDirPath(): string {
    return path.join(this.appDataDir, DECRYPTION_STAGING_DIR_NAME);
  }

  private async createEncryptedNoteFileName(): Promise<string> {
    let fileName = this.createEncryptedNoteFileNameSync();

    while (await this.encryptedNoteFileExists(fileName)) {
      fileName = this.createEncryptedNoteFileNameSync();
    }

    return fileName;
  }

  private createEncryptedNoteFileNameSync(): string {
    return `${crypto.randomBytes(16).toString("hex")}${ENCRYPTED_NOTE_FILE_EXTENSION}`;
  }

  private async encryptedNoteFileExists(fileName: string): Promise<boolean> {
    try {
      await fs.promises.access(path.join(this.getEncryptedNotesDirPath(), fileName), fs.constants.F_OK);
      return true;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return false;
      }

      throw err;
    }
  }

  private areNoteListsEqual(expectedNotes: NoteType[], actualNotes: NoteType[]): boolean {
    return JSON.stringify(expectedNotes.map((note) => this.serializeNoteForComparison(note)))
      === JSON.stringify(actualNotes.map((note) => this.serializeNoteForComparison(note)));
  }

  private serializeNoteForComparison(note: NoteType): Record<string, unknown> {
    return {
      ...note,
      createdOn: new Date(note.createdOn).toISOString(),
      lastModifiedOn: new Date(note.lastModifiedOn).toISOString(),
      pinnedOn: note.pinnedOn ? new Date(note.pinnedOn).toISOString() : undefined
    };
  }

  private getNoteAad(noteId: string): Uint8Array {
    return new TextEncoder().encode(`${NOTE_AAD_PREFIX}:${noteId}`);
  }
}
