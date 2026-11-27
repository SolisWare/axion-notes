/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { channels } from "../../../../electron/ipc/channels";
import { registerClipboardIpc } from "../../../../electron/ipc/clipboardIpc";

const { handlers } = vi.hoisted(() => ({
  handlers: new Map<string, (...args: unknown[]) => unknown>()
}));

vi.mock("electron", () => ({
  ipcMain: { on: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => handlers.set(channel, handler)) }
}));

describe("clipboard IPC", () => {
  beforeEach(() => {
    handlers.clear();
  });

  it("tracks a note copy only while the app is unlocked", () => {
    const clipboardPrivacyService = { trackCurrentNoteCopy: vi.fn() };
    const lockStateService = { getIsLocked: vi.fn(() => false) };
    registerClipboardIpc({ clipboardPrivacyService, lockStateService } as never);

    emit(channels.clipboard.trackNoteCopy);

    expect(clipboardPrivacyService.trackCurrentNoteCopy).toHaveBeenCalledOnce();
  });

  it("does not inspect the clipboard while the app is locked", () => {
    const clipboardPrivacyService = { trackCurrentNoteCopy: vi.fn() };
    const lockStateService = { getIsLocked: vi.fn(() => true) };
    registerClipboardIpc({ clipboardPrivacyService, lockStateService } as never);

    emit(channels.clipboard.trackNoteCopy);

    expect(clipboardPrivacyService.trackCurrentNoteCopy).not.toHaveBeenCalled();
  });
});

function emit(channel: string): void {
  const handler = handlers.get(channel);

  if (!handler) {
    throw new Error(`No IPC listener registered for ${channel}.`);
  }

  handler({});
}
