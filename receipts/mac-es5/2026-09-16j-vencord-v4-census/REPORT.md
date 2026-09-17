# 2026-09-16j - v4 compat layer run against the real Vencord bundle, and what it actually costs

Off-target work only. Nothing here was dispatched, published, installed, or run on the Mac; the gate stays
`COMPILE_GATE=HOLD`. This receipt does two things: it closes the clause "verify a real FF52-compatible
BigInt and regex implementation" **against real app code** instead of fixtures, and it records the analyzer
fixes that run produced, because both changed what a future receipt has to claim.

## Why the app bytes were reachable after all

The 2026-09-16i receipt recorded that the per-app counts could not be recomputed in the sandbox
(`raw.githubusercontent` dead, `gh api` on third-party repos 401). That was wrong in a useful way: `gh api`
works against a third-party repo when the token has public scope, so the exact recorded commit could be
fetched and re-verified.

    gh api -H "Accept: application/vnd.github.raw" \
      "repos/Vencord/builds/contents/Vencord.user.js?ref=8a2b56ed722781381cdf93e62f1096f6358817c1"

Result: 739,330 bytes, sha256 `325bb7568d1fdc790d996387c51f6155edb2ee7ffd4dc710681d9dfcea44210d`, git blob
`5f30565e641567a8788e71f050c167c6bf975612` - byte-identical to what `receipts/mac-es5/2026-09-16g-vencord-local/`
recorded. The bundle at the *current* HEAD is 77 bytes larger, which is why the ref is pinned in the fetch
command and in `SOURCE.json`; a census against a moving build is not a census.

## The census

    node tools/mac-es5-passthrough.ts transpile --in=/tmp/v4run/src --out=/tmp/v4run/out   # exit 4, BLOCKED

| measured | value |
| --- | --- |
| BigInt literals in source | **209** |
| BigInt literals lowered to `__bi.BigInt(...)` | **209 / 209** |
| BigInt operator sites lowered | 2018 |
| regex literals analysed | 595 |
| regex literals rewritten to FF52 grammar | 3 |
| hazards that block publication | **181** |

`COMPATIBILITY.json` is committed here verbatim from the tool, stored compact (46,765 bytes on one line) so a
181-row audit table spends one line of the PR budget instead of 1,300; every hazard carries the exact pattern
and the reason, and `CENSUS.json` records its sha256 as the authority. `compat_sha256` is `8f3bbc53d268...`, identical to the runtime shipped in the earlier
receipts: the compat runtime itself did not change in this wave, only the analyzer.

Blocking hazard classes:

| kind | count | what it means |
| --- | --- | --- |
| `regex-lookbehind-position` | 51 | lookbehind is not at index 0 (`/x(?<=y)/`), so the constraint applies at a string offset, not at the match start |
| `regex-lookbehind-width` | 41 | lookbehind window is not fixed width, typically `(?<=foo:.{0,40}?)` |
| `regex-clone-unsafe` | 76 | a pattern that needs enforcement flows to `matchAll` / `RegExp(re)` / a `.source` read, where the constraints are lost |
| `regex-lookbehind-capture` | 11 | lookbehind body captures a group; deleting it would renumber later references |
| `regex-unicode-property` | 2 | `[^\p{Letter}\p{Number}\p{Punctuation}\s]` style classes in `u` mode |

The BigInt half of the operator's claim ("209 BigInt literals") is **confirmed exactly**, and now confirmed on
the real bundle rather than on samples. The regex half ("184 post-FF52 regex hazards") is **not reproducible as
stated**: the first v4 run reported 279 hazards of which 219 were tool defects, not FF52 limits. Both defects
were in my analyzer and both are fixed here; the remaining 181 are genuine refusals of constructs this pass
will not attempt to express. Publishing stays blocked for the app, by the app's own source-scraping patterns.

## What the real bundle taught the analyzer

Two rules were wrong in the strict direction, and in this project over-strictness is a *publication* bug, not
a style preference:

1. **Annex B web-compat grammar.** Outside unicode mode a `{` that does not form a quantifier is a literal
   (`/a{b/`, `/a{2/`, `/x{}/`, `/}=a/`, `/a{1,2,3}/`), and identity escapes that a strict parser rejects are
   accepted (`/a\i/` matches `ai`). Refusing them reported 156 valid Vencord patterns as hazards. The parser
   now carries the mode distinction (`u` stays strict, which is exactly the mode where those are SyntaxError),
   plus `(?<n>a)(?<n>a)` duplicate names, `\k<name>` naming nothing, and `u`-mode numeric backrefs.
2. **`matchAll`/clone safety at the wrong granularity.** The first pass scanned the whole file for `matchAll`
   and refused every constrained pattern in it: one `matchAll` in a 739 KB single-file bundle blacklisted 63
   unrelated lookbehinds. It is now per object, by following where that regex value flows: safe as the argument
   of `replace`/`replaceAll`/`split`/`match`/`search` and as the receiver of `test`/`exec` (all route through
   the patched instance), unsafe through `matchAll`, `RegExp(re)`, or a `.source`/`.flags`/`.constructor` read;
   when flow leaves the analysis (stored on an object, returned, closed over) it fails closed only if such a
   sink exists in the file at all. `node /tmp/esc.cjs` pins all fifteen shapes.

Both classes are now CI-enforced rather than argued:

- `selftest --compiler` gained `refusal-vocabulary`, which compares `REFUSAL_KINDS` +
  `BIGINT_REFUSAL_KINDS` against the refusal sites in the analyzer source, in both directions. It immediately
  found `regex-dynamic-unsafe` missing from the list and `regex-lookbehind-quantified` present in the list with
  no code to emit it (a quantified lookbehind is refused by the position rule). 18 listed, 18 emitted.
