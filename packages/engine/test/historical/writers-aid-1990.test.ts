import { describe, expect, it } from "vitest";
import { Builder } from "../../src/universe/build.ts";
import { World } from "../../src/model/world.ts";
import { REL_STEREOTYPES, STEREOTYPES } from "../../src/library/stereotypes.ts";
import type { Stereotype } from "../../src/model/traits.ts";
import { writersAidCreate } from "../../src/universe/writers-aid.ts";
import { fixture } from "./helpers.ts";

describe("L90 writer's-aid session (B-15, spec §2.7)", () => {
  const fx = fixture("session-1990-interactive-character.json");
  const answers = (fx.lines as { prompt?: string; input?: string | null }[]).filter((l) => l.prompt).map((l) => l.input ?? "");

  it("asks the documented prompts in order and follows the create-to-specification steps", () => {
    // The 1990 library is lost. This test-local library is the smallest one consistent with the transcript;
    // the test checks that the ALGORITHM reproduces the transcript given such a library (criteria: behavioural).
    const st = (name: string, type: Stereotype["type"], traits: Stereotype["traits"]): Stereotype => ({ name, type, traits, goals: [], tier: "inferred" });
    const lib = [
      st("sleazy-doctor", "occupation", { intelligence: 3, wealth: 7, guile: 6 }),
      st("bureaucrat", "occupation", { niceness: 2, "self-confidence": 0, intelligence: 7 }),
      st("life-guard", "job", { "phys-appearance": 6, "self-confidence": 4 }),
      STEREOTYPES.find((s) => s.name === "swinger")!, // verified values, L84-TR Fig. 3
      st("big-eater", "habit", { "self-confidence": 4, "phys-appearance": -3 }),
      st("egomaniac", "trait", { guile: 7, "self-confidence": 8 }),
      st("taxi-driver", "job", { niceness: 3 }),
    ];
    const b = new Builder({ seed: 7, script: { "name:first": "Kathy", "name:surname": "Cole" } }, new World(lib, REL_STEREOTYPES));
    const transcript: string[] = [];
    let i = 0;
    const p = writersAidCreate(b, {
      say: (l) => transcript.push(l),
      ask: (q) => { transcript.push(q); const a = answers[i++] ?? ""; return a; },
    });
    const prompts = transcript.filter((l) => /:$/.test(l) && !/^Optimal|^For trait|^Possible/.test(l)).map((l) => l.replace(/^Choices \(.*\):$/, "Choices (…):"));
    const want = (fx.lines as { prompt?: string }[]).filter((l) => l.prompt).map((l) => l.prompt!.replace(/^Choices \(.*\):$/, "Choices (…):"));
    expect(prompts).toEqual(want);
    // program-picked spouse name (user left it blank) and the documented messages
    expect(transcript).toContain("Cycling person John Jones");
    expect(transcript).toContain("Cycling marriage between John Jones and Kathy Cole");
    expect(transcript).toContain("Beginning finish up for John Jones");
    expect(transcript.find((l) => l.startsWith("Possible traits to set:"))).toBe("Possible traits to set: wealth, promiscuity, competence, niceness, self-confidence, guile, naivete, moodiness, physical attractiveness, intelligence");
    // create-to-spec shape: occupation first; intelligence satisfied; then self-confidence, then niceness (reverse order)
    const steps = transcript.filter((l) => /^(Optimal occupations|Selecting|Trait \(|For trait)/.test(l));
    expect(steps[0]).toBe("Optimal occupations are: sleazy-doctor");
    expect(steps.slice(1)).toEqual(["Selecting: sleazy-doctor", "Trait (intelligence 3) already satisfied", "For trait (self-confidence 4)", "For trait (niceness 3)"]);
    expect(transcript).toContain("Choices (life-guard, swinger, big-eater):");
    expect(p.stereotypes.slice(0, 2)).toEqual(["sleazy-doctor", "swinger"]);
    expect(p.stereotypes).toContain("taxi-driver");
    expect(transcript).toContain("Choices (taxi-driver):");
  });
});

describe("create-to-specification with the reconstructed library", () => {
  it("still follows the procedure (occupation first, reverse order, residue as modifiers)", () => {
    const b = new Builder({ seed: 3 });
    const p = b.world.addPerson({ first: "Test", surname: "Person", sex: "M", born: 1945 });
    const said: string[] = [];
    writersAidCreate; // (interactive path covered above)
    const targets: [import("../../src/model/traits.ts").NumericTrait, number][] = [["niceness", 3], ["self-confidence", 4], ["intelligence", 3]];
    import("../../src/universe/create-to-spec.ts").then(({ createToSpecification }) => createToSpecification(b.world, p, targets, b.rng, { say: (l) => said.push(l), ask: () => "" }));
    return import("../../src/universe/create-to-spec.ts").then(() => {
      expect(said[0]).toMatch(/^Optimal occupations are: /);
      expect(b.world.stereotypes.get(p.stereotypes[0]!)!.type).toBe("occupation");
      for (const [t, v] of targets) expect(b.world.trait(p, t)).toBe(v); // residue makes the spec exact
    });
  });
});
