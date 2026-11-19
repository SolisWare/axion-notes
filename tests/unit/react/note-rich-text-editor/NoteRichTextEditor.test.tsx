/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NoteRichTextEditor from "../../../../src/components/NoteRichTextEditor";
import { RichTextFormatAction, RichTextFormatCommand } from "../../../../src/types/RichTextFormatCommand";
import { getInactiveRichTextFormatState } from "../../../../src/types/RichTextFormatState";
import { SystemTheme } from "../../../../src/theme/SystemTheme";
import { installDesktopApiMock } from "../../../utils/electron/createDesktopApiMock";

describe("NoteRichTextEditor", () => {
  let menuFormatCallback: ((command: RichTextFormatCommand) => void) | undefined;

  beforeEach(() => {
    menuFormatCallback = undefined;
    Object.defineProperty(document, "elementFromPoint", {
      configurable: true,
      value: () => document.body
    });
    installDesktopApiMock({
      menu: {
        onMenuRichTextFormat: vi.fn((callback) => {
          menuFormatCallback = callback;
          return vi.fn();
        })
      }
    });
  });

  it("initializes from plain text as separate paragraphs", async () => {
    renderEditor({ content: "First line\nSecond line" });
    const editor = await getEditor();
    expect(editor).toHaveTextContent("First line");
    expect(editor).toHaveTextContent("Second line");
    expect(editor.querySelectorAll("p")).toHaveLength(2);
  });

  it("replaces unfocused editor content when its controlled content prop changes", async () => {
    const { rerender } = renderEditor({ content: "Original content" });
    expect(await getEditor()).toHaveTextContent("Original content");

    rerender(createEditorElement({ content: "Replacement content" }));

    await waitFor(async () => expect(await getEditor()).toHaveTextContent("Replacement content"));
  });

  it("applies controlled format actions, reports rich content, and acknowledges the request", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onFormatActionRequestHandled = vi.fn();
    const { rerender } = renderEditor({ content: "Format me", onChange, onFormatActionRequestHandled });
    const editor = await getEditor();

    await selectAllText(user, editor);
    rerender(createEditorElement({
      content: "Format me",
      formatActionRequest: { id: 7, command: RichTextFormatCommand.BOLD },
      onChange,
      onFormatActionRequestHandled
    }));

    await waitFor(() => {
      expect(onFormatActionRequestHandled).toHaveBeenCalledWith(7);
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({
        content: "Format me",
        richContent: expect.objectContaining({ type: "doc" })
      }));
    });
  });

  it.each([
    [RichTextFormatCommand.ITALIC, "em"],
    [RichTextFormatCommand.UNDERLINE, "u"],
    [RichTextFormatCommand.STRIKETHROUGH, "s"],
    [RichTextFormatCommand.HIGHLIGHT, "mark"],
    [RichTextFormatCommand.INLINE_CODE, "code"],
    [RichTextFormatCommand.SUPERSCRIPT, "sup"],
    [RichTextFormatCommand.SUBSCRIPT, "sub"]
  ])("applies %s as an inline document mark", async (command, selector) => {
    const { editor } = await applyControlledFormatAction(command);

    await waitFor(() => expect(editor.querySelector(selector)).toHaveTextContent("Format me"));
  });

  it.each([
    [RichTextFormatCommand.BULLET_LIST, "ul"],
    [RichTextFormatCommand.DASHED_LIST, "ul[data-list-marker-type='dash']"],
    [RichTextFormatCommand.NUMBERED_LIST, "ol"],
    [RichTextFormatCommand.CHECKLIST, "ul[data-type='taskList']"]
  ])("applies %s as a structured document node", async (command, selector) => {
    const { editor } = await applyControlledFormatAction(command);

    await waitFor(() => expect(editor.querySelector(selector)).toHaveTextContent("Format me"));
  });

  it("routes native rich-text commands only to the focused editor", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const editorRender = renderEditor({ content: "Native format", onChange });
    const editor = await getEditor();

    await selectAllText(user, editor);
    act(() => menuFormatCallback?.(RichTextFormatCommand.ITALIC));
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ richContent: expect.any(Object) })));
    const changedCallCount = onChange.mock.calls.length;

    editorRender.unmount();
    act(() => menuFormatCallback?.(RichTextFormatCommand.BOLD));
    expect(onChange).toHaveBeenCalledTimes(changedCallCount);
  });

  it("publishes active formatting on focus and clears it when focus leaves the editor", async () => {
    const user = userEvent.setup();
    const onFormatStateChange = vi.fn();

    renderEditor({ onFormatStateChange });
    await user.click(await getEditor());
    await waitFor(() => expect(onFormatStateChange).toHaveBeenCalledWith(expect.objectContaining({ canFormat: true })));

    act(() => window.dispatchEvent(new Event("blur")));
    await waitFor(() => expect(onFormatStateChange).toHaveBeenLastCalledWith(getInactiveRichTextFormatState()));
  });

  it("focuses from the editor wrapper and announces native font-size commands", async () => {
    renderEditor({ content: "" });
    const editor = await getEditor();
    const wrapper = editor.parentElement?.parentElement;

    if (!wrapper) {
      throw new Error("Could not find the editor wrapper.");
    }

    fireEvent.mouseDown(wrapper);
    await waitFor(() => expect(editor).toHaveClass("ProseMirror-focused"));

    act(() => menuFormatCallback?.(RichTextFormatCommand.INCREASE_FONT_SIZE));
    await waitFor(() => expect(wrapper).toHaveTextContent("16 px"));
  });
});

function renderEditor(overrides: Partial<ComponentProps<typeof NoteRichTextEditor>> = {}) {
  return render(createEditorElement(overrides));
}

function createEditorElement(overrides: Partial<ComponentProps<typeof NoteRichTextEditor>>) {
  return (
    <NoteRichTextEditor
      content="Editor content"
      placeholder="Type here"
      theme={SystemTheme.LIGHT}
      {...overrides}
    />
  );
}

async function getEditor(): Promise<HTMLElement> {
  await waitFor(() => expect(document.querySelector<HTMLElement>(".ProseMirror")).not.toBeNull());
  const editor = document.querySelector<HTMLElement>(".ProseMirror");

  if (!editor) {
    throw new Error("Could not find the rich-text editor.");
  }

  return editor;
}

async function selectAllText(user: ReturnType<typeof userEvent.setup>, editor: HTMLElement) {
  await user.click(editor);
  await user.keyboard("{Control>}a{/Control}");
}

async function applyControlledFormatAction(action: RichTextFormatAction) {
  const user = userEvent.setup();
  const onFormatActionRequestHandled = vi.fn();
  const { rerender } = renderEditor({ content: "Format me", onFormatActionRequestHandled });
  const editor = await getEditor();

  await selectAllText(user, editor);
  rerender(createEditorElement({
    content: "Format me",
    formatActionRequest: { id: 1, command: action },
    onFormatActionRequestHandled
  }));
  await waitFor(() => expect(onFormatActionRequestHandled).toHaveBeenCalledWith(1));

  return { editor };
}
