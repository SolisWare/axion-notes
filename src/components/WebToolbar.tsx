/**
 * Copyright (c) 2023-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { makeStyles } from "@mui/styles";
import AppBar from "@mui/material/AppBar";
import Typography from "@mui/material/Typography";
import Toolbar from '@mui/material/Toolbar';
import { Box, Button, Theme } from "@mui/material";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import clsx from "clsx";
import { getAppColors } from "../theme/AppColors";
import { SystemTheme } from "../theme/SystemTheme";
import { AppColorStyleProps } from "../types/appColorTypes";

type WebToolbarProps = {
  theme: SystemTheme;
  title: string;
  isDeleteAllButtonDisabled: boolean;
  handleAddNoteButton: (event: React.MouseEvent<HTMLElement>) => void;
  handleDeleteAllNotesButton: (event: React.MouseEvent<HTMLElement>) => void;
  handleSettingsButton: (event: React.MouseEvent<HTMLElement>) => void;
};

const useStyles = makeStyles<Theme, AppColorStyleProps>((theme: Theme) => ({
  windowsToolbar: {
    backgroundColor: ({ appColors }) => appColors.WINDOWS_TOOLBAR_BACKGROUND + "!important",
    color: ({ appColors }) => appColors.WINDOWS_TOOLBAR_TEXT + "!important",
    borderTop: ({ appColors }) => "1px solid " + appColors.WINDOWS_TOOLBAR_TOP_BORDER
  },
  toolbar: {
    height: 20
  },
  toolbarBtnsContainer: {
    padding: "5px",
    marginLeft: "25px",
  },
  toolbarGrow: {
    flexGrow: 1
  },
  toolbarRightBtnsContainer: {
    display: "flex",
    gap: 15,
    alignItems: "center"
  },
  toolbarBtn: {
    width: 130,
    height: 32,
  },
  windowsToolbarBtn: {
    backgroundColor: ({ appColors }) => appColors.WINDOWS_TOOLBAR_BUTTON_BACKGROUND + " !important",
    color: ({ appColors }) => appColors.WINDOWS_TOOLBAR_TEXT + "!important",
    outline: ({ appColors }) => "1px solid " + appColors.WINDOWS_TOOLBAR_BUTTON_BORDER + " !important",
    boxShadow: "none !important",
    '&:hover': {
      backgroundColor: ({ appColors }) => appColors.WINDOWS_TOOLBAR_BUTTON_HOVER_BACKGROUND + " !important",
      color: ({ appColors }) => appColors.WINDOWS_TOOLBAR_BUTTON_HOVER_TEXT + " !important",
      outline: ({ appColors }) => "1px solid " + appColors.WINDOWS_TOOLBAR_BUTTON_HOVER_BORDER + " !important"
    }
  },
  windowsToolbarBtnDelete: {
    backgroundColor: ({ appColors }) => appColors.WINDOWS_TOOLBAR_BUTTON_BACKGROUND + " !important",
    color: ({ appColors }) => appColors.WINDOWS_TOOLBAR_TEXT + "!important",
    outline: ({ appColors }) => "1px solid " + appColors.WINDOWS_TOOLBAR_BUTTON_BORDER + " !important",
    boxShadow: "none !important",
    '&:hover': {
      backgroundColor: ({ appColors }) => appColors.WINDOWS_TOOLBAR_DELETE_BUTTON_HOVER_BACKGROUND + " !important",
      color: ({ appColors }) => appColors.WINDOWS_TOOLBAR_DELETE_BUTTON_HOVER_TEXT + " !important",
      outline: ({ appColors }) => "1px solid " + appColors.WINDOWS_TOOLBAR_DELETE_BUTTON_HOVER_BORDER + " !important"
    },
    '&.Mui-disabled': {
      backgroundColor: ({ appColors }) => appColors.WINDOWS_TOOLBAR_BUTTON_DISABLED_BACKGROUND + " !important",
      color: ({ appColors }) => appColors.WINDOWS_TOOLBAR_BUTTON_DISABLED_TEXT + " !important",
      outline: ({ appColors }) => "1px solid " + appColors.WINDOWS_TOOLBAR_BUTTON_DISABLED_BORDER + " !important"
    }
  },
  toolbarBtnSpacer: {
    marginRight: 15
  },
  toolbarIconBtnInnerContainer: {
    display: "flex",
    alignItems: "center",
    verticalAlign: "center"
  },
  toolbarBtnText: {
    paddingTop: "3px",
    paddingLeft: "5px"
  },
  windowsToolbarBtnText: {
    paddingTop: "3px",
    paddingLeft: "5px",
    color: "inherit"
  },
  windowsToolbarTitle: {
    color: ({ appColors }) => appColors.WINDOWS_TOOLBAR_TEXT
  },
  toolbarSettingsBtn: {
    width: 115,
    height: 32,
    color: "#fff !important"
  }
}));

function WebToolbar(props: WebToolbarProps) {
  const appColors = getAppColors(props.theme);
  const classes = useStyles({ appColors });

  const isWindows = window.api.os.isWindows;

  return (
    <AppBar
      position="sticky"
      className={clsx(isWindows && classes.windowsToolbar)}
    >
      <Toolbar className={isWindows ? classes.windowsToolbar : classes.toolbar}>
        {/* TODO: Add app icon. */}
        <Typography
          variant="h6"
          fontWeight="bold"
          className={clsx(isWindows && classes.windowsToolbarTitle)}
        >
          {props.title}
        </Typography>
        <Box className={classes.toolbarBtnsContainer}>
          <Button
            className={clsx(
              classes.toolbarBtn,
              isWindows && classes.windowsToolbarBtn
            )}
            variant="toolbar"
            color="primary"
            onClick={props.handleAddNoteButton}
          >
            <div className={classes.toolbarIconBtnInnerContainer}>
              <AddCircleOutlineIcon fontSize="small" />
              <Typography className={clsx(classes.toolbarBtnText, isWindows && classes.windowsToolbarBtnText)} variant="body2">New Note</Typography>
            </div>
          </Button>
          <span className={classes.toolbarBtnSpacer}/>
          <Button
            className={clsx(
              classes.toolbarBtn,
              isWindows && classes.windowsToolbarBtnDelete
            )}
            variant="toolbarNegative"
            color="primary"
            disabled={props.isDeleteAllButtonDisabled}
            onClick={props.handleDeleteAllNotesButton}
          >
            <DeleteOutlineOutlinedIcon fontSize="small" />
            <Typography className={clsx(classes.toolbarBtnText, isWindows && classes.windowsToolbarBtnText)} variant="body2">Delete All</Typography>
          </Button>
        </Box>
        <div className={classes.toolbarGrow} />
        <Box className={classes.toolbarRightBtnsContainer}>
          <Button
            className={clsx(
              classes.toolbarBtn,
              classes.toolbarSettingsBtn,
              isWindows && classes.windowsToolbarBtn
            )}
            variant="toolbar"
            color="primary"
            onClick={props.handleSettingsButton}
          >
            <div className={classes.toolbarIconBtnInnerContainer}>
              <SettingsOutlinedIcon fontSize="small" />
              <Typography className={clsx(classes.toolbarBtnText, isWindows && classes.windowsToolbarBtnText)} variant="body2">Settings</Typography>
            </div>
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default WebToolbar;
