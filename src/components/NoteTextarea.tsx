/**
 * Copyright (c) 2023-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { Theme } from "@mui/material";
import { makeStyles } from "@mui/styles";
import { ChangeEvent, ChangeEventHandler, useCallback, useEffect, useRef } from "react";
import { getAppColors } from "../theme/AppColors";
import { SystemTheme } from "../theme/SystemTheme";
import { AppColorStyleProps } from "../types/appColorTypes";
import { NoteFontSize } from "../settings/NoteFontSize";
 
type NoteTextareaProps = {
  theme?: SystemTheme;
  fontFamily?: string;
  fontSize?: NoteFontSize;
  placeholder: string;
  content: string;
  onChange?: ChangeEventHandler<HTMLTextAreaElement>;
}
 
const useStyles = makeStyles<Theme, AppColorStyleProps>((theme: Theme) => ({
  wrapper: {
    width: "100%",
    height: "100%",
    minHeight: "100%",
    overflowY: "auto",
    cursor: "default",
    '&::-webkit-scrollbar, &::-webkit-scrollbar-track, &::-webkit-scrollbar-thumb': {
      cursor: "default !important"
    }
  },
  noteTextarea: {
    display: "block",
    width: "100%",
    minHeight: "100%",
    height: "100%",
    boxSizing: "border-box",
    background: "transparent",
    outline: "none",
    border: "none",
    resize: "none",
    overflow: "hidden",
    fontSize: 14,
    color: ({ appColors }) => appColors.NOTE_TEXT + " !important",
    caretColor: ({ appColors }) => appColors.NOTE_TEXT,
    '&::placeholder': {
      color: ({ appColors }) => appColors.NOTE_PLACEHOLDER_TEXT,
      opacity: 1
    },
    '&::-webkit-scrollbar, &::-webkit-scrollbar-track, &::-webkit-scrollbar-thumb': {
      cursor: "default !important"
    }
  }
}));
 
function NoteTextarea(props: NoteTextareaProps) {
  const appColors = getAppColors(props.theme ?? SystemTheme.LIGHT);
  const classes = useStyles({ appColors });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "100%";
    textarea.style.height = `${Math.max(textarea.clientHeight, textarea.scrollHeight)}px`;
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [props.content, resizeTextarea]);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    resizeTextarea();
    props.onChange?.(event);
  };
   
  return (
    <div className={classes.wrapper}>
      <textarea ref={textareaRef}
                className={classes.noteTextarea}
                style={{ fontFamily: props.fontFamily, fontSize: props.fontSize }}
                placeholder={props.placeholder}
                value={props.content}
                onChange={handleChange} />
    </div>
  );
}
 
export default NoteTextarea;
 
