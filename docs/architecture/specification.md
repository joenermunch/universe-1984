# UNIVERSE reconstruction: formal specification

Version 1.1 (2026-11-08): adds the May 1983 report `[L83-TR]` and the published *Poetics* texts `[L84]`, `[L85]`. Every rule is tagged:

- **[V]** verified: stated or shown in a primary source (citation given);
- **[I]** inferred: our decision, consistent with all sources, with rationale;
- **[X]** experimental: not used in historical mode.

Source IDs are listed in [`docs/references.md`](../references.md). Evidence IDs (E-n) and open-question IDs (Q-…) refer to research notes that are not part of this repository.

Reconstructed composite: **U84 character generation + U87 planner**, with U85 trait names as a variant. Labelled as a composite everywhere it is shown (E33). The only documented run of the U84 generator (Jessica Donadio) was already printed in May 1983 (`[L83-TR]` Fig. 12), so "U84" describes the generator as published in January 1984, not a program written after May 1983. [V]

---

## 1. Character model

### 1.1 Person frame

| Field | Rule | Tag |
|---|---|---|
| `id` | `&PER<n>`, n from 0 in creation order | [V] `[L84-TR]` Fig. 12 |
| `name` | first name, birth surname; a generated wife whose latest marriage did not end in divorce also shows the husband's surname (`RENE DAVIDSON ROGERS`, `NADINE BURTON BRYKS`; divorced `JESSICA DONADIO`). Hand-entered characters keep the name as entered (`LIZ CHANDLER`, married to Tony) | [V] examples `[L84-TR]` Fig. 12, `[L85-TR]` Fig. 1, `[L90]`; [I] rule |
| `symbol` | short symbol (e.g. `LIZ`) for hand-entered casts | [V] `[L85-TR]` Fig. 1 |
| `sex` | `M`/`F` | [V] |
| `born` | year | [V] Fig. 12 |
| `died` | year or null | [I] (death is a life event, Fig. 8) |
| `parents` | marriage id or null | [V] `[L87]` p. 236 ("parents") |
| `marriages` | ordered list of marriage ids | [V] |
| `stereotypes` | ordered list | [V] |
| `modifiers` | trait → delta (numeric) or value (symbolic) | [I] see 1.3 |
| `goals` | union of stereotype typical goals, in stereotype order, plus individual goals | [V] Fig. 12 list; [I] union rule |
| `history` | list of `{plot, year, id: &PL<n>}` | [V] Fig. 12 |

Names are unique across the universe except surnames shared within families. [V] `[L84-TR]` p. 12.

### 1.2 Traits (versioned)

**U84** [V] `[L84-TR]` Fig. 2: numeric `phys-appearance` −10..10, `intelligence` 0..10, `moodiness` 0..10, `guile` −10..10, `self-confidence` −10..10, `niceness` −10..10, `competence` −10..10, `promiscuity` 0..10, `wealth` 0..10; symbolic `sex`, `age` (child, teen, young-adult, middle-aged, old), `religion`, `race`, `nationality`, `social-background`, `time-used`.

**U83** [V] `[L83-TR]` Figs. 2, 12: the U84 numeric set, named and printed `phys-att`/`PHYS-ATT`, `self-conf`/`SELF-CONF`, `social-back`. The same Jessica Donadio frame is printed with these short names in May 1983 and with the long names in January 1984 (`[L84-TR]` and `[L84]` Fig. 12/Fig. 3).

**U85** [V] `[L85-TR]` Fig. 1, `[L90]`: same numeric set plus `naivete`, displayed with abbreviations `SELF-CONF`, `PHYS-ATT`. Range of `naivete`: 0..10 [I] (presence trait).

Display age codes: `A` (U84 output), `YA`/`MA`/`OLD` (U85, `[L90]` prompt). [V]. Age group is derived from `born` and the current year: child <13, teen 13–19, young-adult 20–34, middle-aged 35–59, old ≥60. [I]

Neutral point of a trait: 0 for −10..10, 5 for 0..10. [I] (used only where a value must be assumed.)

