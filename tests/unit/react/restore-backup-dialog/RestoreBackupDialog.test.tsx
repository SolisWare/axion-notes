/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import RestoreBackupDialog from "../../../../src/components/RestoreBackupDialog";
import { defaultAppSettings } from "../../../../src/settings/defaultSettings";
import { SystemTheme } from "../../../../src/theme/SystemTheme";
import { RestoreNotesMode } from "../../../../src/types/RestoreNotesMode";
import { RestoreSettingsMode } from "../../../../src/types/RestoreSettingsMode";

const translations: Record<string, string> = {
  addBackupNotes: "Add backup notes",
  cancel: "Cancel",
  keepCurrentPreferences: "Keep current preferences",
  replaceCurrentNotes: "Replace current notes",
  restoreBackup: "Restore backup…",
  restoreBackupCreatedAt: "Created {{date}} at {{time}}",
  restoreBackupNoPreferences: "This backup does not include app preferences. Your current preferences will be kept.",
  restoreBackupNotes: "Notes",
  restoreBackupNotesHelp: "Choose whether the backup replaces your current notes or is added alongside them. Current notes are kept only when you add the backup notes.",
  restoreBackupPreferences: "Restore backup preferences",
  restoreBackupPreferencesHelp: "Choose whether to keep this app's current preferences or replace them with the backup preferences. Security and encryption settings are always kept.",
  restoreBackupPreferencesTitle: "Preferences",
  restoreBackupSummary: "This backup contains {{count}} notes."
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string | number>) => Object.entries(values ?? {}).reduce(
      (translation, [name, value]) => translation.replace(`{{${name}}}`, String(value)),
      translations[key] ?? key
    )
  })
}));

describe("RestoreBackupDialog", () => {
  it("presents the archive summary, timestamp, and separated restore choices", () => {
    renderRestoreBackupDialog();

    expect(screen.getByRole("dialog", { name: "Restore backup…" })).toHaveAccessibleDescription("This backup contains 3 notes.");
    expect(screen.getByText("Created 11/7/2026 at 12:00 AM")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Notes" })).toHaveTextContent("Current notes are kept only when you add the backup notes.");
    expect(screen.getByRole("group", { name: "Preferences" })).toHaveTextContent("Security and encryption settings are always kept.");
  });

  it("submits the selected notes and preferences modes", async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn();
    renderRestoreBackupDialog({ onRestore });

    await user.click(screen.getByRole("radio", { name: "Replace current notes" }));
    await user.click(screen.getByRole("radio", { name: "Restore backup preferences" }));
    await user.click(screen.getByRole("button", { name: "Restore backup…" }));

    expect(onRestore).toHaveBeenCalledWith(RestoreNotesMode.REPLACE_CURRENT, RestoreSettingsMode.RESTORE_BACKUP);
  });

  it("explains that current preferences are kept when the backup has none", () => {
    renderRestoreBackupDialog({ plan: { ...defaultPlan, hasBackupPreferences: false } });

    expect(screen.getByRole("group", { name: "Preferences" })).toHaveTextContent("This backup does not include app preferences. Your current preferences will be kept.");
    expect(screen.queryByRole("radio", { name: "Keep current preferences" })).not.toBeInTheDocument();
  });

  it("requires explicit restore choices when the destination already contains notes", async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn();
    renderRestoreBackupDialog({
      onRestore,
      plan: {
        ...defaultPlan,
        defaultNotesMode: undefined,
        defaultSettingsMode: undefined,
        currentNotesCount: 2,
        requiresNotesModeSelection: true,
        requiresSettingsModeSelection: true
      }
    });

    const restoreButton = screen.getByRole("button", { name: "Restore backup…" });
    expect(restoreButton).toBeDisabled();

    await user.click(screen.getByRole("radio", { name: "Add backup notes" }));
    expect(restoreButton).toBeDisabled();

    await user.click(screen.getByRole("radio", { name: "Keep current preferences" }));
    expect(restoreButton).toBeEnabled();
    await user.click(restoreButton);

    expect(onRestore).toHaveBeenCalledWith(RestoreNotesMode.ADD_TO_CURRENT, RestoreSettingsMode.KEEP_CURRENT);
  });
});

const defaultPlan = {
  archiveCreatedAt: "2026-11-07T12:00:00.000Z",
  conflictingNotesCount: 0,
  currentNotesCount: 0,
  defaultNotesMode: RestoreNotesMode.ADD_TO_CURRENT,
  defaultSettingsMode: RestoreSettingsMode.KEEP_CURRENT,
  hasBackupPreferences: true,
  hasMainWindowState: true,
  identicalNotesCount: 0,
  incomingNotesCount: 3,
  requiresCurrentPassword: false,
  requiresNotesModeSelection: false,
  requiresSettingsModeSelection: false
};

function renderRestoreBackupDialog(props?: Partial<ComponentProps<typeof RestoreBackupDialog>>) {
  return render(
    <RestoreBackupDialog
      appSettings={defaultAppSettings}
      open
      plan={defaultPlan}
      theme={SystemTheme.LIGHT}
      onCancel={vi.fn()}
      onRestore={vi.fn()}
      {...props}
    />
  );
}
