/**
 * Copyright (c) 2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
export type AppVersionConfig = {
  majorVersion: number;
  minorVersion: number;
  patchVersion: number;
  preReleaseVersion?: string;
  buildVersion?: number;
  releaseCodename?: string;
};
