import { NUMERIC_TRAITS, isNumericTrait, type NumericTrait } from "../model/traits.ts";
import type { Person, Sex } from "../model/world.ts";
import type { Builder } from "./build.ts";
import { createToSpecification, type Dialog } from "./create-to-spec.ts";

const LONG: Partial<Record<NumericTrait, string>> = { "phys-appearance": "physical attractiveness" }; // [V] L90 prompt wording

/**
 * Writer's-aid character creation, spec §2.7 [V] L90 transcript; prompt texts verbatim.
 * An empty answer lets the program choose.
 */
export function writersAidCreate(b: Builder, io: Dialog): Person {
  const w = b.world;
  const sexIn = io.ask("Enter sex (m/f):").trim().toLowerCase();
  const sex: Sex = sexIn === "f" ? "F" : sexIn === "m" ? "M" : b.rng.chance("wa:sex", 0.5) ? "M" : "F";
  const name = io.ask("Enter name:").trim();
  const age = io.ask("Enter age group (ya/ma/old):").trim().toLowerCase() || b.rng.choose("wa:age", ["ya", "ma", "old"]);
  const span = age === "ya" ? [20, 34] : age === "ma" ? [35, 59] : [60, 80];
  const born = w.year - b.rng.int(span[0]!, span[1]!);
  const p = name ? w.addPerson({ first: name.split(" ")[0]!, surname: name.split(" ").slice(1).join(" ") || "Doe", sex, born }) : b.createPerson(sex, born);
  io.say(`Cycling person ${w.fullName(p)}`);
  for (;;) {
    const y = io.ask("Enter year of next life event (cr = quit):").trim();
    if (!y) break;
    const ev = io.ask("Next event (m/d):").trim().toLowerCase();
    if (ev === "d") { p.died = Number(y); break; }
    const fromU = io.ask("Try to find spouse in universe (u/n):").trim().toLowerCase() === "u";
    const elig = fromU ? b.eligibleSpouses(p, Number(y)) : [];
    let spouse: Person;
    if (elig.length) spouse = b.rng.choose("wa:spouse", elig, (q) => q.id);
    else {
      const sn = io.ask("Enter name (list):").trim();
      const ssex: Sex = sex === "M" ? "F" : "M";
      spouse = sn ? w.addPerson({ first: sn.split(" ")[0]!, surname: sn.split(" ").slice(1).join(" ") || "Doe", sex: ssex, born: born + b.rng.int(-5, 5) }) : b.createPerson(ssex, born + b.rng.int(-5, 5));
    }
    const [h, wf] = sex === "M" ? [p, spouse] : [spouse, p];
    const msg = `Cycling marriage between ${w.fullName(p)} and ${w.fullName(spouse)}`; // names before the marriage [V] L90
    const m = w.marry(h, wf, Number(y));
    io.say(msg);
    let ended = false;
    for (;;) {
      const my = io.ask("Enter year of next marriage event (cr = quit):").trim();
      if (!my) break;
      const kind = io.ask("Next event (c/d/s):").trim().toLowerCase(); // child, divorce, spouse dies, [I] prompt text not shown in L90
      if (kind === "c") { const c = b.createPerson(b.rng.chance("child:sex", 0.5) ? "M" : "F", Number(my), h.surname, m.id); m.children.push(c.id); }
      else { w.endMarriage(m, Number(my), kind === "d" ? "divorce" : "death"); ended = true; break; }
    }
    if (!ended) break; // still married at present: life cycle ends (L90 goes straight to finish up)
  }
  io.say(`Beginning finish up for ${w.fullName(p)}`);
  const mode = io.ask("Pick traits (p/r):").trim().toLowerCase();
  const traits = NUMERIC_TRAITS.U85;
  const targets: [NumericTrait, number][] = [];
  if (mode === "p") {
    io.say(`Possible traits to set: ${traits.map((t) => LONG[t] ?? t).join(", ")}`);
    for (;;) {
      const ans = io.ask("Enter trait and value (cr = quit):").trim();
      if (!ans) break;
      const m = ans.match(/^(.*\S)\s+(-?\d+)$/);
      if (!m) continue;
      const tn = m[1]!.replace(/^physical attractiveness$/, "phys-appearance");
      if (isNumericTrait(tn)) targets.push([tn, Number(m[2])]);
    }
  }
  createToSpecification(w, p, targets, b.rng, io);
  return p;
}
