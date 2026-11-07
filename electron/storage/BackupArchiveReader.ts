/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import * as fs from "node:fs";
import yauzl, { Entry, ZipFile } from "yauzl";
import { BackupArchiveFile, parseBackupArchive, ValidatedBackupArchive } from "../../src/backup/restoreArchive";

export const MAX_BACKUP_ARCHIVE_COMPRESSED_BYTES = 50 * 1024 * 1024;
export const MAX_BACKUP_ARCHIVE_ENTRIES = 5;
export const MAX_BACKUP_ARCHIVE_UNCOMPRESSED_BYTES = 50 * 1024 * 1024;
export const MAX_BACKUP_ARCHIVE_ENTRY_BYTES = 20 * 1024 * 1024;

/**
 * Reads and validates a user-selected backup ZIP archive in the Electron main process.
 */
export class BackupArchiveReader {

  /**
   * Opens the archive at the supplied path and returns its validated restore payload.
   */
  public async readArchive(archivePath: string): Promise<ValidatedBackupArchive> {
    const files = await this.readFiles(archivePath);
    return parseBackupArchive(files);
  }

  private async readFiles(archivePath: string): Promise<BackupArchiveFile[]> {
    const fileStats = await fs.promises.stat(archivePath);

    if (!fileStats.isFile() || fileStats.size > MAX_BACKUP_ARCHIVE_COMPRESSED_BYTES) {
      throw new Error("Backup archive exceeds the supported size.");
    }

    const zipFile = await this.openZipFile(archivePath);

    if (zipFile.entryCount > MAX_BACKUP_ARCHIVE_ENTRIES) {
      zipFile.close();
      throw new Error("Backup archive contains too many files.");
    }

    return this.readZipEntries(zipFile);
  }

  private async openZipFile(archivePath: string): Promise<ZipFile> {
    return new Promise<ZipFile>((resolve, reject) => {
      yauzl.open(archivePath, {
        autoClose: true,
        lazyEntries: true,
        strictFileNames: true,
        validateEntrySizes: true
      }, (err, zipFile) => {
        if (err) {
          reject(new Error("Backup archive could not be opened."));
          return;
        }

        resolve(zipFile);
      });
    });
  }

  private async readZipEntries(zipFile: ZipFile): Promise<BackupArchiveFile[]> {
    return new Promise<BackupArchiveFile[]>((resolve, reject) => {
      const files: BackupArchiveFile[] = [];
      let totalUncompressedBytes = 0;
      let didSettle = false;

      const fail = (err: Error): void => {
        if (didSettle) {
          return;
        }

        didSettle = true;
        zipFile.close();
        reject(err);
      };

      zipFile.on("error", () => fail(new Error("Backup archive could not be read.")));
      zipFile.on("entry", (entry: Entry) => {
        void this.readZipEntry(zipFile, entry, totalUncompressedBytes)
          .then((file) => {
            totalUncompressedBytes += Buffer.byteLength(file.content, "utf-8");
            files.push(file);
            zipFile.readEntry();
          })
          .catch(fail);
      });
      zipFile.on("end", () => {
        if (!didSettle) {
          didSettle = true;
          resolve(files);
        }
      });

      zipFile.readEntry();
    });
  }

  private async readZipEntry(zipFile: ZipFile, entry: Entry, totalUncompressedBytes: number): Promise<BackupArchiveFile> {
    if (entry.fileName.endsWith("/")
      || entry.uncompressedSize > MAX_BACKUP_ARCHIVE_ENTRY_BYTES
      || totalUncompressedBytes + entry.uncompressedSize > MAX_BACKUP_ARCHIVE_UNCOMPRESSED_BYTES) {
      throw new Error("Backup archive exceeds the supported size.");
    }

    const bytes = await new Promise<Buffer>((resolve, reject) => {
      zipFile.openReadStream(entry, (err, stream) => {
        if (err) {
          reject(new Error(`Backup archive file could not be read: ${entry.fileName}`));
          return;
        }

        const chunks: Buffer[] = [];
        let byteLength = 0;

        stream.on("data", (chunk: Buffer) => {
          byteLength += chunk.length;

          if (byteLength > MAX_BACKUP_ARCHIVE_ENTRY_BYTES) {
            stream.destroy(new Error("Backup archive exceeds the supported size."));
            return;
          }

          chunks.push(chunk);
        });
        stream.once("end", () => resolve(Buffer.concat(chunks)));
        stream.once("error", (streamError: Error) => reject(streamError));
      });
    });

    try {
      return {
        content: new TextDecoder("utf-8", { fatal: true }).decode(bytes),
        fileName: entry.fileName
      };
    } catch {
      throw new Error(`Backup archive file is not UTF-8 text: ${entry.fileName}`);
    }
  }

}
