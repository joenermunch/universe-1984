# ADR-0002: TypeScript engine with a Lisp-shaped data model (no Lisp port first)

- **Status:** Accepted (2026-11-08)

## Context

The preferred stack is TypeScript (portable engine), Next.js/React UI, Vitest. The original was written in an unknown Lisp dialect (inferred from trace syntax). The brief asks whether a Lisp-first implementation would materially improve fidelity.

## Evidence

- No original code survives, so there is nothing to port; a Lisp version would be new code in a guessed dialect.
- Everything we know is at the level of data structures, algorithm descriptions and traces. None of it depends on Lisp-specific semantics (e.g. no reliance on `eval`, macros or dynamic scoping is documented).
- What is Lisp-shaped and visible: s-expression fragment definitions, `?variables`, quoted symbols, REPL traces (`*(tell '(...))`), gensym ids (`&PER7`).

## Decision

1. Implement the engine in **TypeScript**, framework-free, browser- and Node-compatible, zero runtime dependencies beyond a seeded PRNG we write ourselves.
2. Keep the **data model Lisp-shaped**: goals and constraints are nested arrays of symbols (`["churn", "?him", "?her"]`); fragments can be loaded from an s-expression text format that mirrors the published figures.
3. **Print traces in the historical formats** (1985 and 1987).
4. A small Lisp transcription of the published fragment and loop may be written later as documentation only, not as the reference implementation.

## Consequences

- Single codebase for engine and web.
- Fidelity is judged by behaviour against fixtures, not by language.
- If original code is ever found, a Lisp port/emulation would be reconsidered (new ADR).
