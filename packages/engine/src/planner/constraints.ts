import { isNumericTrait } from "../model/traits.ts";
import type { Person, Scale, World } from "../model/world.ts";
import { isVar, type SExpr } from "../sexpr.ts";

export type Value = Person | string | number;
export type Bindings = Map<string, Value>;

export const isPerson = (v: unknown): v is Person => typeof v === "object" && v !== null && "id" in v && "first" in v;

export function resolve(x: SExpr, b: Bindings): Value | SExpr {
  if (isVar(x)) return b.has(x) ? b.get(x)! : x;
  return x;
}

/** Binder predicates: given a bound source, they generate values for a target variable (spec §5.2). */
export function binderValues(w: World, pred: string, src: Person, extra: Value[] = []): Value[] {
  switch (pred) {
    case "has-husband": { const s = w.spouse(src); return src.sex === "F" && s ? [s] : []; }
    case "has-wife": { const s = w.spouse(src); return src.sex === "M" && s ? [s] : []; }
    case "has-spouse": { const s = w.spouse(src); return s ? [s] : []; }
    case "has-parent": return w.parentsOf(src).filter((p) => w.alive(p));
    case "has-child": return w.childrenOf(src).filter((p) => w.alive(p));
    case "has-ex-spouse": return src.marriages.map((id) => w.marriages.get(id)!).filter((m) => m.endedBy === "divorce")
      .map((m) => w.get(m.husband === src.id ? m.wife : m.husband)).filter((p) => w.alive(p));
    case "has-last-ex-spouse": {
      const exes = src.marriages.map((id) => w.marriages.get(id)!).filter((m) => m.endedBy === "divorce");
      const m = exes[exes.length - 1];
      const ex = m && w.get(m.husband === src.id ? m.wife : m.husband);
      return ex && w.alive(ex) ? [ex] : [];
    }
    case "has-job": { const j = w.occupation(src); return j ? [j.toUpperCase()] : []; }
    case "fight-subject": {
      // [I] subjects "generated from knowledge of the characters involved" (L87 p. 238); order from L87 Fig. 2
      const other = extra[0];
      if (!isPerson(other)) return [];
      const out: string[] = [];
      if (w.parentsOf(src).some((p) => w.alive(p)) || w.parentsOf(other).some((p) => w.alive(p))) out.push("IN-LAWS");
      out.push("MONEY");
      if (src.history.length || other.history.length) out.push("SECRETS");
      if ((w.trait(src, "promiscuity") ?? 0) >= 5 || (w.trait(other, "promiscuity") ?? 0) >= 5) out.push("FLIRTING");
      if (w.childrenOf(src).some((c) => w.parentsOf(c).some((p) => p.id === other.id))) out.push("KIDS");
      return out;
    }
  }
  return [];
}
export const BINDERS = new Set(["has-husband", "has-wife", "has-spouse", "has-parent", "has-child", "has-ex-spouse", "has-last-ex-spouse", "has-job", "fight-subject"]);

/** Evaluate a fully-bound constraint. Returns undefined if a variable is still unbound. */
export function holds(w: World, c: SExpr, b: Bindings): boolean | undefined {
  if (!Array.isArray(c)) return true;
  const [op, ...args] = c as [string, ...SExpr[]];
  const v = (x: SExpr) => resolve(x, b);
  const anyUnbound = (xs: SExpr[]): boolean => xs.some((x) => (Array.isArray(x) ? anyUnbound(x) : isVar(x) && !b.has(x)));
  if (op === "or") { const rs = args.map((a) => holds(w, a, b)); return rs.includes(true) ? true : rs.includes(undefined) ? undefined : false; }
  if (op === "not") { const r = holds(w, args[0]!, b); return r === undefined ? undefined : !r; }
  if (anyUnbound(args)) return undefined;
  const P = (x: SExpr): Person => { const r = v(x); if (!isPerson(r)) throw new Error(`not a person: ${String(r)}`); return r; };
  switch (op) {
    case "<": case ">": case "<=": case ">=": {
      const num = (x: SExpr): number | null => {
        if (Array.isArray(x) && (x[0] === "trait-value" || x[0] === "trait-val")) {
          const t = String(x[2]); if (!isNumericTrait(t)) throw new Error(`unknown trait ${t}`);
          return w.trait(P(x[1]!), t);
        }
        if (Array.isArray(x) && x[0] === "ipr") return w.ipr(P(x[1]!), P(x[2]!), String(x[3]) as Scale);
        return Number(x);
      };
      const a = num(args[0]!), z = num(args[1]!);
      if (a === null || z === null) return false;
      return op === "<" ? a < z : op === ">" ? a > z : op === "<=" ? a <= z : a >= z;
    }
    case "female-adult": return P(args[0]!).sex === "F" && w.isAdult(P(args[0]!));
    case "male-adult": return P(args[0]!).sex === "M" && w.isAdult(P(args[0]!));
    case "adult": return w.isAdult(P(args[0]!));
    case "female": return P(args[0]!).sex === "F";
    case "male": return P(args[0]!).sex === "M";
    case "opposite-sex": return P(args[0]!).sex !== P(args[1]!).sex;
    case "stereotype": return P(args[0]!).stereotypes.includes(String(args[1]));
    case "married": return w.married(P(args[0]!), P(args[1]!));
    case "together": return w.together(P(args[0]!), P(args[1]!));
    case "loves": return w.loves(P(args[0]!), P(args[1]!));
    case "in-love": return w.loves(P(args[0]!), P(args[1]!)) && w.loves(P(args[1]!), P(args[0]!));
    case "available": return w.available(P(args[0]!));
    case "employed": return w.occupation(P(args[0]!)) !== null;
    case "same-job": { const j = w.occupation(P(args[0]!)); return j !== null && j === w.occupation(P(args[1]!)); }
    case "have-child": return w.childrenOf(P(args[0]!)).some((c) => w.parentsOf(c).some((p) => p.id === P(args[1]!).id));
    case "different": return P(args[0]!).id !== P(args[1]!).id;
    case "disabled": return P(args[0]!).flags.has("disabled");
    default:
      if (BINDERS.has(op)) {
        const src = v(args[0]!);
        if (!isPerson(src)) return false;
        const target = args.length > 1 ? v(args[args.length - 1]!) : undefined;
        const extra = args.slice(1, -1).map((a) => v(a) as Value);
        const vals = binderValues(w, op, src, extra);
        if (target === undefined) return vals.length > 0;
        return vals.some((x) => (isPerson(x) && isPerson(target) ? x.id === target.id : x === target));
      }
      throw new Error(`unknown constraint ${op}`);
  }
}
