# Engine architecture (provisional)

Status: implemented; the rules themselves are in [`specification.md`](specification.md).

```
packages/
  engine/              # framework-free TypeScript; no React/Next imports
    src/
      rng.ts           # seeded PRNG + choice scripts for structural tests
      model/           # Person, Stereotype, IPR, Marriage, HistoricalPlot, Goal, PlotFragment (all tier-tagged)
      universe/        # fill queue, life cycle, marriage cycle, create-to-spec, inheritance, historical plots
      planner/         # precedence graph, candidate enumeration, selection, deferred fillers, expansion
      text/            # templates; trace printers (1985, 1987 formats)
      library/         # loaders for fragments/stereotypes in s-expression-shaped JSON
      log/             # structured event log (JSONL), replay
  library-historical/  # verified + inferred data only
  library-experimental/
apps/
  web/                 # Next.js + React; depends on engine only through its public API
fixtures/historical/   # transcriptions from the papers
tests/                 # vitest: historical/, invariants/, fidelity/
```

## Key types (sketch)

```ts
type Tier = "verified" | "inferred" | "experimental";
type Sym = string;                     // "churn", "?him", "*"
type SExpr = Sym | number | SExpr[];

interface PlotFragment {
  name: Sym; tier: Tier; sources: SourceRef[];
  roles: { name: Sym; stereotype?: Sym; deferred?: boolean }[];
  constraints: SExpr[];
  goals: SExpr[];                      // goals this fragment achieves
  subgoals: { goal: SExpr; after?: number[] }[];   // partial order
  effects?: Effect[];                  // trait / IPR modifications
  text?: Template[];                   // ">>>" lines
  interest?: number;
  timeScale?: "days" | "months" | "years";
}
```

## Run model

`tell(universe, seedGoals, { seed, budget, mode })` → stream of `TraceLine` and `Event` records. Same input + seed ⇒ identical stream. The web app consumes the stream; nothing in the engine knows about the UI.
