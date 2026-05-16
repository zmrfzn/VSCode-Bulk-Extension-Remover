import assert from "node:assert/strict";
import { listInstalledExtensions } from "../../domain/extensionCatalog";

suite("listInstalledExtensions", () => {
  test("filters built-ins, self, hidden ids, and pending restart removals", () => {
    const extensions = listInstalledExtensions(
      [
        {
          id: "publisher.visible",
          packageJSON: {
            displayName: "Visible Extension",
            publisher: "publisher",
            version: "1.0.0",
            description: "Shown"
          }
        },
        {
          id: "publisher.hidden",
          packageJSON: {
            displayName: "Hidden"
          }
        },
        {
          id: "publisher.pending",
          packageJSON: {
            displayName: "Pending"
          }
        },
        {
          id: "publisher.self",
          packageJSON: {
            displayName: "Self"
          }
        },
        {
          id: "vscode.builtin",
          packageJSON: {
            displayName: "Built In",
            isBuiltin: true
          }
        }
      ],
      {
        selfExtensionId: "publisher.self",
        hiddenExtensionIds: new Set(["publisher.hidden"]),
        pendingRestartRemovals: [
          {
            id: "publisher.pending",
            label: "Pending"
          }
        ],
        isProtected: (extensionId) => extensionId === "publisher.visible"
      }
    );

    assert.deepEqual(extensions, [
      {
        id: "publisher.visible",
        displayName: "Visible Extension",
        publisher: "publisher",
        version: "1.0.0",
        description: "Shown",
        isProtected: true
      }
    ]);
  });
});
