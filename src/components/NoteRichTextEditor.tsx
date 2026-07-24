/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { BulletList } from "@tiptap/extension-bullet-list";
import FontFamily from "@tiptap/extension-font-family";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { FontSize, TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { Editor, JSONContent } from "@tiptap/core";
import { CSSProperties, MouseEvent, useEffect, useMemo, useRef } from "react";
import { TiptapDocument } from "../models/NoteType";
import { RichTextFormatAction, RichTextFormatCommand } from "../models/RichTextFormatCommand";
import { getInactiveRichTextFormatState, RichTextFormatState } from "../models/RichTextFormatState";
import { getNoteFontFamily, getNoteFontPreferenceByFontFamily, NoteFontPreference } from "../settings/NoteFontPreference";
import { DEFAULT_NOTE_CONTENT_FONT_SIZE, NOTE_CONTENT_FONT_SIZE_OPTIONS, NoteFontSize } from "../settings/NoteFontSize";
import { getAppColors } from "../theme/AppColors";
import { SystemTheme } from "../theme/SystemTheme";
import styles from "./NoteRichTextEditor.module.css";

const NOTE_TEXTAREA_DEFAULT_FONT_FAMILY = "monospace";
const BULLET_LIST_MARKER_TYPE_ATTRIBUTE = "listMarkerType";
const BULLET_LIST_MARKER_TYPE_BULLET = "bullet";
const BULLET_LIST_MARKER_TYPE_DASH = "dash";
let focusedEditorId: string | null = null;

const MarkerBulletList = BulletList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      [BULLET_LIST_MARKER_TYPE_ATTRIBUTE]: {
        default: BULLET_LIST_MARKER_TYPE_BULLET,
        parseHTML: (element: HTMLElement) => (
          element.getAttribute("data-list-marker-type") === BULLET_LIST_MARKER_TYPE_DASH
            ? BULLET_LIST_MARKER_TYPE_DASH
            : BULLET_LIST_MARKER_TYPE_BULLET
        ),
        renderHTML: (attributes: Record<string, string>) => (
          attributes[BULLET_LIST_MARKER_TYPE_ATTRIBUTE] === BULLET_LIST_MARKER_TYPE_DASH
            ? { "data-list-marker-type": BULLET_LIST_MARKER_TYPE_DASH }
            : {}
        )
      }
    };
  }
});

type NoteRichTextEditorChange = {
  content: string;
  richContent?: TiptapDocument;
};

type NoteRichTextEditorProps = {
  theme?: SystemTheme;
  fontFamily?: string;
  fontSize?: NoteFontSize;
  placeholder: string;
  content: string;
  richContent?: TiptapDocument;
  formatActionRequest?: RichTextFormatActionRequest | null;
  onChange?: (change: NoteRichTextEditorChange) => void;
  onFormatStateChange?: (state: RichTextFormatState) => void;
  onFormatActionRequestHandled?: (requestId: number) => void;
};

export type RichTextFormatActionRequest = {
  id: number;
  command: RichTextFormatAction;
};

function getPlainTextDocument(content: string): TiptapDocument {
  return {
    type: "doc",
    content: content.split(/\r?\n/).map((line) => ({
      type: "paragraph",
      content: line.length > 0
        ? [{
          type: "text",
          text: line
        }]
        : undefined
    }))
  };
}

function hasRichFormatting(content: JSONContent): boolean {
  if (content.marks && content.marks.length > 0) {
    return true;
  }

  if (content.type && !["doc", "paragraph", "text"].includes(content.type)) {
    return true;
  }

  return content.content?.some(hasRichFormatting) ?? false;
}

function getNoteFontSizePreference(fontSize: string | undefined): NoteFontSize | undefined {
  if (!fontSize) {
    return undefined;
  }

  const parsedFontSize = Number.parseFloat(fontSize);

  return NOTE_CONTENT_FONT_SIZE_OPTIONS.find((fontSizeOption) => fontSizeOption === parsedFontSize);
}

function getFormatState(editor: Editor) {
  const bulletListAttributes = {
    [BULLET_LIST_MARKER_TYPE_ATTRIBUTE]: BULLET_LIST_MARKER_TYPE_BULLET
  };
  const dashedListAttributes = {
    [BULLET_LIST_MARKER_TYPE_ATTRIBUTE]: BULLET_LIST_MARKER_TYPE_DASH
  };
  const textStyleAttributes = editor.getAttributes("textStyle");
  const activeFontFamily = textStyleAttributes.fontFamily;

  return {
    canFormat: true,
    isBoldActive: editor.isActive("bold"),
    isItalicActive: editor.isActive("italic"),
    isUnderlineActive: editor.isActive("underline"),
    isStrikethroughActive: editor.isActive("strike"),
    isSuperscriptActive: editor.isActive("superscript"),
    isSubscriptActive: editor.isActive("subscript"),
    isBulletListActive: editor.isActive("bulletList", bulletListAttributes),
    isDashedListActive: editor.isActive("bulletList", dashedListAttributes),
    isNumberedListActive: editor.isActive("orderedList"),
    isChecklistActive: editor.isActive("taskList"),
    activeFontSize: getNoteFontSizePreference(textStyleAttributes.fontSize),
    activeFont: getNoteFontPreferenceByFontFamily(activeFontFamily)
  };
}

