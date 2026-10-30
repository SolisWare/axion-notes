/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { describe, expect, it } from "vitest";
import { EncryptionKeyService } from "../../../../electron/security/EncryptionKeyService";
import { EncryptionService } from "../../../../electron/security/EncryptionService";
import { EncryptionRecord } from "../../../../src/security/EncryptionRecord";
import { EncryptionAlgorithm } from "../../../../src/security/EncryptionAlgorithm";
import { KeyDerivationAlgorithm } from "../../../../src/security/KeyDerivationAlgorithm";

const password = "correct horse battery staple";

describe("EncryptionKeyService", () => {
  it("creates a random 256-bit master key that the correct password unlocks", async () => {
    const service = createService();

    const { record, masterKey } = await service.createRecord(password);
    const unlockedMasterKey = await service.unlock(password, record);

    expect(masterKey).toHaveLength(32);
    expect(Array.from(unlockedMasterKey)).toEqual(Array.from(masterKey));
    expect(record).toMatchObject({
      version: 1,
      algorithm: EncryptionAlgorithm.AES_256_GCM,
      keyDerivation: {
        algorithm: KeyDerivationAlgorithm.SCRYPT,
        keyLength: 32
      },
      wrappedMasterKey: {
        algorithm: EncryptionAlgorithm.AES_256_GCM
      }
    });
    expect(record.keyDerivation.salt).toMatch(/^[\da-f]{32}$/i);
    expect(record.wrappedMasterKey.iv).toMatch(/^[\da-f]{24}$/i);
    expect(record.wrappedMasterKey.authTag).toMatch(/^[\da-f]{32}$/i);
  });

  it("uses a new master key and password salt for each record", async () => {
    const service = createService();

    const first = await service.createRecord(password);
    const second = await service.createRecord(password);

    expect(Array.from(first.masterKey)).not.toEqual(Array.from(second.masterKey));
    expect(first.record.keyDerivation.salt).not.toBe(second.record.keyDerivation.salt);
    expect(first.record.wrappedMasterKey.ciphertext).not.toBe(second.record.wrappedMasterKey.ciphertext);
  });

  it("rejects an incorrect password without unwrapping the master key", async () => {
    const service = createService();
    const { record } = await service.createRecord(password);

    await expect(service.unlock("incorrect password", record)).rejects.toThrow();
  });

  it("changes only the password wrapping and retains the exact master key", async () => {
    const service = createService();
    const { record, masterKey } = await service.createRecord(password);

    const changedRecord = await service.changePassword(password, "a different secure password", record);

    await expect(service.unlock(password, changedRecord)).rejects.toThrow();
    expect(Array.from(await service.unlock("a different secure password", changedRecord))).toEqual(Array.from(masterKey));
    expect(changedRecord.keyDerivation.salt).not.toBe(record.keyDerivation.salt);
  });

  it.each([
    ["password salt", (record: EncryptionRecord) => ({ ...record, keyDerivation: { ...record.keyDerivation, salt: replaceHexByte(record.keyDerivation.salt) } })],
    ["wrapped ciphertext", (record: EncryptionRecord) => ({ ...record, wrappedMasterKey: { ...record.wrappedMasterKey, ciphertext: replaceHexByte(record.wrappedMasterKey.ciphertext) } })],
    ["wrapped IV", (record: EncryptionRecord) => ({ ...record, wrappedMasterKey: { ...record.wrappedMasterKey, iv: replaceHexByte(record.wrappedMasterKey.iv) } })],
    ["wrapped authentication tag", (record: EncryptionRecord) => ({ ...record, wrappedMasterKey: { ...record.wrappedMasterKey, authTag: replaceHexByte(record.wrappedMasterKey.authTag) } })]
  ])("rejects a tampered %s", async (_name, tamper) => {
    const service = createService();
    const { record } = await service.createRecord(password);

    await expect(service.unlock(password, tamper(record))).rejects.toThrow();
  });

  it.each([
    ["an unsupported record version", (record: EncryptionRecord) => ({ ...record, version: 2 })],
    ["an unsupported key derivation algorithm", (record: EncryptionRecord) => ({ ...record, keyDerivation: { ...record.keyDerivation, algorithm: "pbkdf2" as KeyDerivationAlgorithm } })],
    ["an unsupported key length", (record: EncryptionRecord) => ({ ...record, keyDerivation: { ...record.keyDerivation, keyLength: 64 } })],
    ["a malformed salt", (record: EncryptionRecord) => ({ ...record, keyDerivation: { ...record.keyDerivation, salt: "not-hex" } })],
    ["a malformed wrapped payload", (record: EncryptionRecord) => ({ ...record, wrappedMasterKey: { ...record.wrappedMasterKey, authTag: "00" } })]
  ])("rejects %s", async (_name, modify) => {
    const service = createService();
    const { record } = await service.createRecord(password);

    await expect(service.unlock(password, modify(record))).rejects.toThrow();
  });
});

function createService(): EncryptionKeyService {
  return new EncryptionKeyService(new EncryptionService());
}

function replaceHexByte(value: string): string {
  return `${value.slice(0, 2).toLowerCase() === "00" ? "01" : "00"}${value.slice(2)}`;
}
