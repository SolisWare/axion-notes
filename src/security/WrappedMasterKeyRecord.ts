/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { EncryptionAlgorithm } from "./EncryptionAlgorithm";

export type WrappedMasterKeyRecord = {
  algorithm: EncryptionAlgorithm;
  iv: string;
  authTag: string;
  ciphertext: string;
};
