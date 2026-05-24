# Changelog
All changes to the SolisWare X-NoTES will be documented in this file.

The format is inspired by Keep a Changelog, and this project uses release tags for version tracking.

## [v0.2.0] - Unreleased - Skylight
- Added support for running X-NoTES as a React web app in the browser
- Added a browser API layer that mirrors the Electron preload API for shared app code
- Added persistent browser note storage using localStorage
- Renamed the React toolbar to WebToolbar and limited it to the web app while Electron uses native desktop menus
- Added VS Code debug configurations for the Electron desktop app and React web app
- Added persistent browser app settings using localStorage
- Added a web About button with About and License dialogs for the web app
- Removed the version label from the web toolbar

## [v0.1.0] - May 23, 2026 - Groundwork
- Increased the main window width so notes do not wrap too early when scrollbars appear
- Added a new welcome screen
- Added persistent app settings storage
- Added a Delete All Notes item to the Edit menu with disabled-state handling when no notes exist
- Added restoration for main window state, including maximized windows and safe handling for disconnected displays
- Prevented the welcome screen from briefly flashing before the saved launch preference is loaded
- Saved pending note edits when a note unmounts or the app window closes
- Fixed TypeScript compiler configuration issues
- Refactored Electron preload APIs into dedicated modules and centralized IPC channel names
- Updated dependency constraints so npm install no longer requires the legacy peer dependency resolver
- Updated Electron dependencies and reduced reported dependency vulnerabilities from 38 to 2
- Added native View, Window, and Help menus
- Disabled New Note and Edit menu actions while the welcome screen is shown
- Fixed duplicate note creation from accumulated New Note menu listeners
- Added a missing accelerator for Delete All Notes menu item
- Added a dedicated License window opened from the Help menu

## [v0.1.0-beta.4] - May 9, 2026 - Stakeout
- Centered the note grid so fixed-width notes keep more balanced left and right spacing when the available window width leaves extra room
- Moved scrolling into the main content area so the toolbar remains a fixed app control
- Added slim, semi-transparent app-wide scrollbars styled after the macOS default appearance for all platforms
- Added a dedicated note creation timestamp and renamed the modified timestamp field so notes can be ordered by creation time
- Updated system theme handling so the app responds to OS light and dark mode changes while it is running

## [v0.1.0-beta.3] - April 27, 2026 - Final Draft
- Added system theme detection support with typed Light and Dark theme values
- Exposed the current system theme to the renderer through the Electron preload API
- Added a Windows-only About entry to the File menu
- Added Windows toolbar dark mode styling driven by the detected system theme
- Tuned the Windows dark toolbar colors, button states, and bottom border to better align with the native menu bar appearance
- Added full dark mode support across macOS and Windows
- Refined ConfirmationDialog dark mode styling for improved theme contrast
- Renamed components that followed the old X-SiGMA naming convention
- Reduced reported dependency vulnerabilities from 74 to 36 through targeted package updates as part of ongoing security maintenance

## [v0.1.0-beta.2] - April 20, 2026 - Blueprint
- Refined the Windows desktop experience with toolbar and menu presentation updates
- Adjusted the full Windows toolbar color scheme to better match the native Windows menu bar appearance
- Updated the Windows toolbar background, text, borders, and button states for a more native look and feel
- Removed the macOS-style application-name menu from Windows so the menu bar follows the more typical Windows structure
- Removed redundant variables and imports as part of general code cleanup

## [v0.1.0-beta.1] - April 17, 2026 - Foundation
- Initial public pre-release of SolisWare X-NoTES
- Introduced the first cross-platform desktop release for macOS and Windows
- Added core sticky note functionality, local persistence, desktop packaging, and release versioning
