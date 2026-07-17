/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as fs from "node:fs";
import * as path from "path";
import { NoteType } from "../../src/models/NoteType";
import { Formatter } from "../../src/utils/dt-formatter/Formatter";

const noteOrderFileName = "note-order.json";

function getNoteOrderFilePath(appDataDir: string): string {
  return path.join(appDataDir, noteOrderFileName);
}

function readNoteOrder(appDataDir: string): string[] {
  try {
    const content = fs.readFileSync(getNoteOrderFilePath(appDataDir), "utf-8");
    const noteIds = JSON.parse(content);

    return Array.isArray(noteIds) ? noteIds.filter((noteId): noteId is string => typeof noteId === "string") : [];
  } catch (err) {
    return [];
  }
}

function writeNoteOrder(appDataDir: string, noteIds: string[]): void {
  fs.writeFile(getNoteOrderFilePath(appDataDir), JSON.stringify(noteIds), (err) => {
    if (err) {
      console.error(err);
      // TODO: Throw an exception and send callback to the renderer.
    }
  });
}

export function setNote(appDataDir: string, note: NoteType): void {
  const filePath = path.join(appDataDir, `${note.id}.json`);
  const serializedNote = JSON.stringify(note);
  const noteOrder = readNoteOrder(appDataDir);

  if (!noteOrder.includes(note.id)) {
    writeNoteOrder(appDataDir, [...noteOrder, note.id]);
  }

  fs.writeFile(filePath, serializedNote, (err) => {
    if (err) {
      console.error(err);
      // TODO: Throw an exception and send callback to the renderer.
    }
  });
}

export function setNoteOrder(appDataDir: string, noteIds: string[]): void {
  writeNoteOrder(appDataDir, noteIds);
}

export async function getNotes(appDataDir: string): Promise<NoteType[]> {
  const files = await fs.promises.readdir(appDataDir);
  const noteOrder = readNoteOrder(appDataDir);
  const noteOrderIndexes = new Map(noteOrder.map((noteId, index) => [noteId, index]));
  const notes = await Promise.all(
    files
      .filter((file) => file !== noteOrderFileName)
      .map(async (file): Promise<NoteType | null> => {
        try {
          const filePath = path.join(appDataDir, file);
          const content = await fs.promises.readFile(filePath, "utf-8");
          const parsed = JSON.parse(content) as NoteType;

          return {
            ...parsed,
            createdOn: new Date(parsed.createdOn),
            lastModifiedOn: new Date(parsed.lastModifiedOn),
            pinnedOn: Formatter.toOptionalDate(parsed.pinnedOn)
          };
        } catch (err) {
          console.warn(`Skipping corrupt note file: ${file}`);
          // TODO: We might want to consider an exception so a warning can be displayed.
          return null;
        }
      })
  );

  return notes
    .filter((note): note is NoteType => note !== null)
    .sort((firstNote, secondNote) => {
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

export function deleteNote(appDataDir: string, noteId: string): void {
  const filePath = path.join(appDataDir, `${noteId}.json`);
  writeNoteOrder(appDataDir, readNoteOrder(appDataDir).filter((storedNoteId) => storedNoteId !== noteId));

  console.log("Deleting:", filePath);
  fs.unlink(filePath, (err) => {
    if (err) {
      console.log(err);
      // TODO: Error handling
    }
  });
}

export function deleteAllNotes(appDataDir: string): void {
  console.log("Deleting all files in :", appDataDir);
  fs.promises.readdir(appDataDir)
    .then((files) => Promise.all(
      files
        .map((file) => fs.promises.unlink(path.join(appDataDir, file)))
    ))
    .catch((err) => {
      console.log(err);
      // TODO: Error handling
    });
}
