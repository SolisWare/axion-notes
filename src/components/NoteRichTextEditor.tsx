/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { JSONContent } from "@tiptap/core";
import { CSSProperties, MouseEvent, useEffect, useMemo } from "react";
import { TiptapDocument } from "../models/NoteType";
import { getAppColors } from "../theme/AppColors";
import { SystemTheme } from "../theme/SystemTheme";
import styles from "./NoteRichTextEditor.module.css";

const NOTE_TEXTAREA_DEFAULT_FONT_FAMILY = "monospace";

type NoteRichTextEditorChange = {
  content: string;
  richContent?: TiptapDocument;
};

type NoteRichTextEditorProps = {
  theme?: SystemTheme;
  fontFamily?: string;
  placeholder: string;
  content: string;
  richContent?: TiptapDocument;
  onChange?: (change: NoteRichTextEditorChange) => void;
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

  return content.content?.some(hasRichFormatting) ?? false;
}

function NoteRichTextEditor(props: NoteRichTextEditorProps) {
  const appColors = getAppColors(props.theme ?? SystemTheme.LIGHT);
  const editorStyle = {
    "--note-rich-text-color": appColors.NOTE_TEXT,
    "--note-rich-text-font-family": props.fontFamily ?? NOTE_TEXTAREA_DEFAULT_FONT_FAMILY,
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
        listItem: false,
        orderedList: false
      }),
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
    onUpdate: ({ editor }) => {
      const richContent = editor.getJSON();

      props.onChange?.({
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

    editor.setOptions({
      editorProps: {
        attributes: {
          class: styles.editorSurface
        }
      }
    });
  }, [editor]);

  function handleWrapperMouseDown(event: MouseEvent<HTMLDivElement>) {
    if (!editor || (event.target instanceof Element && event.target.closest(".ProseMirror"))) {
      return;
    }

    event.preventDefault();
    editor.commands.focus(editor.isEmpty ? "start" : "end");
  }

  return (
    <div className={styles.wrapper} onMouseDown={handleWrapperMouseDown} style={editorStyle}>
      <EditorContent className={styles.editor} editor={editor} />
    </div>
  );
}

export default NoteRichTextEditor;
