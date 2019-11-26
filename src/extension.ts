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

  let setupPhoenixDepsCommand = vscode.commands.registerCommand(
    "extension.setupPhoenixDeps",
    () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;

      if (workspaceFolders !== undefined && workspaceFolders.length > 0) {
        updateDeps(workspaceFolders[0]);
      }
    }
  );
  context.subscriptions.push(createTestFileCmd);
  context.subscriptions.push(setupPhoenixDepsCommand);
}

export async function updateDeps(workspaceFolder: vscode.WorkspaceFolder) {
  const mixPath = path.join(workspaceFolder.uri.path, "mix.exs");

  const mixFileContent = await vscode.workspace.fs.readFile(
    vscode.Uri.file(mixPath)
  );

  const appendDeps = [
    '{:credo, "~> 1.1.0", only: [:dev, :test], runtime: false}',
    '{:mix_test_watch, "~> 0.8", only: :dev, runtime: false}',
    '{:ex_machina, "~> 2.3", only: :test}'
  ]
    .join(",\n      ")
    .concat(",\n      ");

  const updateMixFileContent = mixFileContent
    .toString()
    .replace(
      /defp deps do\n    \[\n      /,
      `defp deps do\n    \[\n      ${appendDeps}`
    );

  await vscode.workspace.fs.writeFile(
    vscode.Uri.file(mixPath),
    Buffer.from(updateMixFileContent)
  );
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
