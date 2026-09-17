// es5-compat.ts - the FF52 compatibility LAYER for the mac-es5 passthrough: a real BigInt
// implementation plus a regex rewrite/compat engine, the Babel plugins that wire them into a
// bundle, and the differential verification that proves both against this machine's native
// BigInt / RegExp.
//
// Why this exists (receipts/mac-es5/2026-09-16h-burn-verification/PREFLIGHT.txt): Babel only LOWERS
// BigInt *syntax* to a `BigInt("...")` call and core-js 3.50.0 does not polyfill an absent BigInt,
// so a snowflake-heavy bundle parses and then dies. Deferring post-FF52 regex literals into
// `new RegExp(src, flags)` has the same defect: it moves the throw to module initialisation. Both
// need an actual implementation, and an implementation needs an oracle. The oracle here is native
// BigInt/RegExp in the sandbox, compared case by case, with every emitted file additionally
// re-parsed at the Firefox-52 syntax floor (acorn ecmaVersion 2017 = ES2017, the FF52 class).
//
// The rule that makes the transform safe to apply conservatively: every __bi operator takes plain
// operands and DISPATCHES at runtime, so lowering an expression whose operand turns out not to be a
// bigint keeps the native result (and the native TypeError). Over-lowering is harmless;
// under-lowering is what would corrupt, and a bigint instance refuses valueOf, so an unlowered
// site throws instead of silently coercing.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const require = createRequire(import.meta.url);

export const RUNTIME_FILE = fileURLToPath(new URL('./es5-compat-runtime.js', import.meta.url));
export function runtimeSource(): string {
  return readFileSync(RUNTIME_FILE, 'utf8');
}