### 1.3 Stereotypes and trait values

A stereotype has `name`, `type` (occupation, job, group, avocation, habit, trait), partial numeric trait values, optional `time-used`, typical `goals`. [V] `[L84-TR]` §4.1, Figs. 2–3.

**Overall value of a numeric trait T** (resolves Q-CHAR-1) [I]:

```
base(T)    = value of T in the FIRST stereotype (in the person's stereotype order) that defines T; else undefined
overall(T) = base(T) + modifier(T)   if base defined and modifier defined
           = base(T)                 if only base defined
           = neutral(T) + modifier(T) if only modifier defined
           = NIL                     otherwise   (Liz: COMPETENCE NIL)
```

Rationale: create-to-specification adds stereotypes that "do not alter existing values" (`[L84-TR]` p. 16), so the first defining stereotype fixes the base, and the leftover is "personal idiosyncrasy". Liz: WEALTH modifier 3, overall 8 ⇒ base 5; Jessica: PHYS-APPEARANCE modifier −1, overall 5 ⇒ masseuse base 6 ("relatively high physical appearance … comes from the masseuse stereotype", p. 25). Consistent with both outputs. `[L84-TR]` p. 12's word "override" is read as "individual values take precedence via the delta". Symbolic modifiers (`(SEX F)`, `(AGE A)`) set the value directly. [V] Fig. 12.

Values are clamped to the trait's range. [I]

### 1.4 Goals

Long-term goal symbols only (e.g. `FIND-HAPPINESS`, `BECOME-FAMOUS`). [V] Character short-term plans are not modelled. [V] (absence in all outputs)

---

## 2. Universe construction

### 2.1 Driver [V] `[L84-TR]` Fig. 8

```
queue := patriarchs (created with birth years)
while queue not empty:
  p := dequeue
  if p.born is null: p.born := pick
  cycleLife(p)
  fillDetails(p)
runHistoricalPlots()
```

### 2.2 Life cycle [V] Fig. 8; parameters [I]

```
cycleLife(p):
  year := p.born
  replay p's already-recorded marriages in date order          [I] (p may have been created as someone's spouse;
                                                                     Jessica's first marriage was created when Douglas
                                                                     was cycled, her second when she was, [V] p. 24)
     each replayed marriage: if it ends by p's death → stop; else year := marriage end
  loop:
    e := nextLifeEvent(p, year)          // marriage | death | none
    none  → return
    death → p.died := e.year; return
    marriage → m := cycleMarriage(p, e.year); if p died in m → return; year := m.end
```

`nextLifeEvent` [I]: candidate marriage if p is single, alive, age ≥ 18 and has < 4 marriages ("no one is married and divorced 62 times", p. 20); next-marriage gap sampled 1–12 years after age 18 or after the previous marriage; death year sampled from age-dependent hazard (yearly probability 0.2% under 40, 1% 40–59, 4% 60–79, 12% 80+). The first event (marriage or death) before `presentYear` happens; otherwise `none`.

`presentYear` = 1984 for U84 runs (`[L84-TR]` dates: marriages 1951–1967, history 1964). [I]

### 2.3 Marriage cycle [V] Fig. 9; parameters [I]

```
cycleMarriage(p, year):
  eligible := alive, single (not currently married), opposite sex, |age difference| ≤ 10,
              not directly related to p (ancestor, descendant, sibling, half-sibling)    [V] p. 20; [I] thresholds
  if eligible non-empty and rand() < P_EXISTING (0.5):  spouse := pick(eligible)           [V] "OR" branch; [I] 0.5
  else: spouse := createPerson(sex = opposite, born = p.born + U(−6, 6)); enqueue(spouse)   [V]
  m := marriage(p, spouse, start = year)
  loop:
    e := nextMarriageEvent(m, year)
    child   → createPerson(born = e.year, parents = m, surname = husband's birth surname); enqueue(child)   [V]
    divorce → m.end := e.year; m.endedBy := divorce; return m
    death   → (either spouse) m.end := e.year; set died; return m
    none    → m.end := null (ongoing); return m
```

