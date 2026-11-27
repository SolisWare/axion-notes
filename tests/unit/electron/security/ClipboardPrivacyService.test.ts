/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { ClipboardPrivacyService } from "../../../../electron/security/ClipboardPrivacyService";
import { ClipboardClearDelay } from "../../../../src/settings/ClipboardClearDelay";

describe("ClipboardPrivacyService", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not schedule timed clipboard clearing when the preference is Never", () => {
    const clipboard = createClipboard();
    const scheduleTimeout = vi.fn();
    const service = new ClipboardPrivacyService(clipboard, scheduleTimeout as never, vi.fn());

    service.applyClearDelay(ClipboardClearDelay.NEVER);
    service.trackCurrentNoteCopy();

    expect(clipboard.readText).toHaveBeenCalledOnce();
    expect(scheduleTimeout).not.toHaveBeenCalled();
  });

  it("clears an unchanged copied note after the configured delay", () => {
    const clipboard = createClipboard({ text: "Sensitive note text" });
    const scheduledCallbacks: Array<() => void> = [];
    const scheduleTimeout = vi.fn((callback: () => void) => {
      scheduledCallbacks.push(callback);
      return {} as NodeJS.Timeout;
    });
    const service = new ClipboardPrivacyService(clipboard, scheduleTimeout, vi.fn());

    service.applyClearDelay(ClipboardClearDelay.TWO_MINUTES);
    service.trackCurrentNoteCopy();
    scheduledCallbacks[0]();

    expect(scheduleTimeout).toHaveBeenCalledWith(expect.any(Function), 120_000);
    expect(clipboard.clear).toHaveBeenCalledOnce();
  });

  it("does not clear a copied note before its configured delay expires", () => {
    vi.useFakeTimers();
    const clipboard = createClipboard({ text: "Sensitive note text" });
    const service = new ClipboardPrivacyService(clipboard);

    service.applyClearDelay(ClipboardClearDelay.THIRTY_SECONDS);
    service.trackCurrentNoteCopy();
    vi.advanceTimersByTime(29_999);

    expect(clipboard.clear).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);

    expect(clipboard.clear).toHaveBeenCalledOnce();
  });

  it("does not clear the clipboard after another application has changed its text", () => {
    const clipboard = createClipboard({ text: "Copied from Axion Notes" });
    const scheduledCallbacks: Array<() => void> = [];
    const service = new ClipboardPrivacyService(
      clipboard,
      (callback) => {
        scheduledCallbacks.push(callback);
        return {} as NodeJS.Timeout;
      },
      vi.fn()
    );

    service.applyClearDelay(ClipboardClearDelay.THIRTY_SECONDS);
    service.trackCurrentNoteCopy();
    clipboard.readText.mockReturnValue("Copied from another application");
    scheduledCallbacks[0]();

    expect(clipboard.clear).not.toHaveBeenCalled();
  });

  it("does not clear the clipboard when a rich-text representation changes", () => {
    const clipboard = createClipboard({
      formats: ["text/plain", "text/html"],
      html: "<b>Copied note</b>",
      text: "Copied note"
    });
    const scheduledCallbacks: Array<() => void> = [];
    const service = new ClipboardPrivacyService(
      clipboard,
      (callback) => {
        scheduledCallbacks.push(callback);
        return {} as NodeJS.Timeout;
      },
      vi.fn()
    );

    service.applyClearDelay(ClipboardClearDelay.THIRTY_SECONDS);
    service.trackCurrentNoteCopy();
    clipboard.readHTML.mockReturnValue("<i>Copied note</i>");
    scheduledCallbacks[0]();

    expect(clipboard.clear).not.toHaveBeenCalled();
  });

  it("replaces an earlier pending clear when Axion Notes copies again", () => {
    const clipboard = createClipboard({ text: "First copy" });
    const scheduledCallbacks: Array<() => void> = [];
    const cancelTimeout = vi.fn();
    const service = new ClipboardPrivacyService(
      clipboard,
      (callback) => {
        scheduledCallbacks.push(callback);
        return {} as NodeJS.Timeout;
      },
      cancelTimeout
    );

    service.applyClearDelay(ClipboardClearDelay.FIVE_MINUTES);
    service.trackCurrentNoteCopy();
    clipboard.readText.mockReturnValue("Second copy");
    service.trackCurrentNoteCopy();
    scheduledCallbacks[0]();

    expect(cancelTimeout).toHaveBeenCalledOnce();
    expect(clipboard.clear).not.toHaveBeenCalled();

    scheduledCallbacks[1]();
    expect(clipboard.clear).toHaveBeenCalledOnce();
  });

  it("cancels a pending clear when the preference changes", () => {
    const clipboard = createClipboard({ text: "Copied note" });
    const scheduledCallbacks: Array<() => void> = [];
    const cancelTimeout = vi.fn();
    const service = new ClipboardPrivacyService(
      clipboard,
      (callback) => {
        scheduledCallbacks.push(callback);
        return {} as NodeJS.Timeout;
      },
      cancelTimeout
    );

    service.applyClearDelay(ClipboardClearDelay.TEN_MINUTES);
    service.trackCurrentNoteCopy();
    service.applyClearDelay(ClipboardClearDelay.NEVER);
    scheduledCallbacks[0]();

    expect(cancelTimeout).toHaveBeenCalledOnce();
    expect(clipboard.clear).not.toHaveBeenCalled();
  });

  it("clears an unchanged pending Axion Notes copy when the application exits", () => {
    const clipboard = createClipboard({ text: "Copied note" });
    const cancelTimeout = vi.fn();
    const service = new ClipboardPrivacyService(clipboard, vi.fn(() => ({} as NodeJS.Timeout)), cancelTimeout);

    service.applyClearDelay(ClipboardClearDelay.THIRTY_SECONDS);
    service.trackCurrentNoteCopy();
    service.clearTrackedNoteCopy();

    expect(cancelTimeout).toHaveBeenCalledOnce();
    expect(clipboard.clear).toHaveBeenCalledOnce();
  });

  it("clears an unchanged Axion Notes copy on exit even when timed clearing is disabled", () => {
    const clipboard = createClipboard({ text: "Copied note" });
    const service = new ClipboardPrivacyService(clipboard, vi.fn() as never, vi.fn());

    service.applyClearDelay(ClipboardClearDelay.NEVER);
    service.trackCurrentNoteCopy();
    service.clearTrackedNoteCopy();

    expect(clipboard.clear).toHaveBeenCalledOnce();
  });

  it("preserves newer clipboard content when the application exits", () => {
    const clipboard = createClipboard({ text: "Copied note" });
    const service = new ClipboardPrivacyService(clipboard, vi.fn(() => ({} as NodeJS.Timeout)), vi.fn());

    service.applyClearDelay(ClipboardClearDelay.THIRTY_SECONDS);
    service.trackCurrentNoteCopy();
    clipboard.readText.mockReturnValue("Copied somewhere else");
    service.clearTrackedNoteCopy();

    expect(clipboard.clear).not.toHaveBeenCalled();
  });

  it("does not schedule an empty or unreadable clipboard", () => {
    const emptyClipboard = createClipboard({ text: "" });
    const unreadableClipboard = createClipboard({ text: "Copied note" });
    unreadableClipboard.availableFormats.mockImplementation(() => {
      throw new Error("Clipboard unavailable");
    });
    const scheduleTimeout = vi.fn();
    const emptyService = new ClipboardPrivacyService(emptyClipboard, scheduleTimeout as never, vi.fn());
    const unreadableService = new ClipboardPrivacyService(unreadableClipboard, scheduleTimeout as never, vi.fn());

    emptyService.applyClearDelay(ClipboardClearDelay.THIRTY_SECONDS);
    unreadableService.applyClearDelay(ClipboardClearDelay.THIRTY_SECONDS);
    emptyService.trackCurrentNoteCopy();
    unreadableService.trackCurrentNoteCopy();

    expect(scheduleTimeout).not.toHaveBeenCalled();
  });
});

function createClipboard(overrides: {
  formats?: string[];
  html?: string;
  rtf?: string;
  text?: string;
} = {}) {
  return {
    availableFormats: vi.fn(() => overrides.formats ?? ["text/plain"]),
    clear: vi.fn(),
    readHTML: vi.fn(() => overrides.html ?? ""),
    readRTF: vi.fn(() => overrides.rtf ?? ""),
    readText: vi.fn(() => overrides.text ?? "")
  };
}
