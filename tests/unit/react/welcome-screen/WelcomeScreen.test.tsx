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
import { beforeEach, describe, expect, it, vi } from "vitest";
import WelcomeScreen from "../../../../src/views/MainWindow/pages/WelcomeScreen";
import { AppTheme } from "../../../../src/theme/AppTheme";
import { SystemTheme } from "../../../../src/theme/SystemTheme";

const { translate } = vi.hoisted(() => {
  const translations: Record<string, string> = {
    "welcomeToApp": "Welcome to Axion Notes",
    "welcomeIntro": "Keep quick thoughts close, tidy, and ready whenever you need them.",
    "getStarted": "Get Started",
    "doNotShowWelcomeAgain": "Do not show this welcome screen again",
    "today": "Today",
    "freshWorkspace": "Fresh workspace",
    "ideas": "Ideas",
    "colorfulNotes": "Colorful notes",
    "next": "Next"
  };

  return {
    translate: vi.fn((key: string) => translations[key] ?? key)
  };
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: translate
  })
}));

describe("WelcomeScreen", () => {
  beforeEach(() => {
    translate.mockClear();
  });

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

  describe("API integration boundary", () => {
    it("does not require the desktop API to render", () => {
      expectWithoutDesktopApiAccess(() => {
        renderWelcomeScreen();
      });

      expect(screen.getByRole("heading", { name: "Welcome to Axion Notes" })).toBeInTheDocument();
    });

    it("delegates onboarding through props instead of calling the desktop API directly", async () => {
      const user = userEvent.setup();
      const onGetStarted = vi.fn();

      await expectWithoutDesktopApiAccess(async () => {
        renderWelcomeScreen({ onGetStarted });

        await user.click(screen.getByRole("button", { name: /get started/i }));
      });

      expect(onGetStarted).toHaveBeenCalledOnce();
    });
  });

  describe("browser and Electron behavior", () => {
    it("renders the core welcome content in browser mode", () => {
      withoutDesktopApi(() => {
        renderWelcomeScreen();
      });

      expect(screen.getByRole("heading", { name: "Welcome to Axion Notes" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /get started/i })).toBeInTheDocument();
    });

    it("renders the core welcome content when the Electron API is available", () => {
      withDesktopApi(() => {
        renderWelcomeScreen();
      });

      expect(screen.getByRole("heading", { name: "Welcome to Axion Notes" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /get started/i })).toBeInTheDocument();
    });
  });

  describe("localization", () => {
    it("requests the expected welcome translation keys", () => {
      renderWelcomeScreen();

      expect(translate).toHaveBeenCalledWith("welcomeToApp");
      expect(translate).toHaveBeenCalledWith("welcomeIntro");
      expect(translate).toHaveBeenCalledWith("getStarted");
      expect(translate).toHaveBeenCalledWith("doNotShowWelcomeAgain");
      expect(translate).toHaveBeenCalledWith("today");
      expect(translate).toHaveBeenCalledWith("freshWorkspace");
      expect(translate).toHaveBeenCalledWith("ideas");
      expect(translate).toHaveBeenCalledWith("colorfulNotes");
      expect(translate).toHaveBeenCalledWith("next");
    });
  });

  describe("accessibility", () => {
    it("renders a single accessible welcome heading", () => {
      renderWelcomeScreen();

      expect(screen.getByRole("heading", {
        level: 2,
        name: "Welcome to Axion Notes"
      })).toBeInTheDocument();
      expect(screen.getAllByRole("heading")).toHaveLength(1);
    });

    it("gives interactive controls accessible names", () => {
      renderWelcomeScreen();

      expect(screen.getByRole("button", { name: /get started/i })).toBeInTheDocument();
      expect(screen.getByRole("checkbox", { name: "Do not show this welcome screen again" })).toBeInTheDocument();
    });

    it("allows keyboard focus to reach the welcome actions", async () => {
      const user = userEvent.setup();

      renderWelcomeScreen();

      await user.tab();
      expect(screen.getByRole("button", { name: /get started/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole("checkbox", { name: "Do not show this welcome screen again" })).toHaveFocus();
    });

    it("marks the note preview as decorative", () => {
      renderWelcomeScreen();

      expect(screen.getByText("Today").closest("[aria-hidden='true']")).not.toBeNull();
      expect(screen.getByText("Ideas").closest("[aria-hidden='true']")).not.toBeNull();
      expect(screen.getByText("Next").closest("[aria-hidden='true']")).not.toBeNull();
    });
  });

  describe("layout and style contract", () => {
    it("renders the welcome screen as a section with a content container", () => {
      const { container } = renderWelcomeScreen();
      const root = container.querySelector("section");

      expect(root).not.toBeNull();
      expect(root?.firstElementChild).not.toBeNull();
    });

    it("renders the primary action as a contained branded button", () => {
      renderWelcomeScreen();

      expect(screen.getByRole("button", { name: /get started/i })).toHaveClass("MuiButton-contained");
    });

    it("keeps the note preview separate from the main welcome copy", () => {
      renderWelcomeScreen();

      const preview = screen.getByText("Today").closest("[aria-hidden='true']");

      expect(preview).not.toBeNull();
      expect(preview).toContainElement(screen.getByText("Fresh workspace"));
      expect(preview).toContainElement(screen.getByText("Ideas"));
      expect(preview).toContainElement(screen.getByText("Next"));
    });
  });
});

function renderWelcomeScreen(props?: Partial<ComponentProps<typeof WelcomeScreen>>) {
  return render(
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

async function expectWithoutDesktopApiAccess(action: () => void | Promise<void>) {
  const originalDesktopApiDescriptor = Object.getOwnPropertyDescriptor(window, "api");

  Object.defineProperty(window, "api", {
    configurable: true,
    get: () => {
      throw new Error("WelcomeScreen should not access window.api directly.");
    }
  });

  try {
    await action();
  } finally {
    if (originalDesktopApiDescriptor) {
      Object.defineProperty(window, "api", originalDesktopApiDescriptor);
    } else {
      Object.defineProperty(window, "api", {
        configurable: true,
        value: undefined
      });
    }
  }
}

function withoutDesktopApi(action: () => void) {
  const originalDesktopApiDescriptor = Object.getOwnPropertyDescriptor(window, "api");

  Object.defineProperty(window, "api", {
    configurable: true,
    value: undefined
  });

  try {
    action();
  } finally {
    if (originalDesktopApiDescriptor) {
      Object.defineProperty(window, "api", originalDesktopApiDescriptor);
    }
  }
}

function withDesktopApi(action: () => void) {
  const originalDesktopApiDescriptor = Object.getOwnPropertyDescriptor(window, "api");

  Object.defineProperty(window, "api", {
    configurable: true,
    value: {}
  });

  try {
    action();
  } finally {
    if (originalDesktopApiDescriptor) {
      Object.defineProperty(window, "api", originalDesktopApiDescriptor);
    } else {
      Object.defineProperty(window, "api", {
        configurable: true,
        value: undefined
      });
    }
  }
}
