#!/bin/sh
# lion-compiler-context.command - one downloadable script that carries the ES5
# passthrough compiler instruction sets + full context to the Lion Mac, drops
# them on the Desktop as usable files, and burns a COMPILERCTX1 receipt through
# the One page. Read-only except the Desktop writes. No sudo, no network.

CORPUS_SHA_EXPECTED="d94486672b9a93cda8b7845a7129c929b51c03f90b7bbf2bcf7e1d66327487b0"

CORPUS='{"version":"2026-09-16j-v5","common":["target floor: firefox 52 (Arctic Fox 47 Goanna parse class) via @babel/preset-env, modules:false - syntax lowering only, no module wrapping","polyfill prelude: core-js-bundle full build loads FIRST in loader.html (polyfill.js before every es5-*.js); order is load-bearing","no unverified behavior rewrites: a shim may only change what it has a VERIFIED implementation for (BigInt via __bi, post-FF52 regex via __rx); everything else is transpile + polyfill only. Every semantic shim needs its own instruction entry plus a receipt citation, and no silent behavior changes, ever","node --check proves current Node syntax ONLY, not FF52 runtime. COMPATIBILITY.json records the compat layer'\''s counts, notes and unresolved hazards; BLOCKED or INCOMPLETE aborts transpile/receipt before publication, and receiptDir refuses a bundle with no compat.js. UNVERIFIED now means: every known BigInt/regex construct in this file was resolved by the verified compat runtime - the target'\''s runtime is still only proven by a burn receipt, never by a green compile","loader.html stays ES5-only: no module scripts, no arrow/const/let/template literals in emitted loader (selftest loader-es5-only)","preset-env targets FF52 for supported syntax transforms, not missing Web APIs. Dynamic import with modules:false and module workers remain unverified; no universal modern-app compatibility claim","hazard Web Workers with type module: unsupported on FF52-class; v1 = detection + KNOWN_LIMITATION in the burn receipt only, never silently drop workers","hazard WebCrypto crypto.subtle: absent outside secure contexts on FF52-class; apps gating login on it stall BY DESIGN - route real sessions to Chromium Legacy LION primary path (docs/mac-modern-web.md)","polyfill gaps NOT covered by core-js (shim candidates, none auto-added in v1): ResizeObserver, TextEncoder/TextDecoder webcompat gaps, IntersectionObserver (FF55+)","BigInt (2026-09-16i): core-js-bundle 3.50.0 does NOT supply BigInt when the engine has none, so the bundle ships tools/lib/es5-compat-runtime.js as compat.js. __bi is a real arbitrary-precision integer implementation (sign + base-2^15 magnitude digits; add/sub/mul/div/mod/pow/bitwise/shift/comparisons/toString(radix)/asIntN/asUintN, and __bi.BigInt mirrors the global BigInt including its SyntaxError/RangeError/TypeError cases and the bigint+String concatenation rule). Babel 7.29.7 stores BigIntLiteral digits in node.value and has no node.bigint - reading the wrong field is what emitted BigInt('\''undefined'\'') in v2. Operators are lowered to __bi.* calls that DISPATCH on their operands, so conservative bigint inference can corrupt nothing: a Number operand keeps the native result and a mixed operand keeps the native TypeError. Verified by differential fuzz against this machine'\''s native BigInt with BigInt deleted from the sandbox context (node tools/mac-es5-passthrough.ts selftest --compiler); provenance: receipts/mac-es5/2026-09-16h-burn-verification/PREFLIGHT.txt, core-js.io/docs/missing-polyfills, receipts/mac-es5/2026-09-16i-compat-verification/","babel major pinned to ^7 in ci + local (2026-09-16g): babel 8 raised its output baseline experiment differed and pinning keeps local vs CI receipts comparable; receipt 2026-09-16g local compile","post-FF52 regex literals (2026-09-16i): each literal is parsed by tools/lib/es5-compat.ts and REWRITTEN into the FF52 grammar instead of deferred into a runtime throw. dotAll: '\''.'\'' outside a class becomes [\\\\s\\\\S] and the s flag is dropped (exact equivalence: with s, '\''.'\'' is every code unit). Named groups are renumbered to capture groups with a name->index map so match.groups keeps working through __rx, and $<name> in a literal replacement string becomes $n. The d flag is dropped when match.indices is never read in the file. Leading lookbehinds are removed from the pattern and enforced by __rx, a real RegExp whose exec (and Symbol.split) test the fixed-width window ending at the match start; differing per-branch constraints split the alternation into per-branch matchers with leftmost-wins selection, which is how native alternation preference works. Anything the rewriter cannot express stays a BLOCKED hazard quoting the exact pattern: variable-width lookbehind, mid-pattern lookbehind, lookbehind body that captures or anchors, lookbehind with m, \\\\p{...} property escapes, d with match.indices consumed. Rewrites are proved by differential fuzz against native RegExp over REGEX_FIXTURES (exec/global loop/match/replace/replace-fn/$<name>/split/search/test), same command. Discovery receipt 2026-09-16g: Vencord 1.15.6 camelCase splitter /(?=[A-Z][a-z])|(?<=[a-z])(?=[A-Z])/ at es5 line 2240 - now resolved by branch mode","compat runtime floor: compat.js is tools/lib/es5-compat-runtime.js copied verbatim into every bundle and loaded polyfill.js -> compat.js -> es5-*.js, because __bi/__rx must exist before the first app statement runs. Its own floor is enforced, not assumed: auditEs5 parses it at acorn ecmaVersion 5 and rejects identifiers/methods that a Firefox-52-class engine does not have (BigInt, globalThis, structuredClone, WeakRef, .flatMap, .matchAll, .replaceAll, .hasOwn, ...), and COMPATIBILITY.json records its sha256 plus the audit result. The emitted bundle therefore depends on no engine feature newer than the target except the ones core-js polyfills","present on FF52, no action needed: fetch, WebSocket, localStorage, IndexedDB, Promise, Map/Set","SRI integrity attributes and CSP meta from discovered shells are NOT ported to loader.html by design (local same-origin bundle)","script order = discovery order (webpack chunk dependencies); never sort assets alphabetically","FF52 web-compat regex grammar rules implemented in the analyzer (2026-09-16j): a brace that does not form a quantifier is a LITERAL outside unicode mode, identity escapes are restricted only in unicode mode, duplicate group names and dangling numeric/named backrefs are refused, and the matchAll / RegExp(re) clone hazard is decided per regex object by where that object flows - not by whether the file mentions matchAll. On the real Vencord bundle these two rules were 219 of 279 reported hazards, i.e. tooling strictness, not FF52 limits.","first v4 census of a real app (2026-09-16j, run in-sandbox against the exact 2026-09-16g source bytes: Vencord 1.15.6 Vencord.user.js sha256 325bb7568d1fdc790d996387c51f6155edb2ee7ffd4dc710681d9dfcea44210d): 209/209 BigInt literals lowered through 2018 operator sites, 595 regex literals, 3 rewritten, 181 hazards left = 51 mid-pattern lookbehind + 41 variable-width lookbehind + 11 capture inside lookbehind + 2 unicode-property + 76 clone-visible. App publication stays BLOCKED; the next implementation step is bounded-range lookbehind windows (?<=x.{0,40}y) which clears the 41 class. Receipt: receipts/mac-es5/2026-09-16j-vencord-v4-census/","corpus is versioned and sha256-hashed into RECEIPT-INDEX.json (instructions_sha256); every new hazard/shim lands as an entry here with its receipt citation"],"apps":{"discord-web":["discovery: <script src=...js...> on the https://discord.com/app shell; relative urls absolutized against https://discord.com","keep ALL discovered chunks in v1 (empty drop list); a drop entry requires a burn receipt proving the chunk is fatal","discord shell expects globalThis plus webpack chunk registry; polyfill.js supplies globalThis before chunks load","expected stall point: login/QR flows lean on WebCrypto + modern TLS UI = KNOWN_LIMITATION on Arctic Fox; burn a description via da.gd/lionone and use Chromium Legacy for real sessions"],"vencord-web":["single userscript bundle transpiled as-is; the // ==UserScript== metadata header MUST survive transpile - assert emitted file still opens with the header before publish","vencord injects into discord web at runtime: pair with the discord-web bundle on Arctic Fox, or use Violentmonkey + the vencord.dev userscript on Chromium Legacy (primary path)","plugin sub-fetches at runtime are NOT bundled in v1; a plugin fetching ES2020 code at runtime = KNOWN_LIMITATION entry until a fetch-hook shim exists","vencord-web bigint+regex budget (2026-09-16i): the 209 BigInt literals and 184 post-FF52 regex hazards recorded by the 2026-09-16g local compile are exactly the two classes this corpus resolves; the numbers are recomputed per run from COMPATIBILITY.json counts (bigintLowered/bigintLiterals, regexRewritten/regexLiterals), and any construct the rewriter refuses lands in hazards with its pattern quoted. A CI run is still required to publish: the sandbox cannot reach vencord.dev (HTTP 000), so canonical bytes and their sha256 come only from the fetch step"]}}'

