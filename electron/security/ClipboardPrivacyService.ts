/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { clipboard } from "electron";
import { createHash } from "node:crypto";
import { ClipboardClearDelay } from "../../src/settings/ClipboardClearDelay";

type NativeClipboard = Pick<typeof clipboard, "availableFormats" | "clear" | "readHTML" | "readRTF" | "readText">;
type ClipboardSnapshot = {
  digest: string;
};
type TimeoutHandle = ReturnType<typeof setTimeout>;
type ScheduleTimeout = (callback: () => void, delay: number) => TimeoutHandle;
type CancelTimeout = (timeout: TimeoutHandle) => void;

/**
 * Clears a note copy only when the native clipboard still contains that exact copy.
 */
export class ClipboardPrivacyService {

  private clearDelay = ClipboardClearDelay.NEVER;
  private pendingClearId = 0;
  private pendingSnapshot: ClipboardSnapshot | undefined;
  private pendingTimeout: TimeoutHandle | undefined;

  public constructor(
    private readonly nativeClipboard: NativeClipboard = clipboard,
    private readonly scheduleTimeout: ScheduleTimeout = setTimeout,
    private readonly cancelTimeout: CancelTimeout = clearTimeout
  ) {
  }

  public applyClearDelay(clearDelay: ClipboardClearDelay): void {
    this.clearDelay = clearDelay;
    this.cancelPendingClear();
  }

  public trackCurrentNoteCopy(): void {
    this.cancelPendingClear();

    if (this.clearDelay === ClipboardClearDelay.NEVER) {
      return;
    }

    const snapshot = this.createCurrentSnapshot();

    if (!snapshot) {
      return;
    }

    const clearId = ++this.pendingClearId;
    this.pendingSnapshot = snapshot;
    this.pendingTimeout = this.scheduleTimeout(() => this.clearClipboardIfUnchanged(clearId), this.clearDelay * 1_000);
  }

  private cancelPendingClear(): void {
    this.pendingClearId += 1;

    if (this.pendingTimeout) {
      this.cancelTimeout(this.pendingTimeout);
    }

    this.pendingSnapshot = undefined;
    this.pendingTimeout = undefined;
  }

  private clearClipboardIfUnchanged(clearId: number): void {
    if (clearId !== this.pendingClearId) {
      return;
    }

    const snapshot = this.pendingSnapshot;
    this.pendingSnapshot = undefined;
    this.pendingTimeout = undefined;

    if (!snapshot) {
      return;
    }

    const currentSnapshot = this.createCurrentSnapshot();

    if (currentSnapshot?.digest === snapshot.digest) {
      try {
        this.nativeClipboard.clear();
      } catch {
        // Clipboard access can be unavailable. Leaving its content intact is the safe fallback.
      }
    }
  }

  private createCurrentSnapshot(): ClipboardSnapshot | undefined {
    try {
      const formats = [...this.nativeClipboard.availableFormats()].sort();
      const text = this.nativeClipboard.readText();

      if (!text) {
        return undefined;
      }

      const content = {
        formats,
        html: formats.includes("text/html") ? this.nativeClipboard.readHTML() : "",
        rtf: formats.includes("text/rtf") ? this.nativeClipboard.readRTF() : "",
        text
      };

      return {
        digest: createHash("sha256").update(JSON.stringify(content)).digest("hex")
      };
    } catch {
      return undefined;
    }
  }
}
