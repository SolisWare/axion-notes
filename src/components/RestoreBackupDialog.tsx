/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { useEffect, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControlLabel, Radio, RadioGroup } from "@mui/material";
import { useTranslation } from "react-i18next";
import { RestoreNotesMode } from "../types/RestoreNotesMode";
import { RestorePlan } from "../types/RestorePlan";
import { RestoreSettingsMode } from "../types/RestoreSettingsMode";
import { SystemTheme } from "../theme/SystemTheme";

type RestoreBackupDialogProps = {
  open: boolean;
  plan: RestorePlan;
  theme: SystemTheme;
  onCancel: () => void;
  onRestore: (notesMode: RestoreNotesMode, settingsMode: RestoreSettingsMode) => void;
};

function RestoreBackupDialog(props: RestoreBackupDialogProps) {
  const { t } = useTranslation();
  const [notesMode, setNotesMode] = useState(props.plan.defaultNotesMode ?? RestoreNotesMode.ADD_TO_CURRENT);
  const [settingsMode, setSettingsMode] = useState(props.plan.defaultSettingsMode ?? RestoreSettingsMode.KEEP_CURRENT);

  useEffect(() => {
    if (props.open) {
      setNotesMode(props.plan.defaultNotesMode ?? RestoreNotesMode.ADD_TO_CURRENT);
      setSettingsMode(props.plan.defaultSettingsMode ?? RestoreSettingsMode.KEEP_CURRENT);
    }
  }, [props.open, props.plan]);

  return <Dialog open={props.open} onClose={(_event, reason) => reason !== "backdropClick" && props.onCancel()}>
    <DialogTitle>{t("restoreBackup")}</DialogTitle>
    <DialogContent>
      <DialogContentText>{t("restoreBackupSummary", { count: props.plan.incomingNotesCount })}</DialogContentText>
      <RadioGroup value={notesMode} onChange={(event) => setNotesMode(event.target.value as RestoreNotesMode)}>
        <FormControlLabel value={RestoreNotesMode.REPLACE_CURRENT} control={<Radio />} label={t("replaceCurrentNotes")} />
        <FormControlLabel value={RestoreNotesMode.ADD_TO_CURRENT} control={<Radio />} label={t("addBackupNotes")} />
      </RadioGroup>
      {props.plan.hasBackupPreferences && <RadioGroup value={settingsMode} onChange={(event) => setSettingsMode(event.target.value as RestoreSettingsMode)}>
        <FormControlLabel value={RestoreSettingsMode.KEEP_CURRENT} control={<Radio />} label={t("keepCurrentPreferences")} />
        <FormControlLabel value={RestoreSettingsMode.RESTORE_BACKUP} control={<Radio />} label={t("restoreBackupPreferences")} />
      </RadioGroup>}
    </DialogContent>
    <DialogActions>
      <Button onClick={props.onCancel}>{t("cancel")}</Button>
      <Button color="error" variant="contained" onClick={() => props.onRestore(notesMode, settingsMode)}>{t("restoreBackup")}</Button>
    </DialogActions>
  </Dialog>;
}

export default RestoreBackupDialog;
