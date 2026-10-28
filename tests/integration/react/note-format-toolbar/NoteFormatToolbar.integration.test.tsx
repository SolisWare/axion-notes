/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 *
 * @author Michael Polowczuk
 */
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NoteFormatToolbar from "../../../../src/components/NoteFormatToolbar";
import NoteRichTextEditor from "../../../../src/components/NoteRichTextEditor";
import { RichTextFormatAction } from "../../../../src/models/RichTextFormatCommand";
import { getInactiveRichTextFormatState, RichTextFormatState } from "../../../../src/models/RichTextFormatState";
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

describe("NoteFormatToolbar integration", () => {
  beforeEach(() => {
    installDesktopApiMock();
    translate.mockClear();
    Object.defineProperty(document, "elementFromPoint", {
      configurable: true,
      value: () => document.body
    });
  });

  it("preserves the editor selection and applies bold formatting through the toolbar", async () => {
    const user = userEvent.setup();

    renderRichTextToolbar();
    await selectEditorText(user);
    await user.click(screen.getByRole("button", { name: "formatting.bold" }));

    await expectRichContentToContain('"type":"bold"');
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "formatting.bold" })).toHaveAttribute("aria-pressed", "true");
    });
  });

  it("applies a selected font size to the editor document", async () => {
    const user = userEvent.setup();

    renderRichTextToolbar();
    await selectEditorText(user);
    await user.click(screen.getByRole("button", { name: "formatting.fontSize" }));
    await user.click(screen.getByRole("menuitem", { name: "20" }));

    await expectRichContentToContain('"fontSize":"20px"');
    expect(screen.getByRole("button", { name: "formatting.fontSize" })).toHaveTextContent("20");
  });

  it("converts the selected paragraph to a dashed list through the toolbar", async () => {
    const user = userEvent.setup();

    renderRichTextToolbar();
    await selectEditorText(user);
    await user.click(screen.getByRole("button", { name: "formatting.dashedList" }));

    await expectRichContentToContain('"listMarkerType":"dash"');
  });
});

function RichTextToolbar() {
  const [formatState, setFormatState] = useState<RichTextFormatState>(getInactiveRichTextFormatState);
  const [formatActionRequest, setFormatActionRequest] = useState<{ id: number; command: RichTextFormatAction } | null>(null);
  const [lastRichContent, setLastRichContent] = useState("");

  return (
    <>
      <NoteFormatToolbar
        formatState={formatState}
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

function renderRichTextToolbar() {
  return render(<RichTextToolbar />);
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
