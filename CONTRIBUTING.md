# Contributing

Thanks for helping improve Bulk Extension Remover.

## Development Setup

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Run `npm run compile`.
4. Press `F5` in VS Code to launch the Extension Development Host.

## Project Shape

- `src/extension.ts` owns activation and command registration.
- `src/view/` owns the VS Code webview provider and HTML generation.
- `src/domain/` contains testable extension-list, uninstall-plan, and failure-message logic.
- `src/shared/` contains message contracts shared by extension and webview code.
- `media/` contains webview CSS and browser-side JavaScript.
- `src/test/unit/` contains fast domain tests.
- `src/test/integration/` contains VS Code Extension Host smoke tests.

## Before Opening a Pull Request

Run:

```powershell
npm run compile
npm run lint
npm run test:unit
```

If your change affects activation, commands, VS Code APIs, or webview startup,
also run:

```powershell
npm run test:integration
```

## Pull Request Expectations

- Keep behavior changes small and explain user impact.
- Add or update tests for domain logic and regressions.
- Avoid telemetry unless the project has explicitly adopted a telemetry policy.
- Do not include generated `.vsix` files.
- Keep accessibility and keyboard behavior in mind for webview changes.
