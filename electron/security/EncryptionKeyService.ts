/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as crypto from "node:crypto";
import { EncryptionRecord } from "../../src/security/EncryptionRecord";
import { KeyDerivationAlgorithm } from "../../src/security/KeyDerivationAlgorithm";
import { EncryptionService } from "./EncryptionService";

const ENCRYPTION_RECORD_VERSION = 1;
const MASTER_KEY_LENGTH = 32; // 32 bytes = 256 bits.
const PASSWORD_KEY_LENGTH = 32; // 32 bytes = 256 bits.
const PASSWORD_SALT_LENGTH = 16; // 16 bytes = 128 bits.
const MASTER_KEY_AAD = new TextEncoder().encode("Axion Notes master key");

/**
 * Creates and unlocks encryption master-key records.
 *
 * This service is intended for Electron main-process use only. It derives a
 * password wrapping key with scrypt, uses that key to encrypt/decrypt the
 * random master key, and never exposes password-derived keys to renderer code.
 */
export class EncryptionKeyService {
  
  public constructor(private readonly encryptionService: EncryptionService) {
  }

  /**
   * Creates a new random master key and wraps it with the supplied password.
   *
   * @param password Raw password entered by the user.
   * @returns Encryption metadata record and the unwrapped master key.
   */
  public async createRecord(password: string): Promise<{ record: EncryptionRecord; masterKey: Uint8Array }> {
    const masterKey = this.getRandomBytes(MASTER_KEY_LENGTH);
    const keyDerivation = {
      algorithm: KeyDerivationAlgorithm.SCRYPT,
      salt: this.bytesToHex(this.getRandomBytes(PASSWORD_SALT_LENGTH)),
      keyLength: PASSWORD_KEY_LENGTH
    };
    const passwordKey = await this.derivePasswordKey(password, this.hexToBytes(keyDerivation.salt), keyDerivation.keyLength);

    try {
      const wrappedMasterKey = this.encryptionService.encrypt(masterKey, passwordKey, MASTER_KEY_AAD);

      return {
        record: {
          version: ENCRYPTION_RECORD_VERSION,
          algorithm: wrappedMasterKey.algorithm,
          keyDerivation,
          wrappedMasterKey
        },
        masterKey
      };
    } finally {
      this.zeroBytes(passwordKey);
    }
  }

  /**
   * Unwraps the stored master key with the supplied password.
   *
   * @param password Raw password entered by the user.
   * @param record Stored encryption metadata record.
   * @returns Unwrapped master key.
   */
  public async unlock(password: string, record: EncryptionRecord): Promise<Uint8Array> {
    const supportedRecord = this.migrateRecord(record);

    const passwordKey = await this.derivePasswordKey(
      password,
      this.hexToBytes(supportedRecord.keyDerivation.salt),
      supportedRecord.keyDerivation.keyLength
    );

    try {
      return this.encryptionService.decrypt(supportedRecord.wrappedMasterKey, passwordKey, MASTER_KEY_AAD);
    } finally {
      this.zeroBytes(passwordKey);
    }
  }

  /**
   * Rewraps the stored master key with a new password.
   *
   * Note data does not need to be re-encrypted when only the wrapping password
   * changes.
   *
   * @param currentPassword Existing raw password.
   * @param newPassword New raw password.
   * @param record Existing encryption metadata record.
   * @returns Updated encryption metadata record.
   */
  public async changePassword(currentPassword: string, newPassword: string, record: EncryptionRecord): Promise<EncryptionRecord> {
    const masterKey = await this.unlock(currentPassword, record);

    try {
      return await this.wrapMasterKey(newPassword, masterKey);
    } finally {
      this.zeroBytes(masterKey);
    }
  }

  private async wrapMasterKey(password: string, masterKey: Uint8Array): Promise<EncryptionRecord> {
    const keyDerivation = {
      algorithm: KeyDerivationAlgorithm.SCRYPT,
      salt: this.bytesToHex(this.getRandomBytes(PASSWORD_SALT_LENGTH)),
      keyLength: PASSWORD_KEY_LENGTH
    };
    const passwordKey = await this.derivePasswordKey(password, this.hexToBytes(keyDerivation.salt), keyDerivation.keyLength);

    try {
      const wrappedMasterKey = this.encryptionService.encrypt(masterKey, passwordKey, MASTER_KEY_AAD);

      return {
        version: ENCRYPTION_RECORD_VERSION,
        algorithm: wrappedMasterKey.algorithm,
        keyDerivation,
        wrappedMasterKey
      };
    } finally {
      this.zeroBytes(passwordKey);
    }
  }

  private derivePasswordKey(password: string, salt: Uint8Array, keyLength: number): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      crypto.scrypt(password, salt, keyLength, (err, derivedKey) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(this.copyBuffer(derivedKey));
      });
    });
  }

  private migrateRecord(record: unknown): EncryptionRecord {
    this.assertRecordShape(record);

    if (record.version === ENCRYPTION_RECORD_VERSION) {
      this.assertSupportedRecord(record);
      return record;
    }

    throw new Error(`Unsupported encryption record version: ${record.version}.`);
  }

  private assertSupportedRecord(record: EncryptionRecord): void {
    if (
      record.keyDerivation.algorithm !== KeyDerivationAlgorithm.SCRYPT
      || record.keyDerivation.keyLength !== PASSWORD_KEY_LENGTH
      || record.algorithm !== record.wrappedMasterKey.algorithm
    ) {
      throw new Error("Unsupported encryption record.");
    }
  }

  private assertRecordShape(record: unknown): asserts record is EncryptionRecord {
    if (!this.isObjectRecord(record)
      || typeof record.version !== "number"
      || !this.isObjectRecord(record.keyDerivation)
      || !this.isObjectRecord(record.wrappedMasterKey)
      || typeof record.keyDerivation.algorithm !== "string"
      || typeof record.keyDerivation.salt !== "string"
      || typeof record.keyDerivation.keyLength !== "number"
      || typeof record.wrappedMasterKey.algorithm !== "string"
      || typeof record.wrappedMasterKey.iv !== "string"
      || typeof record.wrappedMasterKey.authTag !== "string"
      || typeof record.wrappedMasterKey.ciphertext !== "string"
    ) {
      throw new Error("Invalid encryption record.");
    }
  }

  private isObjectRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  private getRandomBytes(length: number): Uint8Array {
    return this.copyBuffer(crypto.randomBytes(length));
  }

  private hexToBytes(hex: string): Uint8Array {
    if (hex.length % 2 !== 0) {
      throw new Error("Hex value must contain an even number of characters.");
    }

    const bytes = new Uint8Array(hex.length / 2);

    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
    }

    return bytes;
  }

  private bytesToHex(value: Uint8Array): string {
    return Array.from(value, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  private copyBuffer(value: Buffer): Uint8Array {
    const bytes = new Uint8Array(value.length);

    for (let index = 0; index < value.length; index += 1) {
      bytes[index] = value[index];
    }

    return bytes;
  }

  private zeroBytes(value: Uint8Array): void {
    value.fill(0);
  }
}
