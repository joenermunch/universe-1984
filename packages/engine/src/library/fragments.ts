import { frag, type PlotFragment } from "../planner/fragment.ts";

/**
 * Plot-fragment library. Only FORCED-MARRIAGE is fully documented (VERIFIED). Every other fragment
 * is INFERRED from what the traces show (name, roles, goal, subgoal sequence, output text) and authored
 * minimally to satisfy them. `since` reflects the earliest source that names the fragment.
 * Constraint/effect/step syntax: published s-expressions; binding constraints take the bound role as last argument (D-4).
 */
export const FRAGMENTS: PlotFragment[] = [
  // ------------------------------------------------------------------ churn
  frag({
    name: "FORCED-MARRIAGE", tier: "verified", since: "U85", timeScale: "months",
    sources: ["L85-CS Fig. 1", "L85-TR Fig. 2", "L85 (Poetics 14) Table 2: (do-divorce ?husband ?her); L85-TR Fig. 2 prints ?him, a typo", "D-4: explicit binding arguments"],
    roles: ["?him", "?her", "?husband", "?parent"],
    constraints: ["(has-husband ?her ?husband)", "(has-parent ?husband ?parent)", "(< (trait-value ?parent 'niceness) -5)", "(female-adult ?her)", "(male-adult ?him)"],
    goals: ["(churn ?him ?her)"],
    steps: ['(do-threaten ?parent ?her "forget it")', "(dump-lover ?her ?him)", "(worry-about ?him)", "(together * ?him)", "(eliminate ?parent)", "(do-divorce ?husband ?her)", "(or (churn ?him ?her) (together ?her ?him))"],
  }),
  frag({
    name: "LOVERS-FIGHT", tier: "inferred", since: "U85",
    sources: ["name: L85-TR Fig. 4", "roles + subgoal sequence: L87 Fig. 2 (him/her genderless, fn. 2)"],
    roles: ["?him", "?her"],
    constraints: ["(adult ?him)", "(adult ?her)", "(loves ?her ?him)", "(or (married ?him ?her) (together ?him ?her))"],
    goals: ["(churn ?him ?her)"],
    steps: ["(do-fight ?her ?him)", "(dump-lover ?her ?him)", "(churn ?him ?her)"],
  }),
  frag({
    name: "JOB-PROBLEM", tier: "inferred", since: "U85",
    sources: ["name: L85-TR Fig. 4", "roles P1 P2 JOB: L87 Fig. 2"],
    roles: ["?p1", "?p2", "?job"],
    constraints: ["(has-job ?p1 ?job)", "(or (married ?p1 ?p2) (together ?p1 ?p2))"],
    goals: ["(churn ?p1 ?p2)"],
    steps: [{ tell: "{?p1} is overwhelmed by problems at work as a {?job}" }, "(dump-lover ?p1 ?p2)", "(churn ?p2 ?p1)"],
  }),
  frag({
    name: "PREGNANT-AFFAIR", tier: "inferred", since: "U87", sources: ["name + roles: L87 Fig. 2"],
    roles: ["?woman", "?husband", { name: "?lover", deferred: true }],
    constraints: ["(married ?husband ?woman)", "(female-adult ?woman)", "(male-adult ?lover)"],
    goals: ["(churn ?woman ?husband)"],
    steps: [{ tell: "{?woman} has an affair with {?lover}" }, { tell: "{?woman} is pregnant and does not know whether {?husband} is the father" }, "(churn ?husband ?woman)"],
  }),
  frag({
    name: "ACCIDENT-BREAKUP", tier: "inferred", since: "U87",
    sources: ["name + roles + subgoals + text: L87 Figs. 2–3"],
    roles: ["?p1", "?p2", { name: "?third-party", deferred: true }],
    constraints: ["(> (trait-value ?p1 'niceness) 5)", "(or (married ?p1 ?p2) (together ?p1 ?p2))", "(adult ?third-party)"],
    goals: ["(churn ?p1 ?p2)", "(together ?p2 ?third-party)"],
    steps: ["(do-disable ?p1)", { tell: "{?p1} doesn't want to ruin {?p2}'s life" }, { tell: "{?p1} pretends to blame {?p2} for {pos:?p1} malady" }, "(dump-lover ?p1 ?p2)", "(together ?p2 ?third-party)"],
  }),
  frag({
    name: "STEAL-CHILD", tier: "inferred", since: "U87", sources: ["name + roles: L87 Fig. 2"],
    roles: ["?husband", "?her"],
    constraints: ["(male-adult ?husband)", "(female-adult ?her)", "(married ?husband ?her)", "(have-child ?husband ?her)"],
    goals: ["(churn ?husband ?her)"],
    steps: [{ tell: "{?husband} takes the children and disappears" }, "(churn ?her ?husband)"],
  }),
  frag({
    name: "COLLEAGUE-AFFAIR", tier: "inferred", since: "U87", sources: ["name + roles + deferred COLLEAGUE: L87 Fig. 2"],
    roles: ["?wife", "?husband", { name: "?colleague", deferred: true }],
    constraints: ["(female-adult ?wife)", "(married ?husband ?wife)", "(employed ?wife)", "(same-job ?colleague ?wife)", "(male-adult ?colleague)"],
    goals: ["(churn ?wife ?husband)"],
    steps: [{ tell: "{?wife} has an affair with {?colleague}, who works with {obj:?wife}" }, "(dump-lover ?husband ?wife)"],
  }),
  frag({
    name: "AVALANCHE-ACCIDENT", tier: "inferred", since: "U87", sources: ["name + roles: L87 Fig. 2"],
    roles: ["?him", "?her"],
    constraints: ["(or (married ?him ?her) (together ?him ?her))"],
    goals: ["(churn ?him ?her)"],
    steps: [{ tell: "{?him} is lost in an avalanche and presumed dead" }, "(churn ?her ?him)"],
  }),
  frag({
    name: "EX-ATTEMPT", tier: "inferred", since: "U90",
    sources: ["sequence of events 8–11 in the L90 Nadine/Steven outline; name invented"],
    roles: ["?him", "?her", "?ex"],
    constraints: ["(has-last-ex-spouse ?her ?ex)", "(loves ?him ?her)"],
    goals: ["(churn ?him ?her)"],
    steps: [{ tell: "{?ex} tries to seduce {?her}." }, { tell: "{?him} gets frustrated." }, "(dump-lover ?him ?her)", "(together ?her ?him)"],
  }),
  // ------------------------------------------------------------------ lower level
  frag({
    name: "THREATEN", tier: "inferred", since: "U85", sources: ["name + text: L85-TR Fig. 4", "effect: L85-TR p. 7 ('the threat is likely to make the woman strongly dislike her father-in-law')"],
    roles: ["?threatener", "?victim", "?msg"],
    goals: ["(do-threaten ?threatener ?victim ?msg)"],
    effects: ["(ipr ?victim ?threatener pos-neg -8)"],
    steps: [{ tell: { U85: "{?threatener} threatens {?victim}: {?msg}", U90: "{?threatener} threatens {?victim}: {unq:?msg}." } }],
  }),
  frag({
    name: "BREAK-UP", tier: "inferred", since: "U85", sources: ["name + text: L85-TR Fig. 4; roles DUMPER DUMPED: L87 Fig. 2; text variant: L90"],
    roles: ["?dumper", "?dumped"],
    goals: ["(dump-lover ?dumper ?dumped)"],
    effects: ["(estrange ?dumper ?dumped)", "(ipr ?dumper ?dumped pos-neg 0)"],
    steps: [{ tell: { U85: "{?dumper} tells {?dumped} {sub:?dumper} doesn't love {obj:?dumped}", U90: "{?dumper} tells {?dumped} that {sub:?dumper} doesn't love {obj:?dumped}." } }],
  }),
  frag({
    name: "BE-CONCERNED", tier: "inferred", since: "U85", sources: ["name + role WORRIER + text: L85-TR Fig. 4"],
    roles: ["?target", "?worrier"],
    constraints: ["(adult ?worrier)", "(> (trait-value ?worrier 'niceness) 2)"],
    goals: ["(worry-about ?target)"],
    steps: [{ tell: { U85: "{?worrier} is worried about {?target}", U90: "{?worrier} is worried about {?target}." } }],
  }),
  frag({
    name: "SEDUCTION", tier: "inferred", since: "U85", sources: ["name + role SEDUCER + text: L85-TR Figs. 4, 5, 10; L90"],
    roles: ["?seducer", "?target"],
    constraints: ["(adult ?seducer)", "(adult ?target)", "(opposite-sex ?seducer ?target)", "(> (trait-value ?seducer 'promiscuity) 5)", "(not (together ?seducer ?target))"],
    goals: ["(together ?seducer ?target)"],
    effects: ["(together ?seducer ?target)"],
    steps: [{ tell: { U85: "{?seducer} seduces {?target}", U90: "{?seducer} seduces {?target}." } }],
  }),
  frag({
    name: "DRUNKEN-SNEAK-IN", tier: "inferred", since: "U85", sources: ["name: L85-TR Fig. 4 (content echoes L84-TR STORY1: Kayla drunk in Chris's bed)"],
    roles: ["?drunk", "?host"],
    constraints: ["(stereotype ?drunk drunk)", "(available ?drunk)", "(available ?host)", "(opposite-sex ?drunk ?host)", "(adult ?host)"],
    goals: ["(together ?drunk ?host)"],
    effects: ["(together ?drunk ?host)"],
    steps: [{ tell: "{?drunk} gets drunk and is found in {?host}'s bed" }],
  }),
  frag({
    name: "SYMPATHETIC-UNION", tier: "inferred", since: "U85", sources: ["name: L85-TR Fig. 4 (content echoes L84-TR p. 8 consolation-into-love example)"],
    roles: ["?consoler", "?target"],
    constraints: ["(> (trait-value ?consoler 'niceness) 5)", "(available ?consoler)", "(available ?target)", "(opposite-sex ?consoler ?target)", "(adult ?consoler)"],
    goals: ["(together ?consoler ?target)"],
    effects: ["(together ?consoler ?target)"],
    steps: [{ tell: "{?consoler} comforts {?target}, and they fall in love" }],
  }),
  frag({
    name: "JOB-TOGETHER", tier: "inferred", since: "U85", sources: ["name: L85-TR Fig. 4"],
    roles: ["?colleague", "?target"],
    constraints: ["(same-job ?colleague ?target)", "(available ?colleague)", "(available ?target)", "(opposite-sex ?colleague ?target)"],
    goals: ["(together ?colleague ?target)"],
    effects: ["(together ?colleague ?target)"],
    steps: [{ tell: "{?colleague} and {?target} fall for each other at work" }],
  }),
  frag({
    name: "ATTEMPTED-MURDER", tier: "inferred", since: "U85", sources: ["name + role KILLER + text: L85-TR Figs. 4, 5, 10"],
    roles: ["?victim", "?killer"],
    constraints: ["(adult ?killer)", "(< (trait-value ?killer 'niceness) -2)"],
    goals: ["(eliminate ?victim)"],
    effects: ["(eliminate ?victim)"],
    steps: [{ tell: { U85: "{?killer} tries to kill {?victim}", U90: "{?killer} tries to kill {?victim}." } }],
  }),
  frag({
    name: "EXPOSE", tier: "inferred", since: "U85", sources: ["name: L85-TR Figs. 4–5; two-event text: L90 outline"],
    roles: ["?target", "?exposer"],
    constraints: ["(adult ?exposer)", "(> (trait-value ?exposer 'niceness) 3)"],
    goals: ["(eliminate ?target)"],
    effects: ["(eliminate ?target)"],
    steps: [{ tell: { U85: "{?exposer} decides to expose {?target}", U90: "{?exposer} decides to expose {?target}." } }, { tell: { U85: "{?exposer} tells the world about {?target}", U90: "{?exposer} tells the world about {?target}." } }],
  }),
  frag({
    name: "DIVORCE", tier: "inferred", since: "U85", sources: ["name + text: L85-TR Fig. 4; text variant: L90"],
    roles: ["?a", "?b"],
    constraints: ["(married ?a ?b)"],
    goals: ["(do-divorce ?a ?b)"],
    effects: ["(divorce ?a ?b)"],
    steps: [{ tell: { U85: "{?b} and {?a} got divorced", U90: "{?b} and {?a} get divorced." } }],
  }),
  frag({
    name: "PERSONAL-FIGHT", tier: "inferred", since: "U87", sources: ["name + roles A B SUBJECT + subjects + text: L87 Fig. 2"],
    roles: ["?a", "?b", "?subject"],
    constraints: ["(fight-subject ?a ?b ?subject)"],
    goals: ["(do-fight ?a ?b)"],
    steps: [{ tell: "{?a} and {?b} fight about: {?subject}" }],
  }),
  frag({
    name: "DISABLE", tier: "inferred", since: "U87", sources: ["name + role PERSON + text: L87 Fig. 3"],
    roles: ["?person"],
    goals: ["(do-disable ?person)"],
    effects: ["(disable ?person)"],
    steps: [{ tell: "{?person} has a spinal injury and is paralyzed" }],
  }),
];

export const fragmentByName = (n: string): PlotFragment => {
  const f = FRAGMENTS.find((x) => x.name === n);
  if (!f) throw new Error(`no fragment ${n}`);
  return f;
};
