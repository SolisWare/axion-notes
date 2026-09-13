/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultAppSettings } from "../../../../src/settings/defaultSettings";
import { SystemTheme } from "../../../../src/theme/SystemTheme";
import MainWindow from "../../../../src/views/MainWindow/MainWindow";
import { installDesktopApiMock } from "../../../utils/electron/createDesktopApiMock";

const { navigate, translate } = vi.hoisted(() => {
  const translations: Record<string, string> = {
    "mainWindow.welcome.title": "Welcome to Axion Notes",
    "mainWindow.welcome.intro": "Keep quick thoughts close, tidy, and ready whenever you need them.",
    "mainWindow.welcome.getStarted": "Get Started",
    "mainWindow.welcome.doNotShowAgain": "Do not show this welcome screen again",
    "mainWindow.welcome.preview.today": "Today",
    "mainWindow.welcome.preview.freshWorkspace": "Fresh workspace",
    "mainWindow.welcome.preview.ideas": "Ideas",
    "mainWindow.welcome.preview.colorfulNotes": "Colorful notes",
    "mainWindow.welcome.preview.next": "Next",
    "mainWindow.toolbar.newNote": "New Note",
    "mainWindow.emptyNotes.title": "You don't have any notes yet!"
  };

  return {
    navigate: vi.fn(),
    translate: vi.fn((key: string) => translations[key] ?? key)
  };
});

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();

  return {
    ...actual,
    useNavigate: () => navigate
  };
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: translate
  })
}));

vi.mock("../../../../src/App", () => ({
  AppView: {
    home: "/home",
    welcome: "/welcome",
    lock: "/lock",
    license: "/license"
  }
}));

