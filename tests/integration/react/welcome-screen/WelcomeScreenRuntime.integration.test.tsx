/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { installDesktopApiMock } from "../../../utils/electron/createDesktopApiMock";
import { defaultAppSettings } from "../../../../src/settings/defaultSettings";
import App from "../../../../src/App";

const { i18n, translate, userAgent } = vi.hoisted(() => {
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
    "mainWindow.toolbar.newNote": "New Note"
  };

  return {
    i18n: {
      changeLanguage: vi.fn(),
      t: vi.fn((key: string) => translations[key] ?? key)
    },
    translate: vi.fn((key: string) => translations[key] ?? key),
    userAgent: {
      isElectron: false,
      isMac: false,
      isWindows: false
    }
  };
});

vi.mock("../../../../src/i18n/i18n", () => ({
  default: i18n
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: translate
  })
}));

vi.mock("../../../../src/utils/UserAgent", () => ({
  UserAgent: userAgent
}));

vi.mock("electron-router-dom", async () => {
  const React = await import("react");
  const { MemoryRouter } = await import("react-router-dom");

  function Route() {
    return null;
  }

  function Router(props: { main: React.ReactNode }) {
    return React.createElement(
      MemoryRouter,
      { initialEntries: ["/"] },
      findRootRouteElement(props.main)
    );
  }

  function findRootRouteElement(node: React.ReactNode): React.ReactNode {
    const children = React.isValidElement(node)
      ? React.Children.toArray(node.props.children)
      : React.Children.toArray(node);

    for (const child of children) {
      if (!React.isValidElement(child)) {
        continue;
      }

      if (child.props.path === "/") {
        return child.props.element;
      }

      const nestedRootRouteElement = findRootRouteElement(child);
      if (nestedRootRouteElement) {
        return nestedRootRouteElement;
      }
    }

    return null;
  }

  return {
    Route,
    Router
  };
});

describe("WelcomeScreen runtime integration", () => {
  beforeEach(() => {
    i18n.changeLanguage.mockClear();
    i18n.t.mockClear();
    translate.mockClear();
    window.history.pushState({}, "", "/");
  });

  describe("browser and desktop integration", () => {
    it("renders the Welcome screen on the browser welcome route", async () => {
      userAgent.isElectron = false;
      window.history.pushState({}, "", "/welcome");
      installDesktopApiMock({
        settings: {
          getSettings: vi.fn().mockResolvedValue(defaultAppSettings)
        }
      });

      render(<App />);

      expect(await screen.findByRole("heading", { name: "Welcome to Axion Notes" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /get started/i })).toBeInTheDocument();
    });

    it("renders the Welcome screen on desktop startup when launch settings allow it", async () => {
      userAgent.isElectron = true;
      installDesktopApiMock({
        security: {
          getLockState: vi.fn().mockResolvedValue({ isLocked: false })
        },
        settings: {
          getSettings: vi.fn().mockResolvedValue({
            ...defaultAppSettings,
            showWelcomeScreenOnLaunch: true
          })
        }
      });

      render(<App />);

      expect(await screen.findByRole("heading", { name: "Welcome to Axion Notes" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /get started/i })).toBeInTheDocument();
    });

    it("does not use desktop-only startup checks in browser mode", async () => {
      userAgent.isElectron = false;
      const getLockState = vi.fn().mockResolvedValue({ isLocked: true });
      const setAlwaysOnTop = vi.fn();

      installDesktopApiMock({
        appWindow: {
          setAlwaysOnTop
        },
        security: {
          getLockState
        },
        settings: {
          getSettings: vi.fn().mockResolvedValue({
            ...defaultAppSettings,
            showWelcomeScreenOnLaunch: true
          })
        }
      });

      render(<App />);

      expect(await screen.findByRole("heading", { name: "Welcome to Axion Notes" })).toBeInTheDocument();
      expect(getLockState).not.toHaveBeenCalled();
      expect(setAlwaysOnTop).not.toHaveBeenCalled();
    });
  });
});