function clearFocusedFormatState(editorId: string) {
  if (focusedEditorId !== editorId) {
    return;
  }

  focusedEditorId = null;
  window.api.menu.setRichTextFormatState(getInactiveRichTextFormatState());
}

function getRichTextFormatCommand(action: RichTextFormatAction): RichTextFormatCommand {
  return typeof action === "string" ? action : action.command;
}

function applyRichTextFormatCommand(editor: Editor, action: RichTextFormatAction) {
  const command = getRichTextFormatCommand(action);
  const commandChain = editor.chain().focus();

  switch (command) {
    case RichTextFormatCommand.BOLD:
      commandChain.toggleBold().run();
      break;
    case RichTextFormatCommand.ITALIC:
      commandChain.toggleItalic().run();
      break;
    case RichTextFormatCommand.UNDERLINE:
      commandChain.toggleUnderline().run();
      break;
    case RichTextFormatCommand.STRIKETHROUGH:
      commandChain.toggleStrike().run();
      break;
    case RichTextFormatCommand.SUPERSCRIPT:
      editor.chain().focus().unsetSubscript().toggleSuperscript().run();
      break;
    case RichTextFormatCommand.SUBSCRIPT:
      editor.chain().focus().unsetSuperscript().toggleSubscript().run();
      break;
    case RichTextFormatCommand.BULLET_LIST:
      toggleBulletList(editor, BULLET_LIST_MARKER_TYPE_BULLET);
      break;
    case RichTextFormatCommand.DASHED_LIST:
      toggleBulletList(editor, BULLET_LIST_MARKER_TYPE_DASH);
      break;
    case RichTextFormatCommand.NUMBERED_LIST:
      commandChain.toggleOrderedList().run();
      break;
    case RichTextFormatCommand.CHECKLIST:
      commandChain.toggleTaskList().run();
      break;
    case RichTextFormatCommand.FONT_SIZE:
      if (typeof action === "string" || action.fontSize === DEFAULT_NOTE_CONTENT_FONT_SIZE) {
        commandChain.unsetFontSize().run();
        break;
      }

      commandChain.setFontSize(`${action.fontSize}px`).run();
      break;
    case RichTextFormatCommand.FONT_FAMILY:
      if (typeof action === "string" || action.noteFont === NoteFontPreference.SYSTEM) {
        commandChain.unsetFontFamily().run();
        break;
      }

      commandChain.setFontFamily(getNoteFontFamily(action.noteFont) ?? "").run();
      break;
  }
}

function toggleBulletList(editor: Editor, listMarkerType: string) {
  const listMarkerTypeAttributes = {
    [BULLET_LIST_MARKER_TYPE_ATTRIBUTE]: listMarkerType
  };

  if (!editor.isActive("bulletList")) {
    editor
      .chain()
      .focus()
      .toggleBulletList()
      .updateAttributes("bulletList", listMarkerTypeAttributes)
      .run();
    return;
  }

  if (editor.isActive("bulletList", listMarkerTypeAttributes)) {
    editor.chain().focus().toggleBulletList().run();
    return;
  }

  editor.chain().focus().updateAttributes("bulletList", listMarkerTypeAttributes).run();
}

function publishFormatState(editor: Editor, onFormatStateChange?: (state: RichTextFormatState) => void) {
  const formatState = getFormatState(editor);
  window.api.menu.setRichTextFormatState(formatState);
  onFormatStateChange?.(formatState);
}