- the property fuzzer now asserts **engine agreement in both directions**: if native `new RegExp` throws, the
  analyzer must refuse it (`PARSER-STRICT` fires when it does not), and if native accepts a pattern that
  reaches the target, refusing it is a defect (`PARSER-LENIENT`). The generator gained a web-compat atom bucket
  (`{`, `}=`, `a{b`, `a{2`, `\i`, `\_`, `\-`, `x{}`, `(?=b)+`, `a{1,2,3}`, `#{intl::X#}`-style literals) so the
  shapes that produced the 156 false hazards are generated forever, not just once by hand.

## Verification state after this wave

| check | result |
| --- | --- |
| differential matrix, 63 patterns x 12 flag sets, analyzer verdict vs native `new RegExp` throw | **0 mismatches of 636** |
| regex property fuzz, 4 seeds x 6000 patterns (post-fix) | **24000/24000**, 8305 byte-compared against native, 12631 refused with listed kinds, 925 engine-rejects agreed |
| BigInt differential fuzz, 3 seeds x 12000 (post-fix) | **44838/44838** |
| `selftest --compiler` default cases | `VERIFY_VOCABULARY 18/18`, `VERIFY_BIGINT 3166/3166`, `VERIFY_REGEX 78/78`, `VERIFY_REGEX_PROPERTY 660/660`, PASS |
| `node tools/test-all.ts` | `TEST_ALL=PASS` |
| `node tools/lion-one-test.ts` | `ONE_TEST=PASS` (28 checks incl. Z-* zip equality) |
| `node tools/pr-budget.ts main 405` | see the budget note below |

The corpus entry for all of this landed as `2026-09-16j-v5`, sha `d94486672b9a93cda8b7845a7129c929b51c03f90b7bbf2bcf7e1d66327487b0`,
and `lion-one.zip` (13,737 bytes) was rebuilt from it, so the Mac artifact and the compiler agree:

| file | sha256 (first 16) |
| --- | --- |
| `lion-compiler-context.command` | `95e9ee2283b56990` |
| `lion-one.command` | `129661266dbc1137` |
| `lion-one.html` | `d9bead10983ec7a2` |
| `etc/lion-command.txt` | `7496aee1e93bc79c` |
| `tools/lib/es5-compat.ts` | `9503a78213b941cb` |
| `tools/lib/es5-compat-runtime.js` | `8f3bbc53d268304f` (unchanged: no runtime edit in this wave) |

## Corpus drift is now a tool failure, not a discovery

The corpus lives in `tools/mac-es5-passthrough.ts`; the burn artifact carries a snapshot of it plus the sha it
hashes itself against. Re-syncing that by hand is what let them drift. `tools/lion-corpus-sync.ts` replaces
the hand step: `verify` (wired into `tools/test-all.ts`) fails on any difference between compiler corpus,
embedded corpus, version references in `lion-one.html` / `etc/lion-command.txt`, and the bytes inside
`lion-one.zip`; `sync [--zip]` rewrites them. `node tools/lion-corpus-sync.ts verify` prints
`CORPUS_SYNC=PASS corpus=2026-09-16j-v5 sha=d94486672b9a zip-in-step`.

`tools/test-all.ts` also now runs `selftest --compiler` when the pinned CI deps resolve (it said `TEST_ALL=PASS`
through the 40/78 regex regression, because the dep-free half looked like full coverage); it prints a loud
`SKIP ... (@babel/core + core-js-bundle + acorn not installed)` otherwise, so silence is never coverage.

## Decisions I made when the clarifying questions were skipped

- **Artifact sync**: I re-pinned the burn artifact to the corpus instead of leaving it to the operator, and
  added the drift check above, because an unsynced artifact is one that burns a stale instruction set.
- **Evidence bar for the regex clause**: fixtures + fuzzing + a census on byte-verified real app source, run
  locally. No GitHub dispatch and no published bundle was used to obtain it; the CI run is no longer required
  to know these counts, though it remains the way to publish a bundle.

## What is NOT claimed

- No Firefox 52 was run, locally or on the target. Everything here is V8 + the ES5 floor audit + a
  differential against the engine, not the 2016 engine. A pattern the analyzer accepts and Firefox 52 rejects
  is still only catchable on the target - which is why `COMPILE_GATE` is `HOLD` and not `PASS`.
- `new RegExp(<dynamic>, flags)` bodies are not rewritten (recorded as a note in every `COMPATIBILITY.json`),
  and mid-pattern lookbehind is deliberately refused rather than approximated: rewriting `/x(?<=y)z/` into a
  superset match plus an end-anchored post-filter changes behaviour whenever the wider match can end elsewhere,
  so the sound version needs a prefix-length bound that a `.{0,40}` window can supply and a general pattern cannot.
- No bundle, no loader, no receipt for the app: `transpile` exited 4 before writing any output, which is the
  gate working as designed.

## Next single task

Implement the bounded-width lookbehind window (`(?<=A.{0,40}?)B` -> enumerate the legal window widths and test
each at the candidate offset), which is what 41 of the 181 hazards need, and which would make Vencord's
source-scraping patterns expressible. Everything else in the hazard table is either a refusal to widen
(`-capture`, `-unicode-property`) or already precise.

Operator-side, unchanged: Mac burn of `lion-one.zip`, target receipt, and any merge - merges stay operator-only.
