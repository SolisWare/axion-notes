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
  labelKey: string;
  icon: ReactNode;
};

export type SettingsNavigationSection = {
  labelKey: string;
  items: SettingsNavigationItem[];
};

export const settingsNavigationSections: SettingsNavigationSection[] = [
  {
    labelKey: "settingsWindow.navigation.sections.preferences",
    items: [
      { id: SettingsView.general, labelKey: "settingsWindow.navigation.pages.general", icon: <AppsOutlinedIcon fontSize="small" /> },
      { id: SettingsView.appearance, labelKey: "settingsWindow.navigation.pages.appearance", icon: <PaletteOutlinedIcon fontSize="small" /> },
      ...(UserAgent.isElectron ? [
        { id: SettingsView.shortcuts, labelKey: "settingsWindow.navigation.pages.shortcuts", icon: <KeyboardAltOutlinedIcon fontSize="small" /> }
      ] : [])
    ]
  },
  {
    labelKey: "settingsWindow.navigation.sections.storage",
    items: [
      { id: SettingsView.dataStorage, labelKey: "settingsWindow.navigation.pages.dataStorage", icon: <StorageOutlinedIcon fontSize="small" /> }
    ]
  },
  {
    labelKey: "settingsWindow.navigation.sections.info",
    items: [
      ...(!UserAgent.isElectron ? [
        { id: SettingsView.license, labelKey: "settingsWindow.navigation.pages.license", icon: <ArticleOutlinedIcon fontSize="small" /> },
        { id: SettingsView.links, labelKey: "settingsWindow.navigation.pages.links", icon: <LinkOutlinedIcon fontSize="small" /> },
        { id: SettingsView.about, labelKey: "settingsWindow.navigation.pages.about", icon: <InfoOutlinedIcon fontSize="small" /> }
      ] : [])
    ]
  }
];
