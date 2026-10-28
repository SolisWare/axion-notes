/**
 * Copyright (c) 2023-2026 SolisWare.
 * 
 * All rights reserved. Licensed under the MIT license.
 * See the LICENSE.txt file in the project root directory for details.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import './i18n/i18n';
import './index.css';
import App from './App';
import { installBrowserApi } from './browser/browserApi';

installBrowserApi();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
