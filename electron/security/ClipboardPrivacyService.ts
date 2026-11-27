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
  includesHtml: boolean;
  includesRtf: boolean;
};
type ClipboardFormatSelection = Pick<ClipboardSnapshot, "includesHtml" | "includesRtf">;
type TimeoutHandle = ReturnType<typeof setTimeout>;
type ScheduleTimeout = (callback: () => void, delay: number) => TimeoutHandle;
type CancelTimeout = (timeout: TimeoutHandle) => void;
type GetClearDelayMilliseconds = (clearDelay: ClipboardClearDelay) => number;

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
    private readonly cancelTimeout: CancelTimeout = clearTimeout,
    private readonly getClearDelayMilliseconds: GetClearDelayMilliseconds = (clearDelay) => clearDelay * 1_000
  ) {
  }

  public applyClearDelay(clearDelay: ClipboardClearDelay): void {
    this.clearDelay = clearDelay;
    this.cancelPendingClear();
  }

  public trackCurrentNoteCopy(): void {
    this.cancelPendingClear();

    const snapshot = this.createCurrentSnapshot();

    if (!snapshot) {
      return;
    }

    this.pendingSnapshot = snapshot;

    if (this.clearDelay === ClipboardClearDelay.NEVER) {
      return;
    }

    const clearId = ++this.pendingClearId;
    this.pendingTimeout = this.scheduleTimeout(() => this.clearClipboardIfUnchanged(clearId), this.getClearDelayMilliseconds(this.clearDelay));
  }

  /**
   * Clears the pending Axion Notes copy when the application is about to quit.
   * Clipboard content copied elsewhere is deliberately preserved.
   */
  public clearTrackedNoteCopy(): void {
    const snapshot = this.pendingSnapshot;
    this.cancelPendingClear();
    this.clearSnapshotIfUnchanged(snapshot);
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

    this.clearSnapshotIfUnchanged(snapshot);
  }

  private clearSnapshotIfUnchanged(snapshot: ClipboardSnapshot | undefined): void {
    if (!snapshot) {
      return;
    }

    const currentSnapshot = this.createCurrentSnapshot(snapshot);

    if (currentSnapshot?.digest === snapshot.digest) {
      try {
        this.nativeClipboard.clear();
      } catch {
        // Clipboard access can be unavailable. Leaving its content intact is the safe fallback.
      }
    }
  }

  private createCurrentSnapshot(formatSelection?: ClipboardFormatSelection): ClipboardSnapshot | undefined {
    try {
      const formats = formatSelection ? undefined : this.nativeClipboard.availableFormats();
      const includesHtml = formatSelection?.includesHtml ?? formats?.includes("text/html") ?? false;
      const includesRtf = formatSelection?.includesRtf ?? formats?.includes("text/rtf") ?? false;
      const text = this.nativeClipboard.readText();

      if (!text) {
        return undefined;
      }

      const content = {
        html: includesHtml ? this.nativeClipboard.readHTML() : "",
        rtf: includesRtf ? this.nativeClipboard.readRTF() : "",
        text
      };

      return {
        digest: createHash("sha256").update(JSON.stringify(content)).digest("hex"),
        includesHtml,
        includesRtf
      };
    } catch {
      return undefined;
    }
  }
}
