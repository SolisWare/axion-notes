/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import { EncryptionService } from "../../../../electron/security/EncryptionService";

const propertySeed = 0x5ec0de;

describe("EncryptionService properties", () => {
  it("restores every generated plaintext exactly when its key and authenticated data match", () => {
    const service = new EncryptionService();

    fc.assert(
      fc.property(
        fc.uint8Array({ maxLength: 16_384 }),
        fc.uint8Array({ minLength: 32, maxLength: 32 }),
        fc.option(fc.uint8Array({ maxLength: 256 }), { nil: undefined }),
        (plaintext, key, additionalAuthenticatedData) => {
          const encrypted = service.encrypt(plaintext, key, additionalAuthenticatedData);
          const decrypted = service.decrypt(encrypted, key, additionalAuthenticatedData);

          expect(Array.from(decrypted)).toEqual(Array.from(plaintext));
        }
      ),
      {
        seed: propertySeed,
        numRuns: 100
      }
    );
  });

  it("rejects every generated single-byte ciphertext mutation", () => {
    const service = new EncryptionService();

    fc.assert(
      fc.property(
        fc.uint8Array({ minLength: 1, maxLength: 16_384 }),
        fc.uint8Array({ minLength: 32, maxLength: 32 }),
        fc.option(fc.uint8Array({ maxLength: 256 }), { nil: undefined }),
        (plaintext, key, additionalAuthenticatedData) => {
          const encrypted = service.encrypt(plaintext, key, additionalAuthenticatedData);
          const ciphertext = mutateFirstHexByte(encrypted.ciphertext);

          expect(() => service.decrypt({ ...encrypted, ciphertext }, key, additionalAuthenticatedData)).toThrow();
        }
      ),
      {
        seed: propertySeed + 1,
        numRuns: 100
      }
    );
  });
});

function mutateFirstHexByte(value: string): string {
  return `${value.slice(0, 2).toLowerCase() === "00" ? "01" : "00"}${value.slice(2)}`;
}
