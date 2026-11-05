/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BrowserWindow, dialog } from "electron";
import { BackupState } from "../../src/types/BackupState";
import { BackupContentSelection } from "../../src/types/BackupContentSelection";
import { BackupCreateResult, BackupCreateStatus } from "../../src/types/BackupCreateResult";
import { BackupSaveResult, BackupSaveStatus } from "../../src/types/BackupSaveResult";
import { BackupArchiveService, BACKUP_ARCHIVE_FILE_NAME } from "../storage/BackupArchiveService";
import { BackupService } from "../storage/BackupService";
import { LockStateService } from "../security/LockStateService";
import { channels } from "./channels";
import { protectedHandle } from "./protectedIpc";

type BackupIpcOptions = {
  backupArchiveService: BackupArchiveService;
  backupService: BackupService;
  lockStateService: LockStateService;
};

export function registerBackupIpc(options: BackupIpcOptions): void {
  protectedHandle<BackupCreateResult, [string?]>(channels.backup.createArchive, { ...options, fallback: { status: BackupCreateStatus.FAILED } }, async (_event, password) => {
    return options.backupArchiveService.createArchive(password);
  });

  protectedHandle<BackupSaveResult, []>(channels.backup.saveCopy, { ...options, fallback: { status: BackupSaveStatus.FAILED } }, async (event) => {
    const saveDialogOptions = {
      defaultPath: BACKUP_ARCHIVE_FILE_NAME,
      filters: [{ extensions: ["zip"], name: "ZIP archive" }]
    };
    const parentWindow = BrowserWindow.fromWebContents(event.sender);
    const result = parentWindow
      ? await dialog.showSaveDialog(parentWindow, saveDialogOptions)
      : await dialog.showSaveDialog(saveDialogOptions);

    if (result.canceled || !result.filePath) {
      return { status: BackupSaveStatus.CANCELLED };
    }

    return options.backupArchiveService.saveCopy(result.filePath);
  });

  protectedHandle<BackupState | undefined, []>(channels.backup.getState, { ...options, fallback: undefined }, async () => {
    return options.backupService.getState();
  });

  protectedHandle<BackupState | undefined, []>(channels.backup.initialize, { ...options, fallback: undefined }, async () => {
    try {
      return await options.backupService.initialize();
    } catch (err) {
      console.warn("Failed to initialize backups:", err);
      return undefined;
    }
  });

  protectedHandle<BackupState | undefined, [BackupContentSelection]>(channels.backup.updateContentSelection, { ...options, fallback: undefined }, async (_event, contentSelection) => {
    try {
      return await options.backupService.updateContentSelection(contentSelection);
    } catch (err) {
      console.warn("Failed to update backup content selection:", err);
      return undefined;
    }
  });
}