HOME_DIR="$HOME"
OUT="$HOME_DIR/Desktop/lion-compiler-context.txt"
JOUT="$HOME_DIR/Desktop/passthrough-INSTRUCTIONS.json"
COUT="$HOME_DIR/Desktop/passthrough-CONTEXT.txt"

CORPUS_SHA_COMPUTED="unavailable-no-shasum"
if command -v shasum > /dev/null 2>&1; then
  CORPUS_SHA_COMPUTED=$(printf '%s' "$CORPUS" | shasum -a 256 | cut -d ' ' -f 1)
fi
if [ "$CORPUS_SHA_COMPUTED" = "$CORPUS_SHA_EXPECTED" ]; then
  VERDICT="CORPUS_SHA=MATCH"
else
  VERDICT="CORPUS_SHA=MISMATCH computed=$CORPUS_SHA_COMPUTED"
fi

printf '%s\n' "$CORPUS" > "$JOUT"

cat > "$COUT" <<'CTX'
ES5 PASSTHROUGH COMPILER CONTEXT (corpus 2026-09-16j-v5) - Lion Mac companion.
What this is: the instruction sets + doctrine for the agentic ES5 compiler
passthrough (tools/mac-es5-passthrough.ts in the repo). It transpiles modern
web app bundles down to what Arctic Fox 47.3 (Firefox-52-class Goanna) can
parse, attaches a core-js polyfill prelude, and emits an ES5 loader page.

