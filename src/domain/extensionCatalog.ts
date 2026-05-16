export interface ExtensionPackageJson {
  readonly name?: string;
  readonly displayName?: string;
  readonly publisher?: string;
  readonly version?: string;
  readonly description?: string;
  readonly isBuiltin?: boolean;
}

export interface ExtensionReference {
  readonly id: string;
  readonly packageJSON: ExtensionPackageJson;
}

export interface ExtensionListItem {
  readonly id: string;
  readonly displayName: string;
  readonly publisher: string;
  readonly version: string;
  readonly description: string;
  readonly isProtected: boolean;
}

export interface PendingRestartRemoval {
  readonly id: string;
  readonly label: string;
  readonly reason?: string;
}

export function getExtensionLabel(extension: ExtensionReference): string {
  return extension.packageJSON.displayName || extension.packageJSON.name || extension.id;
}

export function listInstalledExtensions(
  extensions: readonly ExtensionReference[],
  options: {
    readonly selfExtensionId: string;
    readonly hiddenExtensionIds: ReadonlySet<string>;
    readonly pendingRestartRemovals: readonly PendingRestartRemoval[];
    readonly isProtected: (extensionId: string) => boolean;
  }
): ExtensionListItem[] {
  return extensions
    .filter((extension) => !extension.packageJSON.isBuiltin)
    .filter((extension) => extension.id !== options.selfExtensionId)
    .filter((extension) => !options.hiddenExtensionIds.has(extension.id))
    .filter(
      (extension) =>
        !options.pendingRestartRemovals.some((item) => item.id === extension.id)
    )
    .map((extension) => ({
      id: extension.id,
      displayName: getExtensionLabel(extension),
      publisher: extension.packageJSON.publisher || "",
      version: extension.packageJSON.version || "",
      description: extension.packageJSON.description || "",
      isProtected: options.isProtected(extension.id)
    }))
    .sort((left, right) =>
      left.displayName.localeCompare(right.displayName, undefined, {
        sensitivity: "base"
      })
    );
}
