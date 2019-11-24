// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as mkdirp from "mkdirp";
import * as moduleParser from "./moduleParser";
import * as codeGenerator from "./codeGenerator";
import { ElixirModule } from "./ElixirModule";

const defaultTestHelperModuleName: string = "ExUnit.Case";

export function activate(context: vscode.ExtensionContext) {
  let createTestFileCmd = vscode.commands.registerCommand(
    "extension.createTestFile",
    () => {
      if (vscode.window.activeTextEditor !== undefined) {
        const document = vscode.window.activeTextEditor.document;
        writeTestCodeFile(document).then(dest => {
          vscode.workspace.openTextDocument(dest).then(testFile => {
            vscode.window.showTextDocument(testFile);
          });
        });
      }
    }
  );
  context.subscriptions.push(createTestFileCmd);
}

// this method is called when your extension is deactivated
export function deactivate() {}

export async function selectTestHelper(
  support_dir: string,
  support_files: string[]
) {
  const options: vscode.QuickPickOptions = {
    placeHolder: "Select test helper module"
  };

  return await vscode.window
    .showQuickPick(support_files, options)
    .then(selected => {
      if (selected != undefined) {
        const testHelperFileContent = fs.readFileSync(
          path.join(support_dir, selected),
          "utf8"
        );
        const testHelperModule: ElixirModule = moduleParser.parse(
          testHelperFileContent
        );

        return testHelperModule.name;
      } else {
        return defaultTestHelperModuleName;
      }
    });
}

async function writeTestCodeFile(document: vscode.TextDocument) {
  const support_dir: string = document.uri.path
    .split("/lib/")[0]
    .concat("/test/support");

  let testHelperName: string;
  testHelperName = defaultTestHelperModuleName;

  if (fs.existsSync(support_dir)) {
    const support_files = fs.readdirSync(support_dir);
    if (support_files.length > 0) {
      testHelperName = await selectTestHelper(support_dir, support_files);
    }
  }

  const filePath = document.uri.path;
  const body = document.getText();
  const testFilePath = filePath
    .replace("/lib/", "/test/")
    .replace(".ex", "_test.exs");

  mkdirp(path.dirname(testFilePath), (err, made) => {});

  const elixirModule: ElixirModule = moduleParser.parse(body);

  fs.writeFileSync(
    testFilePath,
    codeGenerator.generateTestCode(elixirModule, testHelperName),
    "utf8"
  );

  vscode.window.showInformationMessage(`create ${testFilePath}.`);

  return testFilePath;
}
