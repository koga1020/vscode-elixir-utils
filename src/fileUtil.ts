import * as vscode from "vscode";

export async function writeFile(path: string, content: string) {
  await vscode.workspace.fs.writeFile(
    vscode.Uri.file(path),
    Buffer.from(content)
  );
}

export async function readFile(path: string) {
  const result = await vscode.workspace.fs.readFile(vscode.Uri.file(path));

  return result.toString();
}
