import { DISPLAY_NAME, DISPLAY_ORDER, type NumericTrait, type Version } from "../model/traits.ts";
import { SCALES, type Person, type World } from "../model/world.ts";

/** IPR string, spec §4 [V] format L84-TR Fig. 12: four pairs joined by '//', blank for unset. */
export function iprString(w: World, a: Person, b: Person): string {
  return SCALES.map((s) => {
    const x = w.ipr(a, b, s), y = w.ipr(b, a, s);
    return `${x ?? " "}/${y ?? " "}`.replace(/^ \/ $/, " /");
  }).join("//");
}

const LABEL_U85: Record<string, string> = { "ex-spouse": "EX-SPOUSES" }; // [V] L85-TR Fig. 1

/**
 * Frame display, one logical item per line, in three printed versions:
 * U83 (L83-TR Fig. 12: generated-character layout, short labels), U84 (L84-TR Fig. 12: same layout, long labels)
 * and U85 (L85-TR Fig. 1: hand-entered cast, symbols). [V]
 */
export function printFrame(w: World, p: Person, v: Version = "U84"): string[] {
  const out: string[] = [];
  const long = v !== "U85"; // U83 and U84 share the generated-character layout
  const ref = (q: Person) => (long ? `[${q.id}]` : `[${q.symbol ?? q.first.toUpperCase()}]`);
  out.push(long ? `Name: ${w.name(p)} (${p.id})` : `Name: ${w.name(p)} (${p.symbol ?? p.first.toUpperCase()})`);
  if (long && p.born !== null) out.push(`Born in: ${p.born}`);
  out.push("Marriages:");
  for (const id of p.marriages) {
    const m = w.marriages.get(id)!;
    const s = w.get(m.husband === p.id ? m.wife : m.husband);
    if (long) {
      out.push(`   ${w.name(s)} ${ref(s)} [${m.start ?? ""}/${m.end ?? ""}]`);
      for (const c of m.children) out.push(`      - - ${w.name(w.get(c))} ${ref(w.get(c))}`);
    } else out.push(`   ${w.name(s)} ${ref(s)} [${m.id}]${m.start !== null ? ` [${m.start}]` : ""}`);
  }
  out.push(v === "U84" ? "Interpersonal Relationships:" : "IPRs:");
  for (const r of w.rels.values()) {
    if (r.a !== p.id && r.b !== p.id) continue;
    const other = w.get(r.a === p.id ? r.b : r.a);
    const st = r.type ? w.relStereotypes.get(r.type) : undefined;
    if (!st && Object.keys(r.values).length === 0) continue;
    const label = st ? (v === "U85" ? LABEL_U85[st.name] ?? st.label : st.label) : "";
    out.push(`   ${label.padEnd(14)}${`${w.name(other)} ${ref(other)}`.padEnd(32)}${iprString(w, w.get(r.a), w.get(r.b))}`.replace(/\s+$/, ""));
  }
  if (long && p.history.length) out.push(`History: ${p.history.map((h) => `${h.plot}/${h.year} [${h.id}]`).join(" ")}`);
  out.push(`Stereotypes: ${p.stereotypes.map((s) => s.toUpperCase()).join(" ")}`);
  const num = (Object.keys(p.modifiers) as NumericTrait[]).map((t) => `(${(DISPLAY_NAME[v][t] ?? t).toUpperCase()} ${p.modifiers[t]})`);
  const sym = Object.entries(p.symMods).map(([k, x]) => `(${k.toUpperCase()} ${x})`);
  out.push(`Trait modifiers: ${(long ? [...num, ...sym] : [...sym, ...num]).join(" ")}`);
  out.push("Overall description:");
  for (const t of DISPLAY_ORDER[v]) out.push(`${(DISPLAY_NAME[v][t] ?? t).toUpperCase().padEnd(18)}${w.trait(p, t) ?? "NIL"}`);
  out.push(`${"GOALS".padEnd(18)}(${w.goalsOf(p).join(" ")})`);
  out.push(`${"AGE".padEnd(18)}${p.symMods.age ?? w.ageGroup(p)}`);
  out.push(`${"SEX".padEnd(18)}${p.sex}`);
  return out;
}
