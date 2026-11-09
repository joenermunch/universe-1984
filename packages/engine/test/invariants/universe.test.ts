import { describe, expect, it } from "vitest";
import { Builder } from "../../src/universe/build.ts";
import { printFrame } from "../../src/print/frame.ts";
import { SCALES } from "../../src/model/world.ts";
import { FRAGMENTS } from "../../src/library/fragments.ts";
import { Planner } from "../../src/planner/planner.ts";
import { print1987 } from "../../src/planner/trace.ts";
import { parse } from "../../src/sexpr.ts";

const SEEDS = Array.from({ length: 200 }, (_, i) => i + 1);

describe("universe construction invariants (B-14, B-17)", () => {
  it.each(SEEDS)("seed %i is consistent", (seed) => {
    const w = new Builder({ seed }).build();
    const ids = new Set(w.persons.keys());
    for (const p of w.persons.values()) {
      expect(p.born, "every person has a birth year").not.toBeNull();
      if (p.died !== null) expect(p.died).toBeGreaterThanOrEqual(p.born!);
      // no two simultaneous marriages
      const spans = p.marriages.map((id) => w.marriages.get(id)!).map((m) => [m.start!, m.end ?? 9999] as const).sort((a, b) => a[0] - b[0]);
      for (let i = 1; i < spans.length; i++) expect(spans[i]![0], `overlapping marriages for ${p.id}`).toBeGreaterThanOrEqual(spans[i - 1]![1]);
      // married at 18 or older, before death
      for (const id of p.marriages) {
        const m = w.marriages.get(id)!;
        expect(m.start! - p.born!).toBeGreaterThanOrEqual(18);
        if (p.died !== null) expect(m.start!).toBeLessThanOrEqual(p.died);
      }
      // children born during the parents' marriage, after both parents
      if (p.parents) {
        const m = w.marriages.get(p.parents)!;
        expect(p.born!).toBeGreaterThanOrEqual(m.start!);
        if (m.end !== null) expect(p.born!).toBeLessThanOrEqual(m.end);
        for (const par of w.parentsOf(p)) expect(p.born!).toBeGreaterThan(par.born!);
      }
      // stereotypes exist; every IPR value within range
      for (const s of p.stereotypes) expect(w.stereotypes.has(s), s).toBe(true);
      // every history entry has a year in the past
      for (const h of p.history) expect(h.year).toBeLessThanOrEqual(w.year);
    }
    for (const m of w.marriages.values()) {
      const h = w.get(m.husband), f = w.get(m.wife);
      expect(h.sex).toBe("M"); expect(f.sex).toBe("F");
      expect(w.directlyRelated(h, f), "no marriage to a direct relative").toBe(false);
    }
    for (const r of w.rels.values()) {
      expect(ids.has(r.a) && ids.has(r.b)).toBe(true);
      for (const s of SCALES) for (const v of r.values[s] ?? []) if (v !== null) { expect(v).toBeGreaterThanOrEqual(-10); expect(v).toBeLessThanOrEqual(10); }
    }
    // first names unique except families share surnames [V] L84-TR p. 12
    const firsts = [...w.persons.values()].map((p) => p.first);
    expect(new Set(firsts).size).toBe(firsts.length);
  });

  it("is deterministic: same seed ⇒ identical frames (D-1)", () => {
    const a = new Builder({ seed: 42 }).build(), b = new Builder({ seed: 42 }).build();
    const dump = (w: typeof a) => [...w.persons.values()].map((p) => printFrame(w, p).join("\n")).join("\n\n");
    expect(dump(a)).toBe(dump(b));
  });

  it("queue-based cycling produces families, unrelated characters, and historical IPRs", () => {
    let married = 0, withHistory = 0, children = 0;
    for (const seed of SEEDS.slice(0, 50)) {
      const w = new Builder({ seed }).build();
      married += [...w.marriages.values()].length;
      children += [...w.persons.values()].filter((p) => p.parents).length;
      withHistory += [...w.persons.values()].filter((p) => p.history.length).length;
    }
    expect(married).toBeGreaterThan(50);
    expect(children).toBeGreaterThan(50);
    expect(withHistory).toBeGreaterThan(50);
  });
});

describe("planner invariants", () => {
  it.each(SEEDS.slice(0, 50))("seed %i: churn on generated lovers terminates within budget, told events are never retracted", (seed) => {
    const w = new Builder({ seed }).build();
    const adults = [...w.persons.values()].filter((p) => w.alive(p) && w.isAdult(p));
    const her = adults.find((p) => p.sex === "F" && w.spouse(p));
    const him = adults.find((p) => p.sex === "M" && w.available(p) && her && !w.directlyRelated(p, her));
    if (!her || !him) return;
    w.setIpr(her, him, "pos-neg", 8); w.setIpr(him, her, "pos-neg", 8); w.setIpr(her, him, "attract", 8); w.setIpr(him, her, "attract", 8);
    w.setTogether(her, him, true);
    her.symbol = "HER"; him.symbol = "HIM";
    const p = new Planner(w, FRAGMENTS, { seed, version: "U87", budget: 60 });
    const before: string[] = [];
    const { trace } = p.tell([parse("(churn him her)")]);
    for (const e of trace) if (e.t === "out") before.push(e.text);
    expect(trace.filter((e) => e.t === "goal").length).toBeLessThanOrEqual(60);
    expect(p.outline).toEqual(before); // outline only grows, in order
    expect(print1987(trace).length).toBeGreaterThan(0);
  });
});
