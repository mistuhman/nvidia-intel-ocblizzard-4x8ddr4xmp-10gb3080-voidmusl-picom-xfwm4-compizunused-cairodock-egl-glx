#!/bin/sh
# lion-compiler-context.command - one downloadable script that carries the ES5
# passthrough compiler instruction sets + full context to the Lion Mac, drops
# them on the Desktop as usable files, and burns a COMPILERCTX1 receipt through
# the One page. Read-only except the Desktop writes. No sudo, no network.

CORPUS_SHA_EXPECTED="8583a1cbf2ca700725b50f973843e03ffd46a6dab1a70ab4a825d58de0899372"

CORPUS='{"version":"2026-09-16g-v2","common":["target floor: firefox 52 (Arctic Fox 47 Goanna parse class) via @babel/preset-env, modules:false - syntax lowering only, no module wrapping","polyfill prelude: core-js-bundle full build loads FIRST in loader.html (polyfill.js before every es5-*.js); order is load-bearing","no behavior rewrites: transpile + polyfill only; any semantic shim requires its own instruction entry plus a receipt citation","syntax gate: node --check per emitted .js; any FAIL aborts the run before publish (RECEIPT.json syntax=OK rows are the proof)","loader.html stays ES5-only: no module scripts, no arrow/const/let/template literals in emitted loader (selftest loader-es5-only)","hazard ES2020+ (optional chaining, nullish coalescing, class fields, dynamic import): preset-env lowers for ff52; assert emitted bytes carry no import( or ?. leftovers; burn a receipt if an app stalls here","hazard Web Workers with type module: unsupported on FF52-class; v1 = detection + KNOWN_LIMITATION in the burn receipt only, never silently drop workers","hazard WebCrypto crypto.subtle: absent outside secure contexts on FF52-class; apps gating login on it stall BY DESIGN - route real sessions to Chromium Legacy LION primary path (docs/mac-modern-web.md)","polyfill gaps NOT covered by core-js (shim candidates, none auto-added in v1): ResizeObserver, TextEncoder/TextDecoder webcompat gaps, IntersectionObserver (FF55+)","hazard BigInt literals (ES2020 syntax, FF68+): preset-env cannot lower the syntax; shimmed since 2026-09-16g-v2 as BigIntLiteral -> BigInt(\"<digits>\") call; core-js-bundle full build supplies global BigInt on FF52. CAVEAT: core-js is a ponyfill and cannot fix === reference equality between polyfilled values - runtime comparisons of polyfilled BigInts stay KNOWN_LIMITATION until an on-Mac burn receipt rules otherwise. Discovery receipt: 2026-09-16g local compile, Vencord 1.15.6 bundle carried 209 snowflake BigInt literals","babel major pinned to ^7 in ci + local (2026-09-16g): babel 8 raised its output baseline experiment differed and pinning keeps local vs CI receipts comparable; receipt 2026-09-16g local compile","hazard post-FF52 regex literals (lookbehind (?<= / (?<!, named groups (?<name>, dotAll s, hasIndices d): parse-fatal on FF52; shimmed since 2026-09-16g-v2 as deferred new RegExp(src,flags) construction - the bundle parses, a throw is deferred to first execution of that code path = KNOWN_LIMITATION until burn receipt. Discovery receipt: 2026-09-16g local compile, Vencord 1.15.6 camelCase splitter /(?=[A-Z][a-z])|(?<=[a-z])(?=[A-Z])/ at es5 line 2240","present on FF52, no action needed: fetch, WebSocket, localStorage, IndexedDB, Promise, Map/Set","SRI integrity attributes and CSP meta from discovered shells are NOT ported to loader.html by design (local same-origin bundle)","script order = discovery order (webpack chunk dependencies); never sort assets alphabetically","corpus is versioned and sha256-hashed into RECEIPT-INDEX.json (instructions_sha256); every new hazard/shim lands as an entry here with its receipt citation"],"apps":{"discord-web":["discovery: <script src=...js...> on the https://discord.com/app shell; relative urls absolutized against https://discord.com","keep ALL discovered chunks in v1 (empty drop list); a drop entry requires a burn receipt proving the chunk is fatal","discord shell expects globalThis plus webpack chunk registry; polyfill.js supplies globalThis before chunks load","expected stall point: login/QR flows lean on WebCrypto + modern TLS UI = KNOWN_LIMITATION on Arctic Fox; burn a description via da.gd/lionone and use Chromium Legacy for real sessions"],"vencord-web":["single userscript bundle transpiled as-is; the // ==UserScript== metadata header MUST survive transpile - assert emitted file still opens with the header before publish","vencord injects into discord web at runtime: pair with the discord-web bundle on Arctic Fox, or use Violentmonkey + the vencord.dev userscript on Chromium Legacy (primary path)","plugin sub-fetches at runtime are NOT bundled in v1; a plugin fetching ES2020 code at runtime = KNOWN_LIMITATION entry until a fetch-hook shim exists"]}}'

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
ES5 PASSTHROUGH COMPILER CONTEXT (corpus 2026-09-16g-v2) - Lion Mac companion.
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

SHIMS (semantic, documented, receipted):
- BigInt literals (ES2020, FF68+, parse-fatal on FF52) rewritten to
  BigInt("<digits>"); core-js-bundle supplies global BigInt. CAVEAT: core-js
  is a ponyfill and cannot fix === reference equality between polyfilled
  values - KNOWN_LIMITATION until an on-Mac burn receipt rules otherwise.
  First compile (Vencord 1.15.6) carried 209 snowflake BigInt literals.
- post-FF52 regex literals (lookbehind (?<= / (?<!, named groups (?<name>,
  dotAll s, hasIndices d) rewritten to deferred new RegExp(src, flags) so the
  bundle parses; a throw defers to first execution of that code path -
  KNOWN_LIMITATION until burn receipt. First compile: 184 such literals.
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
  activated (operator-credential path, docs/mac-modern-web.md Trigger path);
  until then Vencord primary path = Violentmonkey + the vencord.dev userscript
  on Chromium Legacy.
- receipt loop: burn ~/Desktop/lion-compiler-context.txt through the One page
  (pick the txt, press Burn) - full text goes straight to the model. No
  merge, no pull request, nothing to type.

STILL FORBIDDEN on this Mac: no erase of Lion SSD Base or RAID members, no
sudo from channel scripts, no network from channel scripts.
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
  echo "CORPUS_VERSION=2026-09-16g-v2"
  echo "CORPUS_SHA_EXPECTED=$CORPUS_SHA_EXPECTED"
  echo "$VERDICT"
  echo "desktop files: passthrough-INSTRUCTIONS.json + passthrough-CONTEXT.txt"
  echo "receipt loop: pick this txt on the One page and press Burn - full text"
  echo "goes straight to the model. No merge, no pull request."
  echo "No disk was erased. No sudo, no network."
  echo "COMPILERCTX1_DONE"
} > "$OUT"

open "$OUT"
exit 0
