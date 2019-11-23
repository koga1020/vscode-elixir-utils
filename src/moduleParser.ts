import { ElixirModule } from './ElixirModule';

function getFunctions(body: string) {
	let functionMatch: RegExpMatchArray | null;

	functionMatch = body.match(/def .*\([^\)]*\)\s*do/g);

	if (functionMatch) {
		return functionMatch.map(defStatement => {
			let match = defStatement.match(/def (.*)\(/);
			if (match) {
				let functionName: string = match[1];
				return functionName;
			} else {
				return "";
			}
		})
		.filter(functionName => functionName !== "");
		
	} else {
		return [];
	}

}

function getModuleName(body: string) {
	let match: RegExpMatchArray | null;
	match = body.match(/defmodule (.*) do/);

	if (match) {
		let moduleName: string = match[1];
		return moduleName;
	} else {
		return "";
	}

}

export function parse(body: string) {

	let moduleName: string;
	let functions: string[];

	moduleName = getModuleName(body);
	functions = getFunctions(body);

	return new ElixirModule(moduleName, functions);
}
