import * as path from "node:path";
import * as fs from "node:fs";
import * as os from "node:os";
import { runTests } from "@vscode/test-electron";

async function main(): Promise<void> {
  try {
    delete process.env.NODE_OPTIONS;
    delete process.env.VSCODE_INSPECTOR_OPTIONS;

    const projectRoot = path.resolve(__dirname, "../../..");
    const extensionDevelopmentPath = getExtensionDevelopmentPath(projectRoot);
    const extensionTestsPath = path.join(
      extensionDevelopmentPath,
      "out",
      "test",
      "integration",
      "suite",
      "index"
    );
    const testDataRoot = getTestDataRoot();

    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [
        `--user-data-dir=${path.join(testDataRoot, "user-data")}`,
        `--extensions-dir=${path.join(testDataRoot, "extensions")}`
      ],
      extensionTestsEnv: {
        NODE_OPTIONS: undefined,
        VSCODE_INSPECTOR_OPTIONS: undefined
      }
    });
  } catch (error) {
    console.error("Failed to run integration tests", error);
    process.exit(1);
  }
}

function getExtensionDevelopmentPath(projectRoot: string): string {
  if (process.platform !== "win32" || !projectRoot.includes(" ")) {
    return projectRoot;
  }

  const linkRoot = path.join(getTestDataRoot(), "workspace-link");
  fs.mkdirSync(path.dirname(linkRoot), {
    recursive: true
  });
  fs.rmSync(linkRoot, {
    force: true,
    recursive: true
  });

  try {
    fs.symlinkSync(projectRoot, linkRoot, "junction");
    return linkRoot;
  } catch {
    return projectRoot;
  }
}

function getTestDataRoot(): string {
  return path.join(os.tmpdir(), "vscode-bulk-extension-remover-test");
}

void main();
