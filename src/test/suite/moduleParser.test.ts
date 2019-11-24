import * as assert from "assert";

import * as moduleParser from "../../moduleParser";
import { ElixirModule } from "../../ElixirModule";

const elixirModuleContent = `
defmodule Sample do
  def a() do
  end

  def b() do
  end

  def c() do
  end
end
`;

suite("moduleParser Test Suite", () => {
  test("parse returns ElixirModule Instance", () => {
    const result: ElixirModule = moduleParser.parse(elixirModuleContent);

    assert.equal("Sample", result.name);
    assert.deepEqual(["a", "b", "c"], result.functions);
  });
});
