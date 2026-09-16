#!/bin/sh
# lion-compiler-context.command - one downloadable script that carries the ES5
# passthrough compiler instruction sets + full context to the Lion Mac, drops
# them on the Desktop as usable files, and burns a COMPILERCTX1 receipt through
# the One page. Read-only except the Desktop writes. No sudo, no network.

CORPUS_SHA_EXPECTED="17c6a29a052ec7632064a56948874ef22b45ea5717a9b779e366407d5e1e5a7a"

CORPUS='{"version":"2026-09-16h-v3","common":["target floor: firefox 52 (Arctic Fox 47 Goanna parse class) via @babel/preset-env, modules:false - syntax lowering only, no module wrapping","polyfill prelude: core-js-bundle full build loads FIRST in loader.html (polyfill.js before every es5-*.js); order is load-bearing","no behavior rewrites: transpile + polyfill only; any semantic shim requires its own instruction entry plus a receipt citation","node --check proves current Node syntax ONLY, not FF52 runtime. COMPATIBILITY.json records known blockers; BLOCKED or INCOMPLETE aborts transpile/receipt before publication. Other output remains runtime UNVERIFIED until target receipts","loader.html stays ES5-only: no module scripts, no arrow/const/let/template literals in emitted loader (selftest loader-es5-only)","preset-env targets FF52 for supported syntax transforms, not missing Web APIs. Dynamic import with modules:false and module workers remain unverified; no universal modern-app compatibility claim","hazard Web Workers with type module: unsupported on FF52-class; v1 = detection + KNOWN_LIMITATION in the burn receipt only, never silently drop workers","hazard WebCrypto crypto.subtle: absent outside secure contexts on FF52-class; apps gating login on it stall BY DESIGN - route real sessions to Chromium Legacy LION primary path (docs/mac-modern-web.md)","polyfill gaps NOT covered by core-js (shim candidates, none auto-added in v1): ResizeObserver, TextEncoder/TextDecoder webcompat gaps, IntersectionObserver (FF55+)","BigInt correction (2026-09-16h): core-js-bundle 3.50.0 does NOT supply BigInt when native support is absent. Babel BigIntLiteral stores digits in node.value, not node.bigint; v2 emitted BigInt(\"undefined\"). Conversion fixed, but FF52 publication stays BLOCKED for BigInt or deferred regex hazards until a semantic implementation is verified. Repro: receipts/mac-es5/2026-09-16h-burn-verification/PREFLIGHT.txt; core-js.io/docs/missing-polyfills","babel major pinned to ^7 in ci + local (2026-09-16g): babel 8 raised its output baseline experiment differed and pinning keeps local vs CI receipts comparable; receipt 2026-09-16g local compile","hazard post-FF52 regex literals (lookbehind (?<= / (?<!, named groups (?<name>, dotAll s, hasIndices d): parse-fatal on FF52; shimmed since 2026-09-16g-v2 as deferred new RegExp(src,flags) construction - the bundle parses, a throw can occur immediately at module initialization. v3 BLOCKS publication of these unverified rewrites instead of treating parse success as runtime success. Discovery receipt: 2026-09-16g local compile, Vencord 1.15.6 camelCase splitter /(?=[A-Z][a-z])|(?<=[a-z])(?=[A-Z])/ at es5 line 2240","present on FF52, no action needed: fetch, WebSocket, localStorage, IndexedDB, Promise, Map/Set","SRI integrity attributes and CSP meta from discovered shells are NOT ported to loader.html by design (local same-origin bundle)","script order = discovery order (webpack chunk dependencies); never sort assets alphabetically","corpus is versioned and sha256-hashed into RECEIPT-INDEX.json (instructions_sha256); every new hazard/shim lands as an entry here with its receipt citation"],"apps":{"discord-web":["discovery: <script src=...js...> on the https://discord.com/app shell; relative urls absolutized against https://discord.com","keep ALL discovered chunks in v1 (empty drop list); a drop entry requires a burn receipt proving the chunk is fatal","discord shell expects globalThis plus webpack chunk registry; polyfill.js supplies globalThis before chunks load","expected stall point: login/QR flows lean on WebCrypto + modern TLS UI = KNOWN_LIMITATION on Arctic Fox; burn a description via da.gd/lionone and use Chromium Legacy for real sessions"],"vencord-web":["single userscript bundle transpiled as-is; the // ==UserScript== metadata header MUST survive transpile - assert emitted file still opens with the header before publish","vencord injects into discord web at runtime: pair with the discord-web bundle on Arctic Fox, or use Violentmonkey + the vencord.dev userscript on Chromium Legacy (primary path)","plugin sub-fetches at runtime are NOT bundled in v1; a plugin fetching ES2020 code at runtime = KNOWN_LIMITATION entry until a fetch-hook shim exists"]}}'

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
ES5 PASSTHROUGH COMPILER CONTEXT (corpus 2026-09-16h-v3) - Lion Mac companion.
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
  echo "CORPUS_VERSION=2026-09-16h-v3"
  echo "CORPUS_SHA_EXPECTED=$CORPUS_SHA_EXPECTED"
  echo "$VERDICT"
  echo "desktop files: passthrough-INSTRUCTIONS.json + passthrough-CONTEXT.txt"
  echo "COMPILE_GATE=HOLD BigInt and regex runtime support unverified"
  echo "receipt loop: pick this txt on the One page and press Burn - full text"
  echo "goes straight to the model. No merge, no pull request."
  echo "No disk was erased. No sudo, no network."
  echo "COMPILERCTX1_DONE"
} > "$OUT"

open "$OUT"
exit 0
