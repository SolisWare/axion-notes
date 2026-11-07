/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
export function chooseBrowserRestoreArchive(): Promise<Uint8Array | undefined> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.accept = ".zip,application/zip";
    input.type = "file";
    input.addEventListener("change", async () => {
      const file = input.files?.[0];

      resolve(file ? new Uint8Array(await file.arrayBuffer()) : undefined);
    }, { once: true });
    input.addEventListener("cancel", () => resolve(undefined), { once: true });
    input.click();
  });
}
