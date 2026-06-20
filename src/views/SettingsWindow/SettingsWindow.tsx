/**
 * Copyright (c) 2026 SolisWare.
 *
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import { CSSProperties, useState } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { AppTheme } from "../../theme/AppTheme";
import { getAppColors } from "../../theme/AppColors";
import { SystemTheme } from "../../theme/SystemTheme";
import { AppSettings } from "../../settings/AppSettings";
import General from "./pages/General";
import Appearance from "./pages/Appearance";
import Shortcuts from "./pages/Shortcuts";
import DataStorage from "./pages/DataStorage";
import License from "./pages/License";
import Links from "./pages/Links";
import About from "./pages/About";
import { SettingsView, settingsNavigationSections } from "./SettingsNavigation";
import styles from "./SettingsWindow.module.css";

type SettingsWindowProps = {
  theme: SystemTheme;
  appSettings: AppSettings;
  embedded?: boolean;
  onAppSettingsChange: (settings: AppSettings) => void;
};

function SettingsWindow(props: SettingsWindowProps) {
  const { t } = useTranslation();
  const [selectedPage, setSelectedPage] = useState<SettingsView>(SettingsView.general);
  
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
    "--settings-nav-selected-border": appColors.SETTINGS_NAV_SELECTED_BORDER,
    "--settings-color-swatch-dot": props.theme === SystemTheme.DARK ? "#E6EEF4" : "#FFFFFF"
  } as CSSProperties;

  const visibleNavigationSections = settingsNavigationSections.filter((section) => section.items.length > 0);
  const selectedPageTitle = visibleNavigationSections
    .flatMap((section) => section.items)
    .find((item) => item.id === selectedPage)?.labelKey ?? "";

  let page = <></>;
  switch (selectedPage) {
    case SettingsView.appearance:
      page = <Appearance theme={props.theme} appSettings={props.appSettings} onAppSettingsChange={props.onAppSettingsChange} />;
      break;
    case SettingsView.shortcuts:
      page = <Shortcuts />;
      break;
    case SettingsView.dataStorage:
      page = <DataStorage />;
      break;
    case SettingsView.license:
      page = <License theme={props.theme} />;
      break;
    case SettingsView.links:
      page = <Links />;
      break;
    case SettingsView.about:
      page = <About theme={props.theme} />;
      break;
    case SettingsView.general:
    default:
      page = <General appSettings={props.appSettings} onAppSettingsChange={props.onAppSettingsChange} />;
  }

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <div className={clsx(styles.root, props.embedded && styles.rootEmbedded)} style={themeVariables}>
        <aside className={styles.sidebar}>
          {visibleNavigationSections.map((section) => (
            <section className={styles.section} key={section.labelKey}>
              <h2 className={styles.sectionLabel}>
                {t(section.labelKey)}
              </h2>
              {section.items.map((item) => (
                <button
                  className={clsx(styles.navItem, selectedPage === item.id && styles.navItemActive)}
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedPage(item.id)}
                >
                  <span className={styles.navItemIcon}>{item.icon}</span>
                  <span className={styles.navItemLabel}>{t(item.labelKey)}</span>
                </button>
              ))}
            </section>
          ))}
        </aside>
        <main className={styles.content}>
          <header className={styles.contentHeader}>
            <h1 className={styles.contentTitle}>{selectedPageTitle ? t(selectedPageTitle) : ""}</h1>
          </header>
          <div className={styles.contentBody}>
            { page }
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default SettingsWindow;
