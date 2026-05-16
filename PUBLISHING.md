# Publishing Notes

This file is for maintainers only. Contributors do not need Marketplace
publisher access to build, test, or submit changes.

For normal project setup, see [README.md](README.md) and
[CONTRIBUTING.md](CONTRIBUTING.md).

The project is configured for this Marketplace identity:

- Publisher ID: `zmrfzn`
- Publisher display name: `Zameer Fouzan`
- Extension ID: `zmrfzn.vscode-bulk-extension-remover`

The `publisher` field in `package.json` must be the Marketplace publisher ID,
not the display name. The display name belongs to your Marketplace publisher
profile and the `author` field.

## Official Links

- VS Code publishing guide: https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- Get a personal access token: https://code.visualstudio.com/api/working-with-extensions/publishing-extension#get-a-personal-access-token
- Publisher management page: https://marketplace.visualstudio.com/manage/publishers/

## Create The Publisher

1. Open https://marketplace.visualstudio.com/manage/publishers/
2. Sign in with the Microsoft account you will use for publishing.
3. Select **Create publisher**.
4. Use `zmrfzn` as the **ID** if it is available.
5. Use `Zameer Fouzan` as the display **Name**.

The publisher ID is permanent once created, so confirm it before publishing.

## Create A Personal Access Token

Follow the official VS Code publishing instructions:

https://code.visualstudio.com/api/working-with-extensions/publishing-extension#get-a-personal-access-token

Use a token with the Marketplace management scope described in that section.

## Login And Publish

Run these from the repository root:

```powershell
npx vsce login zmrfzn
npm run compile
npm run lint
npm run test:unit
npm run test:integration
npm run package
```

After packaging validates cleanly, publish with:

```powershell
npx vsce publish
```

The Marketplace listing URL will use:

```text
https://marketplace.visualstudio.com/items?itemName=zmrfzn.vscode-bulk-extension-remover
```
