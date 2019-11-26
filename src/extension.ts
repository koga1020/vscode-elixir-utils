// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as mkdirp from "mkdirp";
import * as moduleParser from "./moduleParser";
import * as codeGenerator from "./codeGenerator";
import * as phoenixTemplates from "./templates/phoenixTemplates";
import * as fileUtil from "./fileUtil";
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

  let setupPhoenixProjectCommand = vscode.commands.registerCommand(
    "extension.setupPhoenixProject",
    () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;

      if (workspaceFolders !== undefined && workspaceFolders.length > 0) {
        const workspaceFolder = workspaceFolders[0];
        updateDeps(workspaceFolder);
        addWorkflowTemplate(workspaceFolder);

        // TODO: use user choice.
        generateDockerFiles("PostgreSQL", workspaceFolder);
        generateDockerCompose(workspaceFolder);
        generateEnvrc(workspaceFolder);
        updateDevConfig(workspaceFolder);
        updateGitIgnore(workspaceFolder);
      }
    }
  );
  context.subscriptions.push(createTestFileCmd);
  context.subscriptions.push(setupPhoenixProjectCommand);
}

export function addWorkflowTemplate(workspaceFolder: vscode.WorkspaceFolder) {
  const workflowDir = path.join(workspaceFolder.uri.path, ".github/workflows");
  mkdirp(workflowDir, (err, made) => {
    console.log(err);
  });

  fileUtil.writeFile(
    path.join(workflowDir, "test.yml"),
    phoenixTemplates.githubActionYmlContent()
  );
}

export function generateDockerFiles(
  db: string,
  workspaceFolder: vscode.WorkspaceFolder
) {
  const dbDockerfileDir = path.join(
    workspaceFolder.uri.path,
    "dockerfiles",
    "db"
  );

  mkdirp(dbDockerfileDir, (err, made) => {});

  fileUtil.writeFile(
    path.join(dbDockerfileDir, "Dockerfile"),
    dbDockerFileContent(db)
  );
}

export function generateDockerCompose(workspaceFolder: vscode.WorkspaceFolder) {
  fileUtil.writeFile(
    path.join(workspaceFolder.uri.path, "docker-compose.yml"),
    phoenixTemplates.dockerComposeFileContent()
  );
}

export function generateEnvrc(workspaceFolder: vscode.WorkspaceFolder) {
  fileUtil.writeFile(
    path.join(workspaceFolder.uri.path, ".envrc.example"),
    phoenixTemplates.envrcContent()
  );
}

export function dbDockerFileContent(db: string) {
  if (db === "PostgreSQL") {
    return phoenixTemplates.postgresqlDockerFileContent();
  } else {
    return "";
  }
}

export async function updateGitIgnore(workspaceFolder: vscode.WorkspaceFolder) {
  const ignoreFilePath = path.join(workspaceFolder.uri.path, ".gitignore");
  const ignoreFileContent = await fileUtil.readFile(ignoreFilePath);

  const updateIgnoreFileContent = ignoreFileContent.concat(
    "\n.elixir_ls/\ndockerfiles/db/"
  );

  fileUtil.writeFile(ignoreFilePath, updateIgnoreFileContent);
}

export async function updateDevConfig(workspaceFolder: vscode.WorkspaceFolder) {
  const devConfigFile = path.join(workspaceFolder.uri.path, "config/dev.exs");

  const content = await fileUtil.readFile(devConfigFile);

  const updateContent = content
    .replace(/username: .*/, 'username: System.fetch_env!("POSTGRES_USER"),')
    .replace(
      /password: .*/,
      'password: System.fetch_env!("POSTGRES_PASSWORD"),'
    )
    .replace(
      /database: .*/,
      'database: System.fetch_env!("POSTGRES_DB"),\n  port: String.to_integer(System.fetch_env!("POSTGRES_PORT")),'
    );

  fileUtil.writeFile(devConfigFile, updateContent);
}

export async function updateDeps(workspaceFolder: vscode.WorkspaceFolder) {
  const mixPath = path.join(workspaceFolder.uri.path, "mix.exs");

  const mixFileContent = await vscode.workspace.fs.readFile(
    vscode.Uri.file(mixPath)
  );

  const appendDeps = phoenixTemplates.appendDepsString();

  const updateMixFileContent = mixFileContent
    .toString()
    .replace(
      /defp deps do\n    \[\n      /,
      `defp deps do\n    \[\n      ${appendDeps}`
    );

  fileUtil.writeFile(mixPath, updateMixFileContent);
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
