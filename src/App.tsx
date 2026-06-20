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
import LicenseWindow from './views/LicenseWindow/LicenseWindow';
import SettingsWindow from './views/SettingsWindow/SettingsWindow';
import { UserAgent } from './utils/UserAgent';
import { useEffect, useRef, useState } from 'react';
import { SystemTheme } from './theme/SystemTheme';
import { AppSettings } from './settings/AppSettings';
import { defaultAppSettings } from './settings/defaultSettings';
import { resolveAppThemePreference } from './settings/AppThemePreference';

export enum AppView {
  home = "/home",
  welcome = "/welcome",
  license = "/license"
}

function App() {
  const [systemTheme, setSystemTheme] = useState<SystemTheme>(SystemTheme.LIGHT);
  const [appSettings, setAppSettings] = useState<AppSettings>(defaultAppSettings);
  const [hasLoadedAppSettings, setHasLoadedAppSettings] = useState(false);
  const [startupMainWindowPage, setStartupMainWindowPage] = useState<AppView>(AppView.welcome);
  const settingsBroadcastChannel = useRef<BroadcastChannel | undefined>();

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
        const loadedSettings = {
          ...defaultAppSettings,
          ...settings
        };

        i18n.changeLanguage(loadedSettings.language);
        setAppSettings(loadedSettings);
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
            <Route path="/" element={
              <MainWindow view={startupMainWindowPage} theme={effectiveTheme} appSettings={appSettings} onAppSettingsChange={handleAppSettingsChange} />
            } />
          </>
        } license={
          <Route path="/" element={
            <LicenseWindow theme={effectiveTheme} />
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
