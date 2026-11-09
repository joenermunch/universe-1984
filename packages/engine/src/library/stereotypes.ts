import type { NumericTrait, Stereotype, StereotypeType } from "../model/traits.ts";
import type { RelStereotype } from "../model/world.ts";

/**
 * Stereotype library.
 * - lawyer, swinger, waiter: values VERIFIED from L84-TR Fig. 3.
 * - names in L83 Fig. 1 / L84-TR Fig. 4 / outputs are VERIFIED; their trait values and goals are INFERRED.
 * - "Californian" (L83-TR Fig. 4, May 1983) is a verified name that the January 1984 list drops; it is
 *   recorded in fixtures/historical/character-model-1984.json but not used by this U84 generator.
 * Trait keys: pa=phys-appearance, in=intelligence, mo=moodiness, gu=guile, sc=self-confidence,
 * ni=niceness, co=competence, pr=promiscuity, we=wealth, na=naivete.
 */
const K: Record<string, NumericTrait> = { pa: "phys-appearance", in: "intelligence", mo: "moodiness", gu: "guile", sc: "self-confidence", ni: "niceness", co: "competence", pr: "promiscuity", we: "wealth", na: "naivete" };

function st(name: string, type: StereotypeType, spec: string, goals: string[], timeUsed?: string, tier: "verified" | "inferred" = "inferred", source?: string): Stereotype {
  const traits: Partial<Record<NumericTrait, number>> = {};
  for (const kv of spec.split(/\s+/).filter(Boolean)) {
    const [k, v] = kv.split("=");
    traits[K[k!]!] = Number(v);
  }
  return { name, type, traits, goals, ...(timeUsed ? { timeUsed } : {}), tier, ...(source ? { source } : { source: "name: L84-TR Fig. 4 / L83 Fig. 1 / outputs; values inferred" }) };
}

const MONEY = "MAKE-MONEY", HAPPY = "FIND-HAPPINESS", FAME = "BECOME-FAMOUS";

