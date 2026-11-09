# Historical fidelity acceptance criteria

Fixed before engine work. A reproduction "passes" only if every listed criterion holds. Levels (exact, structural, behavioural) are as used in `docs/reconstruction-fidelity-report.md`.

## Behaviour catalogue

| ID | Behaviour | Evidence |
|---|---|---|
| B-1 | Author-goal planning: seed goals are author goals; fragments chosen by the goals they achieve | `[L85-TR]`, `[L87]` |
| B-2 | Subgoals of a fragment are worked on in their listed order | `[L85-TR]` Fig. 4 |
| B-3 | Candidate fragments listed when more than one applies | Figs. 4–5; `[L87]` Fig. 2 |
| B-4 | Candidate role fillers listed when a single free role has several fillers | Figs. 4–5 |
| B-5 | Opportunistic role filler: a filler that also achieves another open goal is chosen | Fig. 5 (RENEE) |
| B-6 | Opportunistic fragment: a fragment that also achieves another open goal is chosen | `[L87]` Fig. 3 |
| B-7 | A goal already true when reached is not worked on | Fig. 5 (`together renee neil`) |
| B-8 | Characters bound earlier in the same expansion are not reused for new roles | Fig. 5 (ALEX, not RENEE) |
| B-9 | A goal with no candidates prints "no acceptable plans"; told events are not retracted | Figs. 4–5 |
| B-10 | Disjunctive final subgoal: churn again or together | forced-marriage |
| B-11 | All role bindings enumerated, both orders of genderless roles | `[L87]` Fig. 2 |
| B-12 | Deferred filler filled after choice | `[L87]` Fig. 2 (COLLEAGUE/JACK) |
| B-13 | Constraint generalisation produces forced-marriage0 exactly as Fig. 9; it applies where forced-marriage does not | Figs. 9–10 |
| B-14 | Universe built by fill queue + life/marriage cycles; spouses and children enqueued | `[L84-TR]` Figs. 8–9 |
| B-15 | Create-to-specification: occupation by minimal discrepancy, satisfied traits skipped, per-trait stereotypes that don't alter set values, residue as modifiers | `[L84-TR]` §4.2; `[L90]` |
| B-16 | Frame display reproduces the 1984/1985 formats including IPR strings | Fig. 12; `[L85-TR]` Fig. 1 |
| B-17 | Historical plots add history entries and event-based IPRs | Fig. 12 (REVENGE → Bruce Smith) |

## Per-fixture criteria

| Fixture | Level | Must match | May differ |
|---|---|---|---|
| `trace-1985-fig4-*` | structural | sequence of goals (incl. arguments), chosen fragments, "Several plans" lists (as sets), candidate lists (as sets), chosen fillers, every `>>>` line, final "no acceptable plans" | spacing/`--` punctuation the OCR lost; order inside candidate lists |
| `trace-1985-fig5-*` | structural | as Fig. 4, plus B-5, B-7, B-8 | the figure's missing "-- using plan SEDUCTION" line |
| `trace-1985-fig10-*` | structural | fragment FORCED-MARRIAGE0 chosen; FORCED-MARRIAGE not applicable; goals and `>>>` lines up to the figure's end | content after the figure ends |
| `trace-1987-fig2-*` | behavioural | the ten candidates for CHURN JOSHUA FRAN (as a set, given the fixture cast); five PERSONAL-FIGHT subjects; LOVERS-FIGHT subgoal sequence; deferred COLLEAGUE filled after choice | choice outcomes other than pinned ones |
| `trace-1987-fig3-*` | behavioural | ACCIDENT-BREAKUP chosen without alternatives being preferred; three `>>>` lines; DUMP-LOVER FRAN JOSHUA; TOGETHER JOSHUA VALERIE pursued | - |
| `outline-1990-*` | behavioural | with a generated cast: forced-marriage subgoal order; `eliminate` realised by EXPOSE as two events; continuation with further churn | names, exact wording |
| `session-1990-*` | behavioural | prompt sequence and the create-to-spec steps (B-15) | the stereotype library's contents |
| `character-jessica-*` | structural | frame printer reproduces every line from the structured fixture | - |
| `character-liz-*` | structural | as above; overall values follow spec §1.3 from modifiers + stereotype bases | - |
| `plot-fragment-forced-marriage` | verified data | published fragment loads; generalisation yields Fig. 9 | - |

Choice scripts may pin only choice points that the source shows as random ("picking one", candidate lists with a choice). Everything else must follow from the spec.
