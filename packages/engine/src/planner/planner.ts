import type { Person, Scale, World } from "../model/world.ts";
import { Rng, type ChoiceScript } from "../rng.ts";
import { isVar, type SExpr } from "../sexpr.ts";
import { createToSpecification } from "../universe/create-to-spec.ts";
import { BINDERS, binderValues, holds, isPerson, type Bindings, type Value } from "./constraints.ts";
import type { LibVersion, PlotFragment, Step, Template } from "./fragment.ts";

/** Structured trace (printed by trace.ts in the 1985 or 1987 format). */
export type TraceEvent =
  | { t: "goal"; goal: string[]; depth?: number }
  | { t: "candidates"; list: { frag: string; roles: [string, string][] }[]; fragments: string[]; equal: boolean }
  | { t: "using"; frag: string; roles: [string, string][]; deferred: [string, string][]; picked: boolean; multipleDeferred: boolean }
  | { t: "fillers"; role: string; names: string[] }
  | { t: "filler"; role: string; name: string }
  | { t: "out"; text: string; frag?: string }
  | { t: "fail" };

export interface TellOptions {
  seed: number;
  script?: ChoiceScript;
  version?: LibVersion; // library version filter + text variant
  budget?: number; // deviation D-2
  names?: "symbol" | "full";
}

/** Goal predicates whose argument order does not matter. [I] from L85-TR Figs. 4/5 (churn) and Fig. 10 (together). */
const SYMMETRIC = new Set(["churn", "together"]);
const ORDER: LibVersion[] = ["U85", "U87", "U90"];

interface Candidate { f: PlotFragment; b: Bindings; free: string[]; extra: number; extraBind: Bindings }

export class Planner {
  readonly trace: TraceEvent[] = [];
  readonly outline: string[] = [];
  readonly rng: Rng;
  private budget: number;
  private v: LibVersion;
  private names: "symbol" | "full";
  /** Agenda (explicit stack, resumable). Bottom frame holds seed goals; each expansion pushes a frame. */
  private agenda: { steps: Step[]; b: Bindings; seed: boolean; frag?: string }[] = [];
  private used = new Set<string>();

  constructor(readonly world: World, readonly library: PlotFragment[], opts: TellOptions) {
    this.rng = new Rng(opts.seed, opts.script ?? {});
    this.budget = opts.budget ?? 200;
    this.v = opts.version ?? "U87";
    this.names = opts.names ?? "symbol";
  }

  private lib(): PlotFragment[] {
    return this.library.filter((f) => ORDER.indexOf(f.since) <= ORDER.indexOf(this.v));
  }
  private nm(p: Person): string {
    return this.names === "symbol" ? this.world.label(p, "symbol") : this.world.label(p, "full");
  }
  private show(x: Value | SExpr): string {
    if (isPerson(x)) return this.nm(x).toUpperCase();
    if (Array.isArray(x)) return "(" + x.map((y) => this.show(y as SExpr)).join(" ") + ")";
    return typeof x === "string" && x.startsWith('"') ? x : String(x).toUpperCase();
  }

  /** Resolve seed symbols to persons. */
  private ground(g: SExpr): SExpr {
    if (Array.isArray(g)) return g.map((x, i) => (i === 0 ? x : this.ground(x)));
    if (typeof g === "string" && g !== "*" && !g.startsWith('"') && !isVar(g)) {
      try { return this.world.bySymbol(g) as unknown as SExpr; } catch { return g; }
    }
    return g;
  }

  tell(seeds: SExpr[]): { trace: TraceEvent[]; outline: string[] } {
    this.agenda.push({ steps: seeds.map((s) => ({ goal: this.ground(s) })), b: new Map(), seed: true });
    return this.run();
  }

  /** Continue the story ("next episode"): resume the remaining agenda with a fresh budget. Spec §6.9. */
  resume(budget = 200): { trace: TraceEvent[]; outline: string[] } {
    this.budget = budget;
    return this.run();
  }

  /** Goals still pending anywhere in the agenda (open-ended stories always have some). */
  pending(): number {
    return this.agenda.reduce((n, f) => n + f.steps.filter((s) => "goal" in s).length, 0);
  }

  private run(): { trace: TraceEvent[]; outline: string[] } {
    while (this.agenda.length && this.budget > 0) {
      const top = this.agenda[this.agenda.length - 1]!;
      const step = top.steps.shift();
      if (!step) { this.agenda.pop(); continue; }
      if ("tell" in step) { this.say(step.tell, top.b, [], top.frag); continue; }
      if (top.seed) this.used = new Set(); // exclusion scope = one seed goal's expansion (spec §6.4)
      this.work(step.goal);
    }
    return { trace: this.trace, outline: this.outline };
  }

