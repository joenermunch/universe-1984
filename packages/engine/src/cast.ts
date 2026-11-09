import { REL_STEREOTYPES, STEREOTYPES } from "./library/stereotypes.ts";
import { neutral, type NumericTrait } from "./model/traits.ts";
import { World, type Scale, type Sex } from "./model/world.ts";

/** Hand-built cast (fixtures/casts/*.json). Trait values given as overall values; stored as deltas (spec §1.3). */
export interface CastFile {
  id: string;
  persons: { sym: string; first: string; surname: string; sex: Sex; born?: number; died?: number; stereotypes?: string[]; traits?: Partial<Record<NumericTrait, number>>; goals?: string[] }[];
  marriages?: { husband: string; wife: string; start?: number; end?: number; endedBy?: "divorce" | "death"; children?: string[] }[];
  relationships?: { a: string; b: string; type?: string; couple?: boolean; values?: Partial<Record<Scale, [number | null, number | null]>> }[];
  history?: { plot: string; year: number; persons: string[] }[];
  year?: number;
}

export function loadCast(c: CastFile, world = new World(STEREOTYPES, REL_STEREOTYPES)): World {
  world.year = c.year ?? 1984;
  for (const p of c.persons) {
    const per = world.addPerson({ first: p.first, surname: p.surname, sex: p.sex, symbol: p.sym, born: p.born ?? null, died: p.died ?? null, stereotypes: p.stereotypes ?? [], goals: p.goals ?? [] });
    for (const [t, v] of Object.entries(p.traits ?? {}) as [NumericTrait, number][]) per.modifiers[t] = v - (world.base(per, t) ?? neutral(t));
  }
  for (const m of c.marriages ?? []) {
    const mar = world.marry(world.bySymbol(m.husband), world.bySymbol(m.wife), m.start ?? null);
    if (m.endedBy) world.endMarriage(mar, m.end ?? null, m.endedBy);
    for (const ch of m.children ?? []) { const k = world.bySymbol(ch); k.parents = mar.id; mar.children.push(k.id); }
  }
  for (const r of c.relationships ?? []) {
    const a = world.bySymbol(r.a), b = world.bySymbol(r.b);
    const rel = r.type ? world.setRelType(a, b, r.type) : world.ensureRel(a, b);
    if (r.couple) rel.couple = true;
    for (const [s, [x, y]] of Object.entries(r.values ?? {}) as [Scale, [number | null, number | null]][]) {
      if (x !== null) world.setIpr(a, b, s, x);
      if (y !== null) world.setIpr(b, a, s, y);
    }
  }
  for (const h of c.history ?? []) { const id = `&PL${world.nPL++}`; for (const s of h.persons) world.bySymbol(s).history.push({ plot: h.plot, year: h.year, id }); }
  return world;
}
