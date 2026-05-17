# Changelog

## Unreleased

### Changed

- Added README preview assets for GitHub and Marketplace rendering.
- Reworked the extension into a Microsoft-style TypeScript layout with `src/`
  source files and generated `out/` JavaScript.
- Split activation, webview provider, domain logic, message contracts, and
  webview assets into smaller modules.
- Moved inline webview CSS and JavaScript into files under `media/`.

### Added

- Unit tests for uninstall planning, extension-list filtering, and failure
  message normalization.
- VS Code Extension Host smoke test scaffold.
- GitHub Actions CI for compile, lint, tests, and VSIX packaging.
- OSS contribution files, issue templates, PR template, security policy, and
  MIT license.

## 0.1.0-baseline

Baseline snapshot for the first usable Bulk Extension Remover build.

### Added

- Installed extension list in a dedicated activity bar webview.
- Search and filtering across extension name, publisher, description, and id.
- Multi-select support with **Select Visible**.
- Protected extension list persisted in VS Code global state.
- Per-extension protect and unprotect action with a visible protected badge.
- Dry-run mode that previews removals without uninstalling extensions.
- Confirmation flow that reports removable and protected-skipped counts.
- Sequential uninstall queue with cancellable progress.
- Per-run success, pending-restart, protected-skip, and failure reporting.
- Retry flow for failed removals that re-checks protection before retrying.
- Dependency-related failure messaging.
- Native restart-screen handoff for extensions that require restart.
- Telemetry-free behavior.

### Notes

- This is a local/private baseline package, not the planned OSS rewrite.
- The VS Code engine floor is `^1.93.0` so the baseline can install in Cursor builds based on VS Code `1.93.x`.
- `private: true` remains in `package.json` to avoid accidental Marketplace publishing.