  private isTrue(g: SExpr[]): boolean {
    const [p, a, b] = g;
    if (p === "together" && isPerson(a) && isPerson(b)) return this.world.together(a, b);
    return false;
  }

  /** Disjunction rule, spec §6.6 [I]. */
  private chooseDisjunct(g: SExpr[]): SExpr[] {
    const alts = g.slice(1) as SExpr[][];
    for (const a of alts) if (this.candidates(a).length) return a;
    return alts[alts.length - 1]!;
  }

  private work(goal0: SExpr): void {
    if (this.budget <= 0) return;
    let goal = goal0 as SExpr[];
    if (goal[0] === "or") goal = this.chooseDisjunct(goal);
    if (this.isTrue(goal)) return; // B-7
    this.budget--;
    this.trace.push({ t: "goal", goal: goal.map((x) => this.show(x as SExpr)), depth: this.agenda.length - 1 });
    const cands = this.candidates(goal);
    if (!cands.length) { this.trace.push({ t: "fail" }); return; } // B-9
    const c = this.select(goal, cands);
    this.expand(c, goal);
  }

  /** Unify a fragment goal pattern with a goal; symmetric predicates try the swapped order first. [I] L87 Fig. 2 order */
  private unify(pattern: SExpr[], goal: SExpr[], b0: Bindings): Bindings[] {
    if (pattern[0] !== goal[0] || pattern.length !== goal.length) return [];
    const orders = SYMMETRIC.has(String(goal[0])) && goal.length === 3 ? [[0, 2, 1], [0, 1, 2]] : [goal.map((_, i) => i)];
    const out: Bindings[] = [];
    for (const ord of orders) {
      const b = new Map(b0);
      let ok = true;
      for (let i = 1; i < pattern.length; i++) {
        const pv = pattern[i]!, gv = goal[ord[i]!]!;
        if (gv === "*") continue;
        if (isVar(pv)) {
          const cur = b.get(pv);
          if (cur !== undefined && cur !== (gv as unknown)) { ok = false; break; }
          b.set(pv, gv as unknown as Value);
        } else if (isPerson(pv) || isPerson(gv)) {
          if (!(isPerson(pv) && isPerson(gv) && pv.id === gv.id)) { ok = false; break; }
        } else if (String(pv) !== String(gv)) { ok = false; break; }
      }
      if (ok && !out.some((o) => [...o].every(([k, x]) => b.get(k) === x))) out.push(b);
    }
    return out;
  }

  candidates(goal: SExpr[]): Candidate[] {
    const out: Candidate[] = [];
    const people = [...this.world.persons.values()].filter((p) => this.world.alive(p));
    for (const f of this.lib()) {
      for (const pat of f.goals) {
        for (const b0 of this.unify(pat as SExpr[], goal, new Map())) {
          const assign = (i: number, b: Bindings, free: string[]): void => {
            // prune on any decidable constraint
            for (const c of f.constraints) if (holds(this.world, c, b) === false) return;
            if (i === f.roles.length) {
              if (f.constraints.some((c) => holds(this.world, c, b) === undefined && !this.mentionsDeferred(f, c))) return;
              out.push({ f, b, free, extra: 0, extraBind: new Map() });
              return;
            }
            const r = f.roles[i]!;
            if (b.has(r.name) || r.deferred) return assign(i + 1, b, free);
            // binder constraint for this role?
            const binder = f.constraints.find((c) => Array.isArray(c) && BINDERS.has(String(c[0])) && c[c.length - 1] === r.name && c.slice(1, -1).every((a) => !isVar(a) || b.has(String(a))));
            let vals: Value[];
            let isFree = false;
            if (binder) {
              const arr = binder as SExpr[];
              const src = b.get(String(arr[1]));
              vals = isPerson(src) ? binderValues(this.world, String(arr[0]), src, arr.slice(2, -1).map((a) => b.get(String(a))!)) : [];
            } else {
              isFree = true;
              vals = people.filter((p) => !this.used.has(p.id)); // B-8 exclusion for newly bound roles
            }
            for (const val of vals) {
              if (isPerson(val) && [...b.values()].some((x) => isPerson(x) && x.id === val.id)) continue; // distinct
              if (r.stereotype && !(isPerson(val) && val.stereotypes.includes(r.stereotype))) continue;
              const nb = new Map(b); nb.set(r.name, val);
              assign(i + 1, nb, isFree ? [...free, r.name] : free);
            }
          };
          assign(0, b0, []);
        }
      }
    }
    return out;
  }
  private mentionsDeferred(f: PlotFragment, c: SExpr): boolean {
    const vars = (x: SExpr): string[] => (Array.isArray(x) ? x.flatMap(vars) : isVar(x) ? [x] : []);
    return vars(c).some((v) => f.roles.find((r) => r.name === v)?.deferred);
  }

