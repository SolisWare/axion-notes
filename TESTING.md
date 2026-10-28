# Testing strategy

Axion Notes should use a layered testing structure. Fast tests should sit close to the code they verify, while slower end-to-end tests should be reserved for full app confidence before release.

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

  fixtures/
    notes/
      plaintext/
      encrypted-v1/
      corrupted/
      migration/
    settings/
    security/

  utils/
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

## Utils

Utils are shared test utilities.

Examples:

- render helpers for React components
- fake `window.api` factories
- temporary app-data directory helpers
- Electron app launch helpers
- encryption fixture builders
- fake timer helpers

Suggested location:

```text
tests/utils/
```

## Tooling direction

The preferred direction is:

- unit tests: Vitest
- React tests: Vitest with Testing Library
- Electron service tests: Vitest running main-process modules directly where possible
- desktop E2E tests: Playwright with Electron support
- web E2E tests: Playwright
- release checks: selected Playwright and integration tests

Vitest coverage uses the V8 provider and reports against the application and Electron source. It does not include Playwright E2E coverage.

## Commands

The initial test framework scripts are:

```text
npm run test:unit
npm run test:unit:watch
npm run test:integration
npm run test:coverage
npm run test:e2e
npm run test:e2e:desktop
npm run test:e2e:web
```

`npm run test:coverage` runs the unit and integration suites, prints a terminal summary, and writes HTML and LCOV reports to `test-results/coverage/`. Open `test-results/coverage/index.html` to browse the HTML report.

The suites are allowed to pass when empty while the framework is being introduced.

## Release confidence

Before a security-focused release, the minimum useful check should be:

1. unit tests
2. Electron integration tests for storage, lock state, password, brute-force, and encryption services
3. desktop E2E lock/encryption happy paths
4. targeted v0.5 security and encryption checks
5. production build
6. npm audit review

The goal is not to test every implementation detail. The goal is to make security issues boringly hard to reintroduce.