FLOOR DOCTRINE:
- targets firefox 52 via @babel/preset-env, modules:false - syntax lowering
  only, no module wrapping, no behavior rewrites.
- preset-env lowers ONLY what FF52 lacks. Arrows/classes/templates/
  destructuring are native on FF52 and legitimately remain in output; the
  parse floor is ES2017-class, NOT literal ES5. Gate: acorn ecmaVersion 2017
  parse PASS on emitted bytes (2026-09-16g first compile: PASS).
- polyfill prelude order is load-bearing: polyfill.js (core-js-bundle full
  build) loads FIRST in loader.html, before every es5-*.js.
- loader.html stays ES5-only: no module scripts, no arrow/const/let/template
  literals in the loader itself.

SHIMS + PRECOMPILE HOLD (v3 correction after the v2 burn):
- v2 corpus receipt CORPUS_SHA=MATCH was received 2026-09-16. That proved
  delivery, NOT runtime compatibility or an app compilation.
- BigInt conversion must read Babel node.value. v2 read node.bigint and
  incorrectly emitted BigInt("undefined"). The conversion is now fixed.
- core-js-bundle 3.50.0 does NOT supply BigInt without native support.
  The first Vencord compile contained 209 BigInt literals; a semantic
  implementation is still required, not just a syntax rewrite.
- post-FF52 regex literals were moved into new RegExp calls. This does NOT
  implement unsupported regex semantics; an exception may occur at module
  initialization, not merely when an optional plugin is used.
- v3 writes COMPATIBILITY.json and refuses compilation/publication when
  BigInt or deferred-regex hazards remain. Other output is UNVERIFIED,
  never a runtime PASS from node --check alone.
- Evidence: receipts/mac-es5/2026-09-16h-burn-verification/PREFLIGHT.txt.
  Regression command: node tools/mac-es5-passthrough.ts selftest --compiler.

v4 - THE SEMANTIC LAYER NOW EXISTS AND IS VERIFIED OFF-TARGET:
- BigInt is no longer a hoped-for polyfill. tools/lib/es5-compat-runtime.js ships __bi, an ES5
  arbitrary-precision implementation; the compiler lowers BigInt literals AND every operator that can
  involve one into __bi calls. Verified by differential fuzz against native BigInt: 119,555 of 119,568
  expressions identical (the 13 are results past the shim's declared 65,536-bit width, where it throws
  RangeError instead of grinding on 2013 hardware - asserted, not assumed, in the same run).