  private openGoals(exclude: SExpr[]): SExpr[][] {
    return this.agenda.flatMap((f) => f.steps).filter((s): s is { goal: SExpr } => "goal" in s).map((s) => s.goal)
      .filter((g) => g !== exclude).flatMap((g) => {
        const gg = g as SExpr[];
        return gg[0] === "or" ? (gg.slice(1) as SExpr[][]) : [gg];
      });
  }

  /** Selection, spec §6.5. */
  private select(goal: SExpr[], cands: Candidate[]): Candidate {
    const opens = this.openGoals(goal).filter((g) => !this.isTrue(g));
    for (const c of cands) {
      for (const pat of c.f.goals) {
        const subst = (pat as SExpr[]).map((x) => (isVar(x) && c.b.has(x) ? (c.b.get(x) as unknown as SExpr) : x));
        for (const og of opens) {
          const u = this.unify(subst, og, new Map());
          if (u.length) { c.extra++; for (const [k, x] of u[0]!) if (isVar(k)) c.extraBind.set(k, x); break; }
        }
      }
    }
    const fragsListed = [...new Set(cands.map((c) => c.f.name))];
    const maxExtra = Math.max(...cands.map((c) => c.extra));
    let pool = cands.filter((c) => c.extra === maxExtra);
    const opportunistic = maxExtra > 0;
    const maxInt = Math.max(...pool.map((c) => c.f.interest));
    pool = pool.filter((c) => c.f.interest === maxInt);
    // 1987 lists candidates only when the choice is among plans "with equal goal effect"
    void opportunistic;
    this.trace.push({ t: "candidates", list: cands.map((c) => ({ frag: c.f.name, roles: this.roleList(c.f, c.b, false) })), fragments: fragsListed, equal: pool.length > 1 });
    // choose fragment first (documented choice point), then binding
    const fname = this.rng.choose(`fragment:${goal[0]}`, [...new Set(pool.map((c) => c.f.name))]);
    const forF = pool.filter((c) => c.f.name === fname);
    const all = cands.filter((c) => c.f.name === fname);
    // filler listing (1985 style): single free role across the fragment's candidates
    const freeRoles = [...new Set(all.flatMap((c) => c.free))];
    let chosen: Candidate;
    if (freeRoles.length === 1) {
      const role = freeRoles[0]!;
      const names = [...new Set(all.map((c) => c.b.get(role)).filter(isPerson).map((p) => p.id))].map((id) => this.world.get(id));
      if (names.length > 1) this.trace.push({ t: "fillers", role: role.slice(1).toUpperCase(), names: names.map((p) => this.nm(p).toUpperCase()) });
      const pick = this.rng.choose(`filler:${role}`, forF, (c) => { const p = c.b.get(role); return isPerson(p) ? this.nm(p).toUpperCase() : String(p); });
      chosen = pick;
      const p = chosen.b.get(role);
      if (isPerson(p)) this.trace.push({ t: "filler", role: role.slice(1).toUpperCase(), name: this.nm(p).toUpperCase() });
    } else {
      chosen = this.rng.choose(`binding:${fname}`, forF, (c) => this.roleList(c.f, c.b, false).map(([r, n]) => `${r}/${n}`).join(" "));
    }
    return chosen;
  }

  private roleList(f: PlotFragment, b: Bindings, withDeferred: boolean): [string, string][] {
    return f.roles.filter((r) => withDeferred || !r.deferred).filter((r) => b.has(r.name))
      .map((r) => [r.name.slice(1).toUpperCase(), this.show(b.get(r.name)! as SExpr)] as [string, string]);
  }

  private expand(c: Candidate, goal: SExpr[]): void {
    const b = new Map(c.b);
    for (const [k, x] of c.extraBind) if (!b.has(k)) b.set(k, x);
    // deferred roles, spec §6.4/§6.8 [V] L87 p. 238
    let multipleDeferred = false;
    const people = [...this.world.persons.values()].filter((p) => this.world.alive(p) && !this.used.has(p.id));
    for (const r of c.f.roles.filter((r) => r.deferred && !b.has(r.name))) {
      const ok = people.filter((p) => ![...b.values()].some((x) => isPerson(x) && x.id === p.id)).filter((p) => {
        const nb = new Map(b); nb.set(r.name, p);
        return c.f.constraints.every((k) => holds(this.world, k, nb) !== false);
      });
      let p: Person;
      if (ok.length) { if (ok.length > 1) multipleDeferred = true; p = this.rng.choose(`deferred:${r.name}`, ok, (q) => this.nm(q).toUpperCase()); }
      else p = this.createFor(c.f, r.name, b);
      b.set(r.name, p);
    }
    for (const v of b.values()) if (isPerson(v)) this.used.add(v.id);
    this.trace.push({ t: "using", frag: c.f.name, roles: this.roleList(c.f, b, false), deferred: this.roleList(c.f, b, true).filter(([r]) => c.f.roles.find((x) => x.name === "?" + r.toLowerCase())?.deferred), picked: true, multipleDeferred });
    for (const e of c.f.effects) this.effect(e, b);
    const steps: Step[] = c.f.steps.map((s) => ("goal" in s ? { goal: this.subst(s.goal, b) } : s));
    this.agenda.push({ steps, b, seed: false, frag: c.f.name });
    void goal;
  }

