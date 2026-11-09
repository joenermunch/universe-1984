/**
 * @universe/engine, reconstruction of Michael Lebowitz's UNIVERSE (Columbia, 1983–87).
 * Framework-free. Specification: docs/architecture/specification.md.
 */
export const ENGINE_VERSION = "0.1.0";
export { Rng, type ChoiceScript } from "./rng.ts";
export { parse, show, type SExpr } from "./sexpr.ts";
export * from "./model/traits.ts";
export { World, SCALES, type Person, type Marriage, type Relationship, type Scale, type Sex } from "./model/world.ts";
export { STEREOTYPES, REL_STEREOTYPES } from "./library/stereotypes.ts";
export { HISTORICAL_PLOTS } from "./library/historical-plots.ts";
export { FRAGMENTS, fragmentByName } from "./library/fragments.ts";
export { Builder, buildUniverse, type BuildOptions } from "./universe/build.ts";
export { createToSpecification, discrepancy, type Dialog } from "./universe/create-to-spec.ts";
export { Planner, type TraceEvent, type TellOptions } from "./planner/planner.ts";
export { frag, type PlotFragment, type LibVersion } from "./planner/fragment.ts";
export { print1985, print1987, toJSONL } from "./planner/trace.ts";
export { printFrame, iprString } from "./print/frame.ts";
export { generalize } from "./learning/generalize.ts";
export { loadCast, type CastFile } from "./cast.ts";
export { writersAidCreate } from "./universe/writers-aid.ts";