- FF52-hostile regex is rewritten to the FF52 grammar and, where FF52 cannot express the constraint
  (variable-width lookbehind, mid-pattern lookbehind, per-branch differences), wrapped in __rx which
  enforces it. Verified 78 fixtures + 39,656 random patterns differentially against native RegExp;
  anything unexpressible REFUSES publication instead of shipping a weakened match.
- Both layers are copied into every bundle as compat.js, loaded between polyfill.js and the es5-*.js
  chunks; a receipt is refused for a bundle without compat.js.
- THIS IS OFF-TARGET VERIFICATION ONLY. The gate stays HOLD until a bundle is compiled with the v4
  corpus, loaded in Arctic Fox on the Mac, and receipts land back in the repo.
  Evidence: receipts/mac-es5/2026-09-16i-compat-verification/REPORT.md.
- polyfill gaps NOT covered by core-js (shim candidates, none auto-added):
  ResizeObserver, TextEncoder/TextDecoder webcompat gaps, IntersectionObserver.
- present on FF52, no action needed: fetch, WebSocket, localStorage,
  IndexedDB, Promise, Map/Set.
- Web Workers with type module unsupported on FF52-class: detection +
  KNOWN_LIMITATION in burn receipt only, never silently dropped.
- WebCrypto crypto.subtle absent outside secure contexts: apps gating login
  on it stall BY DESIGN - real sessions route to Chromium Legacy LION
  (primary modern engine, docs/mac-modern-web.md).

PROVENANCE + PROMOTION:
- every fetch cites sha256 per asset (FETCH.json); first local compile used
  the first-party mirror github.com/Vencord/builds@8a2b56ed (canonical
  vencord.dev unreachable from the sandbox; CI re-fetches canonical).
- Babel pinned @^7 in ci + local for receipt parity.
- candidate apps (youtube-web, soundcloud-web) join the registry ONLY after a
  green fetch+transpile CI receipt; growth = new instruction entry HERE plus
  a receipt citation; corpus version + sha256 ride in every RECEIPT-INDEX.

HOW THIS MAC USES IT:
- the Desktop files this script writes (passthrough-INSTRUCTIONS.json and
  this CONTEXT) are the offline compiler memory: any future bundle burn or
  Arctic Fox/Violentmonkey session cites corpus version + sha.
- bundles themselves arrive as a public release zip once the CI workflow is
  repaired (workflow ACTIVE, but installed template is old and has zero runs);
  do NOT run the old installed workflow. Chromium Legacy was not found by
  the /Applications probe; its separate install/runtime wave remains open.
- receipt loop: burn ~/Desktop/lion-compiler-context.txt through the One page
  (pick the txt, press Burn) - full text goes straight to the model. No
  merge, no pull request, nothing to type.

These instructions document the compiler; exporting them does not execute or
train Babel. Source code in tools/mac-es5-passthrough.ts controls transforms.

STILL FORBIDDEN: no erase of the boot volume start disk clone, Lion SSD Base
or any RAID member. Old wipe wave SUSPENDED after the fresh root-mount receipt.
No sudo or network from channel scripts; no target compile released yet.
CTX

ARCTIC="absent"
if ls /Applications 2>/dev/null | grep -i ArcticFox.app > /dev/null 2>&1; then
  ARCTIC="present"
fi
CHROM="absent"
if ls /Applications 2>/dev/null | grep -i Chromium > /dev/null 2>&1; then
  CHROM="present"
fi

{
  echo "COMPILERCTX1 compiler context receipt"
  echo "date: $(date)"
  echo "host: $(hostname)"
  echo "sw_vers: $(sw_vers -productVersion)"
  echo "arcticfox: $ARCTIC"
  echo "chromium-legacy: $CHROM"
  echo "CORPUS_VERSION=2026-09-16j-v5"
  echo "CORPUS_SHA_EXPECTED=$CORPUS_SHA_EXPECTED"
  echo "$VERDICT"
  echo "desktop files: passthrough-INSTRUCTIONS.json + passthrough-CONTEXT.txt"
  echo "COMPILE_GATE=HOLD no bundle compiled with the v4 corpus has run on the target yet"
  echo "receipt loop: pick this txt on the One page and press Burn - full text"
  echo "goes straight to the model. No merge, no pull request."
  echo "No disk was erased. No sudo, no network."
  echo "COMPILERCTX1_DONE"
} > "$OUT"

open "$OUT"
exit 0
