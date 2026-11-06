/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EmptyNoteList from "../../../../src/components/EmptyNoteList";
import { SystemTheme } from "../../../../src/theme/SystemTheme";
import { installDesktopApiMock } from "../../../utils/electron/createDesktopApiMock";

const translate = vi.fn((key: string, values?: Record<string, string>) => {
  const translations: Record<string, string> = {
    addFirstNotePrompt: `Press ${values?.shortcut} to add your first note`,
    noNotesYet: "You don't have any notes yet!",
    notTheNotesYouAreLookingFor: "Nothing to see here. These are not the notes you are looking for.",
    passwordProtected: `${values?.appName} is password protected.`
  };

  return translations[key] ?? key;
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: translate })
}));

describe("EmptyNoteList", () => {
  beforeEach(() => {
    translate.mockClear();
  });

  it("exposes the normal empty state as a labelled polite live region", () => {
    installDesktopApiMock({ os: { isMac: false } });

    render(<EmptyNoteList theme={SystemTheme.LIGHT} />);

    const title = screen.getByRole("heading", { level: 2, name: "You don't have any notes yet!" });
    const region = screen.getByRole("region", { name: "You don't have any notes yet!" });

    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveAttribute("aria-atomic", "true");
    expect(screen.getByText("Press Ctrl+N to add your first note")).toHaveProperty("tagName", "P");
    expect(title).toBeInTheDocument();
    expect(translate).toHaveBeenCalledWith("addFirstNotePrompt", { shortcut: "Ctrl+N" });
  });

  it("uses the macOS shortcut in the normal empty state", () => {
    installDesktopApiMock({ os: { isMac: true } });

    render(<EmptyNoteList theme={SystemTheme.LIGHT} />);

    expect(screen.getByText("Press Cmd+N to add your first note")).toBeInTheDocument();
    expect(translate).toHaveBeenCalledWith("addFirstNotePrompt", { shortcut: "Cmd+N" });
  });

  it("announces the privacy-safe locked variant without a note-creation shortcut", () => {
    installDesktopApiMock({ os: { isMac: false } });

    render(<EmptyNoteList isLocked theme={SystemTheme.DARK} />);

    expect(screen.getByRole("heading", { level: 2, name: "Axion Notes is password protected." })).toBeInTheDocument();
    expect(screen.getByText("Nothing to see here. These are not the notes you are looking for.")).toBeInTheDocument();
    expect(screen.queryByText(/Press .*\+N to add your first note/)).not.toBeInTheDocument();
    expect(translate).toHaveBeenCalledWith("passwordProtected", { appName: "Axion Notes" });
  });
});
