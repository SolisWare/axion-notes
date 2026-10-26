/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 *
 * @author Michael Polowczuk
 */
export function getMuiDialogRoot(dialog: HTMLElement): HTMLElement {
  const root = dialog.closest(".MuiDialog-root");

  if (!root) {
    throw new Error("Could not find the MUI dialog root.");
  }

  return root as HTMLElement;
}
