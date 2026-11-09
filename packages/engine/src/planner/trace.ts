import type { TraceEvent } from "./planner.ts";

/** 1985 format, spec §7.1 [V] L85-TR Figs. 4, 5, 10. */
export function print1985(ev: TraceEvent[]): string[] {
  const out: string[] = [];
  let pending: string[] = [];
  for (const e of ev) {
    switch (e.t) {
      case "goal": out.push(`working on goal -- (${e.goal.join(" ")})`); break;
      case "candidates": if (e.fragments.length > 1) out.push(`Several plans to choose from ${e.fragments.join(" ")}`); break;
      case "fillers": pending.push(`Possible candidates -- ${e.names.join(" ")}`); break;
      case "filler": pending.push(`Using ${e.name} for ${e.role}`); break;
      case "using": out.push(`-- using plan ${e.frag}`, ...pending); pending = []; break;
      case "out": out.push(`>>> ${e.text}`); break;
      case "fail": out.push("no acceptable plans"); break;
    }
  }
  return out;
}

/** 1987 format, spec §7.2 [V] L87 Figs. 2–3. */
export function print1987(ev: TraceEvent[]): string[] {
  const out: string[] = [];
  const rl = (r: [string, string][]) => r.map(([a, b]) => `${a}/${b}`).join(" ");
  for (const e of ev) {
    switch (e.t) {
      case "goal": out.push(`working on goal -- ${e.goal.join(" ")}`); break;
      case "candidates":
        if (e.equal) out.push("Several possible plans with equal goal effect", ...e.list.map((c) => `${c.frag} ${rl(c.roles)}`.trim()), "-- picking one");
        break;
      case "using":
        if (e.multipleDeferred) out.push("Multiple deferred filler -- picking one");
        out.push(`-- using plan ${e.frag} ${rl([...e.roles, ...e.deferred])}`.trim());
        break;
      case "out": out.push(`>>> ${e.text}`); break;
      case "fail": out.push("no acceptable plans"); break;
    }
  }
  return out;
}

/** Structured event log (spec §9): one JSON object per line; replayable by re-running with the same seed and inputs. */
export function toJSONL(ev: TraceEvent[]): string {
  return ev.map((e) => JSON.stringify(e)).join("\n");
}
