/**
 * Cross-language parity: the TypeScript engine produces data/fixtures/engine-parity.expected.json,
 * and the Python engine (api/tests/test_parity.py) must reproduce it.
 * Regenerate after an intentional model change with: UPDATE_FIXTURES=1 npm test
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { simulatePath, type Assumptions } from "@/lib/engine";
import { buildPathInput, type PathSelection } from "@/services/catalog";

const dir = resolve(__dirname, "../../data/fixtures");
const cases = JSON.parse(readFileSync(resolve(dir, "engine-parity.cases.json"), "utf8")) as {
  name: string;
  path: PathSelection;
  assumptions: Partial<Assumptions>;
}[];
const expectedPath = resolve(dir, "engine-parity.expected.json");

function compute() {
  return Object.fromEntries(
    cases.map((c) => {
      const r = simulatePath(buildPathInput(c.path), c.assumptions);
      const { firstYearBudget, ...summary } = r.summary;
      void firstYearBudget;
      return [c.name, { summary, netWorth: r.rows.map((row) => row.netWorth), gross: r.rows.map((row) => row.gross) }];
    }),
  );
}

describe("engine parity fixture", () => {
  const actual = compute();
  if (process.env.UPDATE_FIXTURES || !existsSync(expectedPath)) {
    writeFileSync(expectedPath, JSON.stringify(actual, null, 1) + "\n");
  }
  const expected = JSON.parse(readFileSync(expectedPath, "utf8"));

  for (const c of cases) {
    it(`matches the committed fixture: ${c.name}`, () => {
      const a = actual[c.name];
      const e = expected[c.name];
      for (const [k, v] of Object.entries(e.summary)) {
        const got = (a.summary as Record<string, unknown>)[k];
        if (typeof v === "number") expect(got as number).toBeCloseTo(v, 4);
        else expect(got).toEqual(v);
      }
      a.netWorth.forEach((v: number, i: number) => expect(v).toBeCloseTo(e.netWorth[i], 4));
    });
  }
});
