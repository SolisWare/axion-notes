/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import WelcomeScreen from "../../../../src/views/MainWindow/pages/WelcomeScreen";
import { AppTheme } from "../../../../src/theme/AppTheme";
import { SystemTheme } from "../../../../src/theme/SystemTheme";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "mainWindow.welcome.title": "Welcome to Axion Notes",
        "mainWindow.welcome.intro": "Keep quick thoughts close, tidy, and ready whenever you need them.",
        "mainWindow.welcome.getStarted": "Get Started",
        "mainWindow.welcome.doNotShowAgain": "Do not show this welcome screen again",
        "mainWindow.welcome.preview.today": "Today",
        "mainWindow.welcome.preview.freshWorkspace": "Fresh workspace",
        "mainWindow.welcome.preview.ideas": "Ideas",
        "mainWindow.welcome.preview.colorfulNotes": "Colorful notes",
        "mainWindow.welcome.preview.next": "Next"
      };

      return translations[key] ?? key;
    }
  })
}));

describe("WelcomeScreen", () => {
  
  describe("basic rendering", () => {
    it("renders the welcome content", () => {
      renderWelcomeScreen();

      expect(screen.getByRole("heading", { name: "Welcome to Axion Notes" })).toBeInTheDocument();
      expect(screen.getByText("Keep quick thoughts close, tidy, and ready whenever you need them.")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /get started/i })).toBeInTheDocument();
      expect(screen.getByLabelText("Do not show this welcome screen again")).toBeInTheDocument();
    });

    it("renders the note preview content", () => {
      renderWelcomeScreen();

      expect(screen.getByText("Today")).toBeInTheDocument();
      expect(screen.getByText("Fresh workspace")).toBeInTheDocument();
      expect(screen.getByText("Ideas")).toBeInTheDocument();
      expect(screen.getByText("Colorful notes")).toBeInTheDocument();
      expect(screen.getByText("Next")).toBeInTheDocument();
    });
  });

  describe("initial state", () => {
    it("renders the initial interactive state", () => {
      renderWelcomeScreen();

      expect(screen.getByRole("button", { name: /get started/i })).toBeEnabled();
      expect(screen.getByLabelText("Do not show this welcome screen again")).not.toBeChecked();
    });

    it("reflects an enabled never-show-again preference", () => {
      renderWelcomeScreen({ neverShowAgain: true });

      expect(screen.getByLabelText("Do not show this welcome screen again")).toBeChecked();
    });
  });

  describe("get started action", () => {
    it("calls the get-started handler when the primary button is clicked", async () => {
      const user = userEvent.setup();
      const onGetStarted = vi.fn();

      renderWelcomeScreen({ onGetStarted });

      await user.click(screen.getByRole("button", { name: /get started/i }));

      expect(onGetStarted).toHaveBeenCalledOnce();
    });

    it("calls the get-started handler when the focused primary button is activated with Enter", async () => {
      const user = userEvent.setup();
      const onGetStarted = vi.fn();

      renderWelcomeScreen({ onGetStarted });

      screen.getByRole("button", { name: /get started/i }).focus();
      await user.keyboard("{Enter}");

      expect(onGetStarted).toHaveBeenCalledOnce();
    });

    it("calls the get-started handler when the focused primary button is activated with Space", async () => {
      const user = userEvent.setup();
      const onGetStarted = vi.fn();

      renderWelcomeScreen({ onGetStarted });

      screen.getByRole("button", { name: /get started/i }).focus();
      await user.keyboard(" ");

      expect(onGetStarted).toHaveBeenCalledOnce();
    });
  });
});

function renderWelcomeScreen(props?: Partial<ComponentProps<typeof WelcomeScreen>>) {
  render(
    <ThemeProvider theme={AppTheme.LightTheme}>
      <WelcomeScreen
        theme={SystemTheme.LIGHT}
        neverShowAgain={false}
        onGetStarted={vi.fn()}
        {...props}
      />
    </ThemeProvider>
  );
}
