/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { ReactNode } from "react";
import BackspaceRoundedIcon from "@mui/icons-material/BackspaceRounded";
import KeyboardCommandKeyRoundedIcon from "@mui/icons-material/KeyboardCommandKeyRounded";
import KeyboardControlKeyRoundedIcon from "@mui/icons-material/KeyboardControlKeyRounded";
import styles from "./SettingsPages.module.css";

type ShortcutKey = {
  label: ReactNode;
  ariaLabel: string;
};

type Shortcut = {
  label: string;
  keys: ShortcutKey[];
};

function getShortcutKeys(): Shortcut[] {
  const isMac = window.api.os.isMac;
  const commandKey = isMac
    ? { label: <KeyboardCommandKeyRoundedIcon className={styles.shortcutIcon} />, ariaLabel: "Command" }
    : { label: <KeyboardControlKeyRoundedIcon className={styles.shortcutIcon} />, ariaLabel: "Control" };
  const shiftKey = { label: "⇧", ariaLabel: "Shift" };
  const backspaceKey = { label: <BackspaceRoundedIcon className={styles.shortcutIcon} />, ariaLabel: "Backspace" };

  return [
    { label: "New note", keys: [commandKey, { label: "N", ariaLabel: "N" }] },
    { label: "Open settings", keys: [commandKey, { label: ",", ariaLabel: "Comma" }] },
    { label: "Delete all notes", keys: [commandKey, shiftKey, backspaceKey] },
  ];
}

function Shortcuts() {
  return (
    <div className={styles.shortcutsPage}>
      <div className={styles.shortcutsList}>
        {getShortcutKeys().map((shortcut) => (
          <div className={styles.shortcutRow} key={shortcut.label}>
            <span className={styles.shortcutLabel}>{shortcut.label}</span>
            <span className={styles.shortcutKeys} aria-label={shortcut.keys.map((key) => key.ariaLabel).join(" + ")}>
              {shortcut.keys.map((key) => (
                <kbd className={styles.shortcutKey} key={`${shortcut.label}-${key.ariaLabel}`}>{key.label}</kbd>
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Shortcuts;
