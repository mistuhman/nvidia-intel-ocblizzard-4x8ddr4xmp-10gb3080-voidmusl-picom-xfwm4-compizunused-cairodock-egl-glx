# Compat verification — BigInt + regex for FF52-class — 2026-09-16i

**Verdict: the two blockers from the 16h hold now have real implementations, verified differentially OFF-target. Publication gate: still HOLD. No CI dispatch, no bundle published, no merge.**

## What the hold demanded

`receipts/mac-es5/2026-09-16h-burn-verification/` ended with two blockers that no syntax lowering can clear:

1. core-js 3.50.0 does not supply `BigInt` on an engine that lacks it, so 209 BigInt literals in Vencord were left as `BigInt(...)` calls against an absent global.
2. post-FF52 regex literals (lookbehind, named groups, `s`, `d`, `\p{...}`, `\k<name>`, `matchAll`) were deferred into `new RegExp(...)`, which parses on FF52 and then throws — and a weakened pattern that *silently matches less* is worse than a throw.

A `node --check` PASS and an acorn ES2017 floor PASS prove bytes the target can *parse*, never that it *behaves*. So the task was: build the semantics, and prove them against a real engine.

## What was built

| File | Role |
|---|---|
| `tools/lib/es5-compat-runtime.js` | The compat layer itself: `__bi` (arbitrary-precision BigInt over 15-bit digit arrays, radix table up to 36, two's-complement bitwise ops over 30-bit words, `asIntN`/`asUintN`, native mixing rules) and `__rx` (constraint enforcement for what FF52 cannot express: variable-width/mid-pattern/per-branch lookbehind, `d`-flag `hasIndices`, named-group access). ES5 syntax only, no dependencies, 33,695 bytes, sha256 `8f3bbc53d268304ff5b363a4ee30ffd20b5700b59be3b5b13d1da21f070a4bab`. |
| `tools/lib/es5-compat.ts` | FF52 capability table (MDN-cited per construct), a hand-written pattern parser + width measurer, `rewritePattern` (FF52-grammar rewrite or a listed refusal), `bigIntPlugin` (literal + operator lowering), `regexPlugin` (literal → `__rx(new RegExp(...))`), `auditEs5` (acorn AST walk, not a grep), and four verifiers: `verifyBigInt`, `verifyRegex`, `verifyRegexProperty`, `verifyRuntime`. |
| `tools/mac-es5-passthrough.ts` | Registry-driven compiler, now consuming the lib: emits `compat.js` into every bundle, writes a rich `COMPATIBILITY.json`, exits 4 refusing publication while hazards remain, and refuses a receipt for a bundle missing `compat.js`. Loader order `polyfill.js` → `compat.js` → `es5-*.js`. Corpus `2026-09-16i-v4`. |

Design choices that matter for safety:

- **Operators dispatch on their operands**, they are not name-tagged. `a + b` becomes `__bi.add(a, b)`, so a Number operand still produces a Number, and a mixed Number/BigInt operand still throws the native `TypeError`. Conservative static inference could have corrupted a `Number`; dispatch cannot.
- **A shim bigint has a throwing `valueOf`.** Any site the lowering *missed* fails loudly at runtime instead of coercing to `NaN`/`0` — which is what makes the static analysis being an under-approximation acceptable.
- **Instances are interned**, so `===`/`==` and `Set`/`Map` keying stay correct even at unlowered sites.
- **Refusal beats weakening.** 15 enumerated refusal kinds (`REFUSAL_KINDS`) each land in `COMPATIBILITY.json.hazards[]` with the offending pattern, the reason, and the MDN citation. A pattern FF52 cannot express and `__rx` cannot enforce does not ship; the bundle is not published.

## Evidence

All counts are from runs in this sandbox (node 22 + the pinned CI dependency set: `@babel/core@7.29.7 @babel/preset-env@7.29.7 core-js-bundle@3.50.0 acorn@8.18.0`).

| Check | Result |
|---|---|
| `selftest --compiler` (default corpus) | `PASSTHROUGH_SELFTEST=PASS` — `VERIFY_BIGINT 3166/3166`, `VERIFY_REGEX 78/78`, `VERIFY_REGEX_PROPERTY 629/629` |
| `selftest --compiler --cases=12000` (the CI preflight, 2 m 26 s) | `PASSTHROUGH_SELFTEST=PASS` — `VERIFY_BIGINT 14946/14946`, property fuzz `33932/33932` (10,691 compared against native, 20,965 refused, 2,068 patterns native itself rejects) |
| `verify-bigint-differential` | `VERIFY_BIGINT 3166/3166` |
| wide BigInt sweep, 8 seeds × 12,000 random + the full grid | `119,568 / 119,568`, zero failures. 13–15 of those cases are results past the shim's declared 65,536-bit width, where native kept computing and the shim throws `RangeError`; they are counted through the bound assertions and their tally moves with the harness's own 30 s print timeout, which is exactly why the bound is pinned by fixtures instead of being measured by fuzz |
| `verify-regex-differential` | `VERIFY_REGEX 78/78` (40 fixtures; 10 assert *refusal*, not rewrite) |
| `verify-regex-property` (default) | `629/629` |
| wide property sweep, 7 seeds × 6,000 random patterns | `39,556 / 39,556` — 12,423 patterns rewritten and compared byte-for-byte against native `RegExp` (exec, repeated exec, `matchAll` loop, `match`, `replace` with function and `$<name>` templates, `split`, `search`, `test`, `src`/`flags`/`toString`/`dotAll`/`indices`), 24,459 refused with an enumerated reason, 2,444 skipped because the generated pattern is rejected by native too |
| `compat-runtime-es5-floor` | PASS — `acorn.parse(runtime, {ecmaVersion: 5})` succeeds on the shipped runtime bytes |
| `fixture-es2017-parse-*` | PASS — every emitted file parses at ES2017 (the real FF52 floor), and the loader at ES5 |
| `compat-layer-end-to-end` | PASS — one source compiled twice, once against native `BigInt`, once against `__bi` with `BigInt` **deleted from the VM context**, producing an identical 13-field output string (`>>`, `+`, `Number`, `%`, `>`, `toString(16)`, unary `-`, `&`, `== BigInt("…")`, truthiness, `String()`, the Vencord camelCase splitter, a lookbehind `replace`) |
| `corejs-still-lacks-bigint` | PASS — the fixture loads the pinned core-js bundle in a BigInt-free context and asserts the global is still absent, so the shim is not silently redundant or silently bypassed |
| gate fixtures | `transpile-gate-*`, `compatibility-*`, `receipt-gate-*`, `receipt-refuses-bundle-without-compat`, `compatibility-no-partial-publish-*` all PASS |
| `node tools/test-all.ts` | `TEST_ALL=PASS` (32 tool syntax checks, MASTER JSON parse, one-link suite) |
| `node tools/lion-one-test.ts` | `ONE_TEST=PASS` |

## What the fuzzers caught that the fixtures did not

Recorded because it is the argument for the method, not a list of shames:

- `(-1n) ** 9007199254740993n` returned `+1`: the base-±1 fast path read the exponent through a `Number`, and 2^53+1 does not survive that round trip. Parity is now taken from digit space (`getBitD`).
- Branch-mode rewrites dropped `.`→`[\s\S]` inside each alternative while still removing the `s` flag, so `/(?<=a|b)..|0/s` matched *less* than the original. `editsWithin` now applies every whole-pattern edit per branch.
- `String.prototype.split` does not route through the overridden `exec` in V8 — the wrapper has to own `Symbol.split`, and its zero-width-match boundary (`"abc".split(/(?:)/)` → `["a","b","c"]`, no leading `""`) is engine-specific.
- `\k<m>1` → `\11` would silently merge into a different backreference. Now refused as `regex-named-backref-ambiguity`.
- `matchAll` clones via `SpeciesConstructor`, which would hand back a RegExp without the `__rx` constraints. Refused as `regex-clone-unsafe` whenever a rewrite is needed and the file touches `matchAll`.
- `exec` must set `lastIndex = index + length` with **no** `+1` for empty matches, and `match.groups` must be `Object.create(null)`.

## Not claimed (explicit)

1. **No GitHub Actions run was dispatched** and **no release/bundle was published** — operator directive.
2. **No target receipt exists for this layer.** Everything above is node-vs-shim differential evidence on the sandbox CPU, not Arctic Fox 47.3 on the Mac. The compile gate stays `COMPILE_GATE=HOLD`.
3. **The 209 / 184 per-app hazard counts were NOT recomputed here.** This sandbox cannot fetch the app: `raw.githubusercontent.com` returns HTTP 000 over TLS and `gh api repos/Vencord/builds/...` answers `401 Bad credentials` for third-party repos. Recomputing those counts against a real fetch is exactly what `COMPATIBILITY.json` is for, and it requires the CI run that is on hold. Until then the numbers remain the 16g/16h discovery figures, not a v4 result.
4. **Behaviour past 65,536 result bits is a declared shim limit**, not JS semantics: the shim throws `RangeError('Maximum BigInt size exceeded')` where V8 keeps computing (and a squaring loop at that width would hang 2013 hardware anyway). Power-of-two bases and shifts are exact to 4,194,304 bits. The bound is asserted by fixtures, and `x ** y ** z` chains beyond it are excluded from the fuzz score rather than waved through.
5. **`d` + real `.indices` consumption** is only handled by rewriting `d` away when `.indices` is unread; an app that reads `m.indices` gets a refusal, not an approximation.
6. `auditEs5` is an AST scan of emitted output; it is a floor check for accidental modern syntax and residual `BigInt` references, not a proof of runtime equivalence by itself.

## Decisions taken without the operator (the two questions were skipped)

1. **Sync the burn artifact to v4 instead of leaving a red suite.** `tools/lion-one-test.ts` asserts the artifact corpus byte-equals `tools/mac-es5-passthrough.ts` `instructions`; that was unsatisfiable while the corpus moved v3→v4. `lion-compiler-context.command`, `lion-one.html`, `etc/lion-command.txt` and `lion-one.zip` were re-pinned to corpus `2026-09-16i-v4`, `CORPUS_SHA_EXPECTED=271318b1ef24e8d02d7dcdf835ea130b9c31a9ac57c92f2b1d5af561434dafd2`. The apostrophes that made three corpus entries unsafe for a single-quoted shell assignment are now carried as `'\''`, so the decoded corpus still hashes correctly. `COMPILE_GATE=HOLD` is preserved verbatim; only its stated *reason* changed, because "BigInt and regex support unverified" is no longer the true reason.
2. **The regex evidence bar is differential + refusal.** A rewrite that matches less is a silent app failure on a machine that cannot be re-flashed from a console; so the bar became "byte-identical observable behaviour across `exec`/`match`/`matchAll`/`replace`/`split`/`search`/`test` for every pattern we *do* accept, and an enumerated refusal for every pattern we don't" — with the refusal kinds themselves treated as the audit surface.

## Artifact hashes (this turn)

> Superseded for the corpus/artifact rows by
> `receipts/mac-es5/2026-09-16j-vencord-v4-census/`: the corpus moved to `2026-09-16j-v5`
> (`d94486672b9a`) after the analyzer fixes the real-bundle census required, so the zip and page shas below
> are the state as of this receipt, not as of now. `tools/lib/es5-compat-runtime.js` is unchanged
> (`8f3bbc53d268`) and the fixture/fuzz totals below predate the web-compat grammar rules. The compat
> runtime and its ES5-floor audit are unaffected.

| File | sha256 |
|---|---|
| `lion-one.zip` | `f0ffceb2536a5646df48480567f10f1f0c0b6327def8e559bd30d4bf92ce90dd` |
| `lion-compiler-context.command` | `8409df6471ef8464266fb7fe6f31d0a000ac91b74cf790648169914dc851f594` |
| `etc/lion-command.txt` | `e56252a2cd00d525a61cbff4da6819f9f0ba7ad76c7d8f25a90f016a064018d7` |
| `tools/lib/es5-compat-runtime.js` | `8f3bbc53d268304ff5b363a4ee30ffd20b5700b59be3b5b13d1da21f070a4bab` |
| `tools/lib/es5-compat.ts` | `9bc50d60e756348a98840602ed887779d555276aca5ff1430dfd316c5b2105d4` |
| `tools/mac-es5-passthrough.ts` | `f113156d120f0b0927bb2cfcab5d681e918889c2af9b81b25b174209a6d13f93` |

Corpus burned on the Mac remains `2026-09-16g-v2` / `8583a1cbf2ca…` (v3 artifact `17c6a29a052e…`); nothing has been re-burned for v4 — that is the next wave, and it is the operator's to trigger.

## Reproduce

One command per line, nothing chained, safe to paste in the repo root:

```
npm i --no-save --no-package-lock @babel/core@7.29.7 @babel/preset-env@7.29.7 core-js-bundle@3.50.0 acorn@8.18.0
node tools/mac-es5-passthrough.ts selftest --compiler
node tools/mac-es5-passthrough.ts selftest --compiler --cases=12000
node tools/lion-one-test.ts
node tools/test-all.ts
node tools/pr-budget.ts main 405
```

## Next, in order (operator actions marked ★)

1. ★ Dispatch `mac-es5-passthrough` with `publish: false` so `COMPATIBILITY.json` is produced against the real Vencord/discord assets — this is the only way to recompute the 209/184 class counts.
2. ★ Compile a v4 bundle for Arctic Fox, burn it on the Mac through `da.gd/lionone`, and return the on-target receipt (loader boot, `compat.js` present, no `TypeError` at module init).
3. Then, and only then, retire `COMPILE_GATE=HOLD` in the corpus and re-pin the artifact.
4. ★ Merge decision for PR #89 / this branch is operator-only; the branch is pushed for review, never merged by the agent.
5. Budget: this change is far beyond the 405-line PR budget (`node tools/pr-budget.ts main 405` prints the number this turn) → an explicit operator override is required before any merge, or the compat layer must be split across PRs.
