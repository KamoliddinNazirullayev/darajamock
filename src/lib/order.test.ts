import { describe, expect, it } from "vitest";
import { sortedKeys } from "./order";

describe("sortedKeys", () => {
  it("rim raqamlari jsonb tartibidan tiklanadi", () => {
    expect(sortedKeys(["I", "II", "IV", "III"])).toEqual(["I", "II", "III", "IV"]);
  });
  it("arab raqamlari son bo'yicha, harflar alifbo bo'yicha", () => {
    expect(sortedKeys(["10", "2", "1"])).toEqual(["1", "2", "10"]);
    expect(sortedKeys(["c", "a", "f", "b"])).toEqual(["a", "b", "c", "f"]);
  });
});