`nextMarriageEvent` [I]: yearly probabilities while the wife is 18–42: child 0.25 (max 5 children); divorce 0.06; spouse death from §2.2 hazard; stop at `presentYear`. Married surnames: wife gains husband's birth surname. [V] format.

`createPerson` assigns a unique first name and surname from the name lists (§2.6), sex as given or random.

### 2.4 Fill details [V] `[L84-TR]` pp. 21–22

```
fillDetails(p):
  targets := {}
  for 3 random numeric traits t: if a parent is known, targets[t] := parent's overall(t)   // "selects several personality traits from the person's parents" [V]; 3 [I]
  for 2 further random numeric traits: targets[t] := uniform in range                    // "several more, for variety, either at the user's request or more or less arbitrarily" [V] [L83-TR] p. 14; "selected somewhat arbitrarily" [V] [L84-TR] pp. 25–26; 2 [I]
  createToSpecification(p, targets)                                                       // §3
  symbolic: race, religion, nationality, social-background inherited from a parent if known, else random  [V] p. 26 (should); [I] implementation
```

### 2.5 Historical plots [V] `[L84-TR]` §6, Figs. 10–11

A historical plot has: name, time frame, roles (with optional stereotype per role), constraints, trait modifications, IPR modifications. [V] After the queue empties, run `H = round(population / 3)` historical plots [I]: pick a plot uniformly (the 1983 program's selection was "rather arbitrary", `[L83-TR]` p. 16 [V]; uniform [I]), fill roles with existing adults satisfying constraints (else create an unrelated character via create-to-spec, without family, "a source of unrelated characters", p. 23 [V]), pick a year when all role fillers are adults and alive [I], apply modifications, append `{plot, year, &PL<n>}` to each participant's history [V].

Contents of all historical plots are [I] (names only survive); see `packages/engine/src/library/historical-plots.ts`.

### 2.6 Names [I]

Name lists are experimental-free but invented: first names by sex and surnames, drawn from 1980s US usage. Uniqueness enforced (§1.1).

### 2.7 Writer's-aid mode [V] `[L90]`

Interactive prompts in this order: `Enter sex (m/f):`, `Enter name:`, `Enter age group (ya/ma/old):`, `Cycling person NAME`, `Enter year of next life event (cr = quit):`, `Next event (m/d):`, `Try to find spouse in universe (u/n):`, `Enter name (list):`, `Cycling marriage between A and B`, `Enter year of next marriage event (cr = quit):`, `Beginning finish up for NAME`, `Pick traits (p/r):`, `Possible traits to set: …`, `Enter trait and value (cr = quit):`, `Optimal occupations are: …`, `Enter occupation:`, `Selecting: X`, `Trait (t v) already satisfied`, `For trait (t v)`, `Choices (…):`. Empty answer ⇒ program picks. [V]

---

## 3. Create to specification [V] `[L84-TR]` §4.2; `[L90]` transcript

```
createToSpecification(p, targets):
  // step 1: occupation
  occ := argmin over stereotypes s with type ∈ {occupation}: D(s, targets)
         (all minima listed as "Optimal occupations are: …"; choose one, user or random)
  p.stereotypes := [occ]
  // step 2: per remaining trait, in REVERSE order of specification   [V] transcript order (intelligence, self-confidence, niceness
  //                                                                       for input niceness, self-confidence, intelligence)
  for t in reverse(keys(targets)):
    if |overall(t) − targets[t]| ≤ 1: print "Trait (t v) already satisfied"; continue          [V] message; [I] tolerance 1
    print "For trait (t v)"
    choices := if base(t) is defined: none (no later stereotype can change it, "does not alter existing values" [V],
                                            read under first-defining semantics §1.3 [I])
               else stereotypes s not in p.stereotypes, of any type except occupation [I], such that s defines t and
                 |s[t] − targets[t]| < |neutral(t) − targets[t]|                                 [V] "brings the person closer"
    if choices: pick one (user or random); append to p.stereotypes
  // step 3: residue
  for t in targets: if |overall(t) − targets[t]| > 0: modifiers[t] := targets[t] − base(t) (or − neutral if base undefined)  [I]
```

`D(s, targets) = Σ_t∈targets |s[t] − targets[t]|`, with `s[t]` undefined counted as `|neutral(t) − targets[t]|` [I] (Q-CHAR-2). `current(t)` = `base(t)` or neutral if undefined. [I]

---

## 4. Interpersonal relationships

- Scales `pos-neg`, `int-dis`, `dom-sub`, `attract`; each −10..10; two directional values. [V] `[L84-TR]` §4.3.
- Stored once per unordered pair, with a **canonical order** `(a, b)`: for stereotypical relationships, role order of the stereotype (husband/wife, mother/child, doctor/patient); for event relationships, the plot's role order. Printed pairs follow canonical order: `a→b / b→a`. Relationships are listed in creation order (Fig. 12 chronological; Liz's frame lists the Tony relationship first, i.e. data-entry order). [I] (Q-IPR-1; consistent with DIV-MOM `dom-sub 6/2`, Bruce Smith `dom-sub 6/-4`, Liz/Tony `pos-neg 0/-8`.)
- Value lookup: explicit value if set, else the stereotypical relationship's default, else unset. [V] Fig. 6 parenthesised values.
- Print format: `a/b//c/d//e/f//g/h`, blank for unset. [V] Fig. 12.
- Stereotypical relationships [V] values where given: `ex-spouse` both ways (−5, 4, 0, 4); `div-mom` mother→child (8, 4, 6, –), child→mother (4, 4, 2, –); `doctor-patient` doctor→patient (1, 0, 6, –), patient→doctor (3, 0, 2, –). `husband-wife`, `parent-child`, `siblings` defaults are [I].
- Derived predicates [I] (Q-IPR-2): `loves(a,b)` ⇔ `pos-neg(a→b) ≥ 5 ∧ attract(a→b) ≥ 5`; `in-love(a,b)` ⇔ `loves(a,b) ∧ loves(b,a)`; `together(a,b)` ⇔ `in-love(a,b)` and both consider the relation current (flag set by fragments that bring them together); `married(a,b)` from marriages; `available(a)` ⇔ not married and not engaged, the last from `[L85-TR]` Fig. 7 [V].

