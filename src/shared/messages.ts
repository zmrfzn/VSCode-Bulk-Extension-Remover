import type { ExtensionListItem, PendingRestartRemoval } from "../domain/extensionCatalog";
import type { UninstallFailure } from "../domain/failures";

export type WebviewToExtensionMessage =
  | { readonly type: "ready" }
  | { readonly type: "refresh" }
  | {
      readonly type: "uninstall";
      readonly extensionIds?: readonly string[];
      readonly dryRun?: boolean;
    }
  | { readonly type: "retryFailed"; readonly extensionIds?: readonly string[] }
  | {
      readonly type: "toggleProtected";
      readonly extensionId?: string;
      readonly protected?: boolean;
    }
  | { readonly type: "openRestartScreen" }
  | { readonly type: "reloadWindow" };

export interface ExtensionsMessage {
  readonly type: "extensions";
  readonly extensions: readonly ExtensionListItem[];
  readonly pendingRestartRemovals: readonly PendingRestartRemoval[];
  readonly protectedCount: number;
}

export type ProgressPhase =
  | "running"
  | "itemComplete"
  | "cancelled"
  | "complete";

export interface ProgressMessage {
  readonly type: "progress";
  readonly phase: ProgressPhase;
  readonly current?: number;
  readonly total?: number;
  readonly dryRun?: boolean;
  readonly id?: string;
  readonly label?: string;
  readonly status?: "dryRun" | "pendingRestart" | "success" | "failed";
  readonly message?: string;
  readonly successCount?: number;
  readonly pendingRestartCount?: number;
  readonly pendingRestart?: readonly string[];
  readonly failureCount?: number;
  readonly failures?: readonly UninstallFailure[];
  readonly skippedCount?: number;
  readonly skipped?: readonly PendingRestartRemoval[];
  readonly protectedSkippedCount?: number;
  readonly protectedSkipped?: readonly PendingRestartRemoval[];
}
