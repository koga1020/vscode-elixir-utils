import { ElixirModule } from './ElixirModule';

function getFunctions(body: string) {

	let functionMatch: RegExpMatchArray | null;

	functionMatch = body.match(/def .*\([^\)]*\)\s*do/g);

	if (functionMatch) {
		return functionMatch.map(defStatement => defStatement.match(/def (.*)\(/)[1])
	} else {
		return [];
	}

}

function getModuleName(body: string) {
	let match: RegExpMatchArray | null;
	match = body.match(/defmodule (.*) do/);

	if (match) {
		return match[1];
	} else {
		return null;
	}

}

export function parse(body: string) {

	let moduleName: string | null;
	let functions: string[] | null;

	moduleName = getModuleName(body);
	functions = getFunctions(body);

	return new ElixirModule(moduleName, functions);
}
