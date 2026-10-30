/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import { EncryptionKeyService } from "../../../../electron/security/EncryptionKeyService";
import { EncryptionService } from "../../../../electron/security/EncryptionService";
import { NoteService } from "../../../../electron/storage/NoteService";
import { NoteType } from "../../../../src/types/NoteType";
import { NoteColorKey } from "../../../../src/theme/NoteColors";

const password = "correct horse battery staple";
const minDate = new Date("2020-01-01T00:00:00.000Z");
const maxDate = new Date("2030-12-31T23:59:59.999Z");

describe("NoteService encryption fuzzing", () => {
  it("preserves randomized vaults through encrypt, restart/unlock, decrypt, and restart", async () => {
    await fc.assert(
      fc.asyncProperty(noteVaultArbitrary(), async (notes) => {
        const rootDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "axion-notes-encryption-fuzz-"));
        const appDataDir = path.join(rootDir, "notes-data");
        const encryptionRecordPath = path.join(rootDir, "security", "encryption.json");

        try {
          await writePlaintextNotes(appDataDir, notes);
          await createService(appDataDir, encryptionRecordPath).enableEncryption(password);

          const encryptedRestart = createService(appDataDir, encryptionRecordPath);
          encryptedRestart.applyEncryptionSetting(true);
          await encryptedRestart.unlockEncryption(password);
          expect(serializeNotes(await encryptedRestart.getNotes())).toEqual(serializeNotes(notes));

          await encryptedRestart.disableEncryption(password);
          const plaintextRestart = createService(appDataDir, encryptionRecordPath);
          expect(serializeNotes(await plaintextRestart.getNotes())).toEqual(serializeNotes(notes));
        } finally {
          await fs.promises.rm(rootDir, { force: true, recursive: true });
        }
      }),
      getFuzzParameters()
    );
  }, 120_000);
});

function noteVaultArbitrary(): fc.Arbitrary<NoteType[]> {
  return fc.uniqueArray(
    fc.record({
      id: fc.uuid(),
      bgcolor: fc.constantFrom(...Object.values(NoteColorKey)),
      title: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
      content: fc.string({ maxLength: 8_000 }),
      isPinned: fc.option(fc.boolean(), { nil: undefined }),
      isTitleHidden: fc.option(fc.boolean(), { nil: undefined }),
      isFolded: fc.option(fc.boolean(), { nil: undefined }),
      createdOn: validDateArbitrary(),
      lastModifiedOn: validDateArbitrary()
    }),
    {
      minLength: 0,
      maxLength: 20,
      selector: (note) => note.id
    }
  ).map((notes) => notes.map((note) => ({
    ...note,
    pinnedOn: note.isPinned ? note.lastModifiedOn : undefined,
    pinnedFromNoteIds: note.isPinned ? [] : undefined
  })));
}

function validDateArbitrary(): fc.Arbitrary<Date> {
  return fc.integer({
    min: minDate.getTime(),
    max: maxDate.getTime()
  }).map((timestamp) => new Date(timestamp));
}

function createService(appDataDir: string, encryptionRecordPath: string): NoteService {
  const encryptionService = new EncryptionService();

  return new NoteService(
    appDataDir,
    encryptionRecordPath,
    encryptionService,
    new EncryptionKeyService(encryptionService)
  );
}

async function writePlaintextNotes(appDataDir: string, notes: NoteType[]): Promise<void> {
  await fs.promises.mkdir(appDataDir, { recursive: true });
  await Promise.all(notes.map((note) => fs.promises.writeFile(path.join(appDataDir, `${note.id}.json`), JSON.stringify(note), "utf-8")));
  await fs.promises.writeFile(path.join(appDataDir, "note-order.json"), JSON.stringify(notes.map((note) => note.id)), "utf-8");
}

function serializeNotes(notes: NoteType[]): unknown[] {
  return JSON.parse(JSON.stringify(notes.map((note) => ({
    ...note,
    createdOn: note.createdOn.toISOString(),
    lastModifiedOn: note.lastModifiedOn.toISOString(),
    pinnedOn: note.pinnedOn?.toISOString()
  }))));
}

function getFuzzParameters(): { numRuns: number; seed?: number } {
  const configuredRuns = Number.parseInt(process.env.AXION_NOTES_FUZZ_STORAGE_RUNS ?? "", 10);
  const configuredSeed = Number.parseInt(process.env.AXION_NOTES_FUZZ_SEED ?? "", 10);

  return {
    numRuns: Number.isSafeInteger(configuredRuns) && configuredRuns > 0 ? configuredRuns : 75,
    ...(Number.isSafeInteger(configuredSeed) ? { seed: configuredSeed } : {})
  };
}
