import { clamp, neutral, type NumericTrait, type Stereotype } from "./traits.ts";

export type Sex = "M" | "F";
export const SCALES = ["pos-neg", "int-dis", "dom-sub", "attract"] as const;
export type Scale = (typeof SCALES)[number];

export interface Person {
  id: string; // &PERn
  n: number;
  first: string;
  surname: string; // birth surname
  marriedSurnames: string[];
  symbol?: string; // e.g. LIZ (hand-entered casts)
  sex: Sex;
  born: number | null;
  died: number | null;
  parents: string | null; // marriage id
  marriages: string[];
  stereotypes: string[];
  modifiers: Partial<Record<NumericTrait, number>>;
  symbolic: Record<string, string>; // race, religion, nationality, social-background, age override
  symMods: Record<string, string>; // printed symbolic trait modifiers, e.g. {sex: 'F', age: 'YA'}
  goals: string[];
  history: { plot: string; year: number; id: string }[];
  flags: Set<string>; // eliminated, disabled, engaged, ...
}

export interface Marriage {
  id: string; // &MFn
  husband: string;
  wife: string;
  start: number | null;
  end: number | null;
  endedBy: "divorce" | "death" | null;
  children: string[];
}

export interface Relationship {
  a: string; // canonical first party, spec §4
  b: string;
  type: string | null; // stereotypical relationship name, e.g. ex-spouse
  values: Partial<Record<Scale, [number | null, number | null]>>; // explicit overrides (a->b, b->a)
  couple: boolean; // "together"
  estranged: boolean;
}

export interface RelStereotype {
  name: string;
  label: string; // printed label, e.g. EX-SPOUSE
  ab: Partial<Record<Scale, number>>;
  ba: Partial<Record<Scale, number>>;
  tier: "verified" | "inferred";
}

export class World {
  persons = new Map<string, Person>();
  marriages = new Map<string, Marriage>();
  rels = new Map<string, Relationship>();
  stereotypes = new Map<string, Stereotype>();
  relStereotypes = new Map<string, RelStereotype>();
  year = 1984;
  private nPer = 0;
  private nMF = 0;
  nPL = 0;

  constructor(stereotypes: Stereotype[] = [], rel: RelStereotype[] = []) {
    for (const s of stereotypes) this.stereotypes.set(s.name, s);
    for (const r of rel) this.relStereotypes.set(r.name, r);
  }

  addPerson(p: Partial<Person> & { first: string; surname: string; sex: Sex }): Person {
    const n = this.nPer++;
    const person: Person = {
      id: `&PER${n}`, n, marriedSurnames: [], born: null, died: null, parents: null, marriages: [],
      stereotypes: [], modifiers: {}, symbolic: {}, symMods: {}, goals: [], history: [], flags: new Set(), ...p,
    };
    this.persons.set(person.id, person);
    return person;
  }
  get(id: string): Person {
    const p = this.persons.get(id);
    if (!p) throw new Error(`no person ${id}`);
    return p;
  }
  bySymbol(sym: string): Person {
    const s = sym.toUpperCase();
    for (const p of this.persons.values()) if ((p.symbol ?? p.first.toUpperCase()) === s) return p;
    throw new Error(`no person ${sym}`);
  }
  /** Married surname shown for a wife whose latest marriage is current or ended by death. [V] Fig. 12 (divorced
   *  JESSICA DONADIO; married RENE DAVIDSON ROGERS), L90 (NADINE BURTON BRYKS); [I] rule. */
  marriedSurname(p: Person): string | null {
    // hand-entered characters keep the name as entered: LIZ CHANDLER, married to TONY (L85-TR Fig. 1) [I]
    if (p.symbol !== undefined) return p.marriedSurnames[0] ?? null;
    if (p.sex !== "F" || p.marriages.length === 0) return p.marriedSurnames[0] ?? null;
    const m = this.marriages.get(p.marriages[p.marriages.length - 1]!)!;
    if (m.endedBy === "divorce") return null;
    const h = this.get(m.husband);
    return h.surname === p.surname ? null : h.surname;
  }
  fullName(p: Person): string {
    const ms = this.marriedSurname(p);
    return [p.first, p.surname, ...(ms ? [ms] : [])].join(" ");
  }
  name(p: Person): string {
    return this.fullName(p).toUpperCase();
  }
  label(p: Person, style: "symbol" | "full"): string {
    return style === "symbol" ? p.symbol ?? p.first.toUpperCase() : this.fullName(p);
  }