function NoteRichTextEditor(props: NoteRichTextEditorProps) {
  const editorId = useMemo(() => crypto.randomUUID(), []);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const {
    formatActionRequest,
    onChange,
    onFormatActionRequestHandled,
    onFormatStateChange
  } = props;
  const appColors = getAppColors(props.theme ?? SystemTheme.LIGHT);
  const editorStyle = {
    "--note-rich-text-color": appColors.NOTE_TEXT,
    "--note-rich-text-font-family": props.fontFamily ?? NOTE_TEXTAREA_DEFAULT_FONT_FAMILY,
    "--note-rich-text-font-size": `${props.fontSize ?? DEFAULT_NOTE_CONTENT_FONT_SIZE}px`,
    "--note-rich-text-placeholder-color": appColors.NOTE_PLACEHOLDER_TEXT
  } as CSSProperties;
  
  const editorContent = useMemo(() => props.richContent ?? getPlainTextDocument(props.content), [props.content, props.richContent]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: false,
        bulletList: false,
        code: false,
        codeBlock: false,
        heading: false,
        horizontalRule: false,
        underline: false
      }),
      MarkerBulletList,
      TaskList,
      TaskItem.configure({
        nested: true
      }),
      TextStyle,
      FontSize,
      FontFamily,
      Superscript,
      Subscript,
      Underline,
      Placeholder.configure({
        placeholder: props.placeholder
      })
    ],
    content: editorContent,
    editorProps: {
      attributes: {
        class: styles.editorSurface
      }
    },
    onFocus: ({ editor }) => {
      focusedEditorId = editorId;
      publishFormatState(editor, onFormatStateChange);
    },
    onSelectionUpdate: ({ editor }) => {
      if (focusedEditorId !== editorId) {
        return;
      }

      publishFormatState(editor, onFormatStateChange);
    },
    onUpdate: ({ editor }) => {
      const richContent = editor.getJSON();

      if (focusedEditorId === editorId) {
        publishFormatState(editor, onFormatStateChange);
      }

      onChange?.({
        content: editor.getText({ blockSeparator: "\n" }),
        richContent: hasRichFormatting(richContent) ? richContent : undefined
      });
    }
  });

  useEffect(() => {
    if (!editor || editor.isFocused) {
      return;
    }

    editor.commands.setContent(editorContent, { emitUpdate: false });
  }, [editor, editorContent]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    function handleDocumentFocusOrMouseDown(event: FocusEvent | globalThis.MouseEvent) {
      const target = event.target instanceof Element ? event.target : null;

      if (
        target
        && (
          wrapperRef.current?.contains(target)
          || target.closest("[data-note-format-toolbar]")
          || target.closest("[data-note-context-menu]")
        )
      ) {
        return;
      }

      clearFocusedFormatState(editorId);
      onFormatStateChange?.(getInactiveRichTextFormatState());
    }

    document.addEventListener("focusin", handleDocumentFocusOrMouseDown, true);
    document.addEventListener("mousedown", handleDocumentFocusOrMouseDown, true);

    return () => {
      document.removeEventListener("focusin", handleDocumentFocusOrMouseDown, true);
      document.removeEventListener("mousedown", handleDocumentFocusOrMouseDown, true);
    };
  }, [editor, editorId, onFormatStateChange]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    function handleWindowFocus() {
      if (editor?.isFocused && focusedEditorId === editorId) {
        publishFormatState(editor, onFormatStateChange);
      }
    }

    function handleWindowBlur() {
      clearFocusedFormatState(editorId);
      onFormatStateChange?.(getInactiveRichTextFormatState());
    }

    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [editor, editorId, onFormatStateChange]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setOptions({
      editorProps: {
        attributes: {
          class: styles.editorSurface
        }
      }
    });
  }, [editor]);

  useEffect(() => {
    return window.api.menu.onMenuRichTextFormat((command) => {
      if (!editor || focusedEditorId !== editorId) {
        return;
      }

      applyRichTextFormatCommand(editor, command);
      publishFormatState(editor, onFormatStateChange);
    });
  }, [editor, editorId, onFormatStateChange]);

  useEffect(() => {
    if (!editor || !formatActionRequest) {
      return;
    }

    focusedEditorId = editorId;
    applyRichTextFormatCommand(editor, formatActionRequest.command);
    publishFormatState(editor, onFormatStateChange);
    onFormatActionRequestHandled?.(formatActionRequest.id);
  }, [editor, editorId, formatActionRequest, onFormatActionRequestHandled, onFormatStateChange]);

  useEffect(() => {
    return () => {
      clearFocusedFormatState(editorId);
      onFormatStateChange?.(getInactiveRichTextFormatState());
    };
  }, [editorId, onFormatStateChange]);

  function handleWrapperMouseDown(event: MouseEvent<HTMLDivElement>) {
    if (!editor || (event.target instanceof Element && event.target.closest(".ProseMirror"))) {
      return;
    }

    event.preventDefault();
    focusedEditorId = editorId;
    editor.commands.focus(editor.isEmpty ? "start" : "end");
  }

  return (
    <div className={styles.wrapper} onMouseDown={handleWrapperMouseDown} ref={wrapperRef} style={editorStyle}>
      <EditorContent className={styles.editor} editor={editor} />
    </div>
  );
}

export default NoteRichTextEditor;
