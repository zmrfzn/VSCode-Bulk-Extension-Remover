import * as vscode from "vscode";
import { getNonce } from "./nonce";

export function getWebviewHtml(
  webview: vscode.Webview,
  extensionUri: vscode.Uri
): string {
  const nonce = getNonce();
  const resetUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "media", "reset.css")
  );
  const vscodeUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "media", "vscode.css")
  );
  const stylesUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "media", "main.css")
  );
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "media", "main.js")
  );

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';"
    />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Bulk Extension Remover</title>
    <link href="${resetUri}" rel="stylesheet" />
    <link href="${vscodeUri}" rel="stylesheet" />
    <link href="${stylesUri}" rel="stylesheet" />
  </head>
  <body>
    <div class="shell">
      <section class="hero">
        <h1>Bulk Extension Remover</h1>
        <p class="subtle">Select many extensions, preview the cleanup, protect important tools, and remove clutter in controlled batches.</p>
      </section>

      <section class="panel">
        <div class="toolbar">
          <div class="toolbarRow searchRow">
            <input id="search" class="searchInput" type="search" placeholder="Filter by name, publisher, or id" />
            <button id="refresh" class="ghost refreshButton" type="button">
              <span class="buttonIcon" aria-hidden="true">&#8635;</span>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div class="toolbar">
          <div class="toolbarRow actionsRow">
            <button id="selectVisible" class="ghost" type="button">
              <span>Select Visible</span>
            </button>
            <button id="clearSelection" class="ghost" type="button">
              <span class="buttonIcon" aria-hidden="true">&#10005;</span>
              <span>Clear</span>
            </button>
            <span id="counter" class="counter">0 selected</span>
          </div>
        </div>

        <div id="list" class="list"></div>

        <div class="status">
          <div class="statusStack">
            <div id="progress" class="progress">Loading installed extensions...</div>
            <div class="statusActions">
              <label class="dryRunControl">
                <input id="dryRun" type="checkbox" />
                <span>Dry Run</span>
              </label>
              <button id="retryFailed" class="ghost" type="button" hidden>
                <span>Retry Failed</span>
              </button>
              <button id="remove" class="danger" type="button" disabled>
                <span class="buttonIcon" aria-hidden="true">&#128465;</span>
                <span>Uninstall Selected</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <script nonce="${nonce}" src="${scriptUri}"></script>
  </body>
</html>`;
}
