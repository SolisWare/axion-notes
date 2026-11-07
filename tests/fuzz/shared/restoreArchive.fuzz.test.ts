/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import { createBackupArchiveEntries } from "../../../src/backup/backupArchive";
import { BackupArchiveFile, parseBackupArchive, ValidatedBackupArchive } from "../../../src/backup/restoreArchive";
import { NoteType } from "../../../src/types/NoteType";
import { NoteColorKey } from "../../../src/theme/NoteColors";

const minDate = new Date("2020-01-01T00:00:00.000Z");
const maxDate = new Date("2030-12-31T23:59:59.999Z");

describe("backup archive fuzzing", () => {
  it("round-trips randomized valid note archives without losing note order or timestamps", () => {
    fc.assert(
      fc.property(noteArchiveArbitrary(), ({ createdAt, notes }) => {
        const files = createBackupArchiveEntries({
          contentSelection: { appSettings: false, mainWindowState: false },
          createdAt,
          notes
        }).map((entry) => ({ content: JSON.stringify(entry.value), fileName: entry.fileName }));

        const archive = parseBackupArchive(files);

        expect(archive.createdAt).toBe(createdAt);
        expect(archive.noteOrder).toEqual(notes.map((note) => note.id));
        expect(serializeNotes(archive.notes)).toEqual(serializeNotes(notes));
      }),
      getFuzzParameters()
    );
  });

  it("either rejects arbitrary archive entries or produces a fully consistent restore payload", () => {
    fc.assert(
      fc.property(untrustedArchiveFilesArbitrary(), (files) => {
        try {
          assertConsistentArchive(parseBackupArchive(files));
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      }),
      getFuzzParameters()
    );
  });
});

function noteArchiveArbitrary(): fc.Arbitrary<{ createdAt: string; notes: NoteType[] }> {
  return fc.record({
    createdAt: validDateArbitrary().map((date) => date.toISOString()),
    notes: fc.uniqueArray(
      fc.record({
        bgcolor: fc.constantFrom(...Object.values(NoteColorKey)),
        content: fc.string({ maxLength: 4_000 }),
        createdOn: validDateArbitrary(),
        id: fc.uuid(),
        lastModifiedOn: validDateArbitrary(),
        title: fc.option(fc.string({ maxLength: 160 }), { nil: undefined })
      }),
      { maxLength: 24, selector: (note) => note.id }
    )
  }) as fc.Arbitrary<{ createdAt: string; notes: NoteType[] }>;
}

function untrustedArchiveFilesArbitrary(): fc.Arbitrary<BackupArchiveFile[]> {
  return fc.array(
    fc.record({
      content: fc.string({ maxLength: 8_000 }),
      fileName: fc.string({ maxLength: 160 })
    }),
    { maxLength: 8 }
  );
}

function validDateArbitrary(): fc.Arbitrary<Date> {
  return fc.integer({ min: minDate.getTime(), max: maxDate.getTime() }).map((timestamp) => new Date(timestamp));
}

function assertConsistentArchive(archive: ValidatedBackupArchive): void {
  const noteIds = archive.notes.map((note) => note.id);

  expect(new Set(noteIds).size).toBe(noteIds.length);
  expect(archive.noteOrder).toHaveLength(noteIds.length);
  expect(new Set(archive.noteOrder)).toEqual(new Set(noteIds));
  expect(Number.isNaN(new Date(archive.createdAt).getTime())).toBe(false);

  archive.notes.forEach((note) => {
    expect(Number.isNaN(note.createdOn.getTime())).toBe(false);
    expect(Number.isNaN(note.lastModifiedOn.getTime())).toBe(false);
  });
}

function serializeNotes(notes: NoteType[]): unknown[] {
  return notes.map((note) => ({
    ...note,
    createdOn: note.createdOn.toISOString(),
    lastModifiedOn: note.lastModifiedOn.toISOString(),
    pinnedOn: note.pinnedOn?.toISOString()
  }));
}

function getFuzzParameters(): { numRuns: number; seed?: number } {
  const configuredRuns = Number.parseInt(process.env.AXION_NOTES_FUZZ_ARCHIVE_RUNS ?? "", 10);
  const configuredSeed = Number.parseInt(process.env.AXION_NOTES_FUZZ_SEED ?? "", 10);

  return {
    numRuns: Number.isSafeInteger(configuredRuns) && configuredRuns > 0 ? configuredRuns : 100,
    ...(Number.isSafeInteger(configuredSeed) ? { seed: configuredSeed } : {})
  };
}
