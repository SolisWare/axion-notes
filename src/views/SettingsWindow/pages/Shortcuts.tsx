/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { TFunction } from "i18next";
import { Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
import styles from "./SettingsPages.module.css";

type ShortcutKey = {
  label: string;
  ariaLabel: string;
};

type Shortcut = {
  label: string;
  keys: ShortcutKey[];
  requiresRichTextEditor?: boolean;
};

type ShortcutsProps = {
  richTextEditorEnabled: boolean;
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
    ...(isMac ? [
      { label: t("settingsWindow.shortcuts.openSettings"), keys: [commandKey, { label: ",", ariaLabel: t("settingsWindow.shortcuts.keys.comma") }] },
    ] : []),
    { label: t("settingsWindow.shortcuts.deleteAllNotes"), keys: [commandKey, shiftKey, backspaceKey] },
    { label: t("settingsWindow.shortcuts.bold"), keys: [commandKey, { label: "B", ariaLabel: "B" }], requiresRichTextEditor: true },
    { label: t("settingsWindow.shortcuts.italic"), keys: [commandKey, { label: "I", ariaLabel: "I" }], requiresRichTextEditor: true },
    { label: t("settingsWindow.shortcuts.underline"), keys: [commandKey, { label: "U", ariaLabel: "U" }], requiresRichTextEditor: true },
    { label: t("settingsWindow.shortcuts.strikethrough"), keys: [commandKey, shiftKey, { label: "X", ariaLabel: "X" }], requiresRichTextEditor: true },
    { label: t("settingsWindow.shortcuts.bulletList"), keys: [commandKey, shiftKey, { label: "6", ariaLabel: "6" }], requiresRichTextEditor: true },
    { label: t("settingsWindow.shortcuts.dashedList"), keys: [commandKey, shiftKey, { label: "7", ariaLabel: "7" }], requiresRichTextEditor: true },
    { label: t("settingsWindow.shortcuts.numberedList"), keys: [commandKey, shiftKey, { label: "8", ariaLabel: "8" }], requiresRichTextEditor: true },
    { label: t("settingsWindow.shortcuts.checklist"), keys: [commandKey, shiftKey, { label: "9", ariaLabel: "9" }], requiresRichTextEditor: true },
  ];
}

function Shortcuts(props: ShortcutsProps) {
  const { t } = useTranslation();
  const disabledFormattingTooltip = t("settingsWindow.disabledRichTextEditorTooltip");

  return (
    <div className={styles.shortcutsPage}>
      <div className={styles.shortcutsList}>
        {getShortcutKeys(t).map((shortcut) => {
          const isDisabled = shortcut.requiresRichTextEditor === true && !props.richTextEditorEnabled;

          return (
            <Tooltip
              arrow
              disableHoverListener={!isDisabled}
              enterDelay={300}
              enterNextDelay={300}
              key={shortcut.label}
              title={disabledFormattingTooltip}
            >
              <div className={`${styles.shortcutRow} ${isDisabled ? styles.shortcutRowDisabled : ""}`}>
                <span className={styles.shortcutLabel}>{shortcut.label}</span>
                <span className={styles.shortcutKeys} aria-label={shortcut.keys.map((key) => key.ariaLabel).join(" + ")}>
                  {shortcut.keys.map((key) => (
                    <kbd className={styles.shortcutKey} key={`${shortcut.label}-${key.ariaLabel}`}>{key.label}</kbd>
                  ))}
                </span>
              </div>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}

export default Shortcuts;
