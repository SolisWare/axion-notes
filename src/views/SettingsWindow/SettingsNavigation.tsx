/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { ReactNode } from "react";
import AppsOutlinedIcon from "@mui/icons-material/AppsOutlined";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import KeyboardAltOutlinedIcon from "@mui/icons-material/KeyboardAltOutlined";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { UserAgent } from "../../utils/UserAgent";

export enum SettingsView {
  general = "general",
  appearance = "appearance",
  shortcuts = "shortcuts",
  dataStorage = "dataStorage",
  license = "license",
  links = "links",
  about = "about"
}

export type SettingsNavigationItem = {
  id: SettingsView;
  label: string;
  icon: ReactNode;
};

export type SettingsNavigationSection = {
  label: string;
  items: SettingsNavigationItem[];
};

export const settingsNavigationSections: SettingsNavigationSection[] = [
  {
    label: "Preferences",
    items: [
      { id: SettingsView.general, label: "General", icon: <AppsOutlinedIcon fontSize="small" /> },
      { id: SettingsView.appearance, label: "Appearance", icon: <PaletteOutlinedIcon fontSize="small" /> },
      { id: SettingsView.shortcuts, label: "Shortcuts", icon: <KeyboardAltOutlinedIcon fontSize="small" /> }
    ]
  },
  {
    label: "Storage",
    items: [
      { id: SettingsView.dataStorage, label: "Data & storage", icon: <StorageOutlinedIcon fontSize="small" /> }
    ]
  },
  {
    label: "Info",
    items: [
      ...(!UserAgent.isElectron ? [
        { id: SettingsView.license, label: "License", icon: <ArticleOutlinedIcon fontSize="small" /> },
        { id: SettingsView.links, label: "Links", icon: <LinkOutlinedIcon fontSize="small" /> },
        { id: SettingsView.about, label: "About", icon: <InfoOutlinedIcon fontSize="small" /> }
      ] : [])
    ]
  }
];