describe("WelcomeScreen integration", () => {
  beforeEach(() => {
    navigate.mockClear();
    translate.mockClear();
    installDesktopApiMock();
  });

  describe("welcome route rendering", () => {
    it("renders the Welcome screen when MainWindow is on the welcome view", () => {
      renderMainWindow();

      expect(screen.getByRole("heading", { name: "Welcome to Axion Notes" })).toBeInTheDocument();
      expect(screen.getByText("Keep quick thoughts close, tidy, and ready whenever you need them.")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /get started/i })).toBeInTheDocument();
    });

    it("does not render the web toolbar on the welcome view", () => {
      renderMainWindow();

      expect(screen.queryByRole("button", { name: "New Note" })).not.toBeInTheDocument();
    });

    it("does not render the empty notes home state behind the Welcome screen", () => {
      renderMainWindow();

      expect(screen.queryByText("You don't have any notes yet!")).not.toBeInTheDocument();
    });
  });

  describe("get started app flow", () => {
    it("navigates to the home view when Get Started is clicked", async () => {
      const user = userEvent.setup();

      renderMainWindow();

      await user.click(screen.getByRole("button", { name: /get started/i }));

      expect(navigate).toHaveBeenCalledOnce();
      expect(navigate).toHaveBeenCalledWith("/home");
    });

    it("does not change app settings when Get Started is clicked by itself", async () => {
      const user = userEvent.setup();
      const onAppSettingsChange = vi.fn();

      renderMainWindow({ onAppSettingsChange });

      await user.click(screen.getByRole("button", { name: /get started/i }));

      expect(onAppSettingsChange).not.toHaveBeenCalled();
    });
  });

  describe("never show again behavior", () => {
    it("shows the checkbox as unchecked when the welcome screen is enabled on launch", () => {
      renderMainWindow({
        appSettings: {
          ...defaultAppSettings,
          showWelcomeScreenOnLaunch: true
        }
      });

      expect(screen.getByRole("checkbox", { name: "Do not show this welcome screen again" })).not.toBeChecked();
    });

    it("shows the checkbox as checked when the welcome screen is disabled on launch", () => {
      renderMainWindow({
        appSettings: {
          ...defaultAppSettings,
          showWelcomeScreenOnLaunch: false
        }
      });

      expect(screen.getByRole("checkbox", { name: "Do not show this welcome screen again" })).toBeChecked();
    });

    it("updates app settings when the checkbox is checked", async () => {
      const user = userEvent.setup();
      const onAppSettingsChange = vi.fn();

      renderMainWindow({
        appSettings: {
          ...defaultAppSettings,
          showWelcomeScreenOnLaunch: true
        },
        onAppSettingsChange
      });

      await user.click(screen.getByRole("checkbox", { name: "Do not show this welcome screen again" }));

      expect(onAppSettingsChange).toHaveBeenCalledOnce();
      expect(onAppSettingsChange).toHaveBeenCalledWith({
        ...defaultAppSettings,
        showWelcomeScreenOnLaunch: false
      });
    });

    it("updates app settings when the checkbox is unchecked", async () => {
      const user = userEvent.setup();
      const onAppSettingsChange = vi.fn();
      const appSettings = {
        ...defaultAppSettings,
        showWelcomeScreenOnLaunch: false
      };

      renderMainWindow({
        appSettings,
        onAppSettingsChange
      });

      await user.click(screen.getByRole("checkbox", { name: "Do not show this welcome screen again" }));

      expect(onAppSettingsChange).toHaveBeenCalledOnce();
      expect(onAppSettingsChange).toHaveBeenCalledWith({
        ...appSettings,
        showWelcomeScreenOnLaunch: true
      });
    });
  });

  describe("menu-triggered welcome screen", () => {
    it("navigates to the welcome view when the menu callback fires", () => {
      let showWelcomeCallback: (() => void) | undefined;

      installDesktopApiMock({
        menu: {
          onMenuShowWelcome: vi.fn((callback) => {
            showWelcomeCallback = callback;

            return vi.fn();
          })
        }
      });
      renderMainWindow();

      showWelcomeCallback?.();

      expect(navigate).toHaveBeenCalledOnce();
      expect(navigate).toHaveBeenCalledWith("/welcome");
    });

    it("unsubscribes from the menu welcome callback on unmount", () => {
      const unsubscribeShowWelcome = vi.fn();

      installDesktopApiMock({
        menu: {
          onMenuShowWelcome: vi.fn(() => unsubscribeShowWelcome)
        }
      });

      const { unmount } = renderMainWindow();
      unmount();

      expect(unsubscribeShowWelcome).toHaveBeenCalledOnce();
    });
  });

  describe("settings persistence boundary", () => {
    it("preserves the rest of app settings when changing the welcome launch preference", async () => {
      const user = userEvent.setup();
      const onAppSettingsChange = vi.fn();
      const appSettings = {
        ...defaultAppSettings,
        keepNotesMainWindowOnTop: true,
        showNoteTitles: false,
        showWelcomeScreenOnLaunch: true
      };

      renderMainWindow({
        appSettings,
        onAppSettingsChange
      });

      await user.click(screen.getByRole("checkbox", { name: "Do not show this welcome screen again" }));

      expect(onAppSettingsChange).toHaveBeenCalledOnce();
      expect(onAppSettingsChange).toHaveBeenCalledWith({
        ...appSettings,
        showWelcomeScreenOnLaunch: false
      });
    });

    it("does not persist settings directly when changing the welcome launch preference", async () => {
      const user = userEvent.setup();
      const setSettings = vi.fn();

      installDesktopApiMock({
        settings: {
          setSettings
        }
      });
      renderMainWindow();

      await user.click(screen.getByRole("checkbox", { name: "Do not show this welcome screen again" }));

      expect(setSettings).not.toHaveBeenCalled();
    });
  });
});

function renderMainWindow(props?: Partial<ComponentProps<typeof MainWindow>>) {
  return render(
    <MemoryRouter initialEntries={["/welcome"]}>
      <MainWindow
        appSettings={defaultAppSettings}
        onAppSettingsChange={vi.fn()}
        theme={SystemTheme.LIGHT}
        view={"/welcome" as never}
        {...props}
      />
    </MemoryRouter>
  );
}
