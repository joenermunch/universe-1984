import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(import.meta.dirname, "../../../fixtures/historical");

describe("historical fixtures", () => {
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  it("exist", () => expect(files.length).toBeGreaterThan(0));
  for (const f of files) {
    it(`${f} parses and declares fidelity + source`, () => {
      const j = JSON.parse(readFileSync(join(dir, f), "utf8"));
      expect(j.id, "id").toBeTruthy();
      expect(j.fidelity, "fidelity").toMatch(/^(verified|inferred|experimental)$/);
      expect(j.source ?? j.sources, "source").toBeTruthy();
    });
  }
});
