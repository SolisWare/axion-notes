/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { Dialog, DialogContent } from "@mui/material";
import { AppSettings } from "../settings/AppSettings";
import { SystemTheme } from "../theme/SystemTheme";
import NoteWindow from "../views/NoteWindow/NoteWindow";
import styles from "./WebNoteWindowDialog.module.css";

type WebNoteWindowDialogProps = {
  appSettings: AppSettings;
  noteId: string | null;
  open: boolean;
  theme: SystemTheme;
  onClose: () => void;
  onOpenNote: (noteId: string) => void;
};

function WebNoteWindowDialog(props: WebNoteWindowDialogProps) {
  const shouldRenderNoteWindow = props.open && props.noteId !== null;

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      maxWidth={false}
      disableRestoreFocus
      PaperProps={{
        className: styles.dialogPaper
      }}
    >
      <DialogContent className={styles.content}>
        {shouldRenderNoteWindow && (
          <NoteWindow
            appSettings={props.appSettings}
            embedded
            noteId={props.noteId}
            theme={props.theme}
            onClose={props.onClose}
            onOpenNote={props.onOpenNote}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

export default WebNoteWindowDialog;
