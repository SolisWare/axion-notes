/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { EncryptionAlgorithm } from "./EncryptionAlgorithm";
import { KeyDerivationRecord } from "./KeyDerivationRecord";
import { WrappedMasterKeyRecord } from "./WrappedMasterKeyRecord";

export type EncryptionRecord = {
  version: number;
  algorithm: EncryptionAlgorithm;
  keyDerivation: KeyDerivationRecord;
  wrappedMasterKey: WrappedMasterKeyRecord;
};
