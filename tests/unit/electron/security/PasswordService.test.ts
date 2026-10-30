/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { PasswordService } from "../../../../electron/security/PasswordService";
import { MIN_LOCK_PASSWORD_LENGTH } from "../../../../src/settings/PasswordPolicy";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => fs.promises.rm(directory, { force: true, recursive: true })));
});

describe("PasswordService", () => {
  it("stores a salted password hash and verifies only the configured password", async () => {
    const { passwordPath, service } = await createService();
    const password = "correct horse battery staple";

    await service.setPassword(password);

    const record = await fs.promises.readFile(passwordPath, "utf-8");
    expect(record).not.toContain(password);
    expect(JSON.parse(record)).toMatchObject({
      version: 1,
      algorithm: "scrypt",
      keyLength: 64
    });
    expect(await service.hasPassword()).toBe(true);
    expect(await service.hasUsablePasswordRecord()).toBe(true);
    expect(await service.verifyPassword(password)).toBe(true);
    expect(await service.verifyPassword("incorrect password")).toBe(false);
  });

  it("uses a new salt and hash when replacing the same password", async () => {
    const { passwordPath, service } = await createService();

    await service.setPassword("correct password");
    const firstRecord = JSON.parse(await fs.promises.readFile(passwordPath, "utf-8"));
    await service.setPassword("correct password");
    const secondRecord = JSON.parse(await fs.promises.readFile(passwordPath, "utf-8"));

    expect(secondRecord.salt).not.toBe(firstRecord.salt);
    expect(secondRecord.hash).not.toBe(firstRecord.hash);
    expect(await service.verifyPassword("correct password")).toBe(true);
  });

  it("rejects a password shorter than the configured policy", async () => {
    const { service } = await createService();

    await expect(service.setPassword("x".repeat(MIN_LOCK_PASSWORD_LENGTH - 1))).rejects.toThrow("Password must be at least");
    await expect(service.hasPassword()).resolves.toBe(false);
  });

  it("clears a password record and makes repeat clearing safe", async () => {
    const { service } = await createService();

    await service.setPassword("correct password");
    await service.clearPassword();
    await service.clearPassword();

    expect(await service.hasPassword()).toBe(false);
    await expect(service.verifyPassword("correct password")).rejects.toMatchObject({ code: "ENOENT" });
  });

  it.each([
    ["malformed JSON", "{"],
    ["an unsupported version", JSON.stringify({ version: 2, algorithm: "scrypt", keyLength: 64, salt: "00".repeat(16), hash: "00".repeat(64) })],
    ["a malformed salt", JSON.stringify({ version: 1, algorithm: "scrypt", keyLength: 64, salt: "not-hex", hash: "00".repeat(64) })],
    ["a truncated hash", JSON.stringify({ version: 1, algorithm: "scrypt", keyLength: 64, salt: "00".repeat(16), hash: "00" })]
  ])("treats %s as an unusable password record", async (_name, content) => {
    const { passwordPath, service } = await createService();
    await fs.promises.mkdir(path.dirname(passwordPath), { recursive: true });
    await fs.promises.writeFile(passwordPath, content, "utf-8");

    expect(await service.hasPassword()).toBe(true);
    expect(await service.hasUsablePasswordRecord()).toBe(false);
    await expect(service.verifyPassword("correct password")).rejects.toThrow();
  });
});

async function createService(): Promise<{ passwordPath: string; service: PasswordService }> {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), "axion-notes-password-service-"));
  temporaryDirectories.push(directory);
  const passwordPath = path.join(directory, "security", "password.json");

  return {
    passwordPath,
    service: new PasswordService(passwordPath)
  };
}
