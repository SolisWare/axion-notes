/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { CSSProperties, useState } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import clsx from "clsx";
import { AppTheme } from "../../theme/AppTheme";
import { getAppColors } from "../../theme/AppColors";
import { SystemTheme } from "../../theme/SystemTheme";
import General from "./pages/General";
import Appearance from "./pages/Appearance";
import Shortcuts from "./pages/Shortcuts";
import DataStorage from "./pages/DataStorage";
import About from "./pages/About";
import { SettingsPageId, settingsNavigationSections } from "./SettingsNavigation";
import styles from "./SettingsWindow.module.css";

type SettingsWindowProps = {
  theme: SystemTheme;
  embedded?: boolean;
};

function SettingsWindow(props: SettingsWindowProps) {
  const [selectedPage, setSelectedPage] = useState<SettingsPageId>(SettingsPageId.general);
  
  const appTheme = props.theme === SystemTheme.DARK ? AppTheme.DarkTheme : AppTheme.LightTheme;
  const appColors = getAppColors(props.theme);
  const themeVariables = {
    "--settings-sidebar-background": appColors.SETTINGS_SIDEBAR_BACKGROUND,
    "--settings-content-background": appColors.SETTINGS_CONTENT_BACKGROUND,
    "--settings-divider": appColors.SETTINGS_DIVIDER,
    "--settings-section-text": appColors.SETTINGS_SECTION_TEXT,
    "--settings-nav-text": appColors.SETTINGS_NAV_TEXT,
    "--settings-nav-hover-text": appColors.SETTINGS_NAV_HOVER_TEXT,
    "--settings-nav-hover-background": appColors.SETTINGS_NAV_HOVER_BACKGROUND,
    "--settings-nav-hover-border": appColors.SETTINGS_NAV_HOVER_BORDER,
    "--settings-nav-selected-text": appColors.SETTINGS_NAV_SELECTED_TEXT,
    "--settings-nav-selected-background": appColors.SETTINGS_NAV_SELECTED_BACKGROUND,
    "--settings-nav-selected-border": appColors.SETTINGS_NAV_SELECTED_BORDER
  } as CSSProperties;

  let page = <></>;
  switch (selectedPage) {
    case SettingsPageId.appearance:
      page = <Appearance />;
      break;
    case SettingsPageId.shortcuts:
      page = <Shortcuts />;
      break;
    case SettingsPageId.dataStorage:
      page = <DataStorage />;
      break;
    case SettingsPageId.about:
      page = <About />;
      break;
    case SettingsPageId.general:
    default:
      page = <General />;
  }

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <div className={clsx(styles.root, props.embedded && styles.rootEmbedded)} style={themeVariables}>
        <aside className={styles.sidebar}>
          {settingsNavigationSections.map((section) => (
            <section className={styles.section} key={section.label}>
              <h2 className={styles.sectionLabel}>
                {section.label}
              </h2>
              {section.items.map((item) => (
                <button
                  className={clsx(styles.navItem, selectedPage === item.id && styles.navItemActive)}
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedPage(item.id)}
                >
                  <span className={styles.navItemIcon}>{item.icon}</span>
                  <span className={styles.navItemLabel}>{item.label}</span>
                </button>
              ))}
            </section>
          ))}
        </aside>
        <main className={styles.content}>
          { page }
        </main>
      </div>
    </ThemeProvider>
  );
}

export default SettingsWindow;
