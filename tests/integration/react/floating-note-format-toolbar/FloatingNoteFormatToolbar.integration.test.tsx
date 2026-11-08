/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FloatingNoteFormatToolbar from "../../../../src/components/FloatingNoteFormatToolbar";
import NoteRichTextEditor from "../../../../src/components/NoteRichTextEditor";
import { RichTextFormatAction } from "../../../../src/types/RichTextFormatCommand";
import { getInactiveRichTextFormatState, RichTextFormatState } from "../../../../src/types/RichTextFormatState";
import { SystemTheme } from "../../../../src/theme/SystemTheme";
import { installDesktopApiMock } from "../../../utils/electron/createDesktopApiMock";

const { translate } = vi.hoisted(() => ({
  translate: vi.fn((key: string) => key)
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: translate
  })
}));

describe("FloatingNoteFormatToolbar integration", () => {
  beforeEach(() => {
    installDesktopApiMock();
    translate.mockClear();
    Object.defineProperty(document, "elementFromPoint", {
      configurable: true,
      value: () => document.body
    });
  });

  it("opens its compact format menu and applies bold formatting to the preserved editor selection", async () => {
    const user = userEvent.setup();

    renderFloatingNoteFormatToolbar();
    await selectEditorText(user);

    await user.click(screen.getByRole("button", { name: "format" }));
    await user.click(screen.getByRole("button", { name: "formatting.bold" }));

    await expectRichContentToContain('"type":"bold"');
    expect(screen.queryByRole("button", { name: "formatting.bold" })).not.toBeInTheDocument();
  });

  it("applies a selected font size through the floating toolbar", async () => {
    const user = userEvent.setup();

    renderFloatingNoteFormatToolbar();
    await selectEditorText(user);

    await user.click(screen.getByRole("button", { name: "formatting.fontSize" }));
    await user.click(screen.getByRole("menuitem", { name: "20" }));

    await expectRichContentToContain('"fontSize":"20px"');
  });
});

function FloatingRichTextToolbar() {
  const [formatState, setFormatState] = useState<RichTextFormatState>(getInactiveRichTextFormatState);
  const [formatActionRequest, setFormatActionRequest] = useState<{ id: number; command: RichTextFormatAction } | null>(null);
  const [lastRichContent, setLastRichContent] = useState("");

  return (
    <>
      <FloatingNoteFormatToolbar
        formatState={formatState}
        surfaceColor="#fff7a8"
        theme={SystemTheme.LIGHT}
        onFormatAction={(command) => {
          setFormatActionRequest({
            command,
            id: Date.now()
          });
        }}
      />
      <NoteRichTextEditor
        content="Axion Notes"
        formatActionRequest={formatActionRequest}
        placeholder="Type here"
        theme={SystemTheme.LIGHT}
        onChange={(change) => setLastRichContent(JSON.stringify(change.richContent))}
        onFormatActionRequestHandled={() => setFormatActionRequest(null)}
        onFormatStateChange={setFormatState}
      />
      <output aria-label="Rich content">{lastRichContent}</output>
    </>
  );
}

function renderFloatingNoteFormatToolbar() {
  return render(<FloatingRichTextToolbar />);
}

async function selectEditorText(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  const editor = document.querySelector<HTMLElement>(".ProseMirror");

  if (!editor) {
    throw new Error("Could not find the rich-text editor.");
  }

  await user.click(editor);
  await user.keyboard("{Control>}a{/Control}");
}

async function expectRichContentToContain(expectedValue: string): Promise<void> {
  await waitFor(() => {
    expect(screen.getByRole("status", { name: "Rich content" })).toHaveTextContent(expectedValue);
  });
}
