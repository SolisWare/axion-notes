/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as crypto from "node:crypto";
import { EncryptionAlgorithm } from "../../src/security/EncryptionAlgorithm";

const AES_256_GCM_KEY_LENGTH = 32; // 32 bytes = 256 bits.
const AES_GCM_IV_LENGTH = 12; // 12 bytes = 96 bits.

export type EncryptedPayload = {
  algorithm: EncryptionAlgorithm;
  iv: string;
  authTag: string;
  ciphertext: string;
};

/**
 * Provides AES-GCM encryption helpers for Electron main-process security
 * services.
 *
 * This service only handles symmetric encryption and decryption. It does not
 * derive password keys, store keys, or decide when note data should be
 * encrypted.
 */
export class EncryptionService {
  
  /**
   * Encrypts plaintext with AES-256-GCM.
   *
   * @param plaintext Raw data to encrypt.
   * @param key 32-byte encryption key.
   * @param additionalAuthenticatedData Optional authenticated metadata.
   * @returns Encrypted payload containing IV, auth tag, and ciphertext as hex.
   */
  public encrypt(plaintext: Uint8Array, key: Uint8Array, additionalAuthenticatedData?: Uint8Array): EncryptedPayload {
    this.assertSupportedKey(key);

    const iv = this.getRandomBytes(AES_GCM_IV_LENGTH);
    const cipher = crypto.createCipheriv(
      EncryptionAlgorithm.AES_256_GCM,
      crypto.createSecretKey(this.toArrayBufferBackedBytes(key)),
      iv
    );

    if (additionalAuthenticatedData) {
      cipher.setAAD(this.toArrayBufferBackedBytes(additionalAuthenticatedData));
    }

    const ciphertext = this.concatBytes([
      this.copyBuffer(cipher.update(this.toArrayBufferBackedBytes(plaintext))),
      this.copyBuffer(cipher.final())
    ]);

    return {
      algorithm: EncryptionAlgorithm.AES_256_GCM,
      iv: this.bytesToHex(iv),
      authTag: this.bytesToHex(this.copyBuffer(cipher.getAuthTag())),
      ciphertext: this.bytesToHex(ciphertext)
    };
  }

  /**
   * Decrypts an AES-256-GCM payload.
   *
   * @param payload Encrypted payload produced by {@link encrypt}.
   * @param key 32-byte encryption key.
   * @param additionalAuthenticatedData Optional authenticated metadata.
   * @returns Decrypted plaintext.
   */
  public decrypt(payload: EncryptedPayload, key: Uint8Array, additionalAuthenticatedData?: Uint8Array): Uint8Array {
    this.assertSupportedPayload(payload);
    this.assertSupportedKey(key);

    const decipher = crypto.createDecipheriv(
      EncryptionAlgorithm.AES_256_GCM,
      crypto.createSecretKey(this.toArrayBufferBackedBytes(key)),
      this.hexToBytes(payload.iv)
    );

    decipher.setAuthTag(this.hexToBytes(payload.authTag));

    if (additionalAuthenticatedData) {
      decipher.setAAD(this.toArrayBufferBackedBytes(additionalAuthenticatedData));
    }

    return this.concatBytes([
      this.copyBuffer(decipher.update(this.hexToBytes(payload.ciphertext))),
      this.copyBuffer(decipher.final())
    ]);
  }

  private assertSupportedPayload(payload: EncryptedPayload): void {
    if (payload.algorithm !== EncryptionAlgorithm.AES_256_GCM) {
      throw new Error("Unsupported encryption algorithm.");
    }
  }

  private assertSupportedKey(key: Uint8Array): void {
    if (key.byteLength !== AES_256_GCM_KEY_LENGTH) {
      throw new Error(`AES-256-GCM key must be ${AES_256_GCM_KEY_LENGTH} bytes long.`);
    }
  }

  private getRandomBytes(length: number) {
    return this.copyBuffer(crypto.randomBytes(length));
  }

  private toArrayBufferBackedBytes(value: Uint8Array) {
    const bytes = new Uint8Array(value.byteLength);
    bytes.set(value);

    return bytes;
  }

  private hexToBytes(hex: string) {
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

  private concatBytes(values: Uint8Array[]): Uint8Array {
    const totalLength = values.reduce((length, value) => length + value.byteLength, 0);
    const bytes = new Uint8Array(totalLength);
    let offset = 0;

    values.forEach((value) => {
      bytes.set(value, offset);
      offset += value.byteLength;
    });

    return bytes;
  }
}
