# Testing strategy

Vitest for the TypeScript engine. Tests are grouped by what they prove.

## 1. Historical-behaviour tests (`tests/historical/`)

Each test cites a fixture in `fixtures/historical/` and the behaviour IDs it demonstrates. They run in **historical mode** only.

| Test | Fixture | Level | Proves |
|---|---|---|---|
| forced-marriage single goal | `trace-1985-fig4-*` | structural | Subgoal order, fragment choice, outline lines, "no acceptable plans" |
| forced-marriage with extra goal | `trace-1985-fig5-*` | structural | Opportunistic filler (RENEE), used-character exclusion (ALEX), goal satisfied as side effect |
| forced-marriage0 | `trace-1985-fig10-*` | structural | Generalised constraints admit DAVID/RENEE; original fragment rejects them |
| candidate enumeration | `trace-1987-fig2-*` | behavioural | All bindings listed incl. both genderless orders; deferred filler |
| opportunistic fragment | `trace-1987-fig3-*` | behavioural | ACCIDENT-BREAKUP chosen when it also achieves `together` |
| Nadine/Steven | `outline-1990-*` | behavioural | Same fragment with generated cast; EXPOSE path for `eliminate` |
| Jessica Donadio frame | `character-jessica-donadio-1984` | structural | Frame display format; ex-spouse and div-mom stereotype values; history entry → raw IPR |
| create-to-spec | `session-1990-interactive-character` | behavioural | Occupation first by min discrepancy; satisfied traits skipped; per-trait candidates don't alter set values |
| life/marriage cycles | `character-generation-algorithms-1984` | behavioural | Fill-queue processing order; spouses/children added to queue; marriage years consistent |

"Structural" tests use a hand-built cast (`fixtures/casts/`) satisfying every fact stated in the source and a **choice script** pinning the documented random choices. They assert the *sequence of goals, fragments, bindings and `>>>` lines*.

## 2. Invariant tests (property-based, seeded)

Over many seeds:

- **Consistency**: ages monotone with time; no one married to two people at once; no marriage to a direct relative; children born during the parents' marriage and after parents' birth; ex-spouses after divorce; no dead character acts.
- **Relationship updates**: every IPR value stays in −10..10; stereotype defaults apply unless overridden; effects are applied exactly once.
- **Constraint satisfaction**: every bound role satisfies its fragment's constraints at binding time.
- **Deterministic replay**: same seed + same inputs ⇒ byte-identical event log and trace.
- **Planning termination**: every run stops within its budget; goal graph never contains cycles.
- **Character history**: every historical plot appears in each participant's history; every non-stereotypical IPR traces to an event.

## 3. Fidelity-tag tests

- Every library item and rule has a tier tag.
- Historical mode loads zero `experimental` items.

## 4. Snapshot tests

Traces printed in 1985 and 1987 formats are snapshot-tested per seed so format regressions are visible.

## 5. Where tests run

On the VPS (heavy jobs via `vps-batch`). CI on GitHub Actions for unit + historical tests on every PR once the engine exists.
