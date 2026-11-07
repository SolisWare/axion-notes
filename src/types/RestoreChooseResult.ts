/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
export enum RestoreChooseStatus {
  CANCELLED = "cancelled",
  FAILED = "failed",
  SELECTED = "selected"
}

export type RestoreChooseResult = {
  filePath?: string;
  status: RestoreChooseStatus;
};
