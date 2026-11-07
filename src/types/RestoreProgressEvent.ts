/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
export enum RestoreProgressPhase {
  READING_ARCHIVE = "readingArchive",
  PREPARING = "preparing",
  PROCESSING_NOTES = "processingNotes",
  RESTORING_PREFERENCES = "restoringPreferences",
  RESTORING_WINDOW_STATE = "restoringWindowState",
  FINALIZING = "finalizing"
}

export type RestoreProgressEvent = {
  current?: number;
  phase: RestoreProgressPhase;
  progress: number;
  total?: number;
};
