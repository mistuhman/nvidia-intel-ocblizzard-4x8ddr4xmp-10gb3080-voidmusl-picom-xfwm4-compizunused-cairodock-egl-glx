# 2026-09-16k - bounded-width lookbehind windows, and what running on real code caught

Off-target work only: no workflow dispatch, no publication, no install, nothing executed on the Mac.
`COMPILE_GATE=HOLD` unchanged. This is the wave the 2026-09-16j receipt named as "next single task".

## The rule that changed

`__rx` used to require a leading lookbehind body to be **exactly** *w* code units wide, because then the check
is "does the body match the *whole* window ending at the match start". Vencord's source-scraping patterns are
all bounded-but-variable - `(?<=forceOpen:.{0,40}?ariaHidden:!0,)` is 24..64 code units - so they were refused.

A lookbehind does not ask "does the body match a window of width exactly w". It asks **does the body match
somewhere, ending at this position**. That question is decidable for a bounded body with one end-anchored
search over the widest legal window:

```
holds(body, s, at)  =  /(?:BODY)$/.test( s.slice(max(0, at - wm), at) )
```

* the end anchor is what "ending at the match start" means;
* the start is deliberately **not** anchored, because the body may match at any width in `[min, wm]`;
* the body's own minimum width is enforced by the body itself - a `.{0,40}?` cannot match more than it matches;
* clipping the window at index 0 is exactly what the engine does when a lookbehind runs at the start of a string;
* negation is the same test inverted: `(?<!L)` holds iff no such match exists, and existence over the maximal
  window is the same quantification.

The exact-window path is kept for `min === max` (one `^(?:…)$` compare, no searching), so nothing got slower
that used to be cheap. `RX_MAX_WINDOW = 4096` code units bounds the scan per candidate position: past that, or
for an unbounded body (`[^}]*?`, `.+?`), the refusal is listed rather than the scan attempted - on a 2016 engine
an unbounded window per candidate is a hang, and a hang is worse than a blocked publication.

**Why only a branch start.** At a branch start the assertion's truth depends only on `(subject, match-start)`,
so "match, then filter" is the same computation the engine performs. Mid-pattern it is not: the position being
asserted at is wherever the engine chose to end the preceding atom, and a filter that rejects one candidate does
not let the engine backtrack into a different length. The witness is
`/(?:xy|x)(?<=x)y/` on `"xyy"` - native matches `"xy"` at 0 (it backtracks `xy`→`x` once the lookbehind fails),
while match-then-filter on `/xyy/` finds only the `xy` candidate, rejects it, and moves the start forward,
missing a legal match. Those 51 patterns stay refused, quoted per pattern.

## What the app caught that a unit test could not

The first cut of this wave also added unicode-mode class-range strictness, and it was **wrong in the strict
direction**: it refused `[\u{e0061}-\u{e0066}]` - a real class in Vencord's colour matcher, legal under `u`
because `\u{...}` *is* a character - as a new `regex-unparseable` hazard. A fixture set built from my own
expectations could not see that; the census found it on the first run, and the rule was reduced to what the
engine table actually supports:

