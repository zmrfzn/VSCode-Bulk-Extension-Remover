import assert from "node:assert/strict";
import { describeUninstallFailure } from "../../domain/failures";

suite("describeUninstallFailure", () => {
  const item = {
    id: "publisher.extension",
    label: "Extension"
  };

  test("normalizes dependency failures", () => {
    const failure = describeUninstallFailure(
      item,
      new Error("Cannot uninstall because another extension depends on it")
    );

    assert.match(failure.reason, /Dependency guardrail/);
  });

  test("preserves unknown failure messages", () => {
    const failure = describeUninstallFailure(item, new Error("Unexpected"));

    assert.equal(failure.reason, "Unexpected");
    assert.equal(failure.message, "Unexpected");
  });
});
