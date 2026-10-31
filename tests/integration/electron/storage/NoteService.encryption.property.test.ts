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

const propertySeed = 0xa710;
const password = "correct horse battery staple";
const minDate = new Date("2020-01-01T00:00:00.000Z");
const maxDate = new Date("2030-12-31T23:59:59.999Z");

describe("NoteService encryption properties", () => {
  it("preserves every generated plaintext vault through encrypt, restart, and unlock", async () => {
    await fc.assert(
      fc.asyncProperty(noteVaultArbitrary(), async (notes) => {
        const rootDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "axion-notes-encryption-property-"));
        const appDataDir = path.join(rootDir, "notes-data");
        const encryptionRecordPath = path.join(rootDir, "security", "encryption.json");

        try {
          await writePlaintextNotes(appDataDir, notes);
          await createService(appDataDir, encryptionRecordPath).enableEncryption(password);

          const restartedService = createService(appDataDir, encryptionRecordPath);
          restartedService.applyEncryptionSetting(true);
          await restartedService.unlockEncryption(password);

          expect(serializeNotes(await restartedService.getNotes())).toEqual(serializeNotes(notes));
        } finally {
          await fs.promises.rm(rootDir, { force: true, recursive: true });
        }
      }),
      {
        seed: propertySeed,
        numRuns: 12
      }
    );
  }, 15_000);
});

function noteVaultArbitrary(): fc.Arbitrary<NoteType[]> {
  return fc.uniqueArray(
    fc.record({
      id: fc.uuid(),
      bgcolor: fc.constantFrom(...Object.values(NoteColorKey)),
      title: fc.option(fc.string({ maxLength: 120 }), { nil: undefined }),
      content: fc.string({ maxLength: 1_000 }),
      isPinned: fc.option(fc.boolean(), { nil: undefined }),
      isTitleHidden: fc.option(fc.boolean(), { nil: undefined }),
      isFolded: fc.option(fc.boolean(), { nil: undefined }),
      createdOn: validDateArbitrary(),
      lastModifiedOn: validDateArbitrary()
    }),
    {
      minLength: 0,
      maxLength: 6,
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
