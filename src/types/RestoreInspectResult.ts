/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { RestorePlan } from "./RestorePlan";

export enum RestoreInspectStatus {
  FAILED = "failed",
  PASSWORD_REQUIRED = "passwordRequired",
  READY = "ready"
}

export type RestoreInspectResult = {
  plan?: RestorePlan;
  status: RestoreInspectStatus;
};
