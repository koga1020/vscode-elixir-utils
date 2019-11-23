import { ElixirModule } from './ElixirModule';

export function generateTestCode(elixirModule: ElixirModule) {
    let testModuleName: string;
    let testCodeBody: string;

    testModuleName = elixirModule.name.concat("Test");
    testCodeBody = elixirModule.functions.map(functionName => {
        return `  describe "${functionName}" do\n  end`;
    }).join("\n\n");

    return `defmodule ${testModuleName} do\n${testCodeBody}\nend\n`;
}