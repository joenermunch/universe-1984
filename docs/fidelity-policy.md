# Fidelity policy

This project reconstructs a lost program. Its credibility depends on never blurring what the sources say with what we made up. These rules are binding for code, data, docs, UI and issues.

## 1. Three tiers

| Tier | Label in code/data | Meaning | Required evidence |
|---|---|---|---|
| **Verified reconstruction** | `verified` | Directly stated in, or shown by output in, a primary source | Source ID + location (page/figure) |
| **Inferred reconstruction** | `inferred` | Needed to run, consistent with every source, but not stated | Rationale + the sources it must stay consistent with + open question ID if any |
| **Experimental extension** | `experimental` | Deliberately new behaviour | Issue link; must be switchable off |

Every data item (stereotype, fragment, historical plot, template, probability) and every non-trivial engine rule carries one of these labels. Untagged = build failure (enforced by a test once the engine exists).

## 2. Source hierarchy

1. Program output and figures in primary sources (`[L84-TR]` Fig. 12, traces in `[L85-*]`, `[L87]`, `[L90]` transcripts).
2. Primary text statements (`[L83]`–`[L87]`, `[L90]`, `[L07]`).
3. Secondary sources: **never** sufficient alone for `verified`.
4. Our inference.

When primary sources conflict, prefer the one describing an **implemented** state over a design, and the later over the earlier for the same component; record the conflict in the specification.

## 3. Versions

Always name the version a behaviour comes from (U83, U84, U85, U87, U90). Composites must be labelled as composites.

## 4. Modes

- **Historical mode**: only `verified` + `inferred`. Never `experimental`.
- **Experimental mode**: anything, with the UI showing which tier produced each decision.

## 5. Deviations log

Any intentional difference from documented behaviour (e.g. seeded RNG, explicit run budget) goes in `docs/deviations.md` with: what, why, which source it deviates from, and how to switch it off if possible.

## 6. Claims

- Never say "UNIVERSE did X" unless X is `verified`. Say "our reconstruction does X (inferred)".
- Never claim equivalence to the original program. The strongest permitted claim is "reproduces the documented behaviour of [figure] structurally".
- Public text (README, UI, reports) must state that no original code survives (as of the date of writing).

## 7. Copyright

- This repository holds no copies of the papers; fixtures contain only short transcriptions of the figures the tests reproduce.
- Short quotations and figure transcriptions are kept for scholarship, with citation.
