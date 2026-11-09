import type { NumericTrait } from "../model/traits.ts";
import type { Scale } from "../model/world.ts";

/**
 * Historical plots (spec §2.5; L84-TR §6, Figs. 10–11).
 * NAMES are verified (L83 Fig. 2, L84-TR Fig. 11, REVENGE from Fig. 12). CONTENTS are inferred,
 * except REVENGE's IPR effect, which is reconstructed from Jessica Donadio's raw IPR with Bruce Smith
 * (L84-TR Fig. 12 and p. 26: negative feeling toward him; he has power over her).
 */
export interface HistoricalPlot {
  name: string;
  timeFrame: "days" | "months" | "years";
  roles: { name: string; stereotype?: string }[];
  constraints: { role: string; trait: NumericTrait; op: "<" | ">"; value: number }[];
  traitMods: { role: string; trait: NumericTrait; delta: number }[];
  iprMods: { from: string; to: string; scale: Scale; value: number }[]; // absolute values
  tier: "verified" | "inferred";
}

const hp = (name: string, roles: string[], ipr: [string, string, Scale, number][], traits: [string, NumericTrait, number][] = [], cons: HistoricalPlot["constraints"] = [], timeFrame: HistoricalPlot["timeFrame"] = "months"): HistoricalPlot => ({
  name, timeFrame, roles: roles.map((r) => { const [n, s] = r.split(":"); return s ? { name: n!, stereotype: s } : { name: n! }; }),
  constraints: cons, traitMods: traits.map(([role, trait, delta]) => ({ role, trait, delta })),
  iprMods: ipr.map(([from, to, scale, value]) => ({ from, to, scale, value })), tier: "inferred",
});

export const HISTORICAL_PLOTS: HistoricalPlot[] = [
  // REVENGE: roles in canonical order (avenger, victim), reproduces '/-4// / //6/-4// /' (Fig. 12)
  { ...hp("revenge", ["avenger", "victim"], [["victim", "avenger", "pos-neg", -4], ["avenger", "victim", "dom-sub", 6], ["victim", "avenger", "dom-sub", -4]], [], [{ role: "avenger", trait: "niceness", op: "<", value: 1 }]), tier: "inferred" },
  hp("lawsuit", ["plaintiff", "defendant"], [["plaintiff", "defendant", "pos-neg", -5], ["defendant", "plaintiff", "pos-neg", -6]]),
  hp("consultant", ["consultant", "client"], [["client", "consultant", "pos-neg", 4], ["consultant", "client", "dom-sub", 3]]),
  hp("client-suicide", ["professional", "relative"], [["relative", "professional", "pos-neg", -7]], [["professional", "moodiness", 2]]),
  hp("big-loss", ["loser", "winner"], [["loser", "winner", "pos-neg", -4]], [["loser", "wealth", -2]]),
  hp("famous-rider", ["rider", "fan"], [["fan", "rider", "pos-neg", 5], ["fan", "rider", "attract", 4]]),
  hp("sports-scandal", ["athlete", "teammate"], [["teammate", "athlete", "pos-neg", -6]]),
  hp("pig-out", ["eater", "friend"], [["friend", "eater", "pos-neg", 2]]),
  hp("divorce", ["a", "b"], [["a", "b", "pos-neg", -5], ["b", "a", "pos-neg", -5]]),
  hp("abuse-charges", ["accuser", "accused"], [["accuser", "accused", "pos-neg", -8], ["accused", "accuser", "pos-neg", -6]]),
  hp("confidante", ["confider", "confidante"], [["confider", "confidante", "pos-neg", 6], ["confider", "confidante", "int-dis", 6], ["confidante", "confider", "int-dis", 5]]),
  hp("threatened", ["threatener", "victim"], [["victim", "threatener", "pos-neg", -6], ["threatener", "victim", "dom-sub", 5], ["victim", "threatener", "dom-sub", -5]]),
  hp("break", ["giver", "receiver"], [["receiver", "giver", "pos-neg", 6]]),
  hp("overdose", ["victim", "rescuer"], [["victim", "rescuer", "pos-neg", 6], ["victim", "rescuer", "int-dis", 4]], [["victim", "moodiness", 2]]),
  hp("feast", ["host", "guest"], [["guest", "host", "pos-neg", 3]]),
  hp("illness", ["patient", "carer"], [["patient", "carer", "pos-neg", 6], ["patient", "carer", "int-dis", 5]]),
  hp("student-pass", ["teacher", "student"], [["student", "teacher", "pos-neg", 5], ["teacher", "student", "dom-sub", 4]]),
  hp("robbery", ["robber", "victim"], [["victim", "robber", "pos-neg", -8]], [["victim", "wealth", -1]]),
  hp("rackets", ["boss", "victim"], [["victim", "boss", "pos-neg", -7], ["boss", "victim", "dom-sub", 7], ["victim", "boss", "dom-sub", -6]]),
  hp("takeover", ["raider", "owner"], [["owner", "raider", "pos-neg", -7]], [["raider", "wealth", 1], ["owner", "wealth", -2]]),
  hp("crime", ["criminal", "witness"], [["criminal", "witness", "pos-neg", -4], ["witness", "criminal", "dom-sub", 4]]),
  hp("malpractice", ["doctor:doctor", "patient"], [["patient", "doctor", "pos-neg", -7]]),
  hp("competition", ["a", "b"], [["a", "b", "pos-neg", -3], ["b", "a", "pos-neg", -3]]),
  hp("cutback", ["boss", "employee"], [["employee", "boss", "pos-neg", -5]], [["employee", "wealth", -1]]),
  hp("bribe", ["briber", "official"], [["official", "briber", "dom-sub", -3], ["briber", "official", "dom-sub", 4]]),
  hp("attempted-suicide", ["victim", "rescuer"], [["victim", "rescuer", "pos-neg", 7], ["rescuer", "victim", "int-dis", 4]], [["victim", "moodiness", 2]]),
  hp("diet", ["dieter", "coach"], [["dieter", "coach", "pos-neg", 3]], [["dieter", "phys-appearance", 1]]),
];
