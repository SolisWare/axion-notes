/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import styles from "./SettingsPages.module.css";

type ShortcutKey = {
  label: string;
  ariaLabel: string;
};

type Shortcut = {
  label: string;
  keys: ShortcutKey[];
};

function getShortcutKeys(t: TFunction): Shortcut[] {
  const isMac = window.api.os.isMac;
  const commandKey = isMac
    ? { label: "⌘", ariaLabel: t("settingsWindow.shortcuts.keys.command") }
    : { label: "⌃", ariaLabel: t("settingsWindow.shortcuts.keys.control") };
  const shiftKey = { label: "⇧", ariaLabel: t("settingsWindow.shortcuts.keys.shift") };
  const backspaceKey = { label: "⌫", ariaLabel: t("settingsWindow.shortcuts.keys.backspace") };

  return [
    { label: t("settingsWindow.shortcuts.newNote"), keys: [commandKey, { label: "N", ariaLabel: "N" }] },
    { label: t("settingsWindow.shortcuts.openSettings"), keys: [commandKey, { label: ",", ariaLabel: t("settingsWindow.shortcuts.keys.comma") }] },
    { label: t("settingsWindow.shortcuts.deleteAllNotes"), keys: [commandKey, shiftKey, backspaceKey] },
  ];
}

function Shortcuts() {
  const { t } = useTranslation();

  return (
    <div className={styles.shortcutsPage}>
      <div className={styles.shortcutsList}>
        {getShortcutKeys(t).map((shortcut) => (
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
