import { describe, expect, it } from "vitest";
import { FRAGMENTS } from "../../src/library/fragments.ts";
import { STEREOTYPES, REL_STEREOTYPES } from "../../src/library/stereotypes.ts";
import { HISTORICAL_PLOTS } from "../../src/library/historical-plots.ts";
import { Planner } from "../../src/planner/planner.ts";
import { toJSONL } from "../../src/planner/trace.ts";
import { parse } from "../../src/sexpr.ts";
import { cast } from "../historical/helpers.ts";

const TIERS = ["verified", "inferred", "experimental"];

describe("fidelity tags (docs/fidelity-policy.md §1)", () => {
  it("every library item carries a tier and a source", () => {
    for (const f of FRAGMENTS) { expect(TIERS, f.name).toContain(f.tier); expect(f.sources.length, f.name).toBeGreaterThan(0); }
    for (const s of STEREOTYPES) { expect(TIERS, s.name).toContain(s.tier); expect(s.source, s.name).toBeTruthy(); }
    for (const r of REL_STEREOTYPES) expect(TIERS, r.name).toContain(r.tier);
    for (const h of HISTORICAL_PLOTS) expect(TIERS, h.name).toContain(h.tier);
  });
  it("only forced-marriage is tagged verified among fragments; the three Fig. 3 stereotypes among stereotypes", () => {
    expect(FRAGMENTS.filter((f) => f.tier === "verified").map((f) => f.name)).toEqual(["FORCED-MARRIAGE"]);
    expect(STEREOTYPES.filter((s) => s.tier === "verified").map((s) => s.name).sort()).toEqual(["lawyer", "swinger", "waiter"]);
  });
  it("the historical library contains no experimental items", () => {
    expect([...FRAGMENTS, ...STEREOTYPES].filter((x) => x.tier === "experimental")).toEqual([]);
  });
});

describe("deterministic replay (D-1)", () => {
  it("same seed and inputs ⇒ identical JSONL event log", () => {
    const run = () => { const p = new Planner(cast("dool-1985-figs4-5.json"), FRAGMENTS, { seed: 99, version: "U87", budget: 40 }); p.tell([parse("(churn neil liz)")]); return toJSONL(p.trace); };
    const a = run();
    expect(a.length).toBeGreaterThan(0);
    expect(run()).toBe(a);
  });
});

describe("open-ended continuation (spec §6.9)", () => {
  it("an episode split at its budget and resumed equals one uninterrupted run", () => {
    const mk = () => new Planner(cast("dool-1985-figs4-5.json"), FRAGMENTS, { seed: 5, version: "U87", budget: 6 });
    const a = mk(); a.tell([parse("(churn neil liz)")]);
    const firstEpisode = [...a.outline];
    expect(a.pending()).toBeGreaterThan(0);
    a.resume(30);
    const b = new Planner(cast("dool-1985-figs4-5.json"), FRAGMENTS, { seed: 5, version: "U87", budget: 36 });
    b.tell([parse("(churn neil liz)")]);
    expect(a.outline).toEqual(b.outline);
    expect(a.outline.slice(0, firstEpisode.length)).toEqual(firstEpisode);
    expect(a.outline.length).toBeGreaterThan(firstEpisode.length);
  });
});

describe("trace goal depth (planner inspector)", () => {
  it("seed goals are depth 0 and subgoals are deeper than the goal they expand", async () => {
    const { Builder, Planner, FRAGMENTS } = await import("../../src/index.ts");
    const w = new Builder({ seed: 1 }).build();
    const rose = [...w.persons.values()].find((p) => p.first === "Rose")!;
    const phil = [...w.persons.values()].find((p) => p.first === "Phil")!;
    for (const [a, b] of [[rose, phil], [phil, rose]] as const) { w.setIpr(a, b, "pos-neg", 8); w.setIpr(a, b, "attract", 8); }
    w.setTogether(rose, phil, true);
    const p = new Planner(w, FRAGMENTS, { seed: 1, version: "U90", names: "full", budget: 40 });
    const { trace } = p.tell([["churn", phil, rose] as never]);
    const depths = trace.flatMap((e) => (e.t === "goal" ? [e.depth ?? -1] : []));
    expect(depths[0]).toBe(0);
    expect(depths.every((d) => d >= 0)).toBe(true);
    expect(Math.max(...depths)).toBeGreaterThan(1);
  });
});