export const STEREOTYPES: Stereotype[] = [
  // ---- verified frames, L84-TR Fig. 3 ----
  st("lawyer", "occupation", "in=6 gu=7 sc=6 ni=0 we=6", [MONEY, HAPPY], "days", "verified", "L84-TR Fig. 3 (values); goals inferred"),
  st("swinger", "trait", "pa=7 mo=6 gu=8 sc=6 co=6 pr=9", [HAPPY], "nights", "verified", "L84-TR Fig. 3 (values); goals inferred"),
  st("waiter", "job", "ni=5 we=2", [MONEY, HAPPY], "evenings", "verified", "L84-TR Fig. 3 (values); goals inferred"),
  // ---- occupations (names verified; values inferred) ----
  st("doctor", "occupation", "in=8 co=7 we=8 sc=5", [MONEY, "ESTABLISH-PRACTICE", HAPPY], "days"), // goals: L84-TR p. 14 example
  st("sleazy-doctor", "occupation", "in=3 we=7", [MONEY, HAPPY], "days"), // name: L90
  st("sleazy-lawyer", "occupation", "in=6 gu=8 we=6 ni=-3", [MONEY, HAPPY], "days"), // name: L87
  st("psychologist", "occupation", "in=8 ni=4 co=5", [HAPPY], "days"), // name: L84-TR Fig. 5
  st("high-school-teacher", "occupation", "in=6 ni=4 we=3", [HAPPY], "days"),
  st("professor", "occupation", "in=9 we=5 sc=4", ["BECOME-RESPECTED", HAPPY], "days"),
  st("gangster", "occupation", "ni=-7 gu=6 we=6 sc=6", [MONEY, "GAIN-POWER"], "nights"),
  st("pro-athlete", "occupation", "pa=6 co=7 sc=7 we=7", [FAME, HAPPY], "days"), // goal: L84-TR p. 14
  st("warden", "occupation", "ni=-3 sc=5 co=4", [HAPPY], "days"),
  st("actor", "occupation", "pa=7 pr=6 in=4 mo=6 sc=6", [HAPPY, FAME, "MEET-FAMOUS-PEOPLE"], "evenings", "inferred", "values derived from L85-TR Fig. 1 under spec §1.3; inferred from output"),
  st("bureaucrat", "occupation", "co=4 we=4 sc=0 ni=2", [HAPPY], "days"),
  st("politician", "occupation", "gu=7 sc=8 we=7", ["GAIN-POWER", FAME], "days"),
  st("store-owner", "occupation", "we=6 co=5 ni=2", [MONEY, HAPPY], "days"),
  st("masseuse", "occupation", "pa=6 pr=7 we=6 co=7 in=4", [FAME, "MEET-FAMOUS-PEOPLE"], "evenings", "inferred", "values derived from L84-TR Fig. 12 under spec §1.3 (first-defining stereotype + modifier); inferred from output"),
  // ---- jobs ----
  st("receptionist", "job", "we=3 ni=4", [HAPPY], "days"),
  st("truck-driver", "job", "we=3 in=3 sc=4", [HAPPY], "days"),
  st("construction-worker", "job", "we=3 pa=3 sc=5", [HAPPY], "days"),
  st("taxi-driver", "job", "ni=3 mo=4", [MONEY, HAPPY], "nights"), // L90 offered 'taxidriver' for niceness 3
  st("life-guard", "job", "pa=6 sc=4", [HAPPY], "days"), // L90 offered for self-confidence 4
  // ---- groups / avocations / habits / traits ----
  st("socialite", "group", "we=5", [HAPPY, FAME, "MEET-FAMOUS-PEOPLE"], "evenings", "inferred", "values derived from L85-TR Fig. 1 under spec §1.3; inferred from output"),
  st("preppie", "group", "we=7 sc=6 na=6", [HAPPY], "days"),
  st("New-Yorker", "group", "sc=6 gu=3", [HAPPY]),
  st("hari-krishna", "group", "ni=6 we=0 na=7", ["FIND-ENLIGHTENMENT"]),
  st("family-man", "group", "ni=6 pr=0 mo=2", ["RAISE-FAMILY", HAPPY]),
  st("party-goer", "avocation", "pr=7 mo=5 ni=0", ["MEET-FAMOUS-PEOPLE"], "nights", "inferred", "values derived from L84-TR Fig. 12 under spec §1.3 (first-defining stereotype + modifier); inferred from output"),
  st("movie-fiend", "avocation", "in=5", [HAPPY], "evenings"),
  st("video-game-player", "avocation", "in=5 na=6", [HAPPY], "evenings"),
  st("sports-fan", "avocation", "mo=4", [HAPPY], "weekends"),
  st("bowler", "avocation", "ni=3", [HAPPY], "evenings"),
  st("concert-goer", "avocation", "mo=4", [HAPPY], "evenings"),
  st("big-eater", "habit", "sc=4 pa=-3", [HAPPY]), // L90 offered for self-confidence 4
  st("gambler", "habit", "we=3 mo=7 gu=4", [MONEY], "nights"),
  st("drunk", "habit", "mo=8 co=-4 sc=-2", [HAPPY], "nights"),
  st("junkie", "habit", "co=-6 we=1 mo=8", [HAPPY], "nights"),
  st("klutz", "trait", "co=-5 sc=-3", [HAPPY]),
  st("flake", "trait", "co=-4 in=3 mo=6", [HAPPY]),
  st("flirt", "trait", "pr=7 pa=5 gu=3", [HAPPY]),
  st("nasty-person", "trait", "ni=-8 gu=6", ["GAIN-POWER"]),
  st("knockout", "trait", "gu=7 na=7", [HAPPY], undefined, "inferred", "values derived from L85-TR Fig. 1 under spec §1.3; inferred from output"),
  st("egomaniac", "trait", "gu=7 sc=8", [FAME, "ASSOCIATE-RIGHT", HAPPY], undefined, "inferred", "values derived from L84-TR Fig. 12 under spec §1.3 (first-defining stereotype + modifier); inferred from output"),
];

/** Stereotypical relationships, spec §4. ab = first role -> second role. */
export const REL_STEREOTYPES: RelStereotype[] = [
  // [V] L84-TR Fig. 6 parentheses + Fig. 12 + L85-TR Fig. 1 (identical defaults)
  { name: "ex-spouse", label: "EX-SPOUSE", ab: { "pos-neg": -5, "int-dis": 4, "dom-sub": 0, attract: 4 }, ba: { "pos-neg": -5, "int-dis": 4, "dom-sub": 0, attract: 4 }, tier: "verified" },
  // [V] L84-TR Fig. 12 (DIV-MOM), mother -> child first
  { name: "div-mom", label: "DIV-MOM", ab: { "pos-neg": 8, "int-dis": 4, "dom-sub": 6 }, ba: { "pos-neg": 4, "int-dis": 4, "dom-sub": 2 }, tier: "verified" },
  // [V] L84-TR Fig. 5
  { name: "doctor-patient", label: "DOCTOR-PATIENT", ab: { "pos-neg": 1, "int-dis": 0, "dom-sub": 6 }, ba: { "pos-neg": 3, "int-dis": 0, "dom-sub": 2 }, tier: "verified" },
  // [I]
  { name: "husband-wife", label: "HUSBAND-WIFE", ab: { "pos-neg": 6, "int-dis": 8, "dom-sub": 0, attract: 6 }, ba: { "pos-neg": 6, "int-dis": 8, "dom-sub": 0, attract: 6 }, tier: "inferred" },
  { name: "parent-child", label: "PARENT-CHILD", ab: { "pos-neg": 7, "int-dis": 6, "dom-sub": 5 }, ba: { "pos-neg": 5, "int-dis": 6, "dom-sub": -3 }, tier: "inferred" },
];
