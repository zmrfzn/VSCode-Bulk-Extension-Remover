import assert from "node:assert/strict";
import type { ExtensionReference } from "../../domain/extensionCatalog";
import { createUninstallPlan } from "../../domain/uninstallPlan";

suite("createUninstallPlan", () => {
  const extensions = new Map<string, ExtensionReference>([
    [
      "publisher.alpha",
      {
        id: "publisher.alpha",
        packageJSON: {
          displayName: "Alpha"
        }
      }
    ],
    [
      "publisher.beta",
      {
        id: "publisher.beta",
        packageJSON: {
          name: "beta"
        }
      }
    ]
  ]);

  test("returns removable extensions in requested order", () => {
    const plan = createUninstallPlan(["publisher.beta", "publisher.alpha"], {
      getExtension: (extensionId) => extensions.get(extensionId),
      isProtected: () => false
    });

    assert.deepEqual(
      plan.removable.map((extension) => extension.id),
      ["publisher.beta", "publisher.alpha"]
    );
    assert.deepEqual(plan.protectedSkipped, []);
  });

  test("skips protected extensions with labels", () => {
    const plan = createUninstallPlan(["publisher.alpha", "publisher.beta"], {
      getExtension: (extensionId) => extensions.get(extensionId),
      isProtected: (extensionId) => extensionId === "publisher.alpha"
    });

    assert.deepEqual(
      plan.removable.map((extension) => extension.id),
      ["publisher.beta"]
    );
    assert.deepEqual(plan.protectedSkipped, [
      {
        id: "publisher.alpha",
        label: "Alpha",
        reason: "Protected"
      }
    ]);
  });

  test("ignores ids that VS Code can no longer resolve", () => {
    const plan = createUninstallPlan(["missing.extension"], {
      getExtension: (extensionId) => extensions.get(extensionId),
      isProtected: () => false
    });

    assert.deepEqual(plan.removable, []);
    assert.deepEqual(plan.protectedSkipped, []);
  });
});
