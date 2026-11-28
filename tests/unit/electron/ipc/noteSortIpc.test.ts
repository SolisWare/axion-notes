/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { channels } from "../../../../electron/ipc/channels";
import { registerNoteSortIpc } from "../../../../electron/ipc/noteSortIpc";

const { getAllWindows, handlers } = vi.hoisted(() => ({
  getAllWindows: vi.fn(),
  handlers: new Map<string, (...args: unknown[]) => unknown>()
}));

vi.mock("electron", () => ({
  BrowserWindow: { getAllWindows },
  ipcMain: { on: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => handlers.set(channel, handler)) }
}));

describe("note sort IPC", () => {
  beforeEach(() => {
    getAllWindows.mockReset();
    handlers.clear();
  });

  it("broadcasts a sort request and confirms it to the requesting renderer", () => {
    const firstWindow = { webContents: { send: vi.fn() } };
    const secondWindow = { webContents: { send: vi.fn() } };
    const sender = { send: vi.fn() };
    getAllWindows.mockReturnValue([firstWindow, secondWindow]);
    registerNoteSortIpc({ lockStateService: { getIsLocked: vi.fn(() => false) } } as never);

    emit({ sender });

    expect(firstWindow.webContents.send).toHaveBeenCalledWith(channels.noteSort.onSortRequest);
    expect(secondWindow.webContents.send).toHaveBeenCalledWith(channels.noteSort.onSortRequest);
    expect(sender.send).toHaveBeenCalledWith(channels.noteSort.onSortApplied);
  });

  it("does not expose sorting while locked", () => {
    const sender = { send: vi.fn() };
    registerNoteSortIpc({ lockStateService: { getIsLocked: vi.fn(() => true) } } as never);

    emit({ sender });

    expect(getAllWindows).not.toHaveBeenCalled();
    expect(sender.send).not.toHaveBeenCalled();
  });
});

function emit(event: { sender: { send: ReturnType<typeof vi.fn> } }): void {
  const handler = handlers.get(channels.noteSort.requestSort);

  if (!handler) {
    throw new Error("No note sort IPC listener registered.");
  }

  handler(event);
}
