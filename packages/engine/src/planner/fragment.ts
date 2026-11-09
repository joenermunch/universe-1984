import { parse, type SExpr } from "../sexpr.ts";
import type { Tier } from "../model/traits.ts";

export type LibVersion = "U85" | "U87" | "U90";
export type Template = string | Partial<Record<LibVersion, string>>;
export type Step = { goal: SExpr } | { tell: Template };

export interface Role {
  name: string; // "?seducer"
  deferred?: boolean; // [V] L87 p. 238
  stereotype?: string; // [V] L85-TR p. 6
}

export interface PlotFragment {
  name: string;
  tier: Tier;
  /** First library version that contains it (U85 traces list fewer fragments than U87). */
  since: LibVersion;
  sources: string[];
  roles: Role[];
  constraints: SExpr[];
  goals: SExpr[];
  steps: Step[];
  effects: SExpr[];
  interest: number;
  timeScale?: "days" | "months" | "years";
  /** Name of the fragment this was generalised from (learning, spec §8). */
  generalizedFrom?: string;
}

/** Concise constructor: constraint/goal/effect strings in published s-expression syntax. */
export function frag(f: {
  name: string; tier: Tier; since: LibVersion; sources: string[];
  roles: (string | Role)[]; constraints?: string[]; goals: string[]; steps?: (string | { tell: Template })[];
  effects?: string[]; interest?: number; timeScale?: PlotFragment["timeScale"];
}): PlotFragment {
  return {
    name: f.name, tier: f.tier, since: f.since, sources: f.sources,
    roles: f.roles.map((r) => (typeof r === "string" ? { name: r } : r)),
    constraints: (f.constraints ?? []).map(parse),
    goals: f.goals.map(parse),
    steps: (f.steps ?? []).map((s) => (typeof s === "string" ? { goal: parse(s) } : s)),
    effects: (f.effects ?? []).map(parse),
    interest: f.interest ?? 5,
    ...(f.timeScale ? { timeScale: f.timeScale } : {}),
  };
}