| measured case | plain mode | u mode | now |
| --- | --- | --- | --- |
| `[a-\d]`, `[\d-a]`, `[a-\p{L}]`, `[\p{L}-a]`, `[a-\B]`, `[a-\1]` | ok (Web | THROW | refuse in `u` only | endpoint kind, u mode only |
| `[a-\x41]`, `[a-\Z]`, `[a-\.]`, `[a-\n]`, `[a-\b]`, `[a-\-]` | THROW | THROW | **range order** (0x61 > 0x41 …) both modes |
| `[\x41-a]`, `[\cA-\cZ]`, `[\0-\x10]`, `[\b-\f]`, `[\u{41}-\u{42}]`, `[\u{e0061}-\u{e0066}]` | ok | ok | accept |
| `[\{-a]`, `[\|-a]`, `[\}-a]` | THROW | THROW | **not mirrored** - ES2018 strictness, FF52 parses them |

A method note, because it nearly cost this wave its findings: two of my three probes were built inside a shell
`node -e "…"`, and double quotes eat backslashes - those runs reported a broken 13-cell and a broken 122-cell
result for patterns that were never the patterns I meant to send. The class rules only became trustworthy once the
case list lived in a file (`/tmp/cases.cjs`, `/tmp/matrix.cjs`, `/tmp/clsmatrix.cjs`) and the escaping stopped
changing under me. Re-running with correct escaping turned up four genuine **over-lenient** cells - the analyzer
accepting what the engine rejects, the dangerous direction - and they are fixed:

* `[\u{41}-\u{42}]` and `[\u{e0061}-\u{e0066}]` **without** `u`: a code point escape inside a class is a
  unicode-mode production, so `classGrammar` now refuses it unless the flag is set - while `a\u{41}` *outside* a
  class stays legal (Annex B identity escape), which is exactly why this had to be a class-internal rule;
* `[a-\B]` in plain mode: outside `u` that is the letter 'B', so 97..66 is a backwards range and refuses like
  any other - my first cut excluded `B` from the letter fallback and let it through.

After those fixes the 18-case class probe agrees in both directions, the 840-cell pattern matrix is still 0, and
**the app census is byte-identical** (181 hazards, same per-kind breakdown, `instructions_sha256` moved with the
corpus bump) - which is the check that the added strictness costs the one app measured here nothing.

Most of what I first read as "V8 being picky about escapes" turned out to be a **backwards range**, which every
engine including FF52 rejects; encoding that is protective, encoding V8's reserved-punctuator taste would
block working code to match one engine's preference. That asymmetry - over-strictness costs publication,
over-leniency ships a dead script - is the whole rule of this pass, and the code says so where a future reader
might be tempted to "fix" it.

## Census after the change (same pinned bytes, same command)

    node tools/mac-es5-passthrough.ts transpile --in=<dir> --out=<dir>   # exit 4, BLOCKED

| | before (16j) | after |
| --- | --- | --- |
| hazards total | 181 | **181** |
| `regex-lookbehind-width` | 41 | **20** |
| `regex-lookbehind-capture` | 11 | 18 |
| `regex-clone-unsafe` | 76 | 90 |
| `regex-lookbehind-position` | 51 | 51 |
| `regex-unicode-property` | 2 | 2 |
| `regex-unparseable` | 0 | 0 |
| BigInt lowered / literals | 209 / 209 | 209 / 209 |
| regex literals / rewritten | 595 / 3 | 595 / 3 |

The total is flat and the composition moved by 21: those lookbehinds are no longer refused for *width*. They
reappear under a precise reason - a lookbehind that captures, or an object that flows to `matchAll` or is stored
where the pass cannot follow it. That is the honest result of this wave: **the app is blocked by how it uses
these regexes, not by the analyzer's inability to express them.** Direct check - the exact app patterns, used
through a safe sink, do rewrite:

```
(?<=forceOpen:.{0,40}?ariaHidden:!0,)children:(?=[A-Z])   ->  src="children:(?=[A-Z])"  cons=[{n:0,w:0,wm:64,…}]
(?<=fallbackIconSrc:.{0,50}?)x                            ->  src="x"                   cons=[{n:0,w:0,wm:66,…}]
(?<=,marginBottom:16)(?=\},children:\[)                   ->  src="(?=\},children:\[)"  cons=[{n:0,w:16,…}]
```

Clearing the remaining classes means, in order of tractability: renumbering captures out of a lookbehind body
(18), then a real prefix-length analysis for mid-pattern lookbehind (51, needs a bound the general case cannot
supply), then either a Unicode property table in `compat.js` (2) or an upstream change in the app (90, which is
its own code).

## Verification state

| check | result |
| --- | --- |
| class-range matrix, 48 shapes x 8 flag sets against V8 | **0 mismatches of 384** |
| pattern matrix, 60 shapes x 14 flag sets | **0 mismatches of 840** |
| regex property fuzz, 8 seeds x 6000 | **48000/48000**, 18431 byte-compared vs native `RegExp`, 23346 refused with listed kinds, 1872 native-rejects agreement-asserted |
| `VERIFY_REGEX` fixtures | **99/99** (9 new window fixtures, 2 new refusal fixtures; 1 stale refusal expectation flipped to differential after the `u`-mode `.` case became decidable) |
| refusal vocabulary audit | 18 kinds listed (15 regex + 3 bigint) = 18 emitted, both directions |
| `VERIFY_BIGINT` | 3166/3166 (unchanged, no BigInt edit this wave) |
| `TEST_ALL` / `ONE_TEST` / `CORPUS_SYNC` | PASS / PASS / PASS |
| window probe (`/tmp/win.cjs`, 16 shapes incl. `g`, `y`, mixed exact+window) | 16 accepted, 0 differences |

Two bugs the *differential* fixtures caught that a rewrite unit test could not see:

1. `consNode` in the plugin emitted only `n, w, s, f` - **`wm` was dropped**, so every bounded window silently
   degraded to a zero-width exact check. Caught by `(?<=a{0,2}b)c` disagreeing with native on the fixture inputs
   (`exec` returned null); my own scratch probe had agreed because it serialised the whole payload with
   `JSON.stringify`, which kept the key. A probe that re-implements the emitter proves nothing: it has to go
   through it.
2. `this.unicode` did not exist on the parser (the flag lives in `this.flags`), so the whole first cut of the
   u-mode class rules was dead code that `node --check` happily accepted.

## Artifacts and hashes

The compat runtime changed, so the bundle hash moved - this is the one number every other receipt's
`compat_sha256` depends on:

| file | sha256 |
| --- | --- |
| `tools/lib/es5-compat-runtime.js` | `ba6d1a08197902725a16784e5ff1f97c340c15616b203eae4813488ac63445cc` (was `8f3bbc53d268…`) |
| `tools/lib/es5-compat.ts` | see `CENSUS.json` |
| corpus `2026-09-16k-v7` | `f72ecd4662bc351cc3bb3c69c666520574e41965fa025adb425616a6571d033c` |
| `lion-one.zip` | 3 entries, 14687 B, rebuilt from that corpus (`CORPUS_SYNC=PASS … zip-in-step`) |

`COMPATIBILITY.json` here is the post-change run, compact, and `CENSUS.json` carries the before/after table and
the file hashes. `ES5 floor audit` on the new runtime: clean (`compat_audit: []`).

## Not claimed

- Still no Firefox 52 anywhere: V8 agreement + an acorn ES5 syntax floor is not the target engine, and that is
  the only reason the gate is HOLD.
- A bounded window is only *decidable*, not cheap: the scan runs per candidate start position. The 4096 bound is
  a performance judgement about a 2016 engine, and I have not measured it on one.
- The `1..inf`/`35..inf` app patterns stay refused; `RX_MAX_WINDOW` could be raised, but nothing here proves
  that is safe on the target, and "raise the constant" is not evidence.
- `new RegExp(<dynamic>, flags)` bodies remain unanalysed (recorded in every `COMPATIBILITY.json`), and
  mid-pattern lookbehind remains refused.

## Next single task

Capture-in-lookbehind renumbering (18 hazards): the body's groups can be given indices *after* the whole
pattern's captures and hidden from `match` results, which is what FF52 would have done with them anyway - or,
if that is judged too invasive, stop widening and hand the operator a publish:false CI run plus the Mac burn.
One of the two, not both.
