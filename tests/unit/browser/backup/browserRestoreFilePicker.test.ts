/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { chooseBrowserRestoreArchive } from "../../../../src/browser/backup/browserRestoreFilePicker";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("chooseBrowserRestoreArchive", () => {
  it("opens a ZIP picker and returns the selected archive bytes", async () => {
    const input = mockFileInput();
    const archive = new Uint8Array([1, 2, 3]);
    const file = new File([archive], "axion-notes-backup.zip", { type: "application/zip" });
    Object.defineProperty(input, "files", { configurable: true, value: [file] });

    const selectedArchive = chooseBrowserRestoreArchive();
    input.dispatchEvent(new Event("change"));

    await expect(selectedArchive).resolves.toEqual(archive);
    expect(input.accept).toBe(".zip,application/zip");
    expect(input.type).toBe("file");
    expect(input.click).toHaveBeenCalledOnce();
  });

  it("returns no archive when the picker change event has no file", async () => {
    const input = mockFileInput();
    Object.defineProperty(input, "files", { configurable: true, value: [] });

    const selectedArchive = chooseBrowserRestoreArchive();
    input.dispatchEvent(new Event("change"));

    await expect(selectedArchive).resolves.toBeUndefined();
  });

  it("returns no archive when the browser picker is cancelled", async () => {
    const input = mockFileInput();

    const selectedArchive = chooseBrowserRestoreArchive();
    input.dispatchEvent(new Event("cancel"));

    await expect(selectedArchive).resolves.toBeUndefined();
  });
});

function mockFileInput(): HTMLInputElement & { click: ReturnType<typeof vi.fn> } {
  const createElement = document.createElement.bind(document);
  const input = createElement("input") as HTMLInputElement & { click: ReturnType<typeof vi.fn> };
  input.click = vi.fn();
  vi.spyOn(document, "createElement").mockImplementation(((tagName: string) => tagName === "input"
    ? input
    : createElement(tagName)) as typeof document.createElement);

  return input;
}
