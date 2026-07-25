/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

const PASSWORD_RECORD_VERSION = 1;
const PASSWORD_ALGORITHM = "scrypt";
const PASSWORD_KEY_LENGTH = 64; // 64 bytes = 512 bits.
const PASSWORD_SALT_LENGTH = 16; // 16 bytes = 128 bits.

type PasswordRecord = {
  version: typeof PASSWORD_RECORD_VERSION;
  algorithm: typeof PASSWORD_ALGORITHM;
  salt: string;
  hash: string;
  keyLength: typeof PASSWORD_KEY_LENGTH;
};

/**
 * Handles local password hashing and verification for security features.
 *
 * This service is intended for Electron main process use only. Renderer code
 * should never receive the stored password record or perform raw password
 * verification directly.
 */
export class PasswordService {
  public constructor(private readonly passwordRecordPath: string) {
  }

  /**
   * Checks whether a password record exists on disk.
   *
   * @returns true when a password has been configured; otherwise false.
   */
  public async hasPassword(): Promise<boolean> {
    try {
      await fs.promises.access(this.passwordRecordPath, fs.constants.F_OK);
      return true;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return false;
      }

      throw err;
    }
  }

  /**
   * Checks whether the stored password record exists and uses a supported
   * format.
   *
   * @returns true when the record can be used for verification; otherwise false.
   */
  public async hasUsablePasswordRecord(): Promise<boolean> {
    try {
      await this.readPasswordRecord();
      return true;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return false;
      }

      console.warn("Password record is not usable:", err);
      return false;
    }
  }

  /**
   * Hashes and stores a new password record.
   *
   * The raw password is never written to disk. Existing password records are
   * replaced.
   *
   * @param password The raw password entered by the user.
   */
  public async setPassword(password: string): Promise<void> {
    const record = await this.createPasswordRecord(password);

    await fs.promises.mkdir(path.dirname(this.passwordRecordPath), { recursive: true });
    await fs.promises.writeFile(this.passwordRecordPath, JSON.stringify(record, null, 2), "utf-8");
  }

  /**
   * Verifies a raw password against the stored password record.
   *
   * @param password The raw password entered by the user.
   * @returns true when the password matches; otherwise false.
   */
  public async verifyPassword(password: string): Promise<boolean> {
    const record = await this.readPasswordRecord();
    const testHash = await this.hashPassword(password, new Uint8Array(Buffer.from(record.salt, "hex")), record.keyLength);
    const storedHash = new Uint8Array(Buffer.from(record.hash, "hex"));

    if (storedHash.length !== testHash.length) {
      return false;
    }

    return crypto.timingSafeEqual(storedHash, new Uint8Array(testHash));
  }

  /**
   * Removes the stored password record if one exists.
   */
  public async clearPassword(): Promise<void> {
    try {
      await fs.promises.unlink(this.passwordRecordPath);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return;
      }

      throw err;
    }
  }

  private async createPasswordRecord(password: string): Promise<PasswordRecord> {
    const salt = new Uint8Array(crypto.randomBytes(PASSWORD_SALT_LENGTH));
    const hash = await this.hashPassword(password, salt, PASSWORD_KEY_LENGTH);

    return {
      version: PASSWORD_RECORD_VERSION,
      algorithm: PASSWORD_ALGORITHM,
      salt: Buffer.from(salt).toString("hex"),
      hash: hash.toString("hex"),
      keyLength: PASSWORD_KEY_LENGTH
    };
  }

  private async readPasswordRecord(): Promise<PasswordRecord> {
    const content = await fs.promises.readFile(this.passwordRecordPath, "utf-8");
    const record = JSON.parse(content) as PasswordRecord;

    if (
      record.version !== PASSWORD_RECORD_VERSION
      || record.algorithm !== PASSWORD_ALGORITHM
      || record.keyLength !== PASSWORD_KEY_LENGTH
    ) {
      throw new Error("Unsupported password record.");
    }

    return record;
  }

  private hashPassword(password: string, salt: Uint8Array, keyLength: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      crypto.scrypt(password, salt, keyLength, (err, derivedKey) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(derivedKey);
      });
    });
  }
}
