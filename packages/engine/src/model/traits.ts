/** Trait schema, spec §1.2. */
export type Tier = "verified" | "inferred" | "experimental";
/** Character-frame versions: U83 (CUCS-055-83, May 1983), U84 (CUCS-99-84 / Poetics 13), U85 (CUCS-202-85 / Poetics 14). */
export type Version = "U83" | "U84" | "U85";

export type NumericTrait =
  | "phys-appearance" | "intelligence" | "moodiness" | "guile" | "self-confidence"
  | "niceness" | "competence" | "promiscuity" | "wealth" | "naivete";

export const RANGES: Record<NumericTrait, [number, number]> = {
  "phys-appearance": [-10, 10], // [V] L84-TR Fig. 2
  intelligence: [0, 10],
  moodiness: [0, 10],
  guile: [-10, 10],
  "self-confidence": [-10, 10],
  niceness: [-10, 10],
  competence: [-10, 10],
  promiscuity: [0, 10],
  wealth: [0, 10],
  naivete: [0, 10], // [I] not in L84-TR; presence trait
};

export const NUMERIC_TRAITS: Record<Version, NumericTrait[]> = {
  // [V] L83-TR Fig. 2 (same nine numeric traits, short names phys-att / self-conf)
  U83: ["phys-appearance", "intelligence", "moodiness", "guile", "self-confidence", "niceness", "competence", "promiscuity", "wealth"],
  // [V] L84-TR Fig. 2
  U84: ["phys-appearance", "intelligence", "moodiness", "guile", "self-confidence", "niceness", "competence", "promiscuity", "wealth"],
  // [V] L85-TR Fig. 1 / L90 prompt order
  U85: ["wealth", "promiscuity", "competence", "niceness", "self-confidence", "guile", "naivete", "moodiness", "phys-appearance", "intelligence"],
};

/** Display order of the "Overall description" block. [V] L83-TR Fig. 12 (U83), L84-TR Fig. 12 (U84) and L85-TR Fig. 1 (U85). */
export const DISPLAY_ORDER: Record<Version, NumericTrait[]> = {
  U83: ["wealth", "promiscuity", "competence", "niceness", "self-confidence", "guile", "moodiness", "phys-appearance", "intelligence"],
  U84: ["wealth", "promiscuity", "competence", "niceness", "self-confidence", "guile", "moodiness", "phys-appearance", "intelligence"],
  U85: ["wealth", "promiscuity", "competence", "niceness", "self-confidence", "guile", "naivete", "moodiness", "phys-appearance", "intelligence"],
};

/** Printed trait names. [V] the same Jessica Donadio frame is printed with short names in May 1983 and long names in January 1984. */
export const DISPLAY_NAME: Record<Version, Partial<Record<NumericTrait, string>>> = {
  U83: { "self-confidence": "SELF-CONF", "phys-appearance": "PHYS-ATT" },
  U84: {},
  U85: { "self-confidence": "SELF-CONF", "phys-appearance": "PHYS-ATT" },
};

/** Neutral point, spec §1.2 [I]. */
export const neutral = (t: NumericTrait): number => (RANGES[t][0] < 0 ? 0 : 5);
export const clamp = (t: NumericTrait, v: number): number => Math.max(RANGES[t][0], Math.min(RANGES[t][1], Math.round(v)));
export const isNumericTrait = (s: string): s is NumericTrait => s in RANGES;

export type StereotypeType = "occupation" | "job" | "group" | "avocation" | "habit" | "trait";

export interface Stereotype {
  name: string;
  type: StereotypeType;
  traits: Partial<Record<NumericTrait, number>>;
  timeUsed?: string;
  goals: string[];
  tier: Tier;
  source?: string;
}
