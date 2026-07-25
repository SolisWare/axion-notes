/**
 * Copyright (c) 2023-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import './App.css';
import i18n from './i18n/i18n';
import { BrowserRouter, Routes, Route as WebRoute } from "react-router-dom";
import { Router, Route } from 'electron-router-dom'
import MainWindow from './views/MainWindow/MainWindow';
import NoteWindow from './views/NoteWindow/NoteWindow';
import LicenseWindow from './views/LicenseWindow/LicenseWindow';
import SettingsWindow from './views/SettingsWindow/SettingsWindow';
import { UserAgent } from './utils/UserAgent';
import { useEffect, useRef, useState } from 'react';
import { SystemTheme } from './theme/SystemTheme';
import { AppSettings } from './settings/AppSettings';
import { defaultAppSettings } from './settings/defaultSettings';
import { resolveAppThemePreference } from './settings/AppThemePreference';
import { MenuEditSelectionState } from './models/MenuEditSelectionState';
import { getInactiveRichTextFormatState } from './models/RichTextFormatState';
import { resolvePreferredSupportedLanguageCode } from './i18n/languageConfig';
import { resolvePreferredDateFormat } from './utils/dt-formatter/dateFormatConfig';
import { resolvePreferredTimeFormat } from './utils/dt-formatter/timeFormatConfig';
import LockScreen from './views/MainWindow/pages/LockScreen';

export enum AppView {
  home = "/home",
  welcome = "/welcome",
  lock = "/lock",
  license = "/license"
}

function getPreferredBrowserLanguage(): string[] {
  return navigator.languages.length > 0 ? navigator.languages : [navigator.language];
}

function getInitialAppSettings(settings: AppSettings | undefined): AppSettings {
  if (settings) {
    return {
      ...defaultAppSettings,
      ...settings
    };
  }

  const preferredBrowserLanguages = getPreferredBrowserLanguage();

  return {
    ...defaultAppSettings,
    dateFormat: resolvePreferredDateFormat(preferredBrowserLanguages),
    language: resolvePreferredSupportedLanguageCode(preferredBrowserLanguages),
    timeFormat: resolvePreferredTimeFormat(preferredBrowserLanguages)
  };
}

function App() {
  const [systemTheme, setSystemTheme] = useState<SystemTheme>(SystemTheme.LIGHT);
  const [appSettings, setAppSettings] = useState<AppSettings>(defaultAppSettings);
  const [hasLoadedAppSettings, setHasLoadedAppSettings] = useState(false);
  const [startupMainWindowPage, setStartupMainWindowPage] = useState<AppView>(AppView.welcome);
  const settingsBroadcastChannel = useRef<BroadcastChannel | undefined>();
  const currentMenuEditSelectionState = useRef<MenuEditSelectionState>({
    hasSelection: false,
    hasEditableSelection: false
  });

  const effectiveTheme = resolveAppThemePreference(appSettings.theme, systemTheme);

  function handleAppSettingsChange(settings: AppSettings) {
    if (!UserAgent.isElectron && settings.language !== appSettings.language) {
      i18n.changeLanguage(settings.language);
    }

    setAppSettings(settings);
    window.api.settings.setSettings(settings);
    settingsBroadcastChannel.current?.postMessage(settings);
  }

  useEffect(() => {
    window.api.settings.getSettings()
      .then((settings) => {
        const loadedSettings = getInitialAppSettings(settings);

        i18n.changeLanguage(loadedSettings.language);
        setAppSettings(loadedSettings);
        if (!settings) {
          window.api.settings.setSettings(loadedSettings);
        }
        setStartupMainWindowPage(loadedSettings.showWelcomeScreenOnLaunch ? AppView.welcome : AppView.home);
        setHasLoadedAppSettings(true);
      })
      .catch((err: Error) => {
        console.error('Failed to load app settings:', err.message);
        setHasLoadedAppSettings(true);
      });

    return window.api.systemTheme.onThemeChange(setSystemTheme);
  }, []);

  useEffect(() => {
    return window.api.settings.onSettingsChange(setAppSettings);
  }, []);

  useEffect(() => {
    if (!UserAgent.isElectron || appSettings.richTextEditorEnabled) {
      return;
    }

    window.api.menu.setRichTextFormatState(getInactiveRichTextFormatState());
  }, [appSettings.richTextEditorEnabled]);

  useEffect(() => {
    if (UserAgent.isElectron && hasLoadedAppSettings) {
      window.api.appWindow.readyToShow();
    }
  }, [hasLoadedAppSettings]);

  useEffect(() => {
    const channel = new BroadcastChannel("solisware.axion-notes.app-settings");
    settingsBroadcastChannel.current = channel;
    channel.onmessage = (event: MessageEvent<AppSettings>) => {
      setAppSettings(event.data);
    };

    return () => {
      settingsBroadcastChannel.current = undefined;
      channel.close();
    };
  }, []);

  useEffect(() => {
    if (!UserAgent.isElectron) {
      return;
    }

    function getTextInputSelectionState(element: Element | null): MenuEditSelectionState | null {
      if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
        return null;
      }

      const selectionStart = element.selectionStart ?? 0;
      const selectionEnd = element.selectionEnd ?? 0;
      const hasSelection = selectionEnd > selectionStart;
      const hasEditableSelection = hasSelection && !element.disabled && !element.readOnly;

      return { hasSelection, hasEditableSelection };
    }

    function getDocumentSelectionState(): MenuEditSelectionState {
      const textInputSelectionState = getTextInputSelectionState(document.activeElement);

      if (textInputSelectionState) {
        return textInputSelectionState;
      }

      const selection = document.getSelection();
      const hasSelection = (selection?.toString().length ?? 0) > 0;
      const activeElement = document.activeElement;
      const hasEditableSelection = hasSelection && activeElement instanceof HTMLElement && activeElement.isContentEditable;

      return { hasSelection, hasEditableSelection };
    }

    function updateEditSelectionState() {
      const nextState = getDocumentSelectionState();
      const currentState = currentMenuEditSelectionState.current;

      if (
        currentState.hasSelection === nextState.hasSelection &&
        currentState.hasEditableSelection === nextState.hasEditableSelection
      ) {
        window.api.menu.setEditSelectionState(nextState);
        return;
      }

      currentMenuEditSelectionState.current = nextState;
      window.api.menu.setEditSelectionState(nextState);
    }

    function scheduleEditSelectionStateUpdate() {
      window.setTimeout(updateEditSelectionState, 0);
    }

    updateEditSelectionState();

    document.addEventListener("selectionchange", scheduleEditSelectionStateUpdate);
    window.addEventListener("focus", scheduleEditSelectionStateUpdate);
    window.addEventListener("keyup", scheduleEditSelectionStateUpdate);
    window.addEventListener("mouseup", scheduleEditSelectionStateUpdate);
    window.addEventListener("pointerup", scheduleEditSelectionStateUpdate);
    const clipboardRefreshInterval = window.setInterval(updateEditSelectionState, 1000);

    return () => {
      document.removeEventListener("selectionchange", scheduleEditSelectionStateUpdate);
      window.removeEventListener("focus", scheduleEditSelectionStateUpdate);
      window.removeEventListener("keyup", scheduleEditSelectionStateUpdate);
      window.removeEventListener("mouseup", scheduleEditSelectionStateUpdate);
      window.removeEventListener("pointerup", scheduleEditSelectionStateUpdate);
      window.clearInterval(clipboardRefreshInterval);
    };
  }, []);

  if (!hasLoadedAppSettings) {
    // TODO: Splash screen: loading placeholder with a spinner. 
    return <></>;
  }

  return (
    <div className="App"> 
      { UserAgent.isElectron ?
        /* Router for an Electron "native" app */
        <Router main={
          <>
            <Route path={AppView.home} element={
              <MainWindow view={AppView.home} theme={effectiveTheme} appSettings={appSettings} onAppSettingsChange={handleAppSettingsChange} />
            } />
            <Route path={AppView.welcome} element={
              <MainWindow view={AppView.welcome} theme={effectiveTheme} appSettings={appSettings} onAppSettingsChange={handleAppSettingsChange} />
            } />
            <Route path={AppView.lock} element={
              <LockScreen theme={effectiveTheme} />
            } />
            <Route path="/" element={
              <MainWindow view={startupMainWindowPage} theme={effectiveTheme} appSettings={appSettings} onAppSettingsChange={handleAppSettingsChange} />
            } />
          </>
        } license={
          <Route path="/" element={
            <LicenseWindow theme={effectiveTheme} />
          } />
        } note={
          <Route path="/" element={
            <NoteWindow theme={effectiveTheme} appSettings={appSettings} />
          } />
        } settings={
          <Route path="/" element={
            <SettingsWindow theme={effectiveTheme} appSettings={appSettings} onAppSettingsChange={handleAppSettingsChange} />
          } />
        } />
        :
        /* Router for a React web app */
        <BrowserRouter>
          <Routes>
            <WebRoute path={AppView.home} element={
              <MainWindow view={AppView.home} theme={effectiveTheme} appSettings={appSettings} onAppSettingsChange={handleAppSettingsChange} />
            } />
            <WebRoute path={AppView.welcome} element={
              <MainWindow view={AppView.welcome} theme={effectiveTheme} appSettings={appSettings} onAppSettingsChange={handleAppSettingsChange} />
            } />
            <WebRoute path={AppView.license} element={
              <LicenseWindow theme={effectiveTheme} />
            } />
            <WebRoute path="/" element={
              <MainWindow view={startupMainWindowPage} theme={effectiveTheme} appSettings={appSettings} onAppSettingsChange={handleAppSettingsChange} />
            } />
          </Routes>
        </BrowserRouter>
      }
    </div>
  );
}

export default App;
