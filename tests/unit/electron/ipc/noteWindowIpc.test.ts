/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { channels } from "../../../../electron/ipc/channels";
import { registerNoteWindowIpc } from "../../../../electron/ipc/noteWindowIpc";

const { createNoteWindow, fromWebContents, handlers } = vi.hoisted(() => ({
  createNoteWindow: vi.fn(),
  fromWebContents: vi.fn(),
  handlers: new Map<string, (...args: unknown[]) => unknown>()
}));

vi.mock("electron", () => ({
  BrowserWindow: { fromWebContents },
  ipcMain: { on: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => handlers.set(channel, handler)) }
}));

vi.mock("../../../../electron/windows/createNoteWindow", () => ({ createNoteWindow }));

describe("note window IPC", () => {
  beforeEach(() => {
    createNoteWindow.mockReset();
    fromWebContents.mockReset();
    handlers.clear();
  });

  it("opens and registers a content-protected note window with an optional opener offset", () => {
    const openerWindow = { id: 1 };
    const noteWindow = { id: 2 };
    const lockStateService = {
      getIsLocked: vi.fn(() => false),
      registerContentProtectedWindow: vi.fn()
    };
    fromWebContents.mockReturnValue(openerWindow);
    createNoteWindow.mockReturnValue(noteWindow);
    registerNoteWindowIpc({ lockStateService } as never);

    emit({ sender: {} }, "note-1", { offsetFromCurrentWindow: true });

    expect(createNoteWindow).toHaveBeenCalledWith({ noteId: "note-1", openerWindow });
    expect(lockStateService.registerContentProtectedWindow).toHaveBeenCalledWith(noteWindow);
  });

  it("opens without an opener when an offset is not requested or unavailable", () => {
    const lockStateService = {
      getIsLocked: vi.fn(() => false),
      registerContentProtectedWindow: vi.fn()
    };
    createNoteWindow.mockReturnValue({ id: 2 });
    registerNoteWindowIpc({ lockStateService } as never);

    emit({ sender: {} }, "note-1");

    expect(fromWebContents).not.toHaveBeenCalled();
    expect(createNoteWindow).toHaveBeenCalledWith({ noteId: "note-1", openerWindow: undefined });
  });

  it("does not open a note window while locked", () => {
    registerNoteWindowIpc({
      lockStateService: { getIsLocked: vi.fn(() => true), registerContentProtectedWindow: vi.fn() }
    } as never);

    emit({ sender: {} }, "note-1", { offsetFromCurrentWindow: true });

    expect(createNoteWindow).not.toHaveBeenCalled();
  });
});

function emit(event: { sender: unknown }, noteId: string, options?: { offsetFromCurrentWindow: boolean }): void {
  const handler = handlers.get(channels.noteWindow.open);

  if (!handler) {
    throw new Error("No note window IPC listener registered.");
  }

  handler(event, noteId, options);
}
