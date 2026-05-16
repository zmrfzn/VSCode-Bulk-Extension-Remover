import type { ExtensionReference, PendingRestartRemoval } from "./extensionCatalog";
import { getExtensionLabel } from "./extensionCatalog";

export interface UninstallPlan {
  readonly removable: ExtensionReference[];
  readonly protectedSkipped: PendingRestartRemoval[];
}

export function createUninstallPlan(
  extensionIds: readonly string[],
  options: {
    readonly getExtension: (extensionId: string) => ExtensionReference | undefined;
    readonly isProtected: (extensionId: string) => boolean;
  }
): UninstallPlan {
  const removable: ExtensionReference[] = [];
  const protectedSkipped: PendingRestartRemoval[] = [];

  for (const id of extensionIds) {
    const extension = options.getExtension(id);
    if (!extension) {
      continue;
    }

    if (options.isProtected(extension.id)) {
      protectedSkipped.push({
        id: extension.id,
        label: getExtensionLabel(extension),
        reason: "Protected"
      });
    } else {
      removable.push(extension);
    }
  }

  return {
    removable,
    protectedSkipped
  };
}
