/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import "@testing-library/jest-dom/vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultAppSettings } from "../../../../src/settings/defaultSettings";
import { SystemTheme } from "../../../../src/theme/SystemTheme";
import { RestoreApplyStatus } from "../../../../src/types/RestoreApplyResult";
import { RestoreChooseStatus } from "../../../../src/types/RestoreChooseResult";
import { RestoreInspectStatus } from "../../../../src/types/RestoreInspectResult";
import { RestoreNotesMode } from "../../../../src/types/RestoreNotesMode";
import { RestoreSettingsMode } from "../../../../src/types/RestoreSettingsMode";
import { RestoreProgressPhase } from "../../../../src/types/RestoreProgressEvent";
import { BackupSource } from "../../../../src/types/BackupSource";
import { UserAgent } from "../../../../src/utils/UserAgent";
import SettingsWindow from "../../../../src/views/SettingsWindow/SettingsWindow";
import { installDesktopApiMock } from "../../../utils/electron/createDesktopApiMock";

const translations: Record<string, string> = {
  appPreferences: "App preferences",
  appPreferencesHelp: "Theme, language, editor preferences, and other app settings",
  backups: "Backups",
  backupConfigurationCreated: "Ready to create a backup",
  backupConfigurationCreatedHelp: "Notes and selected app data are ready to be included in your backup archive.",
  backupOptions: "Backup Options",
  cancel: "Cancel",
  currentPassword: "Current password",
  dataStorage: "Data & storage",
  includedInBackups: "Included in backups",
  mainWindowLayout: "Main-window layout",
  mainWindowLayoutHelp: "Main window size, position, and selected notes layout",
  noBackupCreated: "No backup created yet",
  noBackupCreatedHelp: "Set up a local backup archive of your notes and selected app data.",
  noBackupRestored: "No backup restored yet",
  noBackupRestoredHelp: "Choose a backup archive to restore its notes and selected app data.",
  notesAndNoteOrder: "Notes and note order",
  notesAndNoteOrderHelp: "Always included",
  options: "Options...",
  restore: "Restore",
  restoreBackup: "Restore backup…",
  preparingRestore: "Preparing your backup restore...",
  readingBackupArchive: "Reading your backup archive...",
  restoringNotes: "Restoring note {{current}} of {{total}}...",
  restoringBackupPreferences: "Restoring backup preferences...",
  restoringWindowLayout: "Restoring the main window layout...",
  finalizingRestore: "Finalizing the restore...",
  restoreBackupCreatedAt: "Created {{date}} at {{time}}",
  restoreBackupFailed: "Couldn't access the backup or write the restored data. Try again.",
  restoreBackupInvalidArchive: "The selected file is not a valid Axion Notes backup.",
  restoreBackupNotes: "Notes",
  restoreBackupNotesHelp: "Choose whether the backup replaces or adds to your current notes.",
  restoreBackupNoPreferences: "This backup does not include app preferences.",
  restoreBackupPasswordInstructions: "Enter your encryption password to restore this backup.",
  restoreBackupPreferences: "Restore backup preferences",
  restoreBackupPreferencesHelp: "Choose whether to keep or replace the current app preferences.",
  restoreBackupPreferencesTitle: "Preferences",
  restoreBackupSummary: "This backup contains {{count}} notes.",
  restoreBackupWarning: "Restore the selected backup?",
  replaceCurrentNotes: "Replace current notes",
  addBackupNotes: "Add backup notes",
  keepCurrentPreferences: "Keep current preferences",
  save: "Save",
  saving: "Saving...",
  setUpBackups: "Set up backups",
  settingUpBackups: "Setting up...",
  storage: "Storage"
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: { language: "en" },
    t: (key: string, values?: Record<string, string | number | undefined>) => {
      const translation = translations[key] ?? key;

      return Object.entries(values ?? {}).reduce((result, [name, value]) => result.replace(`{{${name}}}`, String(value)), translation);
    }
  })
}));

afterEach(() => {
  UserAgent.isElectron = false;
});