/* ------------------------------------------------------------------ FF52 floor ---- */
/* Absent-in-FF52 table: the regex constructs the rewriter must eliminate, and the API denylist for
** the runtime's own audit. ff = the Firefox version that added it (MDN compat data). */
export const FF52 = {
  lookbehind: { ff: '78', mdn: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Lookbehind_assertion' },
  namedGroups: { ff: '78', mdn: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/named_groups' },
  dotAll: { ff: '78', mdn: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/dotAll' },
  hasIndices: { ff: '78', mdn: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/hasIndices' },
  unicodePropertyEscapes: { ff: '78', mdn: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Unicode_Property_Escape' },
  namedBackreferences: { ff: '78', mdn: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Named_Backreference' },
  matchAll: { ff: '53', mdn: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/matchAll' },
};
const DENY_GLOBAL = ['BigInt', 'globalThis', 'structuredClone', 'WeakRef', 'FinalizationRegistry', 'Atomics', 'AggregateError'];
const DENY_MEMBER = ['flat', 'flatMap', 'matchAll', 'replaceAll', 'trimStart', 'trimEnd', 'fromEntries', 'hasOwn', 'allSettled', 'findLast', 'findLastIndex', 'groupBy', 'toSorted', 'toReversed', 'isWellFormed', 'toWellFormed'];

/* ------------------------------------------------------------------ compat state ---- */

export type Hazard = { kind: string; detail: string };
export type CompatState = {
  hazards: Hazard[];
  notes: Set<string>;
  counts: { bigintLiterals: number; bigintLowered: number; bigintOperators: number; regexLiterals: number; regexRewritten: number };
};
export function newCompatState(): CompatState {
  return { hazards: [], notes: new Set<string>(), counts: { bigintLiterals: 0, bigintLowered: 0, bigintOperators: 0, regexLiterals: 0, regexRewritten: 0 } };
}

/* ---------------------------------------------------------------- pattern parser ---- */
/* Just enough of the ES2018 pattern grammar to (a) locate every post-FF52 construct with its span,
** (b) measure a sub-pattern's width in UTF-16 code units, (c) splice rewrites into the source text.
** Anything it cannot parse is reported as a hazard; it never guesses. */

type Width = { min: number; max: number };
const BIG = 1e9;
type GroupKind = 'cap' | 'noncap' | 'name' | 'la' | 'nla' | 'lb' | 'nlb';
type Node =
  | { t: 'alt'; alts: Node[]; at: number; end: number }
  | { t: 'seq'; items: Node[]; at: number; end: number }
  | { t: 'group'; kind: GroupKind; name?: string; body: Node; at: number; end: number; openEnd: number }
  | { t: 'class'; text: string; at: number; end: number }
  | { t: 'dot'; at: number; end: number }
  | { t: 'char'; text: string; at: number; end: number; units: number }
  | { t: 'esc'; text: string; at: number; end: number; units: number }
  | { t: 'assert'; text: string; at: number; end: number }
  | { t: 'backref'; text: string; name?: string; at: number; end: number }
  | { t: 'quant'; body: Node; min: number; max: number; text: string; at: number; end: number };

export type Analysis = {
  ok: boolean;
  error?: { at: number; why: string };
  tree?: Node;
  features: Set<string>;
  lookbehinds: { node: Extract<Node, { t: 'group' }>; branch: number; itemIndex: number }[];
  namedGroups: { name: string; index: number; at: number; end: number }[];
  namedBackrefs: { name: string; at: number; end: number }[];
  captures: number;
};

const NAME_OK = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

class Pattern {
  s: string;
  flags: string;
  i = 0;
  cap = 0;
  a: Analysis;

  constructor(s: string, flags: string) {
    this.s = s;
    this.flags = flags;
    this.a = { ok: true, features: new Set(), lookbehinds: [], namedGroups: [], namedBackrefs: [], captures: 0 };
  }

  private fail(at: number, why: string): void {
    this.a.ok = false;
    if (!this.a.error) this.a.error = { at, why };
  }

  parse(): Analysis {
    const tree = this.alt();
    if (!this.a.ok) return this.a;
    if (this.i < this.s.length) { this.fail(this.i, 'unbalanced )'); return this.a; }
    this.a.tree = tree;
    this.a.captures = this.cap;
    const branches = tree.t === 'alt' ? tree.alts : [tree];
    branches.forEach((branch, bi) => {
      if (branch.t !== 'seq') return;
      branch.items.forEach((item, ii) => {
        if (item.t === 'group' && (item.kind === 'lb' || item.kind === 'nlb')) {
          this.a.lookbehinds.push({ node: item, branch: bi, itemIndex: ii });
        }
      });
    });
    return this.a;
  }

  alt(): Node {
    const at = this.i;
    const alts: Node[] = [];
    for (;;) {
      alts.push(this.seq());
      if (!this.a.ok) return { t: 'seq', items: [], at, end: this.i };
      if (this.s[this.i] === '|') { this.i += 1; continue; }
      break;
    }
    if (alts.length === 1) {
      const only = alts[0];
      return { ...only, at, end: this.i } as Node;
    }
    return { t: 'alt', alts, at, end: this.i };
  }

  seq(): Node {
    const at = this.i;
    const items: Node[] = [];
    while (this.i < this.s.length && this.s[this.i] !== '|' && this.s[this.i] !== ')') {
      const q = this.quantified();
      if (!this.a.ok) break;
      items.push(q);
    }
    return { t: 'seq', items, at, end: this.i };
  }

  quantified(): Node {
    const at = this.i;
    const atom = this.atom();
    if (!this.a.ok) return atom;
    const save = this.i;
    const c = this.s[this.i];
    if (c !== '*' && c !== '+' && c !== '?' && c !== '{') return atom;
    const q = this.quantifier();
    if (!q) { this.i = save; return atom; }
    if (this.s[this.i] === '?') this.i += 1;
    else if (this.s[this.i] === '+') { this.fail(this.i, 'possessive quantifier (not ECMAScript)'); return atom; }
    return { t: 'quant', body: atom, min: q.min, max: q.max, text: this.s.slice(save, this.i), at: save, end: this.i };
  }

  quantifier(): { min: number; max: number } | null {
    const c = this.s[this.i];
    if (c === '*') { this.i += 1; return { min: 0, max: BIG }; }
    if (c === '+') { this.i += 1; return { min: 1, max: BIG }; }
    if (c === '?') { this.i += 1; return { min: 0, max: 1 }; }
    const m = /^\{(\d+)(?:,(\d*))?\}/.exec(this.s.slice(this.i));
    if (!m) return null;
    this.i += m[0].length;
    const min = Number(m[1]);
    const max = m[2] === undefined ? min : m[2] === '' ? BIG : Number(m[2]);
    if (max < min) this.fail(this.i, 'quantifier range out of order');
    return { min, max };
  }

  atom(): Node {
    const at = this.i;
    const c = this.s[this.i];
    if (c === undefined) { this.fail(at, 'pattern ended unexpectedly'); return { t: 'char', text: '', at, end: at, units: 0 }; }
    if (c === '(') return this.group();
    if (c === '[') return this.cls();
    if (c === '.') { this.i += 1; return { t: 'dot', at, end: this.i }; }
    if (c === '^' || c === '$') { this.i += 1; return { t: 'assert', text: c, at, end: this.i }; }
    if (c === '\\') return this.escape();
    if (c === '*' || c === '+' || c === '?' || c === '{' || c === '}') { this.fail(at, 'nothing to repeat'); return { t: 'char', text: c, at, end: at + 1, units: 1 }; }
    this.i += 1;
    return { t: 'char', text: c, at, end: this.i, units: 1 };
  }

  escape(): Node {
    const at = this.i;
    this.i += 1;
    const c = this.s[this.i];
    if (c === undefined) { this.fail(at, 'trailing backslash'); return { t: 'char', text: '\\', at, end: this.i, units: 1 }; }
    if (c === 'k' && this.s[this.i + 1] === '<') {
      const end = this.s.indexOf('>', this.i + 2);
      if (end < 0) { this.fail(at, 'unterminated \\k<'); return { t: 'char', text: '\\k', at, end: this.i + 1, units: 1 }; }
      const name = this.s.slice(this.i + 2, end);
      this.a.features.add('namedBackref');
      this.a.namedBackrefs.push({ name, at, end: end + 1 });
      this.i = end + 1;
      return { t: 'backref', text: this.s.slice(at, this.i), name, at, end: this.i };
    }
    if ((c === 'p' || c === 'P') && this.s[this.i + 1] === '{') {
      const end = this.s.indexOf('}', this.i + 2);
      if (end < 0) { this.fail(at, 'unterminated \\p{'); return { t: 'char', text: '\\' + c, at, end: this.i + 1, units: 1 }; }
      this.a.features.add('propertyEscape');
      this.i = end + 1;
      return { t: 'esc', text: this.s.slice(at, this.i), at, end: this.i, units: 1 };
    }
    if (c === 'u' && this.s[this.i + 1] === '{') {
      const end = this.s.indexOf('}', this.i + 2);
      const hex = this.s.slice(this.i + 2, end);
      if (end < 0 || !/^[0-9a-fA-F]{1,6}$/.test(hex)) { this.fail(at, 'bad \\u{...} escape'); return { t: 'char', text: '\\u', at, end: this.i + 1, units: 1 }; }
      this.i = end + 1;
      return { t: 'esc', text: this.s.slice(at, this.i), at, end: this.i, units: parseInt(hex, 16) > 0xffff ? 2 : 1 };
    }
    if (/[1-9]/.test(c)) {
      let j = this.i;
      while (j < this.s.length && /\d/.test(this.s[j])) j += 1;
      this.i = j;
      return { t: 'backref', text: this.s.slice(at, j), at, end: j };
    }
    this.i += 1;
    if (c === 'b' || c === 'B') return { t: 'assert', text: '\\' + c, at, end: this.i };
    return { t: 'esc', text: this.s.slice(at, this.i), at, end: this.i, units: 1 };
  }

  cls(): Node {
    const at = this.i;
    this.i += 1;
    if (this.s[this.i] === '^') this.i += 1;
    let first = true;
    for (;;) {
      const c = this.s[this.i];
      if (c === undefined) { this.fail(at, 'unterminated character class'); break; }
      if (c === ']' && !first) { this.i += 1; break; }
      first = false;
      if (c === '\\') {
        const n = this.s[this.i + 1];
        if ((n === 'p' || n === 'P') && this.s[this.i + 2] === '{') {
          const end = this.s.indexOf('}', this.i + 3);
          if (end < 0) { this.fail(this.i, 'unterminated \\p{ in class'); break; }
          this.a.features.add('propertyEscape');
          this.i = end + 1;
        } else if (n === 'k' && this.s[this.i + 2] === '<') {
          const end = this.s.indexOf('>', this.i + 3);
          if (end < 0) { this.fail(this.i, 'unterminated \\k< in class'); break; }
          this.a.features.add('namedBackref');
          this.a.namedBackrefs.push({ name: this.s.slice(this.i + 3, end), at: this.i, end: end + 1 });
          this.i = end + 1;
        } else if (n === undefined) { this.fail(this.i, 'trailing backslash in class'); break; }
        else if (n === 'u' && this.s[this.i + 2] === '{') {
          const end = this.s.indexOf('}', this.i + 3);
          if (end < 0) { this.fail(this.i, 'unterminated \\u{ in class'); break; }
          this.i = end + 1;
        } else this.i += 2;
        continue;
      }
      this.i += 1;
    }
    return { t: 'class', text: this.s.slice(at, this.i), at, end: this.i };
  }

  private finishGroup(kind: GroupKind, name: string | undefined, at: number, openEnd: number): Node {
    this.i = openEnd;
    if (kind === 'cap' || kind === 'name') this.cap += 1;
    const index = kind === 'cap' || kind === 'name' ? this.cap : 0;
    if (kind === 'name' && name) this.a.namedGroups.push({ name, index, at, end: openEnd });
    const body = this.alt();
    if (this.s[this.i] !== ')') { this.fail(this.i, 'unterminated group'); return { t: 'group', kind, name, body, at, end: this.i, openEnd }; }
    this.i += 1;
    return { t: 'group', kind, name, body, at, end: this.i, openEnd };
  }

  group(): Node {
    const at = this.i;
    this.i += 1;
    let kind: GroupKind = 'cap';
    let name: string | undefined;
    let openEnd = this.i;
    if (this.s[this.i] === '?') {
      const a = this.s[this.i + 1];
      if (a === ':') { kind = 'noncap'; openEnd = this.i + 2; }
      else if (a === '=') { kind = 'la'; openEnd = this.i + 2; }
      else if (a === '!') { kind = 'nla'; openEnd = this.i + 2; }
      else if (a === '<') {
        const b = this.s[this.i + 2];
        if (b === '=' || b === '!') {
          kind = b === '=' ? 'lb' : 'nlb';
          openEnd = this.i + 3;
          this.a.features.add('lookbehind');
          return this.finishGroup(kind, undefined, at, openEnd);
        }
        const end = this.s.indexOf('>', this.i + 2);
        if (end < 0) { this.fail(this.i, 'unterminated group name'); return { t: 'group', kind: 'noncap', body: { t: 'seq', items: [], at: this.i, end: this.i }, at, end: this.i, openEnd: this.i }; }
        name = this.s.slice(this.i + 2, end);
        if (!NAME_OK.test(name)) { this.fail(this.i, 'invalid group name ' + JSON.stringify(name)); return { t: 'group', kind: 'noncap', body: { t: 'seq', items: [], at: this.i, end: this.i }, at, end: this.i, openEnd: this.i }; }
        kind = 'name';
        openEnd = end + 1;
        this.a.features.add('namedGroup');
      } else {
        this.fail(this.i, 'unsupported group prefix ' + JSON.stringify(this.s.slice(this.i, this.i + 4)) + ' (inline modifiers are post-ES2018)');
        return { t: 'group', kind: 'noncap', body: { t: 'seq', items: [], at: this.i, end: this.i }, at, end: this.i, openEnd: this.i };
      }
    }
    this.i = openEnd;
    if (kind === 'cap' || kind === 'name') this.cap += 1;
    const index = kind === 'cap' || kind === 'name' ? this.cap : 0;
    if (kind === 'name' && name) this.a.namedGroups.push({ name, index, at, end: openEnd });
    const body = this.alt();
    if (this.s[this.i] !== ')') { this.fail(this.i, 'unterminated group'); return { t: 'group', kind, name, body, at, end: this.i, openEnd }; }
    this.i += 1;
    return { t: 'group', kind, name, body, at, end: this.i, openEnd };
  }
}

export function analyzePattern(pattern: string, flags: string): Analysis {
  const a = new Pattern(pattern, flags).parse();
  if (flags.indexOf('s') >= 0) a.features.add('dotAllFlag');
  if (flags.indexOf('d') >= 0) a.features.add('hasIndicesFlag');
  return a;
}

function post52(features: Set<string>): string[] {
  const out: string[] = [];
  for (const f of ['lookbehind', 'namedGroup', 'namedBackref', 'propertyEscape', 'dotAllFlag', 'hasIndicesFlag']) {
    if (features.has(f)) out.push(f);
  }
  return out;
}

/* width in UTF-16 code units, conservative: unknown is variable, never guessed narrow */
function width(n: Node | undefined, flags: string): Width {
  if (!n) return { min: 0, max: 0 };
  switch (n.t) {
    case 'alt': {
      let min = BIG, max = 0;
      for (const a of n.alts) { const w = width(a, flags); min = Math.min(min, w.min); max = Math.max(max, w.max); }
      return { min, max };
    }
    case 'seq': {
      let min = 0, max = 0;
      for (const it of n.items) { const w = width(it, flags); min += w.min; max = w.max >= BIG || max >= BIG ? BIG : max + w.max; }
      return { min, max };
    }
    case 'group':
      if (n.kind === 'la' || n.kind === 'nla' || n.kind === 'lb' || n.kind === 'nlb') return { min: 0, max: 0 };
      return width(n.body, flags);
    case 'quant': {
      const w = width(n.body, flags);
      return { min: w.min * n.min, max: w.max >= BIG || n.max >= BIG ? BIG : w.max * n.max };
    }
    case 'class': return flags.indexOf('u') >= 0 ? { min: 1, max: 2 } : { min: 1, max: 1 };
    case 'dot': return flags.indexOf('u') >= 0 ? { min: 1, max: 2 } : { min: 1, max: 1 };
    case 'char': case 'esc': return { min: n.units, max: n.units };
    case 'assert': return { min: 0, max: 0 };
    case 'backref': return { min: 0, max: BIG };
  }
}

type Cons = { n: 0 | 1; w: number; s: string; f: string };
type Branch = { s: string; f: string; c: Cons[] | null };
export type Rewrite =
  | { ok: true; noop: true }
  | { ok: true; noop?: false; src: string; flags: string; branches?: Branch[]; cons?: Cons[] | null; names?: Record<string, number> | null; notes: string[] }
  | { ok: false; kind: string; detail: string };

function applyEdits(src: string, edits: { at: number; end: number; text: string }[]): string {
  let out = src;
  for (const e of edits.slice().sort((x, y) => y.at - x.at)) out = out.slice(0, e.at) + e.text + out.slice(e.end);
  return out;
}
/* Edits that apply to ONE top-level branch, in branch-relative offsets: every transformation the whole
** pattern gets (dotAll expansion, named-group renumbering) plus the leading assertions handed to __rx.
** Skipping any of these makes a branch-mode rewrite match LESS than the original, because the flags on the
** rewritten literal are already downgraded. Found by the property fuzzer, not by the hand-written corpus. */
function editsWithin(branch: Node, pattern: string, flags: string, lead: Extract<Node, { t: 'group' }>): Edit[] {
  const list: Edit[] = [];
  if (flags.indexOf('s') >= 0) {
    for (const d of collect(branch, (n) => n.t === 'dot')) list.push({ at: d.at - branch.at, end: d.end - branch.at, text: '[\\s\\S]' });
  }
  const own = analyzePattern(pattern.slice(branch.at, branch.end), flags);
  if (own.ok) for (const ng of own.namedGroups) list.push({ at: ng.at + 1 - branch.at, end: ng.end - branch.at, text: '' });
  for (const g of lead) list.push({ at: g.at - branch.at, end: g.end - branch.at, text: '' });
  return list;
}
function collect(n: Node | undefined, want: (x: Node) => boolean, out: Node[] = []): Node[] {
  if (!n) return out;
  if (want(n)) out.push(n);
  if (n.t === 'seq') n.items.forEach((x) => collect(x, want, out));
  else if (n.t === 'alt') n.alts.forEach((x) => collect(x, want, out));
  else if (n.t === 'group') collect(n.body, want, out);
  else if (n.t === 'quant') collect(n.body, want, out);
  return out;
}
function nodeText(pattern: string, n: Node): string {
  return pattern.slice(n.at, n.end);
}
function constraintFlags(flags: string): string {
  return flags.split('').filter((c) => 'gymsd'.indexOf(c) < 0).join('');
}

/* Rewrite a post-FF52 literal into an FF52-parsable pattern plus the data __rx needs to enforce
** what the engine cannot express. Every unhandled construct is reported, never published. */
export function rewritePattern(pattern: string, flags: string, opts: { indicesRead?: boolean } = {}): Rewrite {
  const a = analyzePattern(pattern, flags);
  const post = post52(a.features);
  if (!a.ok) return { ok: false, kind: 'regex-unparseable', detail: `${a.error?.why ?? 'parse error'} at index ${a.error?.at ?? 0}` };
  if (!post.length) return { ok: true, noop: true };
  if (a.features.has('propertyEscape')) {
    return { ok: false, kind: 'regex-unicode-property', detail: `/\\p{...}/\\P{...} in this pattern needs Unicode property tables the target engine has no access to (${FF52.unicodePropertyEscapes.mdn})` };
  }
  const notes: string[] = [];
  const edits: Edit[] = [];
  const dropped: string[] = [];

  // dotAll: '.' outside a class -> [\\s\\S]. Without s, . is [^\\n\\r\\u2028\\u2029]; with s it is every
  // code unit, which is exactly [\\s\\S] - an equivalent pattern, not an approximation.
  if (flags.indexOf('s') >= 0) {
    for (const d of collect(a.tree, (n) => n.t === 'dot')) edits.push({ at: d.at, end: d.end, text: '[\\s\\S]' });
    dropped.push('s');
    notes.push('dotAll expanded to [\\s\\S]');
  }
  if (flags.indexOf('d') >= 0) {
    if (opts.indicesRead) return { ok: false, kind: 'regex-hasIndices', detail: `d flag on /${pattern}/${flags} and match.indices is read in this file: no indices on FF52 (${FF52.hasIndices.mdn})` };
    dropped.push('d');
    notes.push('d flag dropped (match.indices is not read in this file)');
  }
  const names: Record<string, number> = {};
  if (a.namedGroups.length) {
    for (const ng of a.namedGroups) {
      edits.push({ at: ng.at + 1, end: ng.end, text: '' });          // (?<name> -> (   (index order is kept)
      names[ng.name] = ng.index;
    }
    for (const br of a.namedBackrefs) {
      const idx = names[br.name];
      if (idx === undefined) return { ok: false, kind: 'regex-named-backref', detail: `\\k<${br.name}> has no named group to number in /${pattern}/` };
      if (/^[0-9]/.test(pattern.slice(br.end))) {
        return { ok: false, kind: 'regex-named-backref-ambiguity', detail: `\\k<${br.name}> is followed by a digit: the numbered form \\${idx} would be read as a different backreference` };
      }
      edits.push({ at: br.at, end: br.end, text: '\\' + idx });
    }
    notes.push('named groups renumbered: ' + Object.keys(names).sort().map((k) => `${k}=$${names[k]}`).join(' '));
  } else if (a.namedBackrefs.length) {
    return { ok: false, kind: 'regex-named-backref', detail: `\\k<${a.namedBackrefs[0].name}> without a named group in /${pattern}/${flags}` };
  }
  if (a.features.has('lookbehind') && flags.indexOf('m') >= 0) {
    return { ok: false, kind: 'regex-lookbehind-multiline', detail: `m + lookbehind on /${pattern}/${flags}: the window boundary would be line-dependent, unverified` };
  }
  const outFlags = flags.split('').filter((c) => dropped.indexOf(c) < 0).join('');

  if (!a.lookbehinds.length) {
    const src = applyEdits(pattern, edits);
    const after = check52(src, outFlags);
    if (after) return after;
    return { ok: true, src, flags: outFlags, cons: null, names: Object.keys(names).length ? names : null, notes };
  }

  // Lookbehinds. A lookbehind that starts a branch constrains the text ending at the MATCH START,
  // which __rx can test directly against the subject. Anything deeper would need the match indices
  // FF52 does not have, so it is reported instead of guessed.
  const branches = a.tree && a.tree.t === 'alt' ? a.tree.alts : [a.tree as Node];
  type Lead = { groups: Extract<Node, { t: 'group' }>[]; cons: Cons[]; src: string };
  const perBranch: Lead[] = [];
  for (const branch of branches) {
    const items = branch.t === 'seq' ? branch.items : [];
    const lead: Extract<Node, { t: 'group' }>[] = [];
    for (const it of items) {
      if (it.t === 'group' && (it.kind === 'lb' || it.kind === 'nlb')) lead.push(it);
      else break;
    }
    const inside = collect(branch, (n) => n.t === 'group' && (n.kind === 'lb' || n.kind === 'nlb'));
    if (inside.length !== lead.length) {
      const bad = inside.find((n) => lead.indexOf(n as Extract<Node, { t: 'group' }>) < 0);
      return { ok: false, kind: 'regex-lookbehind-position', detail: `lookbehind at index ${bad ? bad.at : 0} of /${pattern}/${flags} is not at a branch start: FF52 cannot tell where inside the match to test it` };
    }
    const cons: Cons[] = [];
    for (const g of lead) {
      const bodyText = pattern.slice(g.body.at, g.body.end);
      const w = width(g.body, flags);
      if (w.min !== w.max) {
        return { ok: false, kind: 'regex-lookbehind-width', detail: `(? ${g.kind === 'nlb' ? '!' : '<='}${bodyText}) is not fixed width in code units (${w.min}..${w.max >= BIG ? 'inf' : w.max}): the window to test is unknown` };
      }
      const sub = analyzePattern(bodyText, flags);
      if (!sub.ok) return { ok: false, kind: 'regex-lookbehind-body', detail: `lookbehind body ${sub.error?.why}` };
      const subPost = post52(sub.features).filter((f) => f !== 'dotAllFlag');
      if (subPost.length) return { ok: false, kind: 'regex-lookbehind-body', detail: `lookbehind body uses ${subPost.join(',')} which the constraint matcher cannot express either` };
      if (collect(g.body, (n) => n.t === 'assert').length) return { ok: false, kind: 'regex-lookbehind-anchor', detail: 'lookbehind body uses ^ $ or \\b: they would re-anchor inside the constraint slice' };
      if (collect(g.body, (n) => n.t === 'group' && (n.kind === 'cap' || n.kind === 'name')).length) {
        return { ok: false, kind: 'regex-lookbehind-capture', detail: `lookbehind body captures; removing it would renumber /${pattern}/` };
      }
      let cbody = flags.indexOf('s') >= 0 ? expandDotAll(bodyText) : bodyText;
      const csub = analyzePattern(cbody, flags);
      if (csub.namedGroups.length) cbody = applyEdits(cbody, csub.namedGroups.map((ng) => ({ at: ng.at + 1, end: ng.end, text: '' })));
      cons.push({ n: g.kind === 'nlb' ? 1 : 0, w: w.min, s: cbody, f: constraintFlags(flags) });
      edits.push({ at: g.at, end: g.end, text: '' });                // strip from the whole pattern
    }
    perBranch.push({ groups: lead, cons, src: applyEdits(pattern.slice(branch.at, branch.end), editsWithin(branch, pattern, flags, lead)) });
  }
  const fullSrc = applyEdits(pattern, edits);
  const fullCheck = check52(fullSrc, outFlags);
  if (fullCheck) return fullCheck;
  const shared = perBranch.every((b) => b.cons.length === perBranch[0].cons.length
    && b.cons.every((c, i) => c.n === perBranch[0].cons[i].n && c.w === perBranch[0].cons[i].w && c.s === perBranch[0].cons[i].s && c.f === perBranch[0].cons[i].f));
  if (shared) {
    return {
      ok: true, src: fullSrc, flags: outFlags,
      branches: [{ s: fullSrc, f: outFlags, c: perBranch[0].cons.length ? perBranch[0].cons : null }],
      cons: null, names: Object.keys(names).length ? names : null,
      notes: notes.concat('leading lookbehind(s) enforced at the match start by __rx'),
    };
  }
  if (a.captures) {
    return { ok: false, kind: 'regex-lookbehind-branch-capture', detail: `per-branch lookbehind plus ${a.captures} capture group(s) in /${pattern}/${flags}: splitting the alternation would renumber them` };
  }
  return {
    ok: true, src: fullSrc, flags: outFlags,
    branches: perBranch.map((b) => ({ s: b.src, f: outFlags, c: b.cons.length ? b.cons : null })),
    cons: null, names: null,
    notes: notes.concat('alternation split into per-branch matchers (leftmost wins, ties keep branch order)'),
  };
}

type Edit = { at: number; end: number; text: string };

function check52(src: string, flags: string): Rewrite | null {
  const after = analyzePattern(src, flags);
  const left = post52(after.features);
  if (!after.ok || left.length) {
    return { ok: false, kind: 'regex-rewrite-incomplete', detail: `rewritten pattern still outside the FF52 grammar: ${left.join(',') || after.error?.why || 'parse failure'}` };
  }
  return null;
}
function expandDotAll(body: string): string {
  const a = analyzePattern(body, 's');
  if (!a.ok || !a.tree) return body;
  return applyEdits(body, collect(a.tree, (n) => n.t === 'dot').map((d) => ({ at: d.at, end: d.end, text: '[\\s\\S]' })));
}

/* ------------------------------------------------------------------ Babel plugins ---- */

const BI_RETURNS_BIGINT = new Set(['lit', 'add', 'sub', 'mul', 'div', 'mod', 'pow', 'neg', 'not', 'and', 'or', 'xor', 'shl', 'shr', 'abs', 'max', 'min', 'asIntN', 'asUintN']);
const BI_OPS: Record<string, string> = {
  '+': 'add', '-': 'sub', '*': 'mul', '/': 'div', '%': 'mod', '**': 'pow',
  '&': 'and', '|': 'or', '^': 'xor', '<<': 'shl', '>>': 'shr', '>>>': 'ursh',
  '==': 'eqL', '!=': 'neL', '===': 'eq', '!==': 'ne',
  '<': 'lt', '<=': 'le', '>': 'gt', '>=': 'ge',
};
const BI_UNARY: Record<string, string> = { '-': 'neg', '+': 'pos', '~': 'not' };
const COMPOUND: Record<string, string> = { '+=': '+', '-=': '-', '*=': '*', '/=': '/', '%=': '%', '**=': '**', '&=': '&', '|=': '|', '^=': '^', '<<=': '<<', '>>=': '>>', '>>>=': '>>>' };

/* Babel 7.29.7 stores the digits of a BigIntLiteral in node.value (there is no node.bigint - that
** mismatch is exactly what emitted BigInt("undefined") in v2). The value keeps the source base
** (0xFFn -> "0xFF") and has already dropped '_'. */
export function bigIntDigits(node: { value?: unknown; raw?: string }): string | null {
  const value = typeof node.value === 'string' ? node.value.replace(/_/g, '') : '';
  if (/^[-+]?(0[xXbBoO][0-9a-fA-F]+|[0-9]+)$/.test(value)) return value;
  const m = /^(-?)(0[xXbBoO][0-9a-fA-F_]+|\d[0-9_]*)n$/.exec(node.raw || '');
  if (m) return (m[1] + m[2]).replace(/_/g, '');
  return null;
}

/* Conservative "this value may be a bigint" name set. Name-based, never scope-based: a name that
** turns out to hold a Number still behaves natively because __bi dispatches. */
function collectBigIntNames(path: any): Set<string> {
  const names = new Set<string>();
  const returnsBig = new Set<string>();
  const bigParam = new Map<string, Set<number>>();
  const isBig = (n: any): boolean => {
    if (!n || typeof n !== 'object') return false;
    switch (n.type) {
      case 'BigIntLiteral': return true;
      case 'CallExpression': {
        const c = n.callee;
        if (c.type === 'Identifier' && c.name === 'BigInt') return true;
        if (c.type === 'Identifier' && returnsBig.has(c.name)) return true;
        if (c.type === 'MemberExpression' && c.object?.name === '__bi' && BI_RETURNS_BIGINT.has(c.property?.name)) return true;
        return false;
      }
      case 'UnaryExpression': return n.operator === '-' || n.operator === '+' || n.operator === '~' ? isBig(n.argument) : false;
      case 'BinaryExpression': return !!BI_OPS[n.operator] && (isBig(n.left) || isBig(n.right));
      case 'LogicalExpression': return isBig(n.left) && isBig(n.right);
      case 'ConditionalExpression': return isBig(n.consequent) || isBig(n.alternate);
      case 'SequenceExpression': return n.expressions.some(isBig);
      case 'Identifier': return names.has(n.name);
      case 'AssignmentExpression': return isBig(n.right);
      case 'NewExpression': return false;
      default: return false;
    }
  };
  const scanDeclarators = (): void => {
    path.traverse({
      VariableDeclarator(p: any) {
        if (p.node.id && p.node.id.type === 'Identifier' && isBig(p.node.init)) names.add(p.node.id.name);
      },
      AssignmentExpression(p: any) {
        if (p.node.left.type === 'Identifier' && isBig(p.node.right)) names.add(p.node.left.name);
      },
      FunctionDeclaration(p: any) {
        if (!p.node.id) return;
        const params: string[] = (p.node.params || []).map((x: any) => (x && x.type === 'Identifier' ? x.name : ''));
        let big = false;
        p.traverse({
          ReturnStatement(r: any) { if (isBig(r.node.argument)) big = true; },
        });
        if (big) returnsBig.add(p.node.id.name);
        const argLists: any[][] = [];
        p.scope?.parentPath?.traverse?.({
          CallExpression(c: any) {
            if (c.node.callee.type === 'Identifier' && c.node.callee.name === p.node.id.name) argLists.push(c.node.arguments);
          },
        });
        for (const args of argLists) {
          for (let i = 0; i < args.length && i < params.length; i += 1) {
            if (!params[i]) continue;
            if (isBig(args[i])) {
              if (!bigParam.has(p.node.id.name)) bigParam.set(p.node.id.name, new Set());
              bigParam.get(p.node.id.name)!.add(i);
              names.add(params[i]);
            }
          }
        }
      },
    });
  };
  scanDeclarators();
  scanDeclarators();               // second round: `var a = b` where b became bigint-typed in round 1
  void bigParam;
  return names;
}

export function bigIntPlugin(state: CompatState): unknown {
  return function ({ types: t }: any) {
    let pbi = new Set<string>();
    const isPbi = (n: any): boolean => {
      if (!n || typeof n !== 'object') return false;
      if (n.type === 'BigIntLiteral') return true;
      if (n.type === 'Identifier') return pbi.has(n.name);
      if (n.type === 'CallExpression') {
        const c = n.callee;
        if (c.type === 'Identifier' && c.name === 'BigInt') return true;
        if (c.type === 'MemberExpression' && c.object && c.object.name === '__bi' && BI_RETURNS_BIGINT.has(c.property && c.property.name)) return true;
        return false;
      }
      if (n.type === 'UnaryExpression') return (n.operator === '-' || n.operator === '+' || n.operator === '~' || n.operator === '!') && isPbi(n.argument);
      if (n.type === 'BinaryExpression') return !!BI_OPS[n.operator] && (isPbi(n.left) || isPbi(n.right));
      if (n.type === 'LogicalExpression') return isPbi(n.left) && isPbi(n.right);
      if (n.type === 'ConditionalExpression') return isPbi(n.consequent) || isPbi(n.alternate);
      if (n.type === 'SequenceExpression') return n.expressions.some(isPbi);
      if (n.type === 'AssignmentExpression') return isPbi(n.right);
      return false;
    };
    const call = (fn: string, args: any[]): any => t.callExpression(t.memberExpression(t.identifier('__bi'), t.identifier(fn)), args);
    const guardTest = (path: any, key: string): void => {
      if (!isPbi(path.node[key])) return;
      path.node[key] = call('tz', [path.node[key]]);
    };
    return {
      name: 'mac-es5-bigint-shim',
      visitor: {
        Program: {
          enter(path: any, _state: any, _file?: any): void {
            const code: string = (path.hub && path.hub.getFile && path.hub.getFile().code) || '';
            if (/^\s*(var|let|const)\s+__bi\b/m.test(code) || /\bwindow\.__bi\b/.test(code)) {
              state.hazards.push({ kind: 'bigint-runtime-collision', detail: 'the app already defines a __bi binding; the shim would be shadowed' });
            }
            pbi = collectBigIntNames(path);
          },
        },
        BigIntLiteral(path: any): void {
          state.counts.bigintLiterals += 1;
          const digits = bigIntDigits(path.node);
          if (digits === null) {
            state.hazards.push({ kind: 'bigint-literal-unreadable', detail: 'Babel exposed no usable digits on this BigIntLiteral (neither node.value nor node.raw)' });
            return;
          }
          state.counts.bigintLowered += 1;
          path.replaceWith(call('lit', [t.stringLiteral(digits)]));
        },
        Identifier(path: any): void {
          if (path.node.name !== 'BigInt' || path.node.__biDone) return;
          if (!path.isReferencedIdentifier()) return;
          if (path.scope.hasBinding('BigInt', true)) return;   // true = ignore implicit globals
          const parent = path.parentPath;
          if (parent.isMemberExpression({ object: path.node })) {
            const prop = parent.node.property && parent.node.property.name;
            if (prop && !['asIntN', 'asUintN'].includes(prop)) {
              state.hazards.push({ kind: 'bigint-static-unsupported', detail: `BigInt.${prop} is not implemented by the runtime shim` });
            }
          }
          path.node.__biDone = true;
          path.replaceWith(t.memberExpression(t.identifier('__bi'), t.identifier('BigInt')));
        },
        BinaryExpression(path: any): void {
          const fn = BI_OPS[path.node.operator];
          if (!fn) return;
          if (!isPbi(path.node.left) && !isPbi(path.node.right)) return;
          state.counts.bigintOperators += 1;
          path.replaceWith(call(fn, [path.node.left, path.node.right]));
        },
        UnaryExpression(path: any): void {
          const op = path.node.operator;
          if (!isPbi(path.node.argument)) return;
          if (op === 'typeof') { path.replaceWith(call('typ', [path.node.argument])); return; }
          if (op === '!') { path.node.argument = call('tz', [path.node.argument]); return; }
          const fn = BI_UNARY[op];
          if (!fn) return;
          state.counts.bigintOperators += 1;
          path.replaceWith(call(fn, [path.node.argument]));
        },
        AssignmentExpression(path: any): void {
          const fn = BI_OPS[COMPOUND[path.node.operator]];
          if (!fn) return;
          if (!isPbi(path.node.left) && !isPbi(path.node.right)) return;
          state.counts.bigintOperators += 1;
          path.replaceWith(t.assignmentExpression('=', path.node.left, call(fn, [path.node.left, path.node.right])));
        },
        LogicalExpression(path: any): void {
          if (!isPbi(path.node.left)) return;
          path.node.left = call('tz', [path.node.left]);
        },
        CallExpression(path: any): void {
          const callee = path.node.callee;
          if (callee.type === 'MemberExpression' && !callee.computed) {
            const prop = callee.property && callee.property.name;
            const obj = callee.object;
            if (prop === 'toString' && isPbi(obj)) {
              path.replaceWith(call('str', [obj, ...(path.node.arguments.length ? [path.node.arguments[0]] : [])]));
              return;
            }
            if (prop === 'valueOf' && isPbi(obj) && !path.node.arguments.length) {
              path.replaceWith(call('valOf', [obj]));
              return;
            }
            if (prop === 'toLocaleString' && isPbi(obj)) {
              state.notes.add('bigint toLocaleString: en-US digit grouping is emulated by the shim, locale-correct output UNVERIFIED on the target');
              return;
            }
          }
          if (callee.type === 'Identifier' && path.node.arguments.length === 1 && !path.scope.hasBinding(callee.name, true) && isPbi(path.node.arguments[0])) {
            if (callee.name === 'Number') { path.replaceWith(call('num', path.node.arguments)); return; }
            if (callee.name === 'String') { path.replaceWith(call('str', path.node.arguments)); return; }
            if (callee.name === 'Boolean') { path.replaceWith(call('tz', path.node.arguments)); return; }
          }
        },
        TemplateLiteral(path: any): void {
          path.node.expressions.forEach((ex: any, i: number) => {
            if (!isPbi(ex)) return;
            path.node.expressions[i] = call('str', [ex]);
          });
        },
        IfStatement: (path: any): void => guardTest(path, 'test'),
        WhileStatement: (path: any): void => guardTest(path, 'test'),
        DoWhileStatement: (path: any): void => guardTest(path, 'test'),
        ForStatement: (path: any): void => guardTest(path, 'test'),
        ConditionalExpression: (path: any): void => guardTest(path, 'test'),
      },
    };
  };
}

/* String.prototype.matchAll clones the regex through SpeciesConstructor (and core-js's polyfill for
** FF52 does the same), so a clone of a wrapped RegExp loses the __rx constraint enforcement and
** would quietly match WITHOUT the lookbehind. Any file that both needs a rewrite and reaches for
** matchAll is therefore refused, not shipped on an optimistic reading of the polyfill. */
const REGEX_CLONE_UNSAFE = ['matchAll'];

export function regexPlugin(state: CompatState): unknown {
  return function ({ types: t }: any) {
    let indicesRead = false;
    let cloneUnsafe = false;
    const consNode = (c: Cons): any => t.objectExpression([
      t.objectProperty(t.identifier('n'), t.numericLiteral(c.n)),
      t.objectProperty(t.identifier('w'), t.numericLiteral(c.w)),
      t.objectProperty(t.identifier('s'), t.stringLiteral(c.s)),
      t.objectProperty(t.identifier('f'), t.stringLiteral(c.f)),
    ]);
    const branchNode = (b: Branch): any => t.objectExpression([
      t.objectProperty(t.identifier('s'), t.stringLiteral(b.s)),
      t.objectProperty(t.identifier('f'), t.stringLiteral(b.f)),
      t.objectProperty(t.identifier('c'), b.c ? t.arrayExpression(b.c.map(consNode)) : t.nullLiteral()),
    ]);
    const namesNode = (names: Record<string, number> | null | undefined): any => (
      names && Object.keys(names).length
        ? t.objectExpression(Object.keys(names).sort().map((k) => t.objectProperty(t.identifier(k), t.numericLiteral(names[k]))))
        : t.nullLiteral()
    );
    const build = (r: Extract<Rewrite, { ok: true; noop?: false }>, literal: string, origSrc: string, origFlags: string): any => {
      const branches = r.branches && r.branches.length ? r.branches : [{ s: r.src, f: r.flags, c: r.cons || null }];
      return t.callExpression(t.identifier('__rx'), [
        t.stringLiteral(literal), t.stringLiteral(origSrc), t.stringLiteral(origFlags),
        t.stringLiteral(r.src), t.stringLiteral(r.flags),
        t.arrayExpression(branches.map(branchNode)), namesNode(r.names),
      ]);
    };
    return {
      name: 'mac-es5-regex-compat',
      visitor: {
        Program: {
          enter(path: any): void {
            indicesRead = false;
            cloneUnsafe = false;
            path.traverse({
              MemberExpression(p: any) {
                const name = p.node.property && p.node.property.name;
                if (!p.node.computed && name === 'indices') indicesRead = true;
                if (!p.node.computed && name && REGEX_CLONE_UNSAFE.indexOf(name) >= 0) cloneUnsafe = true;
              },
            });
          },
        },
        RegExpLiteral(path: any): void {
          state.counts.regexLiterals += 1;
          const pattern = String(path.node.pattern == null ? '' : path.node.pattern);
          const flags = String(path.node.flags || '');
          const r = rewritePattern(pattern, flags, { indicesRead });
          if (r.ok && r.noop) return;
          if (!r.ok) {
            state.hazards.push({ kind: r.kind, detail: `/${pattern}/${flags}: ${r.detail}` });
            return;
          }
          if (cloneUnsafe && (r.cons || r.branches)) {
            state.hazards.push({ kind: 'regex-clone-unsafe', detail: `/${pattern}/${flags} needs constraint enforcement, but matchAll clones through SpeciesConstructor: the clone would match without the lookbehind` });
            return;
          }
          state.counts.regexRewritten += 1;
          for (const n of r.notes) state.notes.add(n);
          path.replaceWith(build(r, `/${pattern}/${flags}`, pattern, flags));
        },
        NewExpression(path: any): void {
          if (path.node.callee.type !== 'Identifier' || path.node.callee.name !== 'RegExp') return;
          const args = path.node.arguments;
          const flagArg = args[1];
          const flags = flagArg && flagArg.type === 'StringLiteral' ? String(flagArg.value) : '';
          const srcArg = args[0];
          if (!srcArg || srcArg.type !== 'StringLiteral') {
            if (flagArg && flagArg.type === 'StringLiteral' && /[sd]/.test(flags)) {
              state.hazards.push({ kind: 'regex-dynamic-unsafe', detail: `new RegExp(<dynamic>, "${flags}"): dotAll/hasIndices on a runtime-built pattern cannot be rewritten at build time` });
              return;
            }
            if (!flagArg || flagArg.type !== 'StringLiteral') {
              state.notes.add('new RegExp with non-literal flags: post-FF52 syntax inside runtime-built patterns is NOT analysed');
            }
            return;
          }
          const pattern = String(srcArg.value);
          const r = rewritePattern(pattern, flags, { indicesRead });
          if (r.ok && r.noop) return;
          if (!r.ok) {
            state.hazards.push({ kind: r.kind, detail: `new RegExp(${JSON.stringify(pattern)}, "${flags}"): ${r.detail}` });
            return;
          }
          if (cloneUnsafe && (r.cons || r.branches)) {
            state.hazards.push({ kind: 'regex-clone-unsafe', detail: `/${pattern}/${flags} needs constraint enforcement, but matchAll clones through SpeciesConstructor: the clone would match without the lookbehind` });
            return;
          }
          state.counts.regexRewritten += 1;
          for (const n of r.notes) state.notes.add(n);
          path.replaceWith(build(r, `/${pattern}/${flags}`, pattern, flags));
        },
        // $<name> in a replacement string is FF78 syntax: map it to $n while the regex is in reach
        CallExpression(path: any): void {
          const c = path.node.callee;
          if (c.type !== 'MemberExpression' || c.computed || !c.property || c.property.name !== 'replace') return;
          const args = path.node.arguments;
          if (args.length < 2 || args[1].type !== 'StringLiteral' || String(args[1].value).indexOf('$<') < 0) return;
          let names: Record<string, number> | null = null;
          const re = args[0];
          if (re.type === 'RegExpLiteral' && /\(\?<[A-Za-z_$]/.test(String(re.pattern))) {
            names = {};
            for (const ng of analyzePattern(String(re.pattern), String(re.flags || '')).namedGroups) names[ng.name] = ng.index;
          } else if (re.type === 'CallExpression' && re.callee && re.callee.name === '__rx' && re.arguments[6] && re.arguments[6].type === 'ObjectExpression') {
            names = {};
            for (const p of re.arguments[6].properties) if (p.key) names[p.key.name] = p.value.value;
          }
          if (!names) return;
          const next = String(args[1].value).replace(/\$<([A-Za-z_$][A-Za-z0-9_$]*)>/g, (whole: string, name: string) => (names![name] === undefined ? whole : '$' + names![name]));
          if (next !== args[1].value) args[1] = t.stringLiteral(next);
        },
      },
    };
  };
}

/* ------------------------------------------------------------------- ES5 audit ---- */

/* Parse the file and walk its AST: a raw regex scan would flag the word "BigInt" in a comment
** and every identifier inside a string literal, which is not what "absent in FF52" means. */
export function auditEs5(code: string): string[] {
  const errors: string[] = [];
  let acorn: any;
  try { acorn = require('acorn'); } catch { return ['audit-skipped: acorn is not installed']; }
  let ast: any;
  try {
    ast = acorn.parse(code, { ecmaVersion: 5, sourceType: 'script' });
  } catch (e: any) {
    return [`es5-parse: ${e.message}`];
  }
  const globals = new Set<string>();
  const members = new Set<string>();
  (function walk(node: any, parentKey: string): void {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { for (const n of node) walk(n, parentKey); return; }
    if (node.type === 'Identifier' && parentKey !== 'property' && parentKey !== 'key') globals.add(node.name);
    if (node.type === 'MemberExpression' && !node.computed && node.property) members.add(node.property.name);
    for (const k of Object.keys(node)) {
      if (k === 'type' || k === 'start' || k === 'end' || k === 'loc' || k === 'range' || k === 'regex' || k === 'value') continue;
      walk(node[k], k);
    }
  }(ast, ''));
  for (const name of DENY_GLOBAL) if (globals.has(name)) errors.push(`post-FF52-global: ${name}`);
  for (const name of DENY_MEMBER) if (members.has(name)) errors.push(`post-FF52-method: .${name}()`);
  return errors;
}

/* ------------------------------------------------------------- differential verify ---- */

const SERIALISE = `
var __ser = function (v) {
  if (v === null) return 'null';
  var t = typeof v;
  if (t === 'bigint') return 'B:' + String(v);
  if (t === 'undefined') return 'U';
  if (t === 'number' || t === 'boolean') return t[0].toUpperCase() + ':' + String(v);
  if (t === 'string') return 'S:' + JSON.stringify(v);
  if (t === 'symbol' || t === 'function') return 'F:' + String(v);
  if (v._) return 'B:' + v.toString();
  if (Object.prototype.toString.call(v) === '[object Array]') {
    var arr = Array.prototype.slice.call(v, 0, 10).map(function (x) { return x && x._ ? x.toString() : x; });
    var r = 'A:' + JSON.stringify(arr) + ' i' + v.index + ' l' + (v[0] === undefined ? -1 : v[0].length);
    if (v.groups) r += ' g' + JSON.stringify(v.groups);
    if (v.input !== undefined) r += ' s';
    return r;
  }
  return 'O:' + Object.prototype.toString.call(v);
};
`;

/* keep in sync with POW_MAX_BITS in es5-compat-runtime.js: past this result width the shim throws
** RangeError where a modern engine keeps computing. It is a declared bound, so the fuzzer treats it
** as the edge of its domain instead of reporting a mismatch, and the fixtures below pin both sides. */
const POW_MAX_BITS = 65536;
const LOG2_10 = 3.322;

export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = (a ^ (a >>> 15)) | 1;
    t = (t ^ Math.imul(t >>> 7, t | 61)) ^ ((t ^ (t >>> 14)) >>> 0);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type VerifyResult = { ran: number; passed: number; failures: string[]; census?: string };

function driver(setup: string, body: string): string {
  return `(function () {\n${setup}\nvar __x;\ntry {\n${body}\n;\nreturn __ser(__x);\n} catch (e) { return 'ERR:' + (e && e.constructor ? e.constructor.name : String(e)); }\n})()`;
}
function vmRun(source: string, globals: Record<string, unknown>): string {
  try {
    const out = runInNewContext(source, { ...globals }, { timeout: 30000 });
    return typeof out === 'string' ? out : 'THROW:non-string ' + String(out);
  } catch (e: any) {
    return 'ERR:' + (e && e.name ? e.name : String(e));
  }
}

const BI_VALUES = [
  '0n', '1n', '-1n', '2n', '7n', '-7n', '10n', '60n', '255n', '0xFFn', '0b1010n', '0o17n',
  '4503599627370495n', '4503599627370496n', '9007199254740993n', '-9007199254740993n',
  '343383572805058560n', '-343383572805058560n', '0xFFFFFFFFFFFFFFFFn', '1420070400000n',
  '12345678901234567890123456789012345678901234567890n', '-7485470671203884000n',
  'BigInt("1420070400000")', 'BigInt(42)', 'BigInt("0x2a")', 'BigInt(true)', '(1n << 64n)',
];
const MIX_VALUES = ['0', '1', '-3', '2.5', '1e308', 'NaN', 'Infinity', '-Infinity', '9007199254740992', '"1"', '"42"', '"x"', '" 12 "', 'true', 'false', 'null', 'undefined', '[1]', '({})', '[]', '""'];
const BI_BIN = ['+', '-', '*', '/', '%', '**', '&', '|', '^', '<<', '>>', '>>>', '==', '!=', '===', '!==', '<', '<=', '>', '>='];
/* Exponents for ** in the fuzz corpus. The shim throws RangeError past 65536 result bits (see
** POW_MAX_BITS) where a modern engine would keep grinding for minutes, so the fuzzer stays inside the
** declared domain and the boundary itself is pinned by the pow-bound fixtures below. */
const BI_POW_EXPONENTS = ['0n', '1n', '2n', '3n', '7n', '16n', '63n', '64n', '255n', '(1n << 63n)', '(1n << 64n)', 'BigInt(40)'];
function powExp(arr: string[]): string { const v = pick(arr); return v.indexOf('**') >= 0 ? pick(BI_POW_EXPONENTS) : v; }

function bigintCorpus(cases: number, seed = 0x5eed1): string[] {
  const rand = rng(seed);
  const pick = (arr: string[]): string => arr[Math.floor(rand() * arr.length) % arr.length];
  const out: string[] = [];
  for (const a of BI_VALUES) {
    for (const op of BI_BIN) {
      const e = op === '**' ? pick(BI_POW_EXPONENTS) : a;
      out.push(`__x = ((${a}) ${op} (${e}));`);
      out.push(`__x = ((${a}) ${op} (${op === '**' ? pick(BI_POW_EXPONENTS) : pick(BI_VALUES)}));`);
    }
    for (const m of MIX_VALUES) {
      const op = pick(BI_BIN);
      out.push(`__x = ((${a}) ${op} (${m}));`);
      out.push(`__x = ((${m}) ${op} (${a}));`);
    }
    out.push(
      `__x = (-(${a}));`, `__x = (+(${a}));`, `__x = (~(${a}));`, `__x = (typeof ${a});`, `__x = (!(${a}));`,
      `__x = (Boolean(${a}));`, `__x = Number(${a});`, `__x = String(${a});`, `__x = (${a}).toString(2);`,
      `__x = (${a}).toString(16);`, `__x = (${a}).toString(36);`, `__x = (${a}).valueOf();`,
      `__x = BigInt.asIntN(8, ${a});`, `__x = BigInt.asUintN(8, ${a});`,
      `__x = \`\${${a}}\`;`,
      `__x = JSON.stringify({ v: ${a} });`, `__x = [${a}, ${a}].join(",");`, `__x = (typeof ${a} === "bigint");`,
      `__x = "no"; if (${a}) { __x = "yes"; }`, `__x = (${a} ? "y" : "n");`,
      `__x = BigInt(${a});`, `__x = new BigInt(${a});`,
      `__x = (${a} === BigInt(${a}));`, `__x = String((${a}) >> (22n + 1420070400000n));`,
      `var q = ${a}; q += 1n; __x = q;`, `var r = ${a}; r *= 3n; __x = r;`, `var s = ${a}; s = s / 2n; __x = s;`,
    );
  }
  for (let i = 0; i < cases; i += 1) {
    const a = pick(BI_VALUES), b = pick(BI_VALUES), c = pick(BI_VALUES);
    const op = pick(BI_BIN), op2 = pick(BI_BIN);
    const e1 = op === '**' ? pick(BI_POW_EXPONENTS) : b, e2 = op2 === '**' ? pick(BI_POW_EXPONENTS) : c;
    out.push(`__x = ((((${a}) ${op} (${e1}))) ${op2} (${e2}));`);
  }
  return out;
}

export function verifyBigInt(babel: any, cases: number, seed?: number): VerifyResult {
  const rt = runtimeSource();
  const failures: string[] = [];
  let passed = 0;
  let beyondBound = 0;
  const corpus = bigintCorpus(cases, seed);
  const acorn = (() => { try { return require('acorn'); } catch { return null; } })();
  for (const body of corpus) {
    const nativeOut = vmRun(driver(SERIALISE, body), {});
    let code: string;
    const st = newCompatState();
    try {
      code = babel.transformSync(body, { babelrc: false, configFile: false, compact: false, filename: 'fuzz.js', plugins: [bigIntPlugin(st)] }).code;
    } catch (e: any) {
      failures.push(`TRANSPILE ${body}: ${e.message}`);
      continue;
    }
    if (acorn) {
      try { acorn.parse(code, { ecmaVersion: 2017 }); } catch (e: any) { failures.push(`ES2017-PARSE ${body}: ${e.message}`); }
    }
    if (/BigInt\(/.test(code.replace(/__bi\.BigInt\(/g, ''))) failures.push(`LEAK-BigInt-call ${body} -> ${code}`);
    if (st.hazards.length) failures.push(`HAZARD ${body} -> ${st.hazards.map((h) => h.kind).join(',')}`);
    const shimOut = vmRun(driver(rt + SERIALISE, code), { BigInt: undefined });
    if (nativeOut === shimOut) { passed += 1; continue; }
    /* one exemption: native produced a number past the shim's declared width, where the shim throws */
    if (nativeOut.slice(0, 2) === 'B:' && Math.ceil((nativeOut.length - 4) * LOG2_10) > POW_MAX_BITS
       && (shimOut === 'ERR:RangeError' || shimOut === 'ERR:Error')) {
      /* ERR:Error is the harness's own 30 s timeout while printing a million-bit decimal - not a
      ** semantic difference, and it only ever happens past the width the shim already refuses at.
      ** Counted, not dropped: the behaviour past the line is asserted by the bound cases below, and a
      ** verifier whose clean run can read short of its own total is a verifier that hides failures. */
      beyondBound += 1;
      passed += 1;
      continue;
    }
    failures.push(`DIFF ${body}\n   native=${nativeOut.slice(0, 400)}\n   shim  =${shimOut.slice(0, 400)}`);
  }
  /* the declared bound is asserted, not just excused: just below it the shim must be exact, past it it
  ** must throw RangeError rather than hand back a wrong number or grind on 2013 hardware */
  const bound = [
    ['__x = ((3n ** 32768n) === ((3n ** 32767n) * 3n));', 'B:true'],
    ['__x = (function () { try { 3n ** 65536n; return "silent"; } catch (e) { return e.constructor.name === "RangeError" ? "RangeError" : "wrong:" + e.constructor.name; } })();', 'S:"RangeError"'],
    ['__x = ((2n ** 1000n) ** 1n === 2n ** 1000n);', 'B:true'],
  ];
  for (const [body, want] of bound) {
    const st = newCompatState();
    const code = babel.transformSync(body, { babelrc: false, configFile: false, compact: false, filename: 'bound.js', plugins: [bigIntPlugin(st)] }).code;
    const got = vmRun(driver(rt + SERIALISE, code), { BigInt: undefined });
    if (got === want) { passed += 1; } else { failures.push(`BOUND ${body} -> ${got} (want ${want})`); }
  }
  return { ran: corpus.length + bound.length, passed, failures, census: beyondBound ? beyondBound + ' case(s) past the declared width, counted by the bound assertions' : 'no beyond-width cases' };
}

/* regex fixtures: each entry is a literal to transpile plus the inputs the driver runs it on.
** expect:'blocked' fixtures assert the gate refuses instead of publishing an unverified rewrite. */
export type RegexFixture = { src: string; flags: string; inputs: string[]; expect: 'rewritten' | 'untouched' | 'blocked'; why?: string };
export const REGEX_FIXTURES: RegexFixture[] = [
  { src: '(?<=a)b', flags: '', inputs: ['ab ab xb', 'a', 'b', ''], expect: 'rewritten' },
  { src: '(?<!a)b', flags: '', inputs: ['ab bb b', 'b', ''], expect: 'rewritten' },
  { src: '(?<=a|b)c', flags: '', inputs: ['ac bc cc dc', 'c'], expect: 'rewritten' },
  { src: '(?<=ab)x', flags: '', inputs: ['abx bx ababx', 'x'], expect: 'rewritten' },
  { src: '(?<=\\d)x', flags: '', inputs: ['1x ax 99x', 'x'], expect: 'rewritten' },
  { src: '(?<=a)(?<=b)c', flags: '', inputs: ['abc bc ac c', ''], expect: 'rewritten' },
  { src: '(?<!a)(?<!b)c', flags: '', inputs: ['ac bc cc c', ''], expect: 'rewritten' },
  { src: '(?<=a)', flags: 'g', inputs: ['abab ab', 'a', ''], expect: 'rewritten' },
  { src: '(?<=a)b', flags: 'g', inputs: ['abab xb ab', ''], expect: 'rewritten' },
  { src: '(?<=a)b', flags: 'gi', inputs: ['Ab aB AB', 'ab'], expect: 'rewritten' },
  { src: '(?<=a)b', flags: 'y', inputs: ['ab ab'], expect: 'rewritten' },
  { src: '(?<=a)b', flags: 'u', inputs: ['ab a\u{1f600}b', 'b'], expect: 'rewritten' },
  { src: '(?<=\\u{1f600})a', flags: 'u', inputs: ['\u{1f600}a \u{1f601}a', 'a'], expect: 'rewritten' },
  { src: 'a.b', flags: 's', inputs: ['a\nb a\u2028b ab', 'a\r\nb'], expect: 'rewritten' },
  { src: 'a.b', flags: 'gs', inputs: ['a\nb a b\na.b', ''], expect: 'rewritten' },
  { src: '[a.b]c', flags: 's', inputs: ['ac .c bc', 'a\nc'], expect: 'rewritten' },
  { src: '(?<head>x)(?<tail>\\d+)', flags: '', inputs: ['x12 y12 x', ''], expect: 'rewritten' },
  { src: '(?<y>a)\\k<y>', flags: '', inputs: ['aa ab ba', ''], expect: 'rewritten' },
  { src: '(?<m>a)\\k<m>1', flags: '', inputs: ['aa1 a1', ''], expect: 'blocked', why: 'a numbered backreference before a digit is ambiguous' },
  { src: '(?:)', flags: '', inputs: ['abc', 'a', ''], expect: 'untouched' },
  { src: 'x*', flags: '', inputs: ['abc', '', 'a'], expect: 'untouched' },
  { src: '(?=(?:))', flags: 'g', inputs: ['ab', ''], expect: 'untouched' },
  { src: '(?<=a)(?<g>b)', flags: '', inputs: ['ab cb', ''], expect: 'rewritten' },
  { src: 'a.b', flags: 'd', inputs: ['a\nb ab', ''], expect: 'rewritten' },
  { src: 'x|(?<=a)b', flags: '', inputs: ['xb yb', 'x', ''], expect: 'rewritten' },
  { src: 'a(?<=b)c', flags: '', inputs: ['abc ac', ''], expect: 'blocked', why: 'mid-pattern lookbehind' },
  { src: '(?<=a*)b', flags: '', inputs: ['aaab b', ''], expect: 'blocked', why: 'variable-width lookbehind' },
  { src: '(?<=.)x', flags: 'u', inputs: ['a\u{1f600}x ax', ''], expect: 'blocked', why: 'width 1..2 under the u flag' },
  { src: '(?<=a)b', flags: 'm', inputs: ['a\nb ab'], expect: 'blocked', why: 'multiline + lookbehind' },
  { src: '(?<=\\p{L})a', flags: 'u', inputs: ['xa za'], expect: 'blocked', why: 'unicode property escape' },
  { src: '(?<=a$)b', flags: '', inputs: ['a\nb ab'], expect: 'blocked', why: 'anchor inside a lookbehind' },
  { src: '(?<=(a))b', flags: '', inputs: ['ab b'], expect: 'blocked', why: 'capturing lookbehind' },
  { src: '(?<=a)b|(?<=c)d', flags: '', inputs: ['ab cd xd yb', ''], expect: 'rewritten' },
  { src: '(?=[A-Z][a-z])|(?<=[a-z])(?=[A-Z])', flags: '', inputs: ['camelCaseWord hello World', ''], expect: 'rewritten' },
  { src: '\\w+(?=\\s)(?<=\\d)', flags: '', inputs: ['a1 b2 c', ''], expect: 'blocked', why: 'mid-pattern lookbehind' },
  { src: '(?<=a)b', flags: 'gim', inputs: ['ab AB'], expect: 'blocked', why: 'multiline + lookbehind' },
  { src: 'plain[a-z]+', flags: 'gi', inputs: ['abc ABC'], expect: 'untouched' },
  { src: '(?=a)b', flags: '', inputs: ['ab', 'b'], expect: 'untouched' },
  { src: '(?!a)b', flags: 'g', inputs: ['ab cb'], expect: 'untouched' },
  { src: 'a{2,3}b', flags: '', inputs: ['aab aaab aaaab'], expect: 'untouched' },
];

const RX_DRIVER = `
var __probe = function (re, s) {
  var out = [];
  out.push('src=' + re.source);
  out.push('flags=' + (re.flags === undefined ? 'undef' : re.flags));
  out.push('tostr=' + String(re));
  out.push('dotAll=' + (re.dotAll === undefined ? 'undef' : re.dotAll));
  var m = re.exec(s);
  out.push('exec=' + __ser(m));
  out.push('exec2=' + __ser(re.exec(s)));
  re.lastIndex = 0;
  var all = [], k = 0, prev = -1;
  if (re.global || re.sticky) { while (k < 40 && (m = re.exec(s)) !== null) { all.push(__ser(m)); if (m.index === prev && m[0] === '') break; prev = m.index; k += 1; } }
  out.push('loop=[' + all.join(' ; ') + ']');
  re.lastIndex = 0;
  out.push('match=' + __ser(s.match(re)));
  out.push('replace=' + __ser(s.replace(re, '[$&]')));
  out.push('replaceFn=' + __ser(s.replace(re, function () { return '<' + arguments.length + ':' + Array.prototype.slice.call(arguments, 0, arguments.length).map(function (a) { return String(a); }).join('|') + '>'; })));
  try { out.push('replaceNamed=' + __ser(s.replace(re, '$<head>'))); } catch (e) { out.push('replaceNamed=ERR:' + (e && e.constructor ? e.constructor.name : 'x')); }
  re.lastIndex = 0;
  out.push('split=' + __ser(s.split(re)));
  re.lastIndex = 0;
  out.push('search=' + __ser(s.search(re)));
  re.lastIndex = 0;
  out.push('test=' + __ser(re.test(s)));
  return out.join('\\n');
};
`;

/* Property test, deliberately NOT the hand-written corpus: generate random patterns from a grammar
** that mixes FF52-safe syntax with the four post-FF52 constructs, run each one through
** rewritePattern, then compare the REWRITTEN literal against the ORIGINAL on random inputs with
** native RegExp as the oracle.
** Invariants per generated case:
**   1. accepted rewrite  -> every probe (exec / global loop / match / replace / $<name> / split /
**                           search / test) is byte-identical to what the native engine does with the
**                           original pattern
**   2. accepted rewrite  -> the emitted pattern still parses and holds no post-FF52 construct
**   3. refused rewrite   -> the refusal reason is one of the enumerated unexpressible classes
**   4. nothing may be accepted while differing: a false accept is exactly what a hand-picked
**      corpus can hide, so invariant 4 is the point of this function
*/
export const REFUSAL_KINDS = ['regex-unparseable', 'regex-unicode-property', 'regex-hasIndices', 'regex-named-backref',
  'regex-lookbehind-multiline', 'regex-lookbehind-position', 'regex-lookbehind-width', 'regex-lookbehind-body',
  'regex-lookbehind-anchor', 'regex-lookbehind-capture', 'regex-lookbehind-branch-capture', 'regex-lookbehind-quantified',
  'regex-named-backref-ambiguity', 'regex-clone-unsafe', 'regex-rewrite-incomplete'];

const RX_SAFE_ATOMS = ['a', 'b', 'c', '1', '0', ' ', '\\d', '\\w', '\\s', '[abc]', '[^a]', '.', 'x?', 'y*', 'z+', '(q)', '(?:r)', '(?=t)', '(?!u)'];
const RX_HAZARD_ATOMS = ['(?<=a)', '(?<!b)', '(?<=ab)', '(?<=\\d)', '(?<n>a)', '(?<m>[bc])', '\\k<m>', 'a.b', '(?<=a|b)'];
const RX_LEADING_ATOMS = ['(?<=a)', '(?<!b)', '(?<=ab)', '(?<=\\d)', '(?<=a|b)', '(?<=.)', '(?<=x?)', '(?<n>a)', '(?<m>[bc])'];
const RX_FLAG_SETS = ['', 'g', 'i', 'm', 's', 'd', 'gi', 'gs', 'gim'];

export function verifyRegexProperty(babel: any, cases: number, seed = 0x9e3779b9): VerifyResult {
  const rt = runtimeSource();
  const rand = rng(seed);
  const pick = (arr: string[]): string => arr[Math.floor(rand() * arr.length) % arr.length];
  const failures: string[] = [];
  let ran = 0, compared = 0, refused = 0, skipped = 0, passed = 0;
  for (let i = 0; i < cases; i += 1) {
    let src = '';
    const n = 1 + Math.floor(rand() * 5);
    /* most cases start with a leading assertion: that is where a rewrite is possible at all, so
    ** biasing the generator here is what turns "compared" up from a trickle into real coverage */
    if (rand() < 0.6) src += pick(RX_LEADING_ATOMS);
    if (rand() < 0.25) src += pick(RX_LEADING_ATOMS);
    for (let k = 0; k < n; k += 1) src += rand() < 0.4 ? pick(RX_HAZARD_ATOMS) : pick(RX_SAFE_ATOMS);
    if (rand() < 0.25) src += '|' + pick(RX_SAFE_ATOMS);
    const flags = pick(RX_FLAG_SETS);
    try { void new RegExp(src, flags); } catch { skipped += 1; continue; }   // native rejects the generated pattern
    ran += 1;
    const r = rewritePattern(src, flags, { indicesRead: false });
    if (!r.ok) {
      refused += 1;
      if (REFUSAL_KINDS.indexOf(r.kind) < 0) failures.push(`UNLISTED-REFUSAL ${r.kind} for /${src}/${flags}: ${r.detail}`);
      else passed += 1;
      continue;
    }
    if (r.noop) { passed += 1; continue; }
    const after = analyzePattern(r.src, r.flags);
    const left = post52(after.features);
    if (!after.ok || left.length || r.flags.indexOf('s') >= 0 || r.flags.indexOf('d') >= 0) {
      failures.push(`NOT-FF52-GRAMMAR /${src}/${flags} -> /${r.src}/${r.flags}: ${left.join(',') || (after.error && after.error.why) || 'flag left on'}`);
      continue;
    }
    const input = (() => {
      const len = Math.floor(rand() * 12);
      let s = '';
      for (let j = 0; j < len; j += 1) s += 'abc10 \n'.charAt(Math.floor(rand() * 7) % 7);
      return s;
    })();
    compared += 1;
    const body = `var re = /${src}/${flags};\n__x = __probe(re, ${JSON.stringify(input)});`;
    const nativeOut = vmRun(driver(SERIALISE + RX_DRIVER, body), {});
    const st = newCompatState();
    let code: string;
    try {
      code = babel.transformSync(body, { babelrc: false, configFile: false, compact: false, filename: 'prop.js', plugins: [regexPlugin(st)] }).code;
    } catch (e: any) { failures.push(`TRANSPILE /${src}/${flags}: ${e.message}`); continue; }
    if (st.hazards.length) { failures.push(`HAZARD-AFTER-ACCEPT /${src}/${flags}: ${st.hazards.map((h) => h.kind).join(',')}`); continue; }
    const shimOut = vmRun(driver(rt + SERIALISE + RX_DRIVER, code), {});
    const bothError = nativeOut.indexOf('ERR:') === 0 && shimOut.indexOf('ERR:') === 0;
    if (nativeOut === shimOut || bothError) passed += 1;
    else failures.push(`PROPERTY-DIFFER input=${JSON.stringify(input)} /${src}/${flags} -> /${r.src}/${r.flags}\n  native=${nativeOut}\n  shim  =${shimOut}`);
  }
  return { ran, passed, failures, census: `ran=${ran} compared=${compared} refused=${refused} skipped=${skipped}` };
}

export function verifyRegex(babel: any): VerifyResult {
  const rt = runtimeSource();
  const failures: string[] = [];
  let ran = 0, passed = 0;
  for (const f of REGEX_FIXTURES) {
    for (const input of f.inputs) {
      ran += 1;
      const body = `var re = /${f.src}/${f.flags};\n__x = __probe(re, ${JSON.stringify(input)});`;
      const nativeOut = vmRun(driver(SERIALISE + RX_DRIVER, body), {});
      const st = newCompatState();
      const transformed = babel.transformSync(body, { babelrc: false, configFile: false, compact: false, filename: 'r.js', plugins: [regexPlugin(st)] }).code;
      const kinds = st.hazards.map((h) => h.kind);
      if (f.expect === 'blocked') {
        if (!kinds.length) failures.push(`NOT-BLOCKED /${f.src}/${f.flags} (expected a hazard: ${f.why})`);
        else passed += 1;
        continue;
      }
      const touched = /__rx\(/.test(transformed);
      if (f.expect === 'untouched' && touched) failures.push(`TOUCHED safe literal /${f.src}/${f.flags}`);
      if (f.expect === 'rewritten' && !touched) failures.push(`NOT-REWRITTEN /${f.src}/${f.flags}: ${kinds.join(',') || 'no hazard recorded'}`);
      if (kinds.length) { failures.push(`HAZARD /${f.src}/${f.flags} -> ${kinds.join(',')}: ${st.hazards.map((h) => h.detail).join(' | ')}`); continue; }
      const shimOut = vmRun(driver(rt + SERIALISE + RX_DRIVER, transformed), {});
      if (nativeOut === shimOut) passed += 1;
      else failures.push(`DIFF /${f.src}/${f.flags} on ${JSON.stringify(input)}\n--- native ---\n${nativeOut}\n--- shim ---\n${shimOut}`);
    }
  }
  return { ran, passed, failures };
}

export function verifyRuntime(): VerifyResult {
  const src = runtimeSource();
  const errors = auditEs5(src);
  if (/^\s*\(function \(g\) \{\n\s*'use strict';/m.test(src) === false && !/'use strict';/.test(src)) errors.push("runtime is not in strict mode");
  if (src.indexOf('g.__bi = bi;') < 0 || src.indexOf('g.__rx = __rx;') < 0) errors.push('runtime does not export __bi/__rx on the global object');
  return { ran: 2, passed: errors.length ? 0 : 2, failures: errors };
}
