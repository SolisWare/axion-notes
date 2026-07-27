/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { IpcMainEvent, IpcMainInvokeEvent, ipcMain } from "electron";
import { LockStateService } from "../security/LockStateService";

type ProtectedIpcOptions<TFallback> = {
  fallback?: TFallback;
  lockStateService: LockStateService;
};

export function protectedOn<TArgs extends unknown[]>(
  channel: string,
  options: ProtectedIpcOptions<void>,
  listener: (event: IpcMainEvent, ...args: TArgs) => void
): void {
  ipcMain.on(channel, (event, ...args: TArgs) => {
    if (options.lockStateService.getIsLocked()) {
      return;
    }

    listener(event, ...args);
  });
}

export function protectedHandle<TResult, TArgs extends unknown[]>(
  channel: string,
  options: ProtectedIpcOptions<TResult>,
  listener: (event: IpcMainInvokeEvent, ...args: TArgs) => TResult | Promise<TResult>
): void {
  ipcMain.handle(channel, (event, ...args: TArgs) => {
    if (options.lockStateService.getIsLocked()) {
      return options.fallback as TResult;
    }

    return listener(event, ...args);
  });
}