  private createFor(f: PlotFragment, role: string, b: Bindings): Person {
    const w = this.world;
    const p = w.addPerson({ first: `New${w.persons.size}`, surname: "Character", sex: this.rng.chance("create:sex", 0.5) ? "M" : "F", born: w.year - 30 });
    const targets: [import("../model/traits.ts").NumericTrait, number][] = [];
    for (const c of f.constraints) {
      const a = c as SExpr[];
      if ((a[0] === ">" || a[0] === "<") && Array.isArray(a[1]) && a[1][1] === role) targets.push([String(a[1][2]) as never, Number(a[2]) + (a[0] === ">" ? 2 : -2)]);
    }
    createToSpecification(w, p, targets, this.rng);
    void b;
    return p;
  }

  private subst(x: SExpr, b: Bindings): SExpr {
    if (Array.isArray(x)) return x.map((y) => this.subst(y, b));
    if (isVar(x) && b.has(x)) return b.get(x) as unknown as SExpr;
    return x;
  }

  private say(t: Template, b: Bindings, goal: SExpr[], frag?: string): void {
    const tpl = typeof t === "string" ? t : t[this.v] ?? t.U87 ?? t.U85 ?? Object.values(t)[0]!;
    const pr = (k: string): Person => { const v = b.get(k); if (!isPerson(v)) throw new Error(`template ${k} unbound`); return v; };
    const text = tpl.replace(/\{(?:(sub|obj|pos|unq):)?(\?[a-z0-9-]+)\}/g, (_, form: string | undefined, k: string) => {
      const v = b.get(k);
      if (form === "unq") return String(v).replace(/^"|"$/g, "");
      if (!form) return isPerson(v) ? (this.names === "full" ? this.nm(v) : this.nm(v).toUpperCase()) : String(v);
      const f = pr(k).sex === "F";
      return form === "sub" ? (f ? "she" : "he") : form === "obj" ? (f ? "her" : "him") : f ? "her" : "his";
    });
    void goal;
    this.outline.push(text);
    this.trace.push(frag ? { t: "out", text, frag } : { t: "out", text });
  }

  private effect(e: SExpr, b: Bindings): void {
    const w = this.world;
    const a = e as SExpr[];
    const P = (x: SExpr): Person => { const v = isVar(x) ? b.get(x) : undefined; if (!isPerson(v)) throw new Error(`effect ${String(a[0])}: ${String(x)} unbound`); return v; };
    switch (a[0]) {
      case "together": {
        const x = P(a[1]!), y = P(a[2]!);
        w.setTogether(x, y, true);
        for (const [s, d] of [[x, y], [y, x]] as const) {
          if ((w.ipr(s, d, "attract") ?? 0) < 6) w.setIpr(s, d, "attract", 7);
          if ((w.ipr(s, d, "pos-neg") ?? 0) < 5) w.setIpr(s, d, "pos-neg", 6);
        }
        // the target leaves any other couple [I]
        for (const r of w.rels.values()) if (r.couple && (r.a === y.id || r.b === y.id) && r.a !== x.id && r.b !== x.id) r.couple = false;
        break;
      }
      case "estrange": { const r = w.ensureRel(P(a[1]!), P(a[2]!)); r.estranged = true; r.couple = false; break; }
      case "ipr": w.setIpr(P(a[1]!), P(a[2]!), String(a[3]) as Scale, Number(a[4])); break;
      case "ipr+": w.addIpr(P(a[1]!), P(a[2]!), String(a[3]) as Scale, Number(a[4])); break;
      case "divorce": { const m = w.currentMarriage(P(a[1]!)); if (m) w.endMarriage(m, w.year, "divorce"); break; }
      case "eliminate": P(a[1]!).flags.add("eliminated"); break;
      case "disable": P(a[1]!).flags.add("disabled"); break;
      case "history": { const id = `&PL${w.nPL++}`; for (const x of a.slice(2)) P(x).history.push({ plot: String(a[1]).toUpperCase(), year: w.year, id }); break; }
      default: throw new Error(`unknown effect ${String(a[0])}`);
    }
  }
}
