import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadCast, type CastFile } from "../../src/cast.ts";

const root = join(import.meta.dirname, "../../../../fixtures");
export const fixture = (name: string) => JSON.parse(readFileSync(join(root, "historical", name), "utf8"));
export const cast = (name: string) => loadCast(JSON.parse(readFileSync(join(root, "casts", name), "utf8")) as CastFile);

export type Ev = { k: "goal" | "using" | "several" | "possible" | "filler" | "out" | "fail"; v: string };

/** Normalise 1985/1987 trace lines (published or ours) into comparable events. */
export function normalize(lines: string[]): Ev[] {
  const out: Ev[] = [];
  const set = (s: string) => s.trim().split(/\s+/).sort().join(" ");
  for (const raw of lines) {
    for (const part of raw.split(/ (?=-- using plan )/)) {
      const l = part.trim();
      let m: RegExpMatchArray | null;
      if ((m = l.match(/^working on goal --\s*\(?(.*?)\)?$/))) out.push({ k: "goal", v: m[1]!.replace(/[()]/g, "").replace(/\s+/g, " ").trim() });
      else if ((m = l.match(/^(?:-- )?using plan (\S+)/))) out.push({ k: "using", v: m[1]! });
      else if ((m = l.match(/^Several plans to choose from (.*)$/))) out.push({ k: "several", v: set(m[1]!) });
      else if ((m = l.match(/^Possible candidates -- (.*)$/))) out.push({ k: "possible", v: set(m[1]!) });
      else if ((m = l.match(/^Using (\S+) for (\S+)/))) out.push({ k: "filler", v: `${m[1]} ${m[2]}` });
      else if ((m = l.match(/^>>> (.*)$/))) out.push({ k: "out", v: m[1]!.trim() });
      else if (/^no acceptable plans/.test(l)) out.push({ k: "fail", v: "" });
    }
  }
  return out;
}

/** Strict comparison of all events except `using`, which must appear in the published order where printed. */
export function compareStructural(published: Ev[], ours: Ev[]): { ok: boolean; diff: string } {
  const strip = (e: Ev[]) => e.filter((x) => x.k !== "using").map((x) => `${x.k}: ${x.v}`);
  const a = strip(published), b = strip(ours);
  const pu = published.filter((x) => x.k === "using").map((x) => x.v);
  const ou = ours.filter((x) => x.k === "using").map((x) => x.v);
  let j = 0;
  for (const u of ou) if (j < pu.length && pu[j] === u) j++;
  const ok = JSON.stringify(a) === JSON.stringify(b) && j === pu.length;
  return { ok, diff: ok ? "" : `published:\n  ${a.join("\n  ")}\nours:\n  ${b.join("\n  ")}\nusing published ${pu.join(",")} ours ${ou.join(",")}` };
}
