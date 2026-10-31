/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { CSSProperties, useEffect, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent } from "@mui/material";
import { useTranslation } from "react-i18next";
import SettingsWindow from "../views/SettingsWindow/SettingsWindow";
import { getAppColors } from "../theme/AppColors";
import { SystemTheme } from "../theme/SystemTheme";
import { AppSettings } from "../settings/AppSettings";
import AppToast from "./AppToast";
import { getNotesResortedMessage } from "../settings/noteSortOrder";
import styles from "./WebSettingsDialog.module.css";

type WebSettingsDialogProps = {
  theme: SystemTheme;
  appSettings: AppSettings;
  open: boolean;
  onClose: () => void;
  onAppSettingsChange: (settings: AppSettings) => void;
};

function WebSettingsDialog(props: WebSettingsDialogProps) {
  const { t } = useTranslation();
  const [toastMessage, setToastMessage] = useState("");
  const appColors = getAppColors(props.theme);
  const themeVariables = {
    "--settings-dialog-background": appColors.SETTINGS_CONTENT_BACKGROUND,
    "--settings-dialog-sidebar-background": appColors.SETTINGS_SIDEBAR_BACKGROUND,
    "--settings-dialog-divider": appColors.SETTINGS_DIVIDER
  } as CSSProperties;

  function handleResortNotes() {
    window.api.noteSort.requestSort();
  }

  useEffect(() => {
    if (!props.open) {
      return;
    }

    return window.api.noteSort.onSortApplied(() => {
      setToastMessage(getNotesResortedMessage(t, props.appSettings.notesSortOrder));
    });
  }, [props.appSettings.notesSortOrder, props.open, t]);

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      maxWidth={false}
      PaperProps={{
        className: styles.dialogPaper,
        style: themeVariables
      }}
    >
      <DialogContent className={styles.content}>
        <SettingsWindow
          theme={props.theme}
          appSettings={props.appSettings}
          embedded
          onResortNotes={handleResortNotes}
          onAppSettingsChange={props.onAppSettingsChange}
        />
      </DialogContent>
      <DialogActions className={styles.actions}>
        <Button onClick={props.onClose} variant="contained">
          {t("close")}
        </Button>
      </DialogActions>
      <AppToast message={toastMessage} open={Boolean(toastMessage)} theme={props.theme} onClose={() => setToastMessage("")} />
    </Dialog>
  );
}

export default WebSettingsDialog;
