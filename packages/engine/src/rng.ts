/**
 * Seeded randomness (deviation D-1). Every random decision goes through `choose`/`chance`
 * with a label, so a ChoiceScript can pin documented choice points in structural tests.
 */
export type ChoiceScript = Record<string, string | number | boolean | (string | number | boolean)[]>;

export class Rng {
  private s: number;
  private scriptUse = new Map<string, number>();
  readonly log: { label: string; pick: string }[] = [];
  constructor(seed: number, private script: ChoiceScript = {}) {
    this.s = seed >>> 0;
  }
  /** mulberry32 */
  next(): number {
    let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(lo: number, hi: number): number {
    return lo + Math.floor(this.next() * (hi - lo + 1));
  }
  private scripted(label: string): string | number | boolean | undefined {
    const v = this.script[label];
    if (v === undefined) return undefined;
    if (Array.isArray(v)) {
      const i = this.scriptUse.get(label) ?? 0;
      this.scriptUse.set(label, i + 1);
      return v[Math.min(i, v.length - 1)];
    }
    return v;
  }
  chance(label: string, p: number): boolean {
    const s = this.scripted(label);
    const r = typeof s === "boolean" ? s : this.next() < p;
    this.log.push({ label, pick: String(r) });
    return r;
  }
  /** Choose one item; `key` gives the string a script can name. */
  choose<T>(label: string, items: readonly T[], key: (t: T) => string = String): T {
    if (items.length === 0) throw new Error(`choose(${label}): empty`);
    const s = this.scripted(label);
    let pick: T | undefined;
    if (s !== undefined) {
      pick = items.find((t) => key(t) === String(s));
      if (pick === undefined) throw new Error(`choice script ${label}=${String(s)} not among [${items.map(key).join(", ")}]`);
    } else pick = items[Math.floor(this.next() * items.length)]!;
    this.log.push({ label, pick: key(pick) });
    return pick;
  }
}
