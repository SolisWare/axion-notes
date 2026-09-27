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
  disabledTooltip?: string;
  requiresEncryption?: boolean;
  requiresRichTextEditor?: boolean;
  requiresLockScreen?: boolean;
};

type ShortcutSection = {
  title: string;
  shortcuts: Shortcut[];
};

type ShortcutsProps = {
  lockScreenEnabled: boolean;
  notesEncryptionEnabled: boolean;
  richTextEditorEnabled: boolean;
};

function getShortcutSections(t: TFunction, encryptionDisabledTooltip: string, lockScreenDisabledTooltip: string): ShortcutSection[] {
  const isMac = window.api.os.isMac;
  const commandKey = isMac
    ? { label: "⌘", ariaLabel: t("keys.command") }
    : { label: "⌃", ariaLabel: t("keys.control") };
  const optionKey = isMac
    ? { label: "⌥", ariaLabel: t("keys.option") }
    : { label: "Alt", ariaLabel: t("keys.alt") };
  const shiftKey = { label: "⇧", ariaLabel: t("keys.shift") };
  const backspaceKey = { label: "⌫", ariaLabel: t("keys.backspace") };
  const escapeKey = { label: "Esc", ariaLabel: t("keys.escape") };

  return [
    {
      title: t("general"),
      shortcuts: [
        { label: t("newNote"), keys: [commandKey, { label: "N", ariaLabel: "N" }] },
        ...(isMac ? [
          { label: t("openSettings"), keys: [commandKey, { label: ",", ariaLabel: t("keys.comma") }] },
        ] : []),
        { label: t("deleteAllNotes"), keys: [commandKey, shiftKey, backspaceKey] }
      ]
    },
    {
      title: t("noteSelection"),
      shortcuts: [
        { label: t("selectNotes"), keys: [commandKey, shiftKey, { label: "A", ariaLabel: "A" }] },
        { label: t("selectAllNotes"), keys: [commandKey, { label: "A", ariaLabel: "A" }] },
        { label: t("duplicateSelectedNotes"), keys: [commandKey, shiftKey, { label: "D", ariaLabel: "D" }] },
        { label: t("clearOrCancelSelection"), keys: [escapeKey] }
      ]
    },
    {
      title: t("security"),
      shortcuts: [
        {
          label: t("lockNotes"),
          keys: [commandKey, shiftKey, { label: "L", ariaLabel: "L" }],
          disabledTooltip: lockScreenDisabledTooltip,
          requiresLockScreen: true
        },
        {
          label: t("secureLock"),
          keys: [commandKey, shiftKey, optionKey, { label: "L", ariaLabel: "L" }],
          disabledTooltip: encryptionDisabledTooltip,
          requiresEncryption: true
        }
      ]
    },
    {
      title: t("textFormatting"),
      shortcuts: [
        { label: t("formatting.bold"), keys: [commandKey, { label: "B", ariaLabel: "B" }], requiresRichTextEditor: true },
        { label: t("formatting.italic"), keys: [commandKey, { label: "I", ariaLabel: "I" }], requiresRichTextEditor: true },
        { label: t("formatting.underline"), keys: [commandKey, { label: "U", ariaLabel: "U" }], requiresRichTextEditor: true },
        { label: t("formatting.strikethrough"), keys: [commandKey, shiftKey, { label: "X", ariaLabel: "X" }], requiresRichTextEditor: true },
        { label: t("formatting.highlight"), keys: [commandKey, shiftKey, { label: "H", ariaLabel: "H" }], requiresRichTextEditor: true },
        { label: t("formatting.inlineCode"), keys: [commandKey, { label: "M", ariaLabel: "M" }], requiresRichTextEditor: true },
        { label: t("formatting.clearFormatting"), keys: [commandKey, { label: "\\", ariaLabel: t("keys.backslash") }], requiresRichTextEditor: true },
        { label: t("increaseFontSize"), keys: [commandKey, { label: "+", ariaLabel: t("keys.plus") }], requiresRichTextEditor: true },
        { label: t("decreaseFontSize"), keys: [commandKey, { label: "-", ariaLabel: t("keys.minus") }], requiresRichTextEditor: true }
      ]
    },
    {
      title: t("formatting.lists"),
      shortcuts: [
        { label: t("formatting.bulletList"), keys: [commandKey, shiftKey, { label: "6", ariaLabel: "6" }], requiresRichTextEditor: true },
        { label: t("formatting.dashedList"), keys: [commandKey, shiftKey, { label: "7", ariaLabel: "7" }], requiresRichTextEditor: true },
        { label: t("formatting.numberedList"), keys: [commandKey, shiftKey, { label: "8", ariaLabel: "8" }], requiresRichTextEditor: true },
        { label: t("formatting.checklist"), keys: [commandKey, shiftKey, { label: "9", ariaLabel: "9" }], requiresRichTextEditor: true }
      ]
    }
  ];
}

function Shortcuts(props: ShortcutsProps) {
  const { t } = useTranslation();
  const disabledFormattingTooltip = t("richTextEditorRequired");
  const disabledEncryptionTooltip = t("encryptionRequired");
  const disabledLockScreenTooltip = t("lockScreenRequired");

  return (
    <div className={styles.shortcutsPage}>
      <div className={styles.shortcutsSection}>
        {getShortcutSections(t, disabledEncryptionTooltip, disabledLockScreenTooltip).map((section, sectionIndex) => (
          <section className={styles.shortcutGroup} key={section.title}>
            <div className={`${styles.shortcutSectionHeader} ${sectionIndex === 0 ? styles.shortcutSectionHeaderFirst : ""}`}>
              {section.title}
            </div>
            <div className={styles.shortcutsList}>
            {section.shortcuts.map((shortcut) => {
              const isDisabled = (shortcut.requiresRichTextEditor === true && !props.richTextEditorEnabled)
                || (shortcut.requiresEncryption === true && !props.notesEncryptionEnabled)
                || (shortcut.requiresLockScreen === true && !props.lockScreenEnabled);
              const disabledTooltip = shortcut.disabledTooltip ?? disabledFormattingTooltip;

              return (
                <Tooltip
                  arrow
                  disableHoverListener={!isDisabled}
                  enterDelay={300}
                  enterNextDelay={300}
                  key={shortcut.label}
                  title={disabledTooltip}
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
          </section>
        ))}
      </div>
    </div>
  );
}

export default Shortcuts;
