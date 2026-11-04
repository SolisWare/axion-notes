/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { BackupContentSelection } from "./BackupContentSelection";

export type BackupState = {
  version: 1;
  initializedAt: string;
  contentSelection: BackupContentSelection;
  lastBackupCreatedAt?: string;
};
