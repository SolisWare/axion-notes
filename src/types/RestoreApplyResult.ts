/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { RestoreState } from "./RestoreState";

export enum RestoreApplyStatus {
  APPLIED = "applied",
  FAILED = "failed",
  INVALID_ARCHIVE = "invalidArchive",
  INVALID_PASSWORD = "invalidPassword",
  PASSWORD_REQUIRED = "passwordRequired"
}

export type RestoreApplyResult = {
  state?: RestoreState;
  status: RestoreApplyStatus;
};
