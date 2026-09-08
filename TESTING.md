# Testing strategy

Axion Notes should use a layered testing structure. Fast tests should sit close to the code they verify, while slower end-to-end and regression tests should be reserved for full app confidence before release.

This document describes the intended structure only. It does not mean every layer is already wired.

## Directory structure

```text
tests/
  unit/
    shared/
    react/
    electron/

  integration/
    shared/
    react/
    electron/

  e2e/
    desktop/
    web/

  regression/
    security/
    encryption/
    storage/
    ui/

  fixtures/
    notes/
      plaintext/
      encrypted-v1/
      corrupted/
      migration/
    settings/
    security/

  helpers/
```

## Unit tests

Unit tests verify small pieces of logic in isolation. They should be fast, deterministic, and should avoid launching the app.

Examples:

- password strength estimation
- brute-force cooldown calculations
- lock delay helpers
- encryption metadata validators
- storage format version checks
- React component button/field state with mocked APIs
- Electron service behavior with temporary files

Suggested location:

```text
tests/unit/shared/
tests/unit/react/
tests/unit/electron/
```

## Integration tests

Integration tests verify multiple internal pieces working together, without necessarily driving the full app UI.

Examples:

- `NoteService` writes and reads encrypted notes using `EncryptionService`
- encryption migration converts plaintext notes into encrypted `.note` files and a manifest
- decryption migration restores plaintext notes only after verification
- Security settings opens the password dialog and updates local UI state
- lock state updates menu/shortcut availability through mocked Electron APIs

Suggested location:

```text
tests/integration/shared/
tests/integration/react/
tests/integration/electron/
```

## End-to-end tests

End-to-end tests drive the app as a user would. These are slower and more fragile, so they should cover important flows rather than every small edge case.

Desktop examples:

- enable lock screen
- set password
- lock and unlock notes
- enable encryption
- restart app and unlock encrypted notes
- use Secure Lock
- verify locked renderer does not receive plaintext notes

Web examples:

- create, edit, delete, and reorder notes
- confirm desktop-only security features do not appear in the web app

Suggested location:

```text
tests/e2e/desktop/
tests/e2e/web/
```

## Regression tests

Regression tests are targeted release checks. They should protect behavior that has already broken once, or behavior that would be risky to accidentally weaken.

For v0.5 security and encryption, release regression tests should cover:

- locked app does not expose plaintext notes to the renderer
- route bypass while locked still shows the protected empty-note state
- lock shortcut and menu item are disabled when lock screen is disabled
- Secure Lock flushes plaintext note cache when encryption is enabled
- Secure Lock is disabled once plaintext cache has already been flushed
- encryption migration writes `data/notes/*.note` and `data/notes.manifest`
- decryption migration restores the plaintext layout only after verification
- missing or corrupt lock/password/encryption files show the repair state
- brute-force cooldown disables unlock and counts down correctly
- settings/main window close and app quit are guarded during encryption migration
- lock on system sleep and idle timeout trigger only when configured

Suggested locations:

```text
tests/regression/security/
tests/regression/encryption/
tests/regression/storage/
tests/regression/ui/
```

## Fixtures

Fixtures are prepared test data reused by tests.

Examples:

- plaintext note files
- encrypted note files
- encrypted manifests
- corrupted storage records
- lock settings
- password and encryption metadata records

Fixtures should live under:

```text
tests/fixtures/
```

Tests should copy fixtures into a temporary app-data directory before modifying them. Fixture files should not be changed in place during a test run.

## Helpers

Helpers are shared test utilities.

Examples:

- render helpers for React components
- fake `window.api` factories
- temporary app-data directory helpers
- Electron app launch helpers
- encryption fixture builders
- fake timer helpers

Suggested location:

```text
tests/helpers/
```

## Tooling direction

The preferred direction is:

- unit tests: Vitest
- React tests: Vitest with Testing Library
- Electron service tests: Vitest running main-process modules directly where possible
- desktop E2E tests: Playwright with Electron support
- web E2E tests: Playwright
- release regression tests: selected Playwright and integration tests

The project currently still has Create React App/Jest-era testing dependencies. Moving to Vitest and Playwright should be done as a separate implementation step.

## Commands

The initial test framework scripts are:

```text
npm run test:unit
npm run test:unit:watch
npm run test:integration
npm run test:regression
npm run test:e2e
npm run test:e2e:desktop
npm run test:e2e:web
```

The suites are allowed to pass when empty while the framework is being introduced.

## Release confidence

Before a security-focused release, the minimum useful check should be:

1. unit tests
2. Electron integration tests for storage, lock state, password, brute-force, and encryption services
3. desktop E2E lock/encryption happy paths
4. targeted v0.5 regression checks
5. production build
6. npm audit review

The goal is not to test every implementation detail. The goal is to make security regressions boringly hard to reintroduce.
