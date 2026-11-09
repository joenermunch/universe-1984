# UNIVERSE (1983–1987): a historical reconstruction

A reconstruction of **UNIVERSE**, Michael Lebowitz's story-generation program from Columbia University.

**Try it on the web: [universe.jjwp.net](https://universe.jjwp.net)**: talk to it, read the episodes, see why the planner chose each plot, and browse the cast and families, in five languages.

UNIVERSE built a cast of soap-opera characters, with marriages, children, divorces, stereotypes, personality traits and relationship histories, and then told never-ending melodrama by planning with **author goals** (for example *churn*: keep two lovers apart) and reusable **plot fragments** such as *forced-marriage*.

> **No original UNIVERSE source code is known to survive.** Everything here is reconstructed from the published papers, and every rule is labelled *verified* (stated in a primary source) or *inferred* (our reconstruction). It most likely ran in a UCI-family Lisp on Columbia's DEC-20 (inferred from Lebowitz's other systems; see the [fidelity report](docs/reconstruction-fidelity-report.md#implementation-inferred)).

## Status

| Area | State |
|---|---|
| Specification | [`docs/architecture/specification.md`](docs/architecture/specification.md): every rule tagged verified or inferred |
| Engine | `packages/engine` (TypeScript, no runtime dependencies): universe construction, create-to-specification, author-goal planner, 1985/1987 trace formats, frame printers, constraint generalisation |
| Historical reproduction | 1985 Figs. 4, 5, 9–10 and 1987 Figs. 2–3 reproduced line for line; 1983/1984/1985 character frames; 1990 writer's-aid session and outline. See [`docs/reconstruction-fidelity-report.md`](docs/reconstruction-fidelity-report.md) |
| Tests | 284 (Vitest): historical reproductions, invariants over 200 generated universes, tier enforcement, deterministic replay |

Run the tests: `pnpm install && pnpm check`

## Documents

- [Specification](docs/architecture/specification.md) · [Engine architecture](docs/architecture/engine-architecture.md)
- [Fidelity report](docs/reconstruction-fidelity-report.md) · [Deviations](docs/deviations.md) · [Fidelity criteria](docs/fidelity-criteria.md) · [Fidelity policy](docs/fidelity-policy.md)
- [Testing strategy](docs/testing-strategy.md) · [Decisions](docs/decisions/) · [References](docs/references.md)

## Repository layout

```
packages/engine/   the program and its tests
fixtures/          machine-readable transcriptions of the documented examples the tests reproduce
docs/              specification, fidelity report, policy, decisions, references
```

## Principles

1. Primary sources over summaries; every rule cites a page or figure.
2. The engine never uses a language model, never retracts told events, and never uses planning UNIVERSE did not have.

## Credits

UNIVERSE was designed by Michael Lebowitz at Columbia University, with contributions acknowledged in his papers from Susan Rachel Burstein, Paula Langer and Doron Shalmon. This project is unaffiliated with them.
