import { neutral, type NumericTrait } from "../model/traits.ts";
import type { Person, World } from "../model/world.ts";
import type { Rng } from "../rng.ts";

/** Interactive hooks for writer's-aid mode (spec §2.7). `ask` returns "" to let the program choose. */
export interface Dialog {
  say(line: string): void;
  ask(prompt: string): string;
}
export const silent: Dialog = { say() {}, ask: () => "" };

const TOL = 1; // [I] "Fine differences in numeric values are rarely significant" (L84-TR p. 14)

/** D(s, targets), spec §3 [I]. */
export function discrepancy(world: World, stereo: string, targets: [NumericTrait, number][]): number {
  const s = world.stereotypes.get(stereo)!;
  let d = 0;
  for (const [t, v] of targets) d += Math.abs((s.traits[t] ?? neutral(t)) - v);
  return d;
}

/**
 * Create to specification, spec §3 / L84-TR §4.2, demonstrated in L90.
 * targets: in the order the user (or caller) specified them.
 */
export function createToSpecification(world: World, p: Person, targets: [NumericTrait, number][], rng: Rng, io: Dialog = silent): void {
  if (targets.length === 0) return;
  // step 1: occupation with minimal total discrepancy [V]
  const occs = [...world.stereotypes.values()].filter((s) => s.type === "occupation" && !p.stereotypes.includes(s.name));
  let best = Infinity;
  let optimal: string[] = [];
  for (const s of occs) {
    const d = discrepancy(world, s.name, targets);
    if (d < best) { best = d; optimal = [s.name]; } else if (d === best) optimal.push(s.name);
  }
  if (optimal.length) {
    io.say(`Optimal occupations are: ${optimal.join(", ")}`);
    const ans = io.ask("Enter occupation:").trim();
    const occ = ans && world.stereotypes.has(ans) ? ans : rng.choose("cts:occupation", optimal);
    io.say(`Selecting: ${occ}`);
    p.stereotypes.push(occ);
  }
  // step 2: remaining traits in reverse order of specification [V] L90 transcript order
  for (const [t, v] of [...targets].reverse()) {
    const cur = world.base(p, t);
    if (cur !== undefined && Math.abs(cur - v) <= TOL) { io.say(`Trait (${t} ${v}) already satisfied`); continue; }
    io.say(`For trait (${t} ${v})`);
    const curv = cur ?? neutral(t);
    // "does not alter existing values": under first-defining semantics (spec §1.3) a later stereotype never changes
    // a trait already defined, so it can only help a trait whose base is still undefined. [V] text; [I] reading
    const choices = cur !== undefined ? [] : [...world.stereotypes.values()].filter((s) => {
      // one occupation per person: step 2 never offers another occupation [I] (L90: bureaucrat-like occupations absent)
      if (p.stereotypes.includes(s.name) || s.type === "occupation" || s.traits[t] === undefined) return false;
      return Math.abs(s.traits[t]! - v) < Math.abs(curv - v); // brings the person closer [V]
    }).map((s) => s.name);
    const ans = io.ask(`Choices (${choices.join(", ")}):`).trim();
    if (choices.length === 0) continue;
    const pick = ans && choices.includes(ans) ? ans : rng.choose(`cts:${t}`, choices);
    p.stereotypes.push(pick);
  }
  // step 3: residue as personal idiosyncrasy (modifiers = deltas, spec §1.3) [I]
  for (const [t, v] of targets) {
    const b = world.base(p, t);
    const delta = v - (b ?? neutral(t));
    if (delta !== 0) p.modifiers[t] = delta;
    else delete p.modifiers[t];
  }
}
