import { describe, expect, it } from "vitest";
import { loadCast } from "../../src/cast.ts";
import { World } from "../../src/model/world.ts";
import { REL_STEREOTYPES, STEREOTYPES } from "../../src/library/stereotypes.ts";
import { printFrame } from "../../src/print/frame.ts";
import { fixture } from "./helpers.ts";

const norm = (ls: string[]) => ls.map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);

/** Jessica Donadio's world as printed in L83-TR / L84-TR Fig. 12 (same run). */
function jessicaWorld() {
  const w = new World(STEREOTYPES, REL_STEREOTYPES);
  const mk = (first: string, surname: string, sex: "M" | "F", n?: number) => {
    while (n !== undefined && w.persons.size < n) w.addPerson({ first: `Filler${w.persons.size}`, surname: "X", sex: "M" });
    return w.addPerson({ first, surname, sex });
  };
  const douglas = mk("Douglas", "Davidson", "M", 0);
  const jessica = mk("Jessica", "Donadio", "F", 7);
  const mark = mk("Mark", "Davidson", "M", 8);
  const rene = mk("Rene", "Davidson", "F", 9);
  const ivan = mk("Ivan", "Schaad", "M", 14);
  const bruce = mk("Bruce", "Smith", "M", 45);
  jessica.born = 1918;
  const m1 = w.marry(douglas, jessica, 1951); m1.children.push(mark.id, rene.id); mark.parents = rene.parents = m1.id;
  w.endMarriage(m1, 1959, "divorce");
  const rogers = w.addPerson({ first: "Rick", surname: "Rogers", sex: "M" }); w.marry(rogers, rene, 1975);
  const m2 = w.marry(ivan, jessica, 1959); w.endMarriage(m2, 1967, "divorce");
  w.setRelType(jessica, mark, "div-mom"); w.setRelType(jessica, rene, "div-mom");
  w.ensureRel(bruce, jessica); // REVENGE roles (avenger, victim): canonical order
  w.setIpr(jessica, bruce, "pos-neg", -4); w.setIpr(bruce, jessica, "dom-sub", 6); w.setIpr(jessica, bruce, "dom-sub", -4);
  jessica.history.push({ plot: "REVENGE", year: 1964, id: "&PL7" });
  jessica.stereotypes = ["masseuse", "party-goer", "egomaniac"];
  jessica.modifiers["phys-appearance"] = -1;
  jessica.symMods.age = "A";
  return { w, jessica };
}

// IPR lines in the scans wrap names and values across columns; compare their value strings separately
const iprVals = (ls: string[]) => ls.flatMap((l) => l.match(/-?\d* ?\/-?\d* ?\/\/[^ ]*(?: \/)?/g) ?? []).map((s) => s.replace(/ /g, ""));
const sameFrame = (got: string[], want: string[]) => {
  const plain = (ls: string[]) => ls.filter((l) => !/\/\//.test(l) && !/^(EX-SPOUSE|DIV-MOM|BRUCE)/.test(l));
  expect(plain(got)).toEqual(plain(want));
  expect(iprVals(got).sort()).toEqual(iprVals(want).sort());
};

describe("frame display (B-16)", () => {
  it("re-prints Jessica Donadio (L84-TR Fig. 12) from structured data", () => {
    const { w, jessica } = jessicaWorld();
    const want = norm(fixture("character-jessica-donadio-1984.json").transcription);
    sameFrame(norm(printFrame(w, jessica, "U84")), want);
  });

  it("re-prints the same character with the May 1983 labels (L83-TR Fig. 12)", () => {
    const { w, jessica } = jessicaWorld();
    sameFrame(norm(printFrame(w, jessica, "U83")), norm(fixture("character-jessica-donadio-1983.json").transcription));
  });

  it("re-prints Liz Chandler (L85-TR Fig. 1) and derives overall values from modifiers (spec §1.3)", () => {
    const w = loadCast({
      id: "liz", persons: [
        { sym: "DON", first: "Don", surname: "Craig", sex: "M" },
        { sym: "LIZ", first: "Liz", surname: "Chandler", sex: "F" },
        { sym: "TONY", first: "Tony", surname: "Dimera", sex: "M" },
      ],
    });
    const [don, liz, tony] = ["DON", "LIZ", "TONY"].map((s) => w.bySymbol(s)) as [ReturnType<World["bySymbol"]>, ReturnType<World["bySymbol"]>, ReturnType<World["bySymbol"]>];
    w.ensureRel(tony, liz); // data-entry order: the figure lists the Tony relationship first
    const m1 = w.marry(don, liz, 1980); w.endMarriage(m1, null, "divorce");
    w.marry(tony, liz, null);
    w.setIpr(tony, liz, "pos-neg", 0); w.setIpr(liz, tony, "pos-neg", -8);
    w.setIpr(tony, liz, "int-dis", 8); w.setIpr(liz, tony, "int-dis", 8);
    w.setIpr(tony, liz, "dom-sub", 6); w.setIpr(liz, tony, "dom-sub", -6);
    w.setIpr(tony, liz, "attract", 7); w.setIpr(liz, tony, "attract", -3);
    liz.stereotypes = ["actor", "knockout", "socialite", "party-goer"];
    liz.symMods = { sex: "F", age: "YA" };
    liz.modifiers = { wealth: 3, promiscuity: -3, intelligence: 3 };
    // Liz's marriage frames are &MF1 and &MF3 in the figure; ours number from 0, compare without ids
    const strip = (ls: string[]) => norm(ls).map((l) => l.replace(/\[&MF\d+\] ?/, "").replace(/\s+/g, " ").trim());
    const want = strip(fixture("character-liz-chandler-1985.json").transcription).join("\n").replace("\n(INTELLIGENCE 3)", " (INTELLIGENCE 3)").split("\n");
    expect(strip(printFrame(w, liz, "U85"))).toEqual(want);
  });
});
