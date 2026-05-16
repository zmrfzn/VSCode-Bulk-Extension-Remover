import * as vscode from "vscode";
import { FOCUS_COMMAND, VIEW_CONTAINER_ID, VIEW_TYPE } from "./constants";
import { BulkExtensionRemoveViewProvider } from "./view/BulkExtensionRemoveViewProvider";

export function activate(context: vscode.ExtensionContext): void {
  console.log("Bulk Extension Remover: activating");

  try {
    const provider = new BulkExtensionRemoveViewProvider(context);

    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(VIEW_TYPE, provider, {
        webviewOptions: {
          retainContextWhenHidden: true
        }
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand(FOCUS_COMMAND, async () => {
        await vscode.commands.executeCommand(VIEW_CONTAINER_ID);
      })
    );

    console.log("Bulk Extension Remover: activated");
  } catch (error) {
    console.error("Bulk Extension Remover: activation failed", error);
    throw error;
  }
}

export function deactivate(): void {}
