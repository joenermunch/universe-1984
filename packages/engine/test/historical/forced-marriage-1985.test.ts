import { describe, expect, it } from "vitest";
import { FRAGMENTS } from "../../src/library/fragments.ts";
import { generalize } from "../../src/learning/generalize.ts";
import { Planner } from "../../src/planner/planner.ts";
import { print1985 } from "../../src/planner/trace.ts";
import { parse } from "../../src/sexpr.ts";
import { cast, compareStructural, fixture, normalize } from "./helpers.ts";

const raw = (fx: { lines: { raw: string }[] }) => fx.lines.map((l) => l.raw);

describe("L85-TR Fig. 4, forced-marriage, single goal (B-1..B-4, B-9, B-10)", () => {
  it("reproduces goals, plans, candidates, fillers and outline structurally", () => {
    const w = cast("dool-1985-figs4-5.json");
    const p = new Planner(w, FRAGMENTS, {
      seed: 1, version: "U85",
      // documented random choice points only ("Several plans to choose from", candidate lists)
      script: { "fragment:churn": "FORCED-MARRIAGE", "filler:?worrier": "MARLENA", "fragment:together": "SEDUCTION", "filler:?seducer": "DAPHNE", "fragment:eliminate": "ATTEMPTED-MURDER", "filler:?killer": "RENEE" },
    });
    const { trace } = p.tell([parse("(churn neil liz)")]);
    const r = compareStructural(normalize(raw(fixture("trace-1985-fig4-churn-neil-liz.json"))), normalize(print1985(trace)));
    expect(r.ok, r.diff).toBe(true);
  });
});

describe("L85-TR Fig. 5, same situation with extra goal (B-5, B-7, B-8)", () => {
  it("chooses RENEE opportunistically, excludes her as killer, never works on the satisfied seed goal", () => {
    const w = cast("dool-1985-figs4-5.json");
    const p = new Planner(w, FRAGMENTS, {
      seed: 1, version: "U85",
      script: { "fragment:churn": "FORCED-MARRIAGE", "filler:?worrier": "MARLENA", "fragment:eliminate": "ATTEMPTED-MURDER" },
    });
    const { trace } = p.tell([parse("(churn liz neil)"), parse("(together renee neil)")]);
    const r = compareStructural(normalize(raw(fixture("trace-1985-fig5-churn-with-extra-goal.json"))), normalize(print1985(trace)));
    expect(r.ok, r.diff).toBe(true);
  });
});

describe("L85-TR Figs. 9–10, constraint generalisation (B-13)", () => {
  const fm = FRAGMENTS.find((f) => f.name === "FORCED-MARRIAGE")!;
  it("derives exactly the Fig. 9 constraints", () => {
    const g = generalize(fm);
    const want = fixture("plot-fragment-forced-marriage.json").generalized_constraints_forced_marriage0.constraints;
    // our executable form carries explicit binding args (D-4); compare predicate + first arg + thresholds
    const shape = (c: unknown[]) => (Array.isArray(c[1]) ? [c[0], (c[1] as unknown[])[0], (c[1] as unknown[])[1], (c[1] as unknown[])[2], c[2]] : [c[0], c[1]]);
    expect(g.name).toBe("FORCED-MARRIAGE0");
    expect(g.constraints.map((c) => shape(c as unknown[]))).toEqual(want.map((c: unknown[]) => shape(c)));
  });
  it("forced-marriage0 applies to DAVID/RENEE where forced-marriage does not, and the outline matches Fig. 10", () => {
    const w = cast("dool-1985-fig10.json");
    const lib = [...FRAGMENTS, generalize(fm)];
    const p = new Planner(w, lib, {
      seed: 1, version: "U85",
      script: { "filler:?worrier": "MARLENA", "fragment:together": "SEDUCTION", "filler:?target": "ROMAN", "fragment:eliminate": "ATTEMPTED-MURDER" },
      budget: 7,
    });
    const { trace } = p.tell([parse("(churn david renee)")]);
    const ours = normalize(print1985(trace));
    const pub = normalize(raw(fixture("trace-1985-fig10-forced-marriage0.json")));
    expect(ours.filter((e) => e.k === "using")[0]?.v).toBe("FORCED-MARRIAGE0");
    expect(ours[1]?.k).toBe("using"); // FORCED-MARRIAGE not applicable: no alternatives listed for the top goal
    const keep = (e: { k: string }) => e.k === "goal" || e.k === "out";
    expect(ours.filter(keep).slice(0, pub.filter(keep).length)).toEqual(pub.filter(keep));
  });
});
