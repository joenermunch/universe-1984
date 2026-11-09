# Deviations from documented UNIVERSE behaviour

Every intentional or unavoidable difference between this reconstruction and what the primary sources document. See `docs/fidelity-policy.md` §5.

| ID | What | Documented behaviour | Why we deviate | Switch off? |
|---|---|---|---|---|
| D-1 | All randomness via one seeded PRNG; choice scripts can pin choices | Original randomness unknown ("selects one randomly", `[L87]` p. 236) | Reproducibility and testing | No (seed can be randomised) |
| D-2 | Run budget (default 200 goal expansions per episode) | Open-ended; no termination policy documented (`[L87]`) | Guarantee termination | Budget configurable |
| D-3 | **Resolved, no longer a deviation.** forced-marriage subgoal `(do-divorce ?husband ?her)` | `[L85-TR]` Fig. 2 prints `?him`; the trace prints `(DO-DIVORCE TONY LIZ)`; the published `[L85]` Table 2 (*Poetics* 14, p. 487) prints `?husband` | The report figure had a typo; the executable copy follows the published fragment | n/a |
| D-4 | Constraints that bind roles take explicit role arguments, e.g. `(has-husband ?her ?husband)` | One-argument form with a comment naming the role (`[L85-TR]` Fig. 2) | Make binding explicit; published form accepted as sugar | n/a |
| D-5 | Composite version: U84 character generation + U87 planner | No single paper describes this combination | U84 is the only detailed character spec; U87 the only detailed planner spec | Version flags per subsystem |
| D-6 | Writer's-aid marriage-event prompt `Next event (c/d/s):` | Not shown in `[L90]` (transcript ends marriage cycling with an empty answer) | Needed to enter children/divorce interactively | n/a |
