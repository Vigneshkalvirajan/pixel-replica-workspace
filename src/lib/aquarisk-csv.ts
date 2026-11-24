export const REQUIRED_FEATURE_COUNT = 124;

export type CsvIssue =
  | { kind: "empty" }
  | { kind: "column-count"; row: number; actual: number }
  | { kind: "non-numeric"; row: number; column: number; value: string };

export type CsvValidation = {
  rows: string[][];
  issues: CsvIssue[];
  valid: boolean;
};

export function parseCsv(text: string): string[][] {
  const source = text.replace(/^\uFEFF/, "");
  if (!source.trim()) return [];

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (character === '"') {
      if (quoted && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (character === "," && !quoted) {
      row.push(field);
      field = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += character;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

export function validateCsv(text: string): CsvValidation {
  const rows = parseCsv(text);
  const issues: CsvIssue[] = [];

  if (rows.length === 0) {
    issues.push({ kind: "empty" });
    return { rows, issues, valid: false };
  }

  rows.forEach((row, rowIndex) => {
    if (row.length !== REQUIRED_FEATURE_COUNT) {
      issues.push({ kind: "column-count", row: rowIndex + 1, actual: row.length });
    }

    row.forEach((value, columnIndex) => {
      const trimmedValue = value.trim();
      if (trimmedValue === "" || !Number.isFinite(Number(trimmedValue))) {
        issues.push({
          kind: "non-numeric",
          row: rowIndex + 1,
          column: columnIndex + 1,
          value,
        });
      }
    });
  });

  return { rows, issues, valid: issues.length === 0 };
}