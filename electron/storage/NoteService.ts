/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { NoteType } from "../../src/models/NoteType";
import { deleteAllNotes, deleteNote, getNotes, setNote, setNoteOrder } from "./noteStorage";

/**
 * Provides cached note access for the Electron main process.
 *
 * The first read loads notes from disk. Later reads return the in-memory copy
 * while note mutations update both the cache and disk storage.
 */
export class NoteService {
  
  private notes: NoteType[] | undefined;

  public constructor(private readonly appDataDir: string) {
  }

  /**
   * Returns all notes, loading them from disk only when the cache is empty.
   */
  public async getNotes(): Promise<NoteType[]> {
    if (!this.notes) {
      this.notes = await getNotes(this.appDataDir);
    }

    return [...this.notes];
  }

  /**
   * Stores a note and updates the in-memory cache.
   *
   * @param note Note to create or update.
   */
  public setNote(note: NoteType): void {
    setNote(this.appDataDir, note);

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
   *
   * @param noteIds Ordered note IDs.
   */
  public setNoteOrder(noteIds: string[]): void {
    setNoteOrder(this.appDataDir, noteIds);

    if (!this.notes) {
      return;
    }

    const noteOrderIndexes = new Map(noteIds.map((noteId, index) => [noteId, index]));

    this.notes = [...this.notes].sort((firstNote, secondNote) => {
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

  /**
   * Deletes a note and removes it from the in-memory cache.
   *
   * @param noteId Note ID to delete.
   */
  public deleteNote(noteId: string): void {
    deleteNote(this.appDataDir, noteId);
    this.notes = this.notes?.filter((note) => note.id !== noteId);
  }

  /**
   * Deletes all notes and clears the in-memory cache.
   */
  public deleteAllNotes(): void {
    deleteAllNotes(this.appDataDir);
    this.notes = [];
  }
}
