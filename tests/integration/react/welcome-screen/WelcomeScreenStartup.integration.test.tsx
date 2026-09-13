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

const { i18n, userAgent } = vi.hoisted(() => ({
  i18n: {
    changeLanguage: vi.fn(),
    t: vi.fn((key: string) => key)
  },
  userAgent: {
    isElectron: true,
    isMac: false,
    isWindows: false
  }
}));

vi.mock("../../../../src/i18n/i18n", () => ({
  default: i18n
}));

vi.mock("../../../../src/utils/UserAgent", () => ({
  UserAgent: userAgent
}));

vi.mock("electron-router-dom", async () => {
  const React = await import("react");

  function Route() {
    return null;
  }

  function Router(props: { main: React.ReactNode }) {
    return React.createElement(React.Fragment, null, findRootRouteElement(props.main));
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

vi.mock("../../../../src/views/MainWindow/MainWindow", () => ({
  default: (props: { view: string }) => (
    <div data-testid="main-window" data-view={props.view} />
  )
}));

vi.mock("../../../../src/views/MainWindow/pages/LockScreen", () => ({
  default: () => (
    <div data-testid="lock-screen" />
  )
}));

describe("WelcomeScreen startup integration", () => {
  beforeEach(() => {
    i18n.changeLanguage.mockClear();
    i18n.t.mockClear();
    userAgent.isElectron = true;
  });

  describe("startup decision integration", () => {
    it("shows the welcome view when launch settings allow it and the app is not locked", async () => {
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

      expect(await screen.findByTestId("main-window")).toHaveAttribute("data-view", "/welcome");
      expect(screen.queryByTestId("lock-screen")).not.toBeInTheDocument();
    });

    it("shows the home view when launch settings skip the welcome screen and the app is not locked", async () => {
      installDesktopApiMock({
        security: {
          getLockState: vi.fn().mockResolvedValue({ isLocked: false })
        },
        settings: {
          getSettings: vi.fn().mockResolvedValue({
            ...defaultAppSettings,
            showWelcomeScreenOnLaunch: false
          })
        }
      });

      render(<App />);

      expect(await screen.findByTestId("main-window")).toHaveAttribute("data-view", "/home");
      expect(screen.queryByTestId("lock-screen")).not.toBeInTheDocument();
    });

    it("shows the lock screen before the welcome screen when the app starts locked", async () => {
      installDesktopApiMock({
        security: {
          getLockState: vi.fn().mockResolvedValue({ isLocked: true })
        },
        settings: {
          getSettings: vi.fn().mockResolvedValue({
            ...defaultAppSettings,
            showWelcomeScreenOnLaunch: true
          })
        }
      });

      render(<App />);

      expect(await screen.findByTestId("lock-screen")).toBeInTheDocument();
      expect(screen.queryByTestId("main-window")).not.toBeInTheDocument();
    });
  });
});