  marry(husband: Person, wife: Person, start: number | null): Marriage {
    const m: Marriage = { id: `&MF${this.nMF++}`, husband: husband.id, wife: wife.id, start, end: null, endedBy: null, children: [] };
    this.marriages.set(m.id, m);
    husband.marriages.push(m.id);
    wife.marriages.push(m.id);
    this.setRelType(husband, wife, "husband-wife");
    return m;
  }
  endMarriage(m: Marriage, year: number | null, by: "divorce" | "death"): void {
    m.end = year;
    m.endedBy = by;
    if (by === "divorce") this.setRelType(this.get(m.husband), this.get(m.wife), "ex-spouse");
  }
  currentMarriage(p: Person): Marriage | null {
    for (const id of p.marriages) {
      const m = this.marriages.get(id)!;
      if (m.endedBy === null) return m;
    }
    return null;
  }
  spouse(p: Person): Person | null {
    const m = this.currentMarriage(p);
    if (!m) return null;
    const s = this.get(m.husband === p.id ? m.wife : m.husband);
    return s.died === null ? s : null;
  }
  parentsOf(p: Person): Person[] {
    if (!p.parents) return [];
    const m = this.marriages.get(p.parents)!;
    return [this.get(m.husband), this.get(m.wife)];
  }
  childrenOf(p: Person): Person[] {
    return p.marriages.flatMap((id) => this.marriages.get(id)!.children.map((c) => this.get(c)));
  }
  siblingsOf(p: Person): Person[] {
    const out = new Set<string>();
    for (const par of this.parentsOf(p)) for (const c of this.childrenOf(par)) if (c.id !== p.id) out.add(c.id);
    return [...out].map((id) => this.get(id));
  }
  ancestors(p: Person, acc = new Set<string>()): Set<string> {
    for (const q of this.parentsOf(p)) if (!acc.has(q.id)) { acc.add(q.id); this.ancestors(q, acc); }
    return acc;
  }
  /** "directly related": ancestor, descendant, sibling/half-sibling. [V] L84-TR p. 20; [I] extent */
  directlyRelated(a: Person, b: Person): boolean {
    if (this.ancestors(a).has(b.id) || this.ancestors(b).has(a.id)) return true;
    return this.siblingsOf(a).some((s) => s.id === b.id);
  }
  alive(p: Person): boolean {
    return p.died === null && !p.flags.has("eliminated");
  }
  age(p: Person): number | null {
    return p.born === null ? null : this.year - p.born;
  }
  ageGroup(p: Person): string {
    if (p.symMods.age) return p.symMods.age === "A" ? "YA" : p.symMods.age;
    const a = this.age(p);
    if (a === null) return "YA";
    return a < 13 ? "CHILD" : a < 20 ? "TEEN" : a < 35 ? "YA" : a < 60 ? "MA" : "OLD";
  }
  isAdult(p: Person): boolean {
    const g = this.ageGroup(p);
    return g !== "CHILD" && g !== "TEEN";
  }

  // ---- traits, spec §1.3 ----
  base(p: Person, t: NumericTrait): number | undefined {
    for (const s of p.stereotypes) {
      const v = this.stereotypes.get(s)?.traits[t];
      if (v !== undefined) return v;
    }
    return undefined;
  }
  trait(p: Person, t: NumericTrait): number | null {
    const b = this.base(p, t);
    const m = p.modifiers[t];
    if (b === undefined && m === undefined) return null;
    return clamp(t, (b ?? neutral(t)) + (m ?? 0));
  }
  goalsOf(p: Person): string[] {
    const out: string[] = [];
    for (const s of p.stereotypes) for (const g of this.stereotypes.get(s)?.goals ?? []) if (!out.includes(g)) out.push(g);
    for (const g of p.goals) if (!out.includes(g)) out.push(g);
    return out;
  }
  occupation(p: Person): string | null {
    for (const s of p.stereotypes) {
      const t = this.stereotypes.get(s)?.type;
      if (t === "occupation" || t === "job") return s;
    }
    return null;
  }

  // ---- relationships, spec §4 ----
  private key(a: Person, b: Person): string {
    return a.n < b.n ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;
  }
  rel(a: Person, b: Person): Relationship | undefined {
    return this.rels.get(this.key(a, b));
  }
  /** Ensure a relationship exists; canonical order (a,b) is fixed at first creation. */
  ensureRel(a: Person, b: Person): Relationship {
    const k = this.key(a, b);
    let r = this.rels.get(k);
    if (!r) {
      r = { a: a.id, b: b.id, type: null, values: {}, couple: false, estranged: false };
      this.rels.set(k, r);
    }
    return r;
  }
  setRelType(a: Person, b: Person, type: string): Relationship {
    const r = this.ensureRel(a, b);
    if (r.type !== type) {
      // canonical order follows the stereotype's role order (a = first role)
      r.a = a.id;
      r.b = b.id;
      r.type = type;
      r.values = {};
    }
    return r;
  }
  /** Directional value from x to y. */
  ipr(x: Person, y: Person, s: Scale): number | null {
    const r = this.rel(x, y);
    if (!r) return null;
    const i = r.a === x.id ? 0 : 1;
    const v = r.values[s]?.[i];
    if (v !== undefined && v !== null) return v;
    const st = r.type ? this.relStereotypes.get(r.type) : undefined;
    const d = st ? (i === 0 ? st.ab : st.ba)[s] : undefined;
    return d ?? null;
  }
  setIpr(x: Person, y: Person, s: Scale, v: number): void {
    const r = this.ensureRel(x, y);
    const i = r.a === x.id ? 0 : 1;
    const pair = r.values[s] ?? [null, null];
    pair[i] = Math.max(-10, Math.min(10, Math.round(v)));
    r.values[s] = pair;
  }
  addIpr(x: Person, y: Person, s: Scale, d: number): void {
    this.setIpr(x, y, s, (this.ipr(x, y, s) ?? 0) + d);
  }

  // ---- derived predicates, spec §4 [I] ----
  loves(x: Person, y: Person): boolean {
    return (this.ipr(x, y, "pos-neg") ?? 0) >= 5 && (this.ipr(x, y, "attract") ?? 0) >= 5;
  }
  together(x: Person, y: Person): boolean {
    const r = this.rel(x, y);
    return !!r && r.couple && !r.estranged;
  }
  inCouple(p: Person): boolean {
    for (const r of this.rels.values()) if (r.couple && !r.estranged && (r.a === p.id || r.b === p.id)) return true;
    return false;
  }
  available(p: Person): boolean {
    return this.spouse(p) === null && !p.flags.has("engaged") && !this.inCouple(p);
  }
  married(x: Person, y: Person): boolean {
    return this.spouse(x)?.id === y.id;
  }
  setTogether(x: Person, y: Person, on: boolean): void {
    const r = this.ensureRel(x, y);
    r.couple = on;
    r.estranged = !on && r.estranged;
  }
  living(): Person[] {
    return [...this.persons.values()].filter((p) => this.alive(p));
  }
}
