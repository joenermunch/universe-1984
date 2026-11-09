import type { PlotFragment } from "../planner/fragment.ts";
import { neutral, isNumericTrait } from "../model/traits.ts";
import type { SExpr } from "../sexpr.ts";

/** Predicate hierarchy used for relaxation, spec §8 [V] L85-TR Fig. 9. */
const PARENT: Record<string, string> = { "has-husband": "has-spouse", "has-wife": "has-spouse", "female-adult": "adult", "male-adult": "adult" };

/** Constraint generalisation without causal analysis (the module actually built in 1985). */
export function generalize(f: PlotFragment): PlotFragment {
  const relax = (c: SExpr): SExpr => {
    if (!Array.isArray(c)) return c;
    const [op, ...args] = c;
    if (typeof op === "string" && PARENT[op]) return [PARENT[op]!, ...args];
    if ((op === "<" || op === ">") && Array.isArray(args[0]) && (args[0][0] === "trait-value" || args[0][0] === "trait-val")) {
      const t = String(args[0][2]);
      if (isNumericTrait(t)) return [op, args[0], neutral(t)];
    }
    return c;
  };
  return { ...f, name: `${f.name}0`, tier: f.tier, constraints: f.constraints.map(relax), generalizedFrom: f.name, sources: [...f.sources, "generalised per L85-TR Fig. 9 (spec §8)"] };
}
