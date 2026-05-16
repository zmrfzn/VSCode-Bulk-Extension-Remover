import * as vscode from "vscode";
import { PROTECTED_EXTENSION_IDS_KEY } from "../constants";
import type {
  ExtensionReference,
  PendingRestartRemoval
} from "../domain/extensionCatalog";
import { getExtensionLabel, listInstalledExtensions } from "../domain/extensionCatalog";
import { describeUninstallFailure } from "../domain/failures";
import { createUninstallPlan } from "../domain/uninstallPlan";
import type { ProgressMessage, WebviewToExtensionMessage } from "../shared/messages";
import { getWebviewHtml } from "./getWebviewHtml";

interface UninstallOptions {
  readonly dryRun?: boolean;
  readonly isRetry?: boolean;
  readonly protectedSkipped?: readonly PendingRestartRemoval[];
}

interface BatchResults {
  readonly success: string[];
  readonly pendingRestart: string[];
  readonly failed: Array<{
    readonly id: string;
    readonly label: string;
    readonly message: string;
    readonly reason: string;
  }>;
  readonly skipped: PendingRestartRemoval[];
}

export class BulkExtensionRemoveViewProvider implements vscode.WebviewViewProvider {
  private view: vscode.WebviewView | undefined;
  private readonly hiddenExtensionIds = new Set<string>();
  private readonly pendingRestartRemovals: PendingRestartRemoval[] = [];
  private readonly protectedExtensionIds: Set<string>;

  public constructor(private readonly context: vscode.ExtensionContext) {
    this.protectedExtensionIds = new Set(
      context.globalState.get<string[]>(PROTECTED_EXTENSION_IDS_KEY, [])
    );
  }

