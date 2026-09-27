/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { ReactNode } from "react";
import AppsOutlinedIcon from "@mui/icons-material/AppsOutlined";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import KeyboardAltOutlinedIcon from "@mui/icons-material/KeyboardAltOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { UserAgent } from "../../utils/UserAgent";

export enum SettingsView {
  general = "general",
  appearance = "appearance",
  editor = "editor",
  security = "security",
  shortcuts = "shortcuts",
  dataStorage = "dataStorage",
  license = "license",
  links = "links",
  about = "about"
}

export type SettingsNavigationItem = {
  id: SettingsView;
  labelKey: string;
  icon: ReactNode;
};

export type SettingsNavigationSection = {
  labelKey: string;
  items: SettingsNavigationItem[];
};

export const settingsNavigationSections: SettingsNavigationSection[] = [
  {
    labelKey: "preferences",
    items: [
      { id: SettingsView.general, labelKey: "general", icon: <AppsOutlinedIcon fontSize="small" /> },
      { id: SettingsView.appearance, labelKey: "appearance", icon: <PaletteOutlinedIcon fontSize="small" /> },
      { id: SettingsView.editor, labelKey: "editor", icon: <EditNoteOutlinedIcon fontSize="small" /> },
      ...(UserAgent.isElectron ? [
        { id: SettingsView.security, labelKey: "security", icon: <SecurityOutlinedIcon fontSize="small" /> }
      ] : []),
      ...(UserAgent.isElectron ? [
        { id: SettingsView.shortcuts, labelKey: "shortcuts", icon: <KeyboardAltOutlinedIcon fontSize="small" /> }
      ] : [])
    ]
  },
  {
    labelKey: "storage",
    items: [
      { id: SettingsView.dataStorage, labelKey: "dataStorage", icon: <StorageOutlinedIcon fontSize="small" /> }
    ]
  },
  {
    labelKey: "info",
    items: [
      ...(!UserAgent.isElectron ? [
        { id: SettingsView.license, labelKey: "license", icon: <ArticleOutlinedIcon fontSize="small" /> },
        { id: SettingsView.links, labelKey: "links", icon: <LinkOutlinedIcon fontSize="small" /> },
        { id: SettingsView.about, labelKey: "about", icon: <InfoOutlinedIcon fontSize="small" /> }
      ] : [])
    ]
  }
];
