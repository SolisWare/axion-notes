/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import { EncryptedPayload, EncryptionService } from "../../../../electron/security/EncryptionService";

describe("EncryptionService fuzzing", () => {
  it("round-trips randomized payloads with randomized authenticated metadata", () => {
    const service = new EncryptionService();

    fc.assert(
      fc.property(
        fc.uint8Array({ maxLength: 65_536 }),
        fc.uint8Array({ minLength: 32, maxLength: 32 }),
        fc.option(fc.uint8Array({ maxLength: 1_024 }), { nil: undefined }),
        (plaintext, key, additionalAuthenticatedData) => {
          const encrypted = service.encrypt(plaintext, key, additionalAuthenticatedData);

          expect(Array.from(service.decrypt(encrypted, key, additionalAuthenticatedData))).toEqual(Array.from(plaintext));
        }
      ),
      getFuzzParameters("AXION_NOTES_FUZZ_RUNS", 2_500)
    );
  });

  it("rejects randomized malformed encrypted payloads", () => {
    const service = new EncryptionService();
    const key = new Uint8Array(32).fill(42);

    fc.assert(
      fc.property(fc.jsonValue({ maxDepth: 4 }), (value) => {
        expect(() => service.decrypt(value as EncryptedPayload, key)).toThrow();
      }),
      getFuzzParameters("AXION_NOTES_FUZZ_RUNS", 2_500, 1)
    );
  });
});

function getFuzzParameters(environmentVariable: string, defaultRuns: number, seedOffset = 0): { numRuns: number; seed?: number } {
  const configuredRuns = Number.parseInt(process.env[environmentVariable] ?? "", 10);
  const configuredSeed = Number.parseInt(process.env.AXION_NOTES_FUZZ_SEED ?? "", 10);

  return {
    numRuns: Number.isSafeInteger(configuredRuns) && configuredRuns > 0 ? configuredRuns : defaultRuns,
    ...(Number.isSafeInteger(configuredSeed) ? { seed: configuredSeed + seedOffset } : {})
  };
}
