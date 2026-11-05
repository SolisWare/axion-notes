/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BackupState } from "./BackupState";

export enum BackupCreateStatus {
  CREATED = "created",
  FAILED = "failed",
  INVALID_PASSWORD = "invalidPassword",
  PASSWORD_REQUIRED = "passwordRequired"
}

export type BackupCreateResult = {
  status: BackupCreateStatus;
  state?: BackupState;
};
