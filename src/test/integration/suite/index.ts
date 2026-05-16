import Mocha from "mocha";
import * as path from "node:path";

export function run(): Promise<void> {
  const mocha = new Mocha({
    color: true,
    ui: "tdd"
  });

  mocha.addFile(path.resolve(__dirname, "extension.test.js"));

  return new Promise((resolve, reject) => {
    mocha.run((failures: number) => {
      if (failures > 0) {
        reject(new Error(`${failures} integration test(s) failed.`));
      } else {
        resolve();
      }
    });
  });
}
