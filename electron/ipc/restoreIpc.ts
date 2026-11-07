/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { dialog } from "electron";
import { RestoreApplyOptions, RestoreService } from "../storage/RestoreService";
import { BackupArchiveReader } from "../storage/BackupArchiveReader";
import { NoteService } from "../storage/NoteService";
import { LockStateService } from "../security/LockStateService";
import { RestoreApplyResult, RestoreApplyStatus } from "../../src/types/RestoreApplyResult";
import { RestoreChooseResult, RestoreChooseStatus } from "../../src/types/RestoreChooseResult";
import { channels } from "./channels";
import { protectedHandle } from "./protectedIpc";

type RestoreIpcOptions = {
  backupArchiveReader: BackupArchiveReader;
  lockStateService: LockStateService;
  noteService: NoteService;
  restoreService: RestoreService;
};

export function registerRestoreIpc(options: RestoreIpcOptions): void {
  protectedHandle<RestoreChooseResult, []>(channels.restore.chooseArchive, { ...options, fallback: { status: RestoreChooseStatus.FAILED } }, async (event) => {
    const result = await dialog.showOpenDialog({
      defaultPath: undefined,
      filters: [{ extensions: ["zip"], name: "Axion Notes backup" }],
      properties: ["openFile"],
      title: "Restore backup"
    });

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
      const state = await options.restoreService.applyRestore(archive, restoreOptions);

      return { state, status: RestoreApplyStatus.APPLIED };
    } catch (err) {
      console.warn("Failed to restore backup:", err);
      return { status: RestoreApplyStatus.FAILED };
    }
  });
}
