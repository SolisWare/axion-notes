/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import appVersionConfig from "../../app-version-config.json";
import { AppVersionResolver } from "../../src/utils/app-version/AppVersionResolver";

export const versionApi = {
  
  getShortDisplayVersion: () => {
    return AppVersionResolver.getShortDisplayVersion(appVersionConfig);
  }
};
