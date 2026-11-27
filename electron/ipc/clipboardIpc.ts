/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { ClipboardPrivacyService } from "../security/ClipboardPrivacyService";
import { LockStateService } from "../security/LockStateService";
import { channels } from "./channels";
import { protectedOn } from "./protectedIpc";

type ClipboardIpcOptions = {
  clipboardPrivacyService: ClipboardPrivacyService;
  lockStateService: LockStateService;
};

export function registerClipboardIpc(options: ClipboardIpcOptions): void {
  protectedOn(channels.clipboard.trackNoteCopy, options, () => {
    options.clipboardPrivacyService.trackCurrentNoteCopy();
  });
}
