/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
export enum EncryptionProgressOperation {
  ENCRYPT = "encrypt",
  DECRYPT = "decrypt"
}

export enum EncryptionProgressPhase {
  PREPARING = "preparing",
  PROCESSING_NOTES = "processingNotes",
  VERIFYING = "verifying",
  CLEANING_UP = "cleaningUp"
}

export type EncryptionProgressEvent = {
  operation: EncryptionProgressOperation;
  phase: EncryptionProgressPhase;
  current?: number;
  total?: number;
  progress: number;
};
