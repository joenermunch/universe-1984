# Fixtures

`historical/` holds machine-readable transcriptions of everything the primary sources show: program traces, character frames, plot-fragment definitions, data tables, algorithms and the 1990 interactive session.

## Conventions

- `fidelity`: `verified` for transcriptions. Inferred readings inside a verified fixture are marked locally (`"fidelity": "inferred"` on the field, or `"ambiguous": [...]` for scan readings).
- `source`: `{ref, location}` using IDs from `docs/references.md` and the printed page/figure.
- `lines[].raw` / `transcription`: verbatim text, normalised only for OCR damage (`»>` → `>>>`, block-glyph `N`). Any normalisation is described in the fixture.
- `structured`: our parse of the same content, for tests.
- `observations` / `open_questions`: anomalies and open questions.

## Index

| Fixture | Source | Kind |
|---|---|---|
| `plot-fragment-forced-marriage.json` | `[L85-CS]` Fig. 1, `[L85-TR]` Figs. 2, 9, `[L85]` Table 2 | fragment definition + generalised constraints |
| `trace-1985-fig4-churn-neil-liz.json` | `[L85-TR]` Fig. 4 | program trace |
| `trace-1985-fig5-churn-with-extra-goal.json` | `[L85-TR]` Fig. 5; `[L85-CS]` Fig. 3 | program trace |
| `trace-1985-fig10-forced-marriage0.json` | `[L85-TR]` Fig. 10 | program trace |
| `trace-1987-fig2-churn-joshua-fran.json` | `[L87]` Fig. 2 | program trace |
| `trace-1987-fig3-multigoal.json` | `[L87]` Fig. 3 | program trace |
| `character-jessica-donadio-1983.json` | `[L83-TR]` Fig. 12 | the same generated frame, printed in May 1983 with short labels |
| `character-jessica-donadio-1984.json` | `[L84-TR]` Fig. 12; `[L84]` Fig. 3 | generated character frame |
| `character-liz-chandler-1985.json` | `[L85-TR]` Fig. 1 | character frame |
| `character-model-1984.json` | `[L84-TR]` Figs. 1–6 | traits, stereotypes, IPRs |
| `character-generation-algorithms-1984.json` | `[L84-TR]` Figs. 8–11, §4.2 | algorithms |
| `session-1990-interactive-character.json` | `[L90]` | interactive session |
| `outline-1990-nadine-steven.json` | `[L90]` | automatic plot outline |
