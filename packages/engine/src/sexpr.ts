/** Lisp-shaped data (ADR-0002): symbols are strings, `?x` variables, `*` wildcard. */
export type Atom = string | number;
export type SExpr = Atom | SExpr[];

export const isVar = (x: unknown): x is string => typeof x === "string" && x.startsWith("?");

/** Parse published s-expression text, e.g. `(< (trait-value ?parent 'niceness) -5)`. Quote marks are dropped. */
export function parse(src: string): SExpr {
  const toks = src.replace(/\{[^}]*\}/g, " ").match(/"[^"]*"|[()]|[^\s()]+/g) ?? [];
  let i = 0;
  const read = (): SExpr => {
    const t = toks[i++];
    if (t === undefined) throw new Error("unexpected end");
    if (t === "(") {
      const out: SExpr[] = [];
      while (toks[i] !== ")") { if (i >= toks.length) throw new Error("missing )"); out.push(read()); }
      i++;
      return out;
    }
    if (t === ")") throw new Error("unexpected )");
    if (t.startsWith('"')) return t;
    const u = t.replace(/^'/, "");
    return /^-?\d+$/.test(u) ? Number(u) : u.toLowerCase();
  };
  return read();
}

export function show(x: SExpr): string {
  if (Array.isArray(x)) return "(" + x.map(show).join(" ") + ")";
  return String(x);
}

export const upper = (x: SExpr): string => (Array.isArray(x) ? "(" + x.map(upper).join(" ") + ")" : typeof x === "string" && x.startsWith('"') ? x : String(x).toUpperCase());
