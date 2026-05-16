import assert from "node:assert/strict";
import * as vscode from "vscode";
import { FOCUS_COMMAND } from "../../../constants";

suite("extension smoke", () => {
  test("registers the focus command", async () => {
    const extension = vscode.extensions.getExtension(
      "zmrfzn.vscode-bulk-extension-remover"
    );

    assert.ok(extension);
    await extension.activate();

    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes(FOCUS_COMMAND));
  });
});
