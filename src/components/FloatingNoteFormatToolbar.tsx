/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { RichTextFormatAction } from "../models/RichTextFormatCommand";
import { RichTextFormatState } from "../models/RichTextFormatState";
import { SystemTheme } from "../theme/SystemTheme";
import NoteFormatToolbar from "./NoteFormatToolbar";
import styles from "./FloatingNoteFormatToolbar.module.css";

type FloatingNoteFormatToolbarProps = {
  theme: SystemTheme;
  formatState: RichTextFormatState;
  surfaceColor: string;
  onFormatAction: (command: RichTextFormatAction) => void;
};

function FloatingNoteFormatToolbar(props: FloatingNoteFormatToolbarProps) {
  if (!props.formatState.canFormat) {
    return null;
  }

  return (
    <div className={styles.floatingToolbar}>
      <NoteFormatToolbar
        className={styles.toolbar}
        theme={props.theme}
        formatState={props.formatState}
        surfaceColor={props.surfaceColor}
        onFormatAction={props.onFormatAction}
        compactInlineStyles
      />
    </div>
  );
}

export default FloatingNoteFormatToolbar;
