/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { downloadBrowserBackupArchive } from "../../../../src/browser/backup/browserBackupDownload";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("downloadBrowserBackupArchive", () => {
  it("downloads a ZIP archive through a temporary hidden link and cleans up its object URL", async () => {
    const archive = new Uint8Array([1, 2, 3]);
    const createObjectURL = vi.fn(() => "blob:axion-notes-backup");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    vi.useFakeTimers();
    const appendChild = vi.spyOn(document.body, "appendChild");
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);

    downloadBrowserBackupArchive(archive, "axion-notes-backup.zip");

    const link = appendChild.mock.calls[0][0] as HTMLAnchorElement;
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe("application/zip");
    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(archive);
    expect(link).toMatchObject({ download: "axion-notes-backup.zip", href: "blob:axion-notes-backup" });
    expect(link.style.display).toBe("none");
    expect(click).toHaveBeenCalledOnce();
    expect(document.body.contains(link)).toBe(false);

    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:axion-notes-backup");
  });
});