describe("Backups settings integration", () => {
  it("initializes backups from the desktop settings window", async () => {
    const user = userEvent.setup();
    const desktopApi = installDesktopApiMock({
      backup: {
        getState: vi.fn().mockResolvedValue(undefined),
        initialize: vi.fn().mockResolvedValue({
          version: 1,
          initializedAt: "2026-11-05T12:00:00.000Z",
          contentSelection: {
            appSettings: true,
            mainWindowState: true
          }
        }),
        updateContentSelection: vi.fn().mockResolvedValue({
          version: 1,
          initializedAt: "2026-11-05T12:00:00.000Z",
          contentSelection: {
            appSettings: false,
            mainWindowState: true
          }
        })
      }
    });
    UserAgent.isElectron = true;

    render(
      <SettingsWindow
        appSettings={defaultAppSettings}
        onAppSettingsChange={vi.fn()}
        theme={SystemTheme.LIGHT}
      />
    );

    await user.click(screen.getByRole("button", { name: "Backups" }));
    await user.click(await screen.findByRole("button", { name: "Set up backups" }));

    expect(desktopApi.backup.initialize).toHaveBeenCalledOnce();
    expect(await screen.findByText("Ready to create a backup")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Options..." }));
    await user.click(screen.getByRole("checkbox", { name: "App preferences" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(desktopApi.backup.updateContentSelection).toHaveBeenCalledWith({
      appSettings: false,
      mainWindowState: true
    });
  });

  it("reviews a selected backup, confirms its restore, and restarts after applying it", async () => {
    const user = userEvent.setup();
    const desktopApi = installDesktopApiMock({
      restore: {
        apply: vi.fn().mockResolvedValue({
          state: { lastRestoredAt: "2026-11-07T12:30:00.000Z", version: 1 },
          status: RestoreApplyStatus.APPLIED
        }),
        chooseArchive: vi.fn().mockResolvedValue({
          filePath: "/tmp/axion-notes-backup.zip",
          status: RestoreChooseStatus.SELECTED
        }),
        inspect: vi.fn().mockResolvedValue({
          plan: createRestorePlan(),
          status: RestoreInspectStatus.READY
        })
      }
    });
    UserAgent.isElectron = true;

    render(<SettingsWindow appSettings={defaultAppSettings} onAppSettingsChange={vi.fn()} theme={SystemTheme.LIGHT} />);

    await openBackups(user);
    await user.click(screen.getByRole("button", { name: "Restore backup…" }));

    const reviewDialog = await screen.findByRole("dialog", { name: "Restore backup…" });
    await user.click(within(reviewDialog).getByRole("button", { name: "Restore backup…" }));

    const confirmationDialog = await screen.findByRole("dialog", { name: "Restore backup…" });
    await user.click(within(confirmationDialog).getByRole("button", { name: "Restore backup…" }));

    expect(desktopApi.restore.inspect).toHaveBeenCalledWith("/tmp/axion-notes-backup.zip", undefined);
    expect(desktopApi.restore.apply).toHaveBeenCalledWith("/tmp/axion-notes-backup.zip", {
      notesMode: RestoreNotesMode.REPLACE_CURRENT,
      password: undefined,
      settingsMode: RestoreSettingsMode.RESTORE_BACKUP
    });
    expect(desktopApi.appWindow.restart).toHaveBeenCalledOnce();
  });

  it("skips restore choices when the selected backup has no conflicts", async () => {
    const user = userEvent.setup();
    const desktopApi = installDesktopApiMock({
      restore: {
        apply: vi.fn().mockResolvedValue({
          state: { lastRestoredAt: "2026-11-07T12:30:00.000Z", version: 1 },
          status: RestoreApplyStatus.APPLIED
        }),
        chooseArchive: vi.fn().mockResolvedValue({
          filePath: "/tmp/axion-notes-backup.zip",
          status: RestoreChooseStatus.SELECTED
        }),
        inspect: vi.fn().mockResolvedValue({
          plan: {
            ...createRestorePlan(),
            currentNotesCount: 0,
            defaultNotesMode: RestoreNotesMode.REPLACE_CURRENT,
            hasNotesConflict: false,
            hasPreferencesConflict: false,
            requiresNotesModeSelection: false,
            requiresSettingsModeSelection: false
          },
          status: RestoreInspectStatus.READY
        })
      }
    });
    UserAgent.isElectron = true;

    render(<SettingsWindow appSettings={defaultAppSettings} onAppSettingsChange={vi.fn()} theme={SystemTheme.LIGHT} />);

    await openBackups(user);
    await user.click(screen.getByRole("button", { name: "Restore backup…" }));

    const confirmationMessage = await screen.findByText("Restore the selected backup?");
    expect(screen.queryByText("This backup contains 2 notes.")).not.toBeInTheDocument();
    await user.click(within(confirmationMessage.closest("[role=dialog]")!).getByRole("button", { name: "Restore backup…" }));

    expect(desktopApi.restore.apply).toHaveBeenCalledWith("/tmp/axion-notes-backup.zip", {
      notesMode: RestoreNotesMode.REPLACE_CURRENT,
      password: undefined,
      settingsMode: RestoreSettingsMode.RESTORE_BACKUP
    });
  });

  it("shows restore progress only after the restore begins writing data", async () => {
    const user = userEvent.setup();
    let completeRestore: (() => void) | undefined;
    let reportProgress: ((progress: { current?: number; phase: RestoreProgressPhase; progress: number; total?: number }) => void) | undefined;
    const desktopApi = installDesktopApiMock({
      restore: {
        apply: vi.fn().mockImplementation(() => new Promise((resolve) => {
          completeRestore = () => resolve({
            state: { lastRestoredAt: "2026-11-07T12:30:00.000Z", version: 1 },
            status: RestoreApplyStatus.APPLIED
          });
        })),
        chooseArchive: vi.fn().mockResolvedValue({
          filePath: "/tmp/axion-notes-backup.zip",
          status: RestoreChooseStatus.SELECTED
        }),
        inspect: vi.fn().mockResolvedValue({
          plan: createRestorePlan(),
          status: RestoreInspectStatus.READY
        }),
        onProgress: vi.fn((callback) => {
          reportProgress = callback;
          return vi.fn();
        })
      }
    });
    UserAgent.isElectron = true;

    render(<SettingsWindow appSettings={defaultAppSettings} onAppSettingsChange={vi.fn()} theme={SystemTheme.LIGHT} />);

    await openBackups(user);
    await user.click(screen.getByRole("button", { name: "Restore backup…" }));
    await user.click(within(await screen.findByRole("dialog", { name: "Restore backup…" })).getByRole("button", { name: "Restore backup…" }));
    const confirmationMessage = await screen.findByText("Restore the selected backup?");
    await user.click(within(confirmationMessage.closest("[role=dialog]")!).getByRole("button", { name: "Restore backup…" }));

    await waitFor(() => expect(desktopApi.restore.apply).toHaveBeenCalledOnce());

    if (!reportProgress) {
      throw new Error("Restore progress listener was not registered.");
    }

    act(() => reportProgress!({ current: 1, phase: RestoreProgressPhase.PROCESSING_NOTES, progress: 43, total: 3 }));

    const progressDialog = await screen.findByRole("dialog", { name: "Restore backup…" });
    expect(progressDialog).toHaveTextContent("Restoring note 1 of 3...");
    expect(within(progressDialog).getByRole("progressbar")).toHaveAttribute("aria-valuenow", "43");

    if (!completeRestore) {
      throw new Error("Restore operation did not start.");
    }

    await act(async () => completeRestore!());

    await waitFor(() => expect(desktopApi.appWindow.restart).toHaveBeenCalledOnce());
  });

  it("requests an encryption password only when archive inspection requires it", async () => {
    const user = userEvent.setup();
    const desktopApi = installDesktopApiMock({
      restore: {
        chooseArchive: vi.fn().mockResolvedValue({
          filePath: "/tmp/encrypted-backup.zip",
          status: RestoreChooseStatus.SELECTED
        }),
        inspect: vi.fn()
          .mockResolvedValueOnce({ status: RestoreInspectStatus.PASSWORD_REQUIRED })
          .mockResolvedValueOnce({ plan: createRestorePlan(), status: RestoreInspectStatus.READY })
      }
    });
    UserAgent.isElectron = true;

    render(<SettingsWindow appSettings={defaultAppSettings} onAppSettingsChange={vi.fn()} theme={SystemTheme.LIGHT} />);

    await openBackups(user);
    await user.click(screen.getByRole("button", { name: "Restore backup…" }));
    await user.type(await screen.findByLabelText("Current password"), "current-password");
    await user.click(screen.getByRole("button", { name: "Restore backup…" }));

    expect(desktopApi.restore.inspect).toHaveBeenNthCalledWith(1, "/tmp/encrypted-backup.zip", undefined);
    expect(desktopApi.restore.inspect).toHaveBeenNthCalledWith(2, "/tmp/encrypted-backup.zip", "current-password");
    expect(await screen.findByText("This backup contains 2 notes.")).toBeInTheDocument();
  });

  it("shows an invalid-archive error without opening the restore review", async () => {
    const user = userEvent.setup();
    const desktopApi = installDesktopApiMock({
      restore: {
        chooseArchive: vi.fn().mockResolvedValue({
          filePath: "/tmp/not-a-backup.zip",
          status: RestoreChooseStatus.SELECTED
        }),
        inspect: vi.fn().mockResolvedValue({ status: RestoreInspectStatus.INVALID_ARCHIVE })
      }
    });
    UserAgent.isElectron = true;

    render(<SettingsWindow appSettings={defaultAppSettings} onAppSettingsChange={vi.fn()} theme={SystemTheme.LIGHT} />);

    await openBackups(user);
    await user.click(screen.getByRole("button", { name: "Restore backup…" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("The selected file is not a valid Axion Notes backup.");
    expect(screen.queryByText("This backup contains 2 notes.")).not.toBeInTheDocument();
    expect(desktopApi.restore.apply).not.toHaveBeenCalled();
  });
});

async function openBackups(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole("button", { name: "Backups" }));
  await screen.findByText("No backup restored yet");
}

function createRestorePlan() {
  return {
    archiveCreatedAt: "2026-11-07T12:00:00.000Z",
    backupSource: BackupSource.DESKTOP,
    conflictingNotesCount: 0,
    currentNotesCount: 2,
    defaultNotesMode: RestoreNotesMode.REPLACE_CURRENT,
    defaultSettingsMode: RestoreSettingsMode.RESTORE_BACKUP,
    hasBackupPreferences: true,
    hasNotesConflict: true,
    hasPreferencesConflict: true,
    preferencesCanBeRestored: true,
    hasMainWindowState: false,
    identicalNotesCount: 0,
    incomingNotesCount: 2,
    requiresCurrentPassword: false,
    requiresNotesModeSelection: true,
    requiresSettingsModeSelection: true
  };
}