  public resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, "media")
      ]
    };
    webviewView.webview.html = getWebviewHtml(
      webviewView.webview,
      this.context.extensionUri
    );

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        void this.postExtensions();
      }
    });

    webviewView.webview.onDidReceiveMessage((message: WebviewToExtensionMessage) => {
      void this.handleMessage(message);
    });
  }

  private async handleMessage(message: WebviewToExtensionMessage): Promise<void> {
    switch (message.type) {
      case "ready":
      case "refresh":
        await this.postExtensions();
        break;
      case "uninstall":
        await this.handleUninstall(message.extensionIds || [], {
          dryRun: Boolean(message.dryRun)
        });
        break;
      case "retryFailed":
        await this.handleRetryFailed(message.extensionIds || []);
        break;
      case "toggleProtected":
        await this.handleToggleProtected(
          message.extensionId,
          Boolean(message.protected)
        );
        break;
      case "openRestartScreen":
        await this.openRestartScreen();
        break;
      case "reloadWindow":
        await this.reloadWindow();
        break;
    }
  }

  private async postExtensions(): Promise<void> {
    if (!this.view) {
      return;
    }

    const extensions = listInstalledExtensions(
      vscode.extensions.all as readonly ExtensionReference[],
      {
        selfExtensionId: this.context.extension.id,
        hiddenExtensionIds: this.hiddenExtensionIds,
        pendingRestartRemovals: this.pendingRestartRemovals,
        isProtected: (extensionId) => this.isProtected(extensionId)
      }
    );

    await this.view.webview.postMessage({
      type: "extensions",
      extensions,
      pendingRestartRemovals: this.pendingRestartRemovals,
      protectedCount: extensions.filter((extension) => extension.isProtected)
        .length
    });
  }

  private async handleUninstall(
    extensionIds: readonly string[],
    options: UninstallOptions = {}
  ): Promise<void> {
    if (!extensionIds.length) {
      void vscode.window.showInformationMessage(
        "Select at least one extension to uninstall."
      );
      return;
    }

    const plan = this.createUninstallPlan(extensionIds);
    const pickedExtensions = plan.removable;
    const dryRun = Boolean(options.dryRun);

    if (!pickedExtensions.length && !plan.protectedSkipped.length) {
      await this.postProgress({
        phase: "cancelled",
        message:
          "None of the selected extensions are available to uninstall. Refresh the list and try again."
      });
      return;
    }

    if (!pickedExtensions.length) {
      const message = dryRun
        ? `Dry run complete. Would remove 0 extension(s); would skip ${plan.protectedSkipped.length} protected.`
        : `No extensions were removed. ${plan.protectedSkipped.length} selected extension(s) are protected.`;

      void vscode.window.showInformationMessage(message);
      await this.postProgress({
        phase: "complete",
        dryRun,
        successCount: 0,
        pendingRestartCount: 0,
        pendingRestart: [],
        failureCount: 0,
        failures: [],
        skippedCount: 0,
        skipped: [],
        protectedSkippedCount: plan.protectedSkipped.length,
        protectedSkipped: plan.protectedSkipped
      });
      return;
    }

    const labelPreview = pickedExtensions
      .slice(0, 5)
      .map((extension) => getExtensionLabel(extension));

    const remaining = pickedExtensions.length - labelPreview.length;
    const previewText =
      remaining > 0
        ? `${labelPreview.join(", ")} and ${remaining} more`
        : labelPreview.join(", ");

    if (dryRun) {
      await this.runUninstallBatch(pickedExtensions, {
        dryRun: true,
        protectedSkipped: plan.protectedSkipped
      });
      return;
    }

    const protectedText = plan.protectedSkipped.length
      ? ` ${plan.protectedSkipped.length} protected extension(s) will be skipped.`
      : "";

    const confirmation = await vscode.window.showWarningMessage(
      `Uninstall ${pickedExtensions.length} extension(s)? ${previewText}.${protectedText}`,
      { modal: true },
      "Uninstall"
    );

    if (confirmation !== "Uninstall") {
      await this.postProgress({
        phase: "cancelled",
        message: "Bulk uninstall cancelled."
      });
      return;
    }

    await this.runUninstallBatch(pickedExtensions, {
      isRetry: false,
      protectedSkipped: plan.protectedSkipped
    });
  }

  private async handleRetryFailed(extensionIds: readonly string[]): Promise<void> {
    const plan = this.createUninstallPlan(extensionIds);
    const pickedExtensions = plan.removable;

    if (!pickedExtensions.length && !plan.protectedSkipped.length) {
      await this.postProgress({
        phase: "cancelled",
        message: "No failed extensions are available to retry."
      });
      return;
    }

    if (!pickedExtensions.length) {
      await this.postProgress({
        phase: "complete",
        dryRun: false,
        successCount: 0,
        pendingRestartCount: 0,
        pendingRestart: [],
        failureCount: 0,
        failures: [],
        skippedCount: 0,
        skipped: [],
        protectedSkippedCount: plan.protectedSkipped.length,
        protectedSkipped: plan.protectedSkipped
      });
      return;
    }

    await this.runUninstallBatch(pickedExtensions, {
      isRetry: true,
      protectedSkipped: plan.protectedSkipped
    });
  }

  private async runUninstallBatch(
    pickedExtensions: readonly ExtensionReference[],
    options: UninstallOptions = {}
  ): Promise<void> {
    const dryRun = Boolean(options.dryRun);
    const protectedSkipped = options.protectedSkipped || [];
    const queue = pickedExtensions.map((extension) => ({
      id: extension.id,
      label: getExtensionLabel(extension)
    }));

    const results: BatchResults = {
      success: [],
      pendingRestart: [],
      failed: [],
      skipped: []
    };

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        cancellable: true,
        title: dryRun
          ? "Previewing extension removals"
          : options.isRetry
            ? "Retrying failed extension removals"
            : "Bulk uninstalling extensions"
      },
      async (progress, token) => {
        const total = queue.length;

        for (let index = 0; index < queue.length; index += 1) {
          if (token.isCancellationRequested) {
            results.skipped.push(...queue.slice(index));
            await this.postProgress({
              phase: "cancelled",
              message: `Bulk uninstall cancelled. ${results.skipped.length} extension(s) were not attempted.`
            });
            break;
          }

          const item = queue[index];

          progress.report({
            message: `${dryRun ? "Previewing" : "Removing"} ${item.label} (${index + 1}/${total})`
          });

          await this.postProgress({
            phase: "running",
            current: index + 1,
            total,
            dryRun,
            message: `${dryRun ? "Would remove" : "Removing"} ${item.label}...`
          });

          try {
            if (!dryRun) {
              await vscode.commands.executeCommand(
                "workbench.extensions.uninstallExtension",
                item.id
              );
            }

            const stillLoaded =
              !dryRun && Boolean(vscode.extensions.getExtension(item.id));

            if (!dryRun) {
              const removedItem = {
                id: item.id,
                label: item.label
              };

              if (stillLoaded) {
                if (
                  !this.pendingRestartRemovals.some(
                    (pendingItem) => pendingItem.id === item.id
                  )
                ) {
                  this.pendingRestartRemovals.push(removedItem);
                }
                results.pendingRestart.push(item.label);
              } else {
                this.hiddenExtensionIds.add(item.id);
              }
            }

            results.success.push(item.label);
            await this.postProgress({
              phase: "itemComplete",
              id: item.id,
              label: item.label,
              status: dryRun
                ? "dryRun"
                : stillLoaded
                  ? "pendingRestart"
                  : "success"
            });
          } catch (error) {
            const failure = describeUninstallFailure(item, error);
            results.failed.push(failure);
            await this.postProgress({
              phase: "itemComplete",
              id: item.id,
              label: item.label,
              status: "failed",
              message: failure.reason
            });
          }

          progress.report({
            increment: 100 / total
          });
        }
      }
    );

    const shouldPostCompletion = await this.reportBatchResults(
      results,
      dryRun,
      protectedSkipped
    );
    if (!shouldPostCompletion) {
      return;
    }

    await this.postProgress({
      phase: "complete",
      dryRun,
      successCount: results.success.length,
      pendingRestartCount: results.pendingRestart.length,
      pendingRestart: results.pendingRestart,
      failureCount: results.failed.length,
      failures: results.failed,
      skippedCount: results.skipped.length,
      skipped: results.skipped,
      protectedSkippedCount: protectedSkipped.length,
      protectedSkipped
    });

    await this.postExtensions();
  }

  private createUninstallPlan(extensionIds: readonly string[]) {
    return createUninstallPlan(extensionIds, {
      getExtension: (extensionId) =>
        vscode.extensions.getExtension(extensionId) as
          | ExtensionReference
          | undefined,
      isProtected: (extensionId) => this.isProtected(extensionId)
    });
  }

  private isProtected(extensionId: string): boolean {
    return (
      extensionId === this.context.extension.id ||
      this.protectedExtensionIds.has(extensionId)
    );
  }

  private async handleToggleProtected(
    extensionId: string | undefined,
    shouldProtect: boolean
  ): Promise<void> {
    if (!extensionId || extensionId === this.context.extension.id) {
      return;
    }

    if (shouldProtect) {
      this.protectedExtensionIds.add(extensionId);
    } else {
      this.protectedExtensionIds.delete(extensionId);
    }

    await this.context.globalState.update(
      PROTECTED_EXTENSION_IDS_KEY,
      Array.from(this.protectedExtensionIds).sort()
    );
    await this.postExtensions();
  }

  private async reportBatchResults(
    results: BatchResults,
    dryRun: boolean,
    protectedSkipped: readonly PendingRestartRemoval[]
  ): Promise<boolean> {
    if (dryRun && results.skipped.length) {
      void vscode.window.showInformationMessage(
        `Dry run cancelled. Previewed ${results.success.length} extension(s); ${results.skipped.length} were not previewed; would skip ${protectedSkipped.length} protected.`
      );
    } else if (dryRun) {
      void vscode.window.showInformationMessage(
        `Dry run complete. Would remove ${results.success.length} extension(s); would skip ${protectedSkipped.length} protected.`
      );
    } else if (results.skipped.length) {
      void vscode.window.showWarningMessage(
        `Bulk uninstall cancelled. Removed ${results.success.length} extension(s); ${results.skipped.length} were not attempted.`
      );
    } else if (results.failed.length) {
      const failureSummary = results.failed
        .slice(0, 3)
        .map((item) => `${item.label}: ${item.reason}`)
        .join(" | ");

      const retrySelection = await vscode.window.showWarningMessage(
        `Removed ${results.success.length} extension(s). ${results.failed.length} failed. ${failureSummary}`,
        "Retry Failed"
      );

      if (retrySelection === "Retry Failed") {
        await this.handleRetryFailed(results.failed.map((item) => item.id));
        return false;
      }
    } else {
      let message = `Removed ${results.success.length} extension(s).`;
      let actions: string[] = [];

      if (results.pendingRestart.length) {
        message += ` ${results.pendingRestart.length} are pending restart. Open VS Code's Extensions view to use the native Restart Extensions action.`;
        actions = ["Open Restart Screen", "Reload Window"];
      }

      const selection = await vscode.window.showInformationMessage(
        message,
        ...actions
      );

      if (selection === "Open Restart Screen") {
        await this.openRestartScreen();
      } else if (selection === "Reload Window") {
        await this.reloadWindow();
      }
    }

    return true;
  }

  private async postProgress(payload: Omit<ProgressMessage, "type">): Promise<void> {
    if (!this.view) {
      return;
    }

    await this.view.webview.postMessage({
      type: "progress",
      ...payload
    });
  }

  private async openRestartScreen(): Promise<void> {
    const extensionIds = this.pendingRestartRemovals.map((item) => item.id);

    try {
      const commands = await vscode.commands.getCommands(true);
      if (!commands.includes("workbench.extensions.action.showExtensionsWithIds")) {
        throw new Error(
          "Command workbench.extensions.action.showExtensionsWithIds is not available."
        );
      }

      await vscode.commands.executeCommand(
        "workbench.extensions.action.showExtensionsWithIds",
        extensionIds
      );
    } catch (error) {
      console.warn(
        "Bulk Extension Remover: opening the native restart screen failed; falling back to Extensions view.",
        error
      );
      await vscode.commands.executeCommand("workbench.view.extensions");
    }
  }

  private async reloadWindow(): Promise<void> {
    await vscode.commands.executeCommand("workbench.action.reloadWindow");
  }
}
