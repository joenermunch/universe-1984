# Reconstruction fidelity report

State on 2026-11-08, engine 0.1.0. Criteria: `docs/fidelity-criteria.md`. Deviations: `docs/deviations.md`.

## Documented runs

| Source | What | Level reached | Test |
|---|---|---|---|
| `[L85-TR]` Fig. 4 | forced-marriage on Liz/Neil, one goal | **Structural: every goal, plan list, candidate list, filler and `>>>` line matches** | `test/historical/forced-marriage-1985.test.ts` |
| `[L85-TR]` Fig. 5 | same, extra goal `(together renee neil)` | **Structural: matches**, including RENEE chosen opportunistically, ALEX as sole killer, seed goal never worked on | same |
| `[L85-TR]` Figs. 9–10 | constraint generalisation → FORCED-MARRIAGE0 on David/Renee | **Exact constraints (Fig. 9); goals and outline lines of Fig. 10 match**; FORCED-MARRIAGE not applicable | same |
| `[L87]` Fig. 2 | CHURN JOSHUA FRAN with all candidate bindings | **Line-for-line match of the printed trace** (10 + 9 candidate lines, fight subjects, deferred filler) | `test/historical/planning-stories-1987.test.ts` |
| `[L87]` Fig. 3 | multi-goal, ACCIDENT-BREAKUP with THIRD-PARTY/VALERIE | **Line-for-line match** | same |
| `[L84-TR]` Fig. 12 | Jessica Donadio frame | **Every line matches**; IPR value strings match (layout of the scan wraps columns) | `test/historical/frames.test.ts` |
| `[L83-TR]` Fig. 12 | the same frame as printed in May 1983 (short labels) | **Every line matches** with the U83 printer | same |
| `[L85-TR]` Fig. 1 | Liz Chandler frame | **Every line matches** (marriage-frame ids renumbered) | same |
| `[L90]` session | writer's-aid character creation | **Prompt sequence matches; create-to-spec steps match** with a library consistent with the transcript | `test/historical/writers-aid-1990.test.ts` |
| `[L90]` outline | Nadine/Steven on a generated cast | **Behavioural: 11-event structure reproduced** on generated casts (threat, break-up, worry, seduction, two-event EXPOSE, divorce, ex's attempt, frustration, break-up, seduction) | `test/historical/outline-1990.test.ts` |

"Structural" uses hand-built casts (`fixtures/casts/`, tier inferred) and pins only choice points the source shows as random.

## Behaviours

| ID | Behaviour | Status |
|---|---|---|
| B-1 | Author-goal planning | Demonstrated (all traces) |
| B-2 | Subgoals in listed order | Demonstrated (Figs. 4, 5, 10; L90) |
| B-3 | Fragment alternatives listed | Demonstrated (1985 and 1987 formats) |
| B-4 | Filler alternatives listed | Demonstrated |
| B-5 | Opportunistic filler | Demonstrated (RENEE, Fig. 5) |
| B-6 | Opportunistic fragment | Demonstrated (ACCIDENT-BREAKUP, L87 Fig. 3) |
| B-7 | Already-true goal skipped | Demonstrated (Fig. 5) |
| B-8 | Used characters excluded | Demonstrated (Fig. 5) |
| B-9 | "no acceptable plans"; no retraction | Demonstrated (Figs. 4–5); invariant over 50 seeds |
| B-10 | Disjunctive final subgoal | Demonstrated (Figs. 4–5: together branch; L90: churn branch) |
| B-11 | All bindings enumerated, both genderless orders | Demonstrated (L87 Fig. 2) |
| B-12 | Deferred filler after choice | Demonstrated (COLLEAGUE/JACK; THIRD-PARTY/VALERIE) |
| B-13 | Constraint generalisation | Demonstrated (Fig. 9 exact) |
| B-14 | Fill queue, life and marriage cycles | Implemented; invariants hold over 200 seeds |
| B-15 | Create-to-specification | Demonstrated (L90 transcript) |
| B-16 | Frame display | Demonstrated (Figs. 12 and L85-TR Fig. 1) |
| B-17 | Historical plots → history + raw IPRs | Implemented (REVENGE reproduces Fig. 12's raw IPR pattern) |

## What reproduction taught us (now in the spec)

Each of these was forced by making a published output come out right; each is tagged [I] in the spec.

1. **`churn` and `together` are symmetric**, and candidates are enumerated with the *swapped* argument order first, the only order that reproduces both the 1985 bindings and the 1987 candidate lists.
2. **Ready goals are worked depth-first, seeds in order**, the only policy consistent with Fig. 5 (the extra seed goal is never worked on because the seduction satisfies it first).
3. **Disjunction**: the first branch with candidates, else the last branch, which reproduces the final "no acceptable plans" in Figs. 4–5.
4. **Trait modifiers are deltas on the first stereotype that defines a trait.** This is the only reading under which both Jessica Donadio's and Liz Chandler's printed values are consistent. It also fixes the values of six stereotypes (masseuse, party-goer, egomaniac, actor, knockout, socialite) from output.
5. **Create-to-specification** offers no second occupation and can only help a trait no stereotype has defined yet (1990 transcript).
6. **Married surnames** are shown only for generated characters (RENE DAVIDSON ROGERS, NADINE BURTON BRYKS), not hand-entered ones (LIZ CHANDLER, married to Tony).
7. **The ex-husband who returns is the latest one** (L90: Teddy, just divorced).
8. **Fig. 2 vs Fig. 4 disagree on `do-divorce`'s first argument**; we followed the trace. The published *Poetics* version (Table 2, p. 487) confirms it: it prints `(do-divorce ?husband ?her)`. Former deviation D-3, now resolved.
9. The **1987 trace lists alternatives only when they have "equal goal effect"**: when opportunism decides, no list is printed (Fig. 3), unlike the 1985 format, which always lists plans.

## Known gaps

- ~45 of ~65 fragments are unknown; the library has 21 (1 verified, 20 inferred from traces). A November 2026 search of the published record found no further fragment contents.
- Stereotype library: 3 verified frames, 6 derived from output, the rest invented values for verified names. One more verified name, "Californian" (May 1983 only), is recorded but not used.
- Writer's-aid marriage-event prompt (`c/d/s`) is not shown in L90; ours is inferred.
- Compared since version 1: CUCS-055-83 (May 1983), both *Poetics* articles and the printed Kurzweil essay. The journal texts match the reports apart from the `do-divorce` correction, the typeset −6 in Table 6, and the "..." that ends the forced-marriage0 trace; the printed 1990 session and outline match the fixtures.

## Implementation (inferred)

No original code is known to survive. Lebowitz's previous system, IPP, was "written in Yale/Rutgers/UCI LISP on a DECSystem 20/60" (CUCS-13-81, p. 68), and in the UNIVERSE years he worked on Columbia's DEC-20 (his network address in AIList Digest, Oct 1985, is on the `columbia-20` host). UNIVERSE most likely ran in a UCI-family Lisp on that machine, which fits the `*` prompt in every published trace. This is an inference, not a documented fact.
