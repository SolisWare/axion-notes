/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NoteAccessStatus } from "../../../../src/models/NoteAccessStatus";
import { channels } from "../../../../electron/ipc/channels";
import { registerStorageIpc } from "../../../../electron/ipc/storageIpc";
import { LockStateService } from "../../../../electron/security/LockStateService";
import { NoteService } from "../../../../electron/storage/NoteService";

const { handlers, listeners } = vi.hoisted(() => ({
  handlers: new Map<string, (...args: unknown[]) => unknown>(),
  listeners: new Map<string, (...args: unknown[]) => unknown>()
}));

vi.mock("electron", () => ({
  BrowserWindow: {
    getAllWindows: vi.fn(() => [])
  },
  ipcMain: {
    handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => handlers.set(channel, handler)),
    on: vi.fn((channel: string, listener: (...args: unknown[]) => unknown) => listeners.set(channel, listener))
  }
}));

beforeEach(() => {
  handlers.clear();
  listeners.clear();
  vi.restoreAllMocks();
});

describe("storage IPC lock boundary", () => {
  it("does not expose notes, folders, or note mutations while locked", async () => {
    const note = { id: "private-note" };
    const lockStateService = {
      getIsLocked: vi.fn(() => true)
    };
    const noteService = {
      getNotes: vi.fn(async () => [note]),
      setNote: vi.fn(),
      setNoteOrder: vi.fn(),
      deleteNote: vi.fn(),
      deleteAllNotes: vi.fn()
    };
    registerStorageIpc({
      appDataDir: "/private/notes",
      lockStateService: lockStateService as unknown as LockStateService,
      noteService: noteService as unknown as NoteService
    });

    await expect(invoke(channels.storage.getNotes, createEvent())).resolves.toEqual([]);
    await expect(invoke(channels.storage.getNotesWithAccessState, createEvent())).resolves.toEqual({
      status: NoteAccessStatus.LOCKED,
      notes: []
    });
    await expect(invoke(channels.storage.getNotesFolderLocation, createEvent())).resolves.toBe("");

    emit(channels.storage.setNote, createEvent(), note);
    emit(channels.storage.setNoteOrder, createEvent(), [note.id]);
    emit(channels.storage.deleteNote, createEvent(), note.id);
    emit(channels.storage.deleteAllNotes, createEvent());

    expect(noteService.getNotes).not.toHaveBeenCalled();
    expect(noteService.setNote).not.toHaveBeenCalled();
    expect(noteService.setNoteOrder).not.toHaveBeenCalled();
    expect(noteService.deleteNote).not.toHaveBeenCalled();
    expect(noteService.deleteAllNotes).not.toHaveBeenCalled();
  });
});

function createEvent() {
  return {
    sender: {
      send: vi.fn()
    }
  };
}

async function invoke(channel: string, event: ReturnType<typeof createEvent>): Promise<unknown> {
  const handler = handlers.get(channel);

  if (!handler) {
    throw new Error(`No IPC handler registered for ${channel}.`);
  }

  return handler(event);
}

function emit(channel: string, event: ReturnType<typeof createEvent>, ...args: unknown[]): void {
  const listener = listeners.get(channel);

  if (!listener) {
    throw new Error(`No IPC listener registered for ${channel}.`);
  }

  listener(event, ...args);
}
