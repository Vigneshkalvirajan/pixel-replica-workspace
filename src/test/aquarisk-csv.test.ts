import { describe, expect, it } from "vitest";

import { REQUIRED_FEATURE_COUNT, parseCsv, validateCsv } from "@/lib/aquarisk-csv";

const validRow = Array.from({ length: REQUIRED_FEATURE_COUNT }, (_, index) => String(index + 1));

describe("AquaRisk CSV validation", () => {
  it("accepts a row with exactly 124 numeric features", () => {
    const result = validateCsv(validRow.join(","));

    expect(REQUIRED_FEATURE_COUNT).toBe(124);
    expect(result.valid).toBe(true);
    expect(result.rows[0]).toHaveLength(124);
  });

  it("reports rows with missing features", () => {
    const result = validateCsv(validRow.slice(0, 123).join(","));

    expect(result.valid).toBe(false);
    expect(result.issues[0]).toEqual({ kind: "column-count", row: 1, actual: 123 });
  });

  it("reports rows with extra features", () => {
    const result = validateCsv([...validRow, "125"].join(","));

    expect(result.valid).toBe(false);
    expect(result.issues[0]).toEqual({ kind: "column-count", row: 1, actual: 125 });
  });

  it("rejects non-numeric feature values", () => {
    const row = [...validRow];
    row[5] = "rainy";
    const result = validateCsv(row.join(","));

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual({
      kind: "non-numeric",
      row: 1,
      column: 6,
      value: "rainy",
    });
  });

  it("rejects empty input and parses quoted numeric values", () => {
    expect(validateCsv(" \r\n").issues).toEqual([{ kind: "empty" }]);
    expect(parseCsv(`"1",${validRow.slice(1).join(",")}`)[0]?.[0]).toBe("1");
  });
});