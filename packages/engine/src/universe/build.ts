import { HISTORICAL_PLOTS, type HistoricalPlot } from "../library/historical-plots.ts";
import { BACKGROUNDS, FIRST_F, FIRST_M, NATIONALITIES, RACES, RELIGIONS, SURNAMES } from "../library/names.ts";
import { REL_STEREOTYPES, STEREOTYPES } from "../library/stereotypes.ts";
import { NUMERIC_TRAITS, RANGES, type NumericTrait, type Version } from "../model/traits.ts";
import { World, type Marriage, type Person, type Sex } from "../model/world.ts";
import { Rng, type ChoiceScript } from "../rng.ts";
import { createToSpecification, silent, type Dialog } from "./create-to-spec.ts";

/** Universe-construction parameters. All INFERRED (spec §2.2–2.5) unless noted. */
export interface BuildOptions {
  seed: number;
  version?: Version;
  presentYear?: number; // [I] 1984 for U84
  patriarchs?: number; // [I]
  pExistingSpouse?: number; // [I] Fig. 9 "OR" branch
  maxMarriages?: number; // [I] "no one is married and divorced 62 times"
  historicalPlotRatio?: number; // [I]
  script?: ChoiceScript;
  log?: (e: BuildEvent) => void;
}
export type BuildEvent = { kind: "cycle-person" | "cycle-marriage" | "finish" | "historical-plot" | "create"; text: string };

export class Builder {
  readonly world: World;
  readonly rng: Rng;
  readonly o: Required<Omit<BuildOptions, "script" | "log">> & Pick<BuildOptions, "log">;
  private queue: Person[] = [];
  private usedFirst = new Set<string>();
  private usedSur = new Set<string>();

  constructor(opts: BuildOptions, world?: World) {
    this.o = { version: "U84", presentYear: 1984, patriarchs: 3, pExistingSpouse: 0.5, maxMarriages: 4, historicalPlotRatio: 1 / 3, ...opts };
    this.rng = new Rng(opts.seed, opts.script ?? {});
    this.world = world ?? new World(STEREOTYPES, REL_STEREOTYPES);
    this.world.year = this.o.presentYear;
    for (const p of this.world.persons.values()) { this.usedFirst.add(p.first); this.usedSur.add(p.surname); }
  }
  private emit(kind: BuildEvent["kind"], text: string) { this.o.log?.({ kind, text }); }

  // ---- names, spec §2.6 [I] ----
  private freshFirst(sex: Sex): string {
    const pool = (sex === "M" ? FIRST_M : FIRST_F).filter((n) => !this.usedFirst.has(n));
    const n = pool.length ? this.rng.choose("name:first", pool) : `${sex === "M" ? "Man" : "Woman"}${this.usedFirst.size}`;
    this.usedFirst.add(n);
    return n;
  }
  private freshSurname(): string {
    const pool = SURNAMES.filter((n) => !this.usedSur.has(n));
    const n = pool.length ? this.rng.choose("name:surname", pool) : `Family${this.usedSur.size}`;
    this.usedSur.add(n);
    return n;
  }
  createPerson(sex: Sex, born: number | null, surname?: string, parents: string | null = null): Person {
    const p = this.world.addPerson({ first: this.freshFirst(sex), surname: surname ?? this.freshSurname(), sex, born, parents });
    this.emit("create", `${this.world.name(p)} (${p.id})`);
    return p;
  }

  // ---- driver, spec §2.1 [V] L84-TR Fig. 8 ----
  build(): World {
    for (let i = 0; i < this.o.patriarchs; i++) {
      const p = this.createPerson(this.rng.chance("patriarch:sex", 0.5) ? "M" : "F", this.rng.int(1895, 1920));
      this.queue.push(p);
    }
    while (this.queue.length) {
      const p = this.queue.shift()!;
      if (p.born === null) p.born = this.rng.int(1900, this.o.presentYear - 20);
      this.cycleLife(p);
      this.fillDetails(p);
    }
    this.runHistoricalPlots();
    return this.world;
  }

  // ---- life cycle, spec §2.2 [V] Fig. 8; parameters [I] ----
  private deathYear(p: Person, from: number, to: number): number | null {
    for (let y = from; y <= to; y++) {
      const age = y - p.born!;
      const h = age < 40 ? 0.002 : age < 60 ? 0.01 : age < 80 ? 0.04 : 0.12;
      if (this.rng.next() < h) return y;
    }
    return null;
  }
  cycleLife(p: Person): void {
    this.emit("cycle-person", `Cycling person ${this.world.fullName(p)}`);
    let year = p.born!;
    // replay marriages created while cycling a spouse [I]
    for (const id of [...p.marriages]) {
      const m = this.world.marriages.get(id)!;
      if (p.died !== null) return;
      if (m.endedBy === null) return; // still married at present
      year = Math.max(year, m.end ?? year);
    }
    if (p.died !== null) return;
    for (;;) {
      if (p.marriages.length >= this.o.maxMarriages) { this.finishDeath(p, year); return; }
      const start = Math.max(year + 1, p.born! + 18);
      const mYear = start + this.rng.int(0, 12);
      const dYear = this.deathYear(p, year + 1, Math.min(mYear, this.o.presentYear));
      if (dYear !== null) { p.died = dYear; return; }
      if (mYear > this.o.presentYear || mYear - p.born! > 60) return;
      const m = this.cycleMarriage(p, mYear);
      if (p.died !== null || m.endedBy === null) return;
      year = m.end!;
    }
  }
  private finishDeath(p: Person, year: number) {
    const d = this.deathYear(p, year + 1, this.o.presentYear);
    if (d !== null) p.died = d;
  }

  // ---- marriage cycle, spec §2.3 [V] Fig. 9; parameters [I] ----
  eligibleSpouses(p: Person, year: number): Person[] {
    const w = this.world;
    return [...w.persons.values()].filter((q) =>
      q.id !== p.id && q.sex !== p.sex && q.born !== null && q.died === null &&
      Math.abs(q.born - p.born!) <= 10 && year - q.born >= 18 &&
      // single at `year` and no marriage already recorded later (it would overlap) [I]
      !q.marriages.some((id) => { const m = w.marriages.get(id)!; return m.start === null || m.end === null || m.end > year; }) &&
      !w.directlyRelated(p, q));
  }
  cycleMarriage(p: Person, year: number): Marriage {
    const w = this.world;
    const eligible = this.eligibleSpouses(p, year);
    let spouse: Person;
    if (eligible.length && this.rng.chance("spouse:existing", this.o.pExistingSpouse)) {
      spouse = this.rng.choose("spouse:pick", eligible, (q) => q.id);
    } else {
      spouse = this.createPerson(p.sex === "M" ? "F" : "M", Math.min(year - 18, p.born! + this.rng.int(-6, 6)));
      this.queue.push(spouse);
    }
    const [h, wf] = p.sex === "M" ? [p, spouse] : [spouse, p];
    const msg = `Cycling marriage between ${w.fullName(p)} and ${w.fullName(spouse)}`;
    const mar = w.marry(h, wf, year);
    this.emit("cycle-marriage", msg);
    for (let y = year + 1; y <= this.o.presentYear; y++) {
      const wifeAge = y - wf.born!;
      if (wifeAge >= 18 && wifeAge <= 42 && mar.children.length < 5 && this.rng.next() < 0.25) {
        const c = this.createPerson(this.rng.chance("child:sex", 0.5) ? "M" : "F", y, h.surname, mar.id);
        mar.children.push(c.id);
        this.queue.push(c);
      }
      if (this.rng.next() < 0.06) { w.endMarriage(mar, y, "divorce"); this.relateDivorcedChildren(mar); return mar; }
      for (const q of [h, wf]) {
        const age = y - q.born!;
        const hz = age < 40 ? 0.002 : age < 60 ? 0.01 : age < 80 ? 0.04 : 0.12;
        if (this.rng.next() < hz) { q.died = y; w.endMarriage(mar, y, "death"); return mar; }
      }
    }
    return mar; // ongoing
  }
  /** Divorced mother gets the stereotypical DIV-MOM relation with each child. [V] Fig. 12 */
  private relateDivorcedChildren(m: Marriage) {
    const mom = this.world.get(m.wife);
    for (const c of m.children) this.world.setRelType(mom, this.world.get(c), "div-mom");
  }

  // ---- fill details, spec §2.4 ----
  fillDetails(p: Person, io: Dialog = silent): void {
    const w = this.world;
    const traits = NUMERIC_TRAITS[this.o.version];
    const targets: [NumericTrait, number][] = [];
    const parents = w.parentsOf(p).filter((q) => q.stereotypes.length);
    const pool = [...traits];
    const take = () => pool.splice(Math.floor(this.rng.next() * pool.length), 1)[0]!;
    if (parents.length) {
      for (let i = 0; i < 3; i++) { // "several" [V]; 3 [I]
        const t = take();
        const par = this.rng.choose("inherit:parent", parents, (q) => q.id);
        const v = w.trait(par, t);
        if (v !== null) targets.push([t, v]);
      }
    }
    for (let i = 0; i < 2; i++) { const t = take(); const [lo, hi] = RANGES[t]; targets.push([t, this.rng.int(lo, hi)]); }
    this.emit("finish", `Beginning finish up for ${w.fullName(p)}`);
    createToSpecification(w, p, targets, this.rng, io);
    const par = w.parentsOf(p)[0];
    for (const [k, list] of [["race", RACES], ["religion", RELIGIONS], ["nationality", NATIONALITIES], ["social-background", BACKGROUNDS]] as const) {
      p.symbolic[k] = par?.symbolic[k] ?? this.rng.choose(`sym:${k}`, list);
    }
  }

  // ---- historical plots, spec §2.5 ----
  runHistoricalPlots(plots: HistoricalPlot[] = HISTORICAL_PLOTS): void {
    const w = this.world;
    const n = Math.round(w.persons.size * this.o.historicalPlotRatio);
    for (let i = 0; i < n; i++) this.runHistoricalPlot(this.rng.choose("hplot", plots, (h) => h.name));
  }
  runHistoricalPlot(h: HistoricalPlot): boolean {
    const w = this.world;
    const bound = new Map<string, Person>();
    for (const r of h.roles) {
      const cands = [...w.persons.values()].filter((q) => q.born !== null && q.died === null && w.isAdult(q) &&
        ![...bound.values()].includes(q) && (!r.stereotype || q.stereotypes.includes(r.stereotype)) &&
        h.constraints.filter((c) => c.role === r.name).every((c) => { const v = w.trait(q, c.trait) ?? 0; return c.op === "<" ? v < c.value : v > c.value; }));
      let q: Person;
      if (cands.length && this.rng.chance("hplot:existing", 0.8)) q = this.rng.choose(`hplot:${h.name}:${r.name}`, cands, (x) => x.id);
      else { // a source of unrelated characters [V] L84-TR p. 23
        q = this.createPerson(this.rng.chance("hplot:sex", 0.5) ? "M" : "F", this.o.presentYear - this.rng.int(25, 60));
        if (r.stereotype) q.stereotypes.push(r.stereotype);
        this.fillDetails(q);
      }
      bound.set(r.name, q);
    }
    const people = [...bound.values()];
    const lo = Math.max(...people.map((q) => q.born! + 18));
    if (lo > this.o.presentYear) return false;
    const year = this.rng.int(lo, this.o.presentYear);
    const [r0, r1] = h.roles;
    if (r0 && r1) w.ensureRel(bound.get(r0.name)!, bound.get(r1.name)!); // canonical order = role order [I]
    for (const m of h.iprMods) w.setIpr(bound.get(m.from)!, bound.get(m.to)!, m.scale, m.value);
    for (const m of h.traitMods) { const q = bound.get(m.role)!; q.modifiers[m.trait] = (q.modifiers[m.trait] ?? 0) + m.delta; }
    const id = `&PL${w.nPL++}`;
    for (const q of people) q.history.push({ plot: h.name.toUpperCase(), year, id });
    this.emit("historical-plot", `${h.name} ${year} ${people.map((q) => w.name(q)).join(", ")}`);
    return true;
  }
}

export function buildUniverse(opts: BuildOptions): World {
  return new Builder(opts).build();
}
