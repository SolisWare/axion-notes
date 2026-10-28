/**
 * Copyright (c) 2023-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
export class UserAgent {
  
  private static userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent.toLowerCase();
  
  public static isElectron = (
    typeof process !== "undefined" && Boolean(process.versions?.electron)) || (
    typeof window !== "undefined" && (Boolean(window.api) || UserAgent.userAgent.includes("electron"))
  );
  
  public static isMac = (UserAgent.userAgent.includes("mac") || UserAgent.userAgent.includes("macintosh"));

  public static isWindows = UserAgent.userAgent.includes("windows");
}
