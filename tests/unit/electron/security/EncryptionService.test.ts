/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { describe, expect, it } from "vitest";
import { EncryptionService, EncryptedPayload } from "../../../../electron/security/EncryptionService";
import { EncryptionAlgorithm } from "../../../../src/security/EncryptionAlgorithm";

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const key = new Uint8Array(32).fill(17);
const additionalAuthenticatedData = encoder.encode("note:92e8c2d0");

describe("EncryptionService", () => {
  it.each([
    "",
    "A short note",
    "Line one\nLine two\n\nLine four",
    "Zażółć gęślą jaźń — 🔐 你好 العربية",
    "<p>Rich <strong>note</strong> with a checklist</p>"
  ])("round-trips plaintext without changing it: %j", (plaintext) => {
    const service = new EncryptionService();

    const payload = service.encrypt(encoder.encode(plaintext), key, additionalAuthenticatedData);
    const result = service.decrypt(payload, key, additionalAuthenticatedData);

    expect(decoder.decode(result)).toBe(plaintext);
    expect(payload.algorithm).toBe(EncryptionAlgorithm.AES_256_GCM);
    expect(payload.iv).toHaveLength(24);
    expect(payload.authTag).toHaveLength(32);
  });

  it("uses a fresh IV and ciphertext for each encryption of the same plaintext", () => {
    const service = new EncryptionService();
    const plaintext = encoder.encode("The same note content");

    const first = service.encrypt(plaintext, key, additionalAuthenticatedData);
    const second = service.encrypt(plaintext, key, additionalAuthenticatedData);

    expect(first.iv).not.toBe(second.iv);
    expect(first.ciphertext).not.toBe(second.ciphertext);
    expect(decoder.decode(service.decrypt(first, key, additionalAuthenticatedData))).toBe("The same note content");
    expect(decoder.decode(service.decrypt(second, key, additionalAuthenticatedData))).toBe("The same note content");
  });

  it.each([new Uint8Array(31), new Uint8Array(33)])("rejects unsupported key lengths", (invalidKey) => {
    const service = new EncryptionService();
    const payload = service.encrypt(encoder.encode("note"), key);

    expect(() => service.encrypt(encoder.encode("note"), invalidKey)).toThrow("AES-256-GCM key must be 32 bytes long");
    expect(() => service.decrypt(payload, invalidKey)).toThrow("AES-256-GCM key must be 32 bytes long");
  });

  it("rejects decryption with another valid-length key", () => {
    const service = new EncryptionService();
    const payload = service.encrypt(encoder.encode("private note"), key, additionalAuthenticatedData);

    expect(() => service.decrypt(payload, new Uint8Array(32).fill(18), additionalAuthenticatedData)).toThrow();
  });

  it.each([
    ["ciphertext", (payload: EncryptedPayload) => ({ ...payload, ciphertext: replaceHexByte(payload.ciphertext) })],
    ["IV", (payload: EncryptedPayload) => ({ ...payload, iv: replaceHexByte(payload.iv) })],
    ["authentication tag", (payload: EncryptedPayload) => ({ ...payload, authTag: replaceHexByte(payload.authTag) })]
  ])("rejects a tampered %s", (_name, tamper) => {
    const service = new EncryptionService();
    const payload = service.encrypt(encoder.encode("private note"), key, additionalAuthenticatedData);

    expect(() => service.decrypt(tamper(payload), key, additionalAuthenticatedData)).toThrow();
  });

  it("rejects altered additional authenticated data without returning plaintext", () => {
    const service = new EncryptionService();
    const payload = service.encrypt(encoder.encode("private note"), key, additionalAuthenticatedData);

    expect(() => service.decrypt(payload, key, encoder.encode("note:another-id"))).toThrow();
  });

  it("rejects unsupported and malformed payloads before attempting decryption", () => {
    const service = new EncryptionService();
    const payload = service.encrypt(encoder.encode("private note"), key);

    expect(() => service.decrypt({ ...payload, algorithm: "aes-128-gcm" as EncryptionAlgorithm }, key)).toThrow("Unsupported encryption algorithm");
    expect(() => service.decrypt({ ...payload, iv: "not-hex" }, key)).toThrow("IV must be a valid hexadecimal value");
    expect(() => service.decrypt({ ...payload, authTag: "00" }, key)).toThrow("Authentication tag must be 16 bytes long");
    expect(() => service.decrypt({ ...payload, ciphertext: "0" }, key)).toThrow("Ciphertext must be a valid hexadecimal value");
  });
});

function replaceHexByte(value: string): string {
  const replacement = value.slice(0, 2).toLowerCase() === "00" ? "01" : "00";

  return `${replacement}${value.slice(2)}`;
}
