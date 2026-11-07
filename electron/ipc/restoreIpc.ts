/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BrowserWindow, dialog, OpenDialogOptions } from "electron";
import { RestoreService } from "../storage/RestoreService";
import { RestoreStateStorage } from "../storage/RestoreStateStorage";
import { RestoreApplyOptions } from "../../src/types/RestoreApplyOptions";
import { BackupArchiveReadError, BackupArchiveReadFailure, BackupArchiveReader } from "../storage/BackupArchiveReader";
import { NoteService } from "../storage/NoteService";
import { LockStateService } from "../security/LockStateService";
import { RestoreApplyResult, RestoreApplyStatus } from "../../src/types/RestoreApplyResult";
import { RestoreChooseResult, RestoreChooseStatus } from "../../src/types/RestoreChooseResult";
import { RestoreInspectResult, RestoreInspectStatus } from "../../src/types/RestoreInspectResult";
import { RestoreState } from "../../src/types/RestoreState";
import { channels } from "./channels";
import { protectedHandle } from "./protectedIpc";

type RestoreIpcOptions = {
  backupArchiveReader: BackupArchiveReader;
  lockStateService: LockStateService;
  noteService: NoteService;
  restoreStateStorage: RestoreStateStorage;
  restoreService: RestoreService;
};

export function registerRestoreIpc(options: RestoreIpcOptions): void {
  protectedHandle<RestoreState | undefined, []>(channels.restore.getState, { ...options, fallback: undefined }, async () => {
    return options.restoreStateStorage.getState();
  });

  protectedHandle<RestoreChooseResult, []>(channels.restore.chooseArchive, { ...options, fallback: { status: RestoreChooseStatus.FAILED } }, async (event) => {
    const dialogOptions: OpenDialogOptions = {
      filters: [{ extensions: ["zip"], name: "Axion Notes backup" }],
      properties: ["openFile"],
      title: "Restore backup"
    };
    const parentWindow = BrowserWindow.fromWebContents(event.sender);
    const result = parentWindow ? await dialog.showOpenDialog(parentWindow, dialogOptions) : await dialog.showOpenDialog(dialogOptions);

    if (result.canceled || result.filePaths.length === 0) {
      return { status: RestoreChooseStatus.CANCELLED };
    }

    return { filePath: result.filePaths[0], status: RestoreChooseStatus.SELECTED };
  });

  protectedHandle<RestoreApplyResult, [string, RestoreApplyOptions]>(channels.restore.apply, { ...options, fallback: { status: RestoreApplyStatus.FAILED } }, async (_event, archivePath, restoreOptions) => {
    if (!options.noteService.isEncryptionUnlocked() && !restoreOptions.password) {
      return { status: RestoreApplyStatus.PASSWORD_REQUIRED };
    }

    try {
      const archive = await options.backupArchiveReader.readArchive(archivePath);

      if (!options.noteService.isEncryptionUnlocked() && !await options.noteService.verifyEncryptionPassword(restoreOptions.password!)) {
        return { status: RestoreApplyStatus.INVALID_PASSWORD };
      }

      const state = await options.restoreService.applyRestore(archive, restoreOptions);

      return { state, status: RestoreApplyStatus.APPLIED };
    } catch (err) {
      console.warn("Failed to restore backup:", err);
      return { status: getApplyFailureStatus(err) };
    }
  });

  protectedHandle<RestoreInspectResult, [string, string?]>(channels.restore.inspect, { ...options, fallback: { status: RestoreInspectStatus.FAILED } }, async (_event, archivePath, password) => {
    try {
      const archive = await options.backupArchiveReader.readArchive(archivePath);

      if (!options.noteService.isEncryptionUnlocked() && !password) {
        return { status: RestoreInspectStatus.PASSWORD_REQUIRED };
      }

      if (!options.noteService.isEncryptionUnlocked() && !await options.noteService.verifyEncryptionPassword(password!)) {
        return { status: RestoreInspectStatus.INVALID_PASSWORD };
      }

      return { plan: await options.restoreService.inspectRestore(archive, password), status: RestoreInspectStatus.READY };
    } catch (err) {
      console.warn("Failed to inspect backup for restore:", err);
      return { status: getInspectFailureStatus(err) };
    }
  });
}

function getApplyFailureStatus(error: unknown): RestoreApplyStatus {
  return error instanceof BackupArchiveReadError && error.failure === BackupArchiveReadFailure.INVALID_ARCHIVE
    ? RestoreApplyStatus.INVALID_ARCHIVE
    : RestoreApplyStatus.FAILED;
}

function getInspectFailureStatus(error: unknown): RestoreInspectStatus {
  return error instanceof BackupArchiveReadError && error.failure === BackupArchiveReadFailure.INVALID_ARCHIVE
    ? RestoreInspectStatus.INVALID_ARCHIVE
    : RestoreInspectStatus.FAILED;
}
