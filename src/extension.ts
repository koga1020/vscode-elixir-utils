// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import * as moduleParser from './moduleParser';
import * as codeGenerator from './codeGenerator';
import { ElixirModule } from './ElixirModule';
import { stringify } from 'querystring';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "elixir-utils" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.createTestFile', () => {

		if (vscode.window.activeTextEditor !== undefined) {
			const document = vscode.window.activeTextEditor.document;
			writeTestCodeFile(document).then(dest => {
				vscode.workspace.openTextDocument(dest).then(testFile => {
					vscode.window.showTextDocument(testFile);
				});
			});

		}


	});
	context.subscriptions.push(disposable);

}


// this method is called when your extension is deactivated
export function deactivate() { }

async function selectTestHelper(support_dir: string, support_files: string[]) {
	const options: vscode.QuickPickOptions = { placeHolder: "Select test helper module" };

	return await vscode.window.showQuickPick(support_files, options).then((selected) => {
		if (selected != undefined) {
			const testHelperFileContent = fs.readFileSync(path.join(support_dir, selected), 'utf8');
			const testHelperModule: ElixirModule = moduleParser.parse(testHelperFileContent);

			return testHelperModule.name;
		} else {
			return "ExUnit.Case";
		}

	});

}

async function writeTestCodeFile(document: vscode.TextDocument) {
	const support_dir: string = document.uri.path.split("/lib/")[0].concat("/test/support");
	let testHelperName: string;
	const support_files = fs.readdirSync(support_dir);

	if (support_files.length > 0) {
		testHelperName = await selectTestHelper(support_dir, support_files);
	} else {
		testHelperName = "ExUnit.Case";
	}

	const filePath = document.uri.path;
	const body = document.getText();
	const testFilePath = filePath
		.replace('/lib/', '/test/')
		.replace('.ex', '_test.exs');

	mkdirp(path.dirname(testFilePath), (err, made) => {});

	const elixirModule: ElixirModule = moduleParser.parse(body);

	fs.writeFileSync(testFilePath, codeGenerator.generateTestCode(elixirModule, testHelperName), 'utf8');

	vscode.window.showInformationMessage(`create ${testFilePath}.`);

	return testFilePath;

}