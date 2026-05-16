export interface QueueItem {
  readonly id: string;
  readonly label: string;
}

export interface UninstallFailure {
  readonly id: string;
  readonly label: string;
  readonly message: string;
  readonly reason: string;
}

export function describeUninstallFailure(
  item: QueueItem,
  error: unknown
): UninstallFailure {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();
  let reason = message || "VS Code did not provide a detailed failure reason.";

  if (
    normalized.includes("depend") ||
    normalized.includes("required by") ||
    normalized.includes("extension pack")
  ) {
    reason =
      "Dependency guardrail: another extension may depend on this item, or it may belong to an extension pack. Remove dependents first, then retry.";
  } else if (normalized.includes("cancel") || normalized.includes("user")) {
    reason = "The uninstall was cancelled before VS Code completed it.";
  } else if (
    normalized.includes("not found") ||
    normalized.includes("does not exist")
  ) {
    reason =
      "VS Code could not find this extension anymore. Refresh the list and retry if it still appears.";
  } else if (normalized.includes("disabled")) {
    reason =
      "VS Code reported a disabled-extension state while uninstalling. Refresh, reload the window, and retry.";
  }

  return {
    id: item.id,
    label: item.label,
    message,
    reason
  };
}
