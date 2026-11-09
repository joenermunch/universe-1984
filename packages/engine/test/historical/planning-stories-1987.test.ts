import { describe, expect, it } from "vitest";
import { FRAGMENTS } from "../../src/library/fragments.ts";
import { Planner } from "../../src/planner/planner.ts";
import { print1987 } from "../../src/planner/trace.ts";
import { parse } from "../../src/sexpr.ts";
import { cast, fixture } from "./helpers.ts";

const pub = (f: string) => (fixture(f).lines as { raw: string; type: string }[]).filter((l) => l.type !== "editorial").map((l) => l.raw);

describe("L87 Fig. 2, candidate enumeration with bindings (B-3, B-11, B-12)", () => {
  const run = () => {
    const w = cast("universe-1987-joshua-fran.json");
    const p = new Planner(w, FRAGMENTS, {
      seed: 1, version: "U87", budget: 4,
      script: { "fragment:churn": ["LOVERS-FIGHT", "COLLEAGUE-AFFAIR"], "binding:LOVERS-FIGHT": "HIM/FRAN HER/JOSHUA", "binding:PERSONAL-FIGHT": "A/JOSHUA B/FRAN SUBJECT/MONEY", "deferred:?colleague": "JACK" },
    });
    p.tell([parse("(churn JOSHUA FRAN)")]);
    return print1987(p.trace);
  };
  it("prints the published trace line for line up to the figure's end", () => {
    const want = pub("trace-1987-fig2-churn-joshua-fran.json");
    expect(run().slice(0, want.length)).toEqual(want);
  });
});

describe("L87 Fig. 3, opportunistic fragment choice (B-6)", () => {
  it("picks ACCIDENT-BREAKUP with THIRD-PARTY/VALERIE without listing alternatives", () => {
    const w = cast("universe-1987-joshua-fran.json");
    const p = new Planner(w, FRAGMENTS, { seed: 1, version: "U87", budget: 4 });
    p.tell([parse("(churn JOSHUA FRAN)"), parse("(together JOSHUA VALERIE)")]);
    const want = pub("trace-1987-fig3-multigoal.json");
    expect(print1987(p.trace).slice(0, want.length)).toEqual(want);
  });
});
