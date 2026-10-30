/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
export enum UnlockResultStatus {
  UNLOCKED = "unlocked",
  INVALID_PASSWORD = "invalidPassword",
  COOLDOWN_ACTIVE = "cooldownActive",
  RECOVERY_REQUIRED = "recoveryRequired"
}
