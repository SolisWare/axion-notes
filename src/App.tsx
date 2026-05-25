/**
 * Copyright (c) 2023-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import './App.css';
import { BrowserRouter, Routes, Route as WebRoute } from "react-router-dom";
import { Router, Route } from 'electron-router-dom'
import MainWindow from './views/MainWindow/MainWindow';
import LicenseWindow from './views/LicenseWindow/LicenseWindow';
import SettingsWindow from './views/SettingsWindow/SettingsWindow';
import { UserAgent } from './utils/UserAgent';
import { useEffect, useState } from 'react';
import { SystemTheme } from './theme/SystemTheme';
import { AppSettings } from './settings/AppSettings';
import { defaultAppSettings } from './settings/defaultSettings';

export enum AppView {
  home = "/home",
  welcome = "/welcome"
}

function App() {
  const [systemTheme, setSystemTheme] = useState<SystemTheme>(SystemTheme.LIGHT);
  const [appSettings, setAppSettings] = useState<AppSettings>(defaultAppSettings);
  const [hasLoadedAppSettings, setHasLoadedAppSettings] = useState(false);

  const defaultMainWindowPage = appSettings.showWelcomeScreenOnLaunch ? AppView.welcome : AppView.home;

  useEffect(() => {
    window.api.settings.getSettings()
      .then((settings) => {
        setAppSettings(settings ?? defaultAppSettings);
        setHasLoadedAppSettings(true);
      })
      .catch((err: Error) => {
        console.error('Failed to load app settings:', err.message);
        setHasLoadedAppSettings(true);
      });

    return window.api.systemTheme.onThemeChange(setSystemTheme);
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
              <MainWindow view={AppView.home} theme={systemTheme} appSettings={appSettings} />
            } />
            <Route path={AppView.welcome} element={
              <MainWindow view={AppView.welcome} theme={systemTheme} appSettings={appSettings} />
            } />
            <Route path="/" element={
              <MainWindow view={defaultMainWindowPage} theme={systemTheme} appSettings={appSettings} />
            } />
          </>
        } license={
          <Route path="/" element={
            <LicenseWindow theme={systemTheme} />
          } />
        } settings={
          <Route path="/" element={
            <SettingsWindow theme={systemTheme} />
          } />
        } />
        :
        /* Router for a React web app */
        <BrowserRouter>
          <Routes>
            <WebRoute path={AppView.home} element={
              <MainWindow view={AppView.home} theme={systemTheme} appSettings={appSettings} />
            } />
            <WebRoute path={AppView.welcome} element={
              <MainWindow view={AppView.welcome} theme={systemTheme} appSettings={appSettings} />
            } />
            <WebRoute path="/" element={
              <MainWindow view={defaultMainWindowPage} theme={systemTheme} appSettings={appSettings} />
            } />
            <WebRoute path="/license" element={
              <LicenseWindow theme={systemTheme} />
            } />
            <WebRoute path="/settings" element={
              <SettingsWindow theme={systemTheme} />
            } />
          </Routes>
        </BrowserRouter>
      }
    </div>
  );
}

export default App;