---

## 5. Plot fragments

### 5.1 Data model

```
PlotFragment {
  name, tier, sources[]
  roles: [{ name: "?him", stereotype?: sym, deferred?: bool }]        [V] roles + stereotype; [V] deferred [L87]
  constraints: SExpr[]                                                 [V]
  goals: SExpr[]          // goals this fragment achieves (may be several)  [V]
  subgoals: SExpr[]       // executed in order (total order default; `after` indices for partial order)  [V] partial order allowed
  effects: Effect[]       // applied when the fragment is expanded       [V] existence [L85-TR] p. 7, [L87] p. 236
  text: Template[]        // ">>>" lines emitted on expansion            [V] [L87] "simple templates"
  interest: number        // default 5                                   [V] existence; [I] values
  timeScale?: days|months|years                                         [V] [L85-CS]
}
```

### 5.2 Constraint language [V] predicate names from figures; [I] semantics

`(has-husband ?x)`, `(has-wife ?x)`, `(has-spouse ?x)`, binds/requires the current spouse; `(has-parent ?x)`, `?x`'s living parent; `(female-adult ?x)`, `(male-adult ?x)`, `(adult ?x)`; `(< (trait-value ?x 'trait) n)` / `>` / `<=` / `>=` (also spelled `trait-val`); `(stereotype ?x 'name)`; `(in-love ?a ?b)`, `(married ?a ?b)`, `(available ?x)`, `(not C)`, `(different ?a ?b)`.

**Role-binding constraints.** `(has-husband ?her)` with role `?husband` binds `?husband` to her current husband; `(has-parent ?husband)` with role `?parent` binds `?parent` to a parent of `?husband`. In the figures the binding is implied by the comment ("{the husband character}"); we make it explicit by writing `(has-husband ?her ?husband)` and `(has-parent ?husband ?parent)` in our library, and treat the published one-argument form as sugar. [I] (Q-PF-2 partly)

### 5.3 Goal syntax

Goals are s-expressions `(predicate arg…)`; `*` is a wildcard argument meaning "someone, to be chosen by the fragment that achieves the goal". [V] `(together * ?him)`. Disjunction `(or G1 G2 …)`. [V]

### 5.4 forced-marriage

Verbatim in `fixtures/historical/plot-fragment-forced-marriage.json` [V]. Our executable copy adds explicit binding arguments (§5.2). The subgoal is `(do-divorce ?husband ?her)` [V]: the published version (`[L85]` Table 2, p. 487) prints `?husband`, agreeing with the trace `(DO-DIVORCE TONY LIZ)`; `[L85-TR]` Fig. 2 prints `?him`, a typo in the report. (Q-PF-2 resolved; former deviation D-3.)

### 5.5 Text templates [V] observed lines; [I] syntax

`"{?parent} threatens {?her}: \"{msg}\""`, role names in braces are replaced by the bound character's print name (U85 traces: `SYMBOL`; U87/U90 full names); `{msg}` refers to a quoted goal argument.

---

## 6. Planner [V] `[L85-TR]` Fig. 3, p. 10; `[L87]` pp. 236–238

### 6.1 State

- `G`: list of pending goal nodes `{goal, parent, after: node?, rootSeed}`. [V] precedence graph; [I] structure.
- `used[root]`: characters bound in the expansion tree of each seed goal. [I]
- `budget`: maximum goal expansions (default 200). [I] (Q-PL-9; deviation D-2.)

### 6.2 Loop

```
tell(seeds):
  for s in seeds: G.push(node(s))
  while G not empty and budget > 0:
    n := selectReady(G)                       // §6.3
    remove n from G
    if n.goal is already true in the world: continue (silently)         [V] behaviour Fig. 5 (together renee neil never worked on); [I] mechanism
    if n.goal is (or …): n.goal := chooseDisjunct(n.goal)               // §6.6
    print "working on goal -- G"
    cands := candidates(n.goal)               // §6.4
    if none: print "no acceptable plans"; continue                      [V] print; [I] continue (Q-PL-6)
    c := select(cands)                        // §6.5
    fill deferred roles of c                  [V] [L87]
    expand(c): push subgoals (each after the previous), apply effects, print ">>> " text   [V]
    budget -= 1
```

### 6.3 Ready-goal selection [I] (Q-PL-1)

A node is ready when its `after` node is completed. Among ready nodes choose the **most recently added** (LIFO). Rationale: reproduces every published trace, in `[L85-TR]` Fig. 5 the seed `(together renee neil)` is ready from the start yet forced-marriage's subgoals are all worked on first; Lebowitz says the system is not purely depth-first because seeds and parallel subgoals can interleave, which LIFO-over-ready still allows.

### 6.4 Candidates [V] `[L87]` p. 236–238

For a goal `(pred a1 … an)`: every fragment indexed under `pred` whose goal pattern unifies with the goal (constants match, `?vars` bind, `*` in the goal leaves the variable free); then every assignment of characters to unbound non-deferred roles such that all constraints hold, roles are filled by distinct characters, and no newly bound character is in `used[root]` (unless the goal names it). [V] binding enumeration; [V] exclusion behaviour `[L85-TR]` p. 10; [I] scope.

Roles in the original that are filled by "creating a new character if need be" are marked `deferred`. [V]

### 6.5 Selection [V] `[L87]` p. 236

1. Prefer candidates whose fragment goals (under the binding) unify with **another open goal** in `G` ("achieve extra goals"). [V]
2. Then highest `interest`. [V] existence; [I] values.
3. Then uniformly at random (seeded). [V] random; [I] seeded.

The same rule chooses between role fillers for a single role: a filler that makes the fragment achieve another open goal wins (Renee as seducer). [V] `[L85-TR]` Fig. 5.

### 6.6 Disjunctions [I] (Q-PL-3)

`(or G1 … Gk)`: take the first `Gi` that has at least one candidate; if none has, take the last one (so the trace shows its failure). Reproduces `[L85-TR]` Figs. 4–5, where `(churn …)` has no candidates after the divorce (Liz is no longer married and the lovers have split) and `(TOGETHER LIZ NEIL)` is printed and fails.

### 6.7 Expansion and effects

Effects are applied at expansion time of the fragment that owns them, before its subgoals run [I]. Told events (`>>>` lines) are never retracted. [V] "we tell the story as we plan".

### 6.8 Character creation during planning [V]

If a role must be filled and no character qualifies, and the role is `deferred`, create a character by create-to-specification with targets taken from the role's trait constraints. [V] `[L85-TR]` p. 6, `[L87]` p. 238.

### 6.9 Open-endedness [V] `[L87]` p. 236

Churn fragments end with a churn (or disjunction containing churn) subgoal; the budget stops the run. "Next episode" = resume with the remaining goal graph and a fresh budget. [I]

---

## 7. Output

### 7.1 1985 trace format [V] `[L85-TR]` Figs. 4, 5, 10

```
working on goal -- (CHURN NEIL LIZ)
Several plans to choose from FORCED-MARRIAGE LOVERS-FIGHT JOB-PROBLEM      // when >1 fragment applies
-- using plan FORCED-MARRIAGE
Possible candidates -- MARLENA JULIE …                                      // when a single free role has >1 filler
Using MARLENA for WORRIER
>>> MARLENA is worried about NEIL
no acceptable plans
```

Goals printed in parentheses, uppercase; string arguments in double quotes.

### 7.2 1987 trace format [V] `[L87]` Figs. 2–3

```
working on goal -- CHURN JOSHUA FRAN
Several possible plans with equal goal effect
LOVERS-FIGHT HIM/FRAN HER/JOSHUA
…
-- picking one
Multiple deferred filler -- picking one
-- using plan COLLEAGUE-AFFAIR WIFE/FRAN HUSBAND/JOSHUA COLLEAGUE/JACK
>>> JOSHUA and FRAN fight about: MONEY
```

Role names printed without `?`, uppercase.

### 7.3 Frame display [V] `[L83-TR]` Fig. 12, `[L84-TR]` Fig. 12, `[L85-TR]` Fig. 1

Three printers reproducing the layouts in the fixtures, including `IPR` strings: U83 (generated character, `IPRs:`, `PHYS-ATT`, `SELF-CONF`), U84 (same layout, `Interpersonal Relationships:`, long trait names) and U85 (hand-entered cast with symbols).

---

## 8. Learning: constraint generalisation [V] `[L85-TR]` Figs. 9–10

`generalize(fragment)` produces `NAME0` by:

1. replacing each predicate by its parent in the predicate hierarchy: `has-husband → has-spouse`, `has-wife → has-spouse`, `female-adult → adult`, `male-adult → adult`; [V] Fig. 9
2. relaxing each trait threshold to the trait's neutral point (`(< (trait-value ?parent 'niceness) -5)` → `… 0`); [V] Fig. 9 ("The level of nastiness needed by the parent has also been relaxed"); [I] general rule
3. leaving roles, goals, subgoals, text and effects unchanged. [V] ("without the analysis of the underlying causality")

Explanation-based generalisation with author goals (`[L85-TR]` §3) is **[X]**.

---

## 9. Determinism and logging (deviation D-1)

All randomness goes through one seeded PRNG (mulberry32 over a 32-bit seed). A **choice script** can force any choice point by label, for structural reproduction tests. Every run produces a JSONL event log; replay with the same seed and inputs yields identical output. Not historical; required for science (`docs/deviations.md`).

## 10. Deviations log

Recorded in `docs/deviations.md`: D-1 seeded RNG; D-2 run budget; D-3 resolved (the published fragment prints `?husband`); D-4 explicit binding arguments in constraints; D-5 composite version.
