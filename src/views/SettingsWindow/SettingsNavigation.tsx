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
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export enum SettingsPageId {
  general = "general",
  appearance = "appearance",
  shortcuts = "shortcuts",
  dataStorage = "dataStorage",
  about = "about"
}

export type SettingsNavigationItem = {
  id: SettingsPageId;
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
      { id: SettingsPageId.general, label: "General", icon: <AppsOutlinedIcon fontSize="small" /> },
      { id: SettingsPageId.appearance, label: "Appearance", icon: <PaletteOutlinedIcon fontSize="small" /> },
      { id: SettingsPageId.shortcuts, label: "Shortcuts", icon: <KeyboardAltOutlinedIcon fontSize="small" /> }
    ]
  },
  {
    label: "System",
    items: [
      { id: SettingsPageId.dataStorage, label: "Data & storage", icon: <StorageOutlinedIcon fontSize="small" /> },
      { id: SettingsPageId.about, label: "About", icon: <InfoOutlinedIcon fontSize="small" /> }
    ]
  }
];
