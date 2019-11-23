export class ElixirModule {
	name: string | null;
	functions: string[];

	constructor(name: string | null, functions: string[]) {
		this.name = name;
		this.functions = functions;
	}

}