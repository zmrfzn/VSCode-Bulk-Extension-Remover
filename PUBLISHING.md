# Publishing

This project is configured for this Marketplace identity:

- Publisher ID: `zmrfzn`
- Publisher display name: `Zameer Fouzan`
- Extension ID: `zmrfzn.vscode-bulk-extension-remover`

The `publisher` field in `package.json` must be the Marketplace publisher ID,
not the display name. The display name belongs to your Marketplace publisher
profile and the `author` field.

## Official Links

- VS Code publishing guide: https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- Publisher management page: https://marketplace.visualstudio.com/manage/publishers/
- Azure DevOps portal: https://dev.azure.com/
- Azure DevOps personal access token docs: https://learn.microsoft.com/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate

## Create The Publisher

1. Open https://marketplace.visualstudio.com/manage/publishers/
2. Sign in with the Microsoft account you will use for publishing.
3. Select **Create publisher**.
4. Use `zmrfzn` as the **ID** if it is available.
5. Use `Zameer Fouzan` as the display **Name**.

The publisher ID is permanent once created, so confirm it before publishing.

## Create A Personal Access Token

1. Open https://dev.azure.com/
2. Go to **User settings** > **Personal access tokens**.
3. Create a token with **Marketplace: Manage** scope.
4. Copy it immediately. Azure DevOps will only show it once.

## Login And Publish

Run these from the repository root:

```powershell
npx vsce login zmrfzn
npm run compile
npm run lint
npm run test:unit
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
