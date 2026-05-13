# X-NoTES

![Last Modified](https://img.shields.io/badge/last%20modified-April%202026-blue)
![Version](https://img.shields.io/badge/version-0.1-green)
![License](https://img.shields.io/badge/license-MIT-yellow)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows-lightgray)

A cross-platform sticky notes desktop app built with ReactJS and Electron by SolisWare.

---

## Getting Started

### Download & Install
 
Download the latest prebuilt release for your platform from the [Releases](https://github.com/solisware/sticky-notes-desktop/releases) page.
 
> **macOS users:** If you see a *"X-NoTES is damaged and can't be opened"* warning after downloading, this is macOS Gatekeeper blocking the app because it is not yet signed with an Apple Developer certificate. The app itself is fine. Run the following command in Terminal to fix it:
> ```bash
> xattr -cr /Applications/X-NoTES.app
> ```
>
> **Windows users:** If you see a *"Windows protected your PC"* warning after downloading, this is Microsoft Defender SmartScreen blocking the installer because it is new or not yet widely recognized. The app itself is fine. Click **More info**, then click **Run anyway** to continue the installation.

---

## Contributing
Contributions are welcome — whether that's bug fixes, new features, documentation improvements, or raising issues and feature requests.

### Raising Issues & Feature Requests
Found a bug or have an idea? [Open an issue](https://github.com/SolisWare/sticky-notes-desktop/issues) and describe it clearly. For feature requests, explain the use case and why it would be valuable.

### Submitting a Pull Request
1. Fork the repository
2. Create a feature branch from `develop`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes and commit with clear, descriptive messages
4. Push your branch and open a Pull Request against `develop` branch

### PR Review Policy
All pull requests must be reviewed and approved by the **SolisWare team** before merging. We aim to review PRs promptly. Please be patient — we appreciate your effort.

---

## Development

### Prerequisites
> These are required for development only. The distributed app bundles its own runtime — end users do not need Node.js installed.

- [Node.js](https://nodejs.org/) v18 or higher
- npm v9 or higher

### Clone the Repository
```bash
git clone https://github.com/solisware/sticky-notes-desktop.git
cd x-notes
npm install
```
> **Note:** `--legacy-peer-deps` is required due to peer dependency conflicts between some packages and React 18. This is a known compatibility issue and does not affect the app's functionality.

### Run in Development Mode
```bash
npm run electron:dev
```

This starts the React dev server and Electron concurrently. The app will reload automatically on code changes.
> **Note:** Changes to `electron/electron.ts` or `electron/preload.ts` require a full restart of the dev process to take effect.

### Project Structure
```
x-notes/
├── electron/          # Electron main process, preload, and menu
├── src/               # React renderer (components, pages, theme, models)
├── assets/            # App icons and installer assets
├── build/             # Compiled output (generated, do not edit or commit)
├── dist/              # Distribution packages (generated, do not edit or commit)
└── public/            # Static assets for the React app
```

### Version Numbers
Version metadata is managed in `app-version-config.json`.

After changing any release value, run:
```bash
npm run version-numbers
```

This updates:
- `package.json`
- `package-lock.json`
- the version badge in `README.md`

Accepted `app-version-config.json` values:

| Value | Type | Description |
| --- | --- | --- |
| `majorVersion` | `number` | Required major version number. Example: `1` in `1.2.0`. |
| `minorVersion` | `number` | Required minor version number. Example: `2` in `1.2.0`. |
| `patchVersion` | `number` | Required patch version number. Example: `0` in `1.2.0`. |
| `preReleaseVersion` | `string` | Optional prerelease suffix appended as `-<value>`. Example: `beta.1` -> `0.1.0-beta.1`. |
| `buildVersion` | `string` | Optional build suffix appended as `-b<value>`. Example: `123` -> `0.1.0-b123`. |
| `releaseCodename` | `string` | Optional label shown in the app About dialog. This does not change the package version number. |

Example:
```json
{
  "majorVersion": 0,
  "minorVersion": 1,
  "patchVersion": 0,
  "preReleaseVersion": "beta.1",
  "buildVersion": "123",
  "releaseCodename": "Unreleased Milestone"
}
```

With the example above, the generated app version becomes `0.1.0-beta.1-b123`.

Build version precedence:
- `GITHUB_RUN_NUMBER` environment variable if present
- `buildVersion` from `app-version-config.json`
- no build suffix if neither is present

---

## Building for Production
 
Build the app:
```bash
npm run build
```
> **Important:** Run `npm run build` manually before running any `dist` target. The distribution commands do not build the app for you.
 
### Distribute for macOS (Apple Silicon)
```bash
npm run dist-mac-arm64
```
Output: `dist/` — produces a `.dmg` installer.

### Distribute for macOS (Intel)
```bash
npm run dist-mac-x64
```
Output: `dist/` — produces a `.dmg` installer.

### Distribute for Windows (64-bit)
```bash
npm run dist-windows-x64
```
Output: `dist/` — produces an NSIS `.exe` installer.

### Distribute for Windows (32-bit)
```bash
npm run dist-windows-x86
```
Output: `dist/` — produces an NSIS `.exe` installer.

---

## License
X-NoTES is open source software licensed under the [MIT License](LICENSE.txt).
 
You are free to use, modify, and distribute this software. Attribution is not required but is greatly appreciated — if you use our code in your project, a mention or a link back to this repository means a lot to us.
