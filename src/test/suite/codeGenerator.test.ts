import * as assert from "assert";

import * as codeGenator from "../../codeGenerator";
import { ElixirModule } from "../../ElixirModule";

suite("codeGenator Test Suite", () => {
  test("generateTestCode returns Elixir test code string", () => {
    const elixirModule: ElixirModule = new ElixirModule("Sample", [
      "a",
      "b",
      "c"
    ]);
    const expected: string = [
      "defmodule SampleTest do",
      "  use ExUnit.Case",
      "",
      '  describe "a" do',
      "  end",
      "",
      '  describe "b" do',
      "  end",
      "",
      '  describe "c" do',
      "  end",
      "end",
      ""
    ].join("\n");

    assert.equal(
      codeGenator.generateTestCode(elixirModule, "ExUnit.Case"),
      expected
    );
  });
});
