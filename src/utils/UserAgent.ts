/**
 * Copyright (c) 2023-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
export class UserAgent {
  
  private static userAgent = window.navigator.userAgent.toLowerCase();
  
  public static isElectron = UserAgent.userAgent.includes("electron");
  
  public static isMac = (UserAgent.userAgent.includes("mac") || UserAgent.userAgent.includes("macintosh"));

  public static isWindows = UserAgent.userAgent.includes("windows");
}
