# Mac modern web — Chromium Legacy vs ES5 passthrough vs parked (2026-09-16f)

Operator directive 2026-09-16f: "for those unsupported apps, make a repo workflow (easy to
compile from phone) that runs an agentic compiler passthrough for the mac so we can have fast
(chromium? any other alternatives?) webpage apps like vencord etc." This doc ranks every route
with receipts and defines the passthrough workflow + its receipt loop. Machine: Mac Pro 3,1,
Lion 10.7.5, x86_64 (64-bit kernel capable), GTX 285.

## 1. Ranking

| Rank | Route | Verdict | Receipt |
|---|---|---|---|
| 1 | **Chromium Legacy (blueboxd/chromium-legacy)** — community Chromium fork with dedicated **LION builds**: release tags `121.0.6167.160.1-stable.lion`, `121.0.6167.139.1-stable.lion`, `120.0.6099.199.1-stable.lion` (x86_64); newer legacy builds 124-127 for 10.9+; macintoshrepository mirrors `chromium_legacy.zip` build 1260910 (2024) claiming 10.7-10.14, SHA1 cdbf14b42dea1a5e049069b41e063401f1c6a901 | PRIMARY: a Chromium-120/121-class engine ON LION = Discord web, Vencord userscript, YouTube, SoundCloud, modern uBlock Origin all native. Last Google Chrome for 10.7-era was v49 (2016, dead) - Chromium Legacy is what supersedes it | github.com/blueboxd/chromium-legacy/releases (fetched 2026-09-16f: lion tags present); macintoshrepository.org/81376-chromium-legacy (10.7-10.14, SHA1 above); Chrome-49-cutoff: apple.stackexchange.com/questions/237271 |
| 2 | **Arctic Fox 47.3 + this repo's ES5 passthrough** (ci/workflows/mac-es5-passthrough.yml) | FALLBACK + channel browser: transpiles a modern app's bundles to FF52-parseable ES5 + core-js polyfill. Experimental: syntax down-levels, but runtime feature checks (WebRTC shape, CSS) may still stall some apps - receipt-gated | tools/mac-es5-passthrough.ts; Babel preset-env targets firefox 52; core-js-bundle prelude |
| 3 | Text bridges (matrix/IRC) or phone | PARKED: needs a host; operator excluded the Void box 2026-09-16d | docs/mac-daily-driver.md §10 |

Hardening rules for Chromium Legacy (community binary, no Google updater):
- Verify the downloaded zip against the published SHA (release asset hash / mirror SHA1 above)
  BEFORE opening; record the hash you verified in the burn receipt.
- Dedicated profile used ONLY as the "apps browser" (Discord/music/video); keep Arctic Fox as
  the hardened daily + agent-channel browser (its user.js hardening stays).
- No Google sign-in/sync in it; install uBlock Origin (modern, from the Chrome Web Store -
  Chromium 120-class supports it) instead of the legacy XPI there.
- Treat it as untrusted-vendor software: if a build ever behaves oddly, quit, burn the
  description, and fall back to rank 2.

## 2. Vencord / Discord path on Chromium Legacy

1. Install Chromium Legacy lion build (rank 1 source; sha-verify).
2. Install Violentmonkey (Chrome Web Store) as the userscript manager.
3. Install the Vencord web userscript from vencord.dev (web install button) into Violentmonkey.
4. Open https://discord.com/app - Vencord patches the web client in-page (that IS
   "vesktop/discord w/ vencord" on this Mac, browser-class).
5. Voice: WebRTC on Chromium-120-class works; expect the browser tab to be the call endpoint
   (headphones out of the MicPort chain or the Mac jacks; mic = system default input = MicPort
   once docs/mac-daily-driver.md §9 wave lands).
Receipt owed: login + one channel render + Vencord settings pane visible; burn description or
screenshot-photo via the One page.

## 3. The passthrough workflow (rank 2), phone-triggerable

- Trigger from phone: GitHub mobile site or app -> this repo -> Actions ->
  `mac-es5-passthrough` -> Run workflow -> choose app (discord-web | vencord-web) -> Run.
  (Any shell with gh can also: gh workflow run mac-es5-passthrough.yml -f app=discord-web.)
- What it does: fetch target script assets (discord: discover <script src> from the app shell;
  vencord: single userscript) -> Babel preset-env (targets firefox 52) per file -> copy
  core-js-bundle as polyfill.js -> emit ES5 loader.html -> RECEIPT.json (sha256 + node --check
  per file, syntax FAIL aborts the run) -> upload artifact + publish a public release zip.
- On the Mac: download the release zip (public, no auth), open loader.html in Arctic Fox.
- Receipt loop: whatever renders/stalls gets burned through da.gd/lionone (any .txt or a
  written description), agent reads inbox and iterates the tool (regex/targets) in the next run.
- Deps are CI-only (@babel/core, @babel/preset-env, core-js-bundle) per MASTER toolStyle
  "zero dependency unless justified"; sandbox selftest stays dep-free.

## 4. What this does NOT change

- Arctic Fox hardening wave + uBlock legacy XPI remain as shipped (daily/channel browser).
- The one link da.gd/lionone remains the single channel and receipt loop.
- DRM-gated services stay dead on every Lion route (no EME/DRM in Arctic Fox; Chromium Legacy
  carries Widevine only for officially supported OSes - treat streaming-music as
  YouTube/SoundCloud web, not Spotify/Netflix).

## Trigger path — validated 2026-09-16 (receipt: operator phone screenshot, Actions tab "Found 0 workflows")

- Screenshot proves: phone -> repo -> Actions reachable, search works, repo in GitHub "Get started" state = ZERO registered workflows. Corroborated: `gh api .../actions/workflows` total_count=0 and `.../actions/runs` total_count=0 (the five GPU-lab workflows were never activated either).
- Root cause A: `ci/workflows/` is source-only by this repo's design (README line + `scripts/install-github-workflows.sh` header): GitHub registers/runs only `.github/workflows/`, which never existed here.
- Root cause B: `workflow_dispatch` UI listing shows default-branch workflows only (GitHub docs, SO 75250667, community discussion 178194). main lacks it; PR #88 unmerged.
- Hard gate (test-push receipt, verbatim): GitHub refused the agent push of `.github/workflows/mac-es5-passthrough.yml` — "refusing to allow a GitHub App to create or update workflow ... without `workflows` permission". Activation therefore requires OPERATOR credentials. Local activation commit 45b3a09 rolled back to 70d8d32; ci source intact.
- Activation options (operator, lightest first):
  1. Phone web UI (~3 min, no computer): github.com -> this repo -> branch **main** -> Add file -> Create new file -> name `.github/workflows/mac-es5-passthrough.yml` -> paste content copied from the raw ci source on the arena branch: `https://raw.githubusercontent.com/mistuhman/nvidia-intel-ocblizzard-4x8ddr4xmp-10gb3080-voidmusl-picom-xfwm4-compizunused-cairodock-egl-glx/arena/01a0a9ee-nvidia-intel-ocblizzard-4x8ddr/ci/workflows/mac-es5-passthrough.yml` (open, select-all, copy) -> commit straight to main.
  2. Grant the Arena GitHub App the Workflows permission (repo Settings -> the App -> Repository permissions -> Workflows = read and write); the agent then re-pushes the activation commit.
  3. Any credentialed checkout: `scripts/install-github-workflows.sh` -> commit -> push (also activates the five GPU-lab workflows, as designed).
- After activation: merge PR #88 (operator tap) so main carries `tools/mac-es5-passthrough.ts`; then phone Actions -> mac-es5-passthrough -> Run workflow (app: discord-web, publish: on). Pre-merge, Run still works with the branch selector set to `arena/01a0a9ee-nvidia-intel-ocblizzard-4x8ddr` (the tool lives on that branch).
- Until activation + first run + on-Mac burn: T1 stays [~] in ToDo.md.

### Standing tap-to-run ergonomics (2026-09-16 hardening, same day as Trigger path)

- The workflow is now a STANDING update pipeline, not a one-shot: `app` input defaults to `all` and the app list lives ONLY in `tools/mac-es5-passthrough.ts` (APPS registry). Adding a planned app later = one agent commit on the arena branch; the YAML never changes, nothing is re-pasted on the phone, no merge required.
- Checkout inside the job is pinned to `arena/01a0a9ee-nvidia-intel-ocblizzard-4x8ddr`, so every tap runs the freshest tool + registry whether or not PR #88 has merged. No branch selector needed on the phone.
- Run = two taps once activated: Actions -> mac-es5-passthrough -> Run workflow -> green Run (defaults app=all, publish=on). Output: one public release zip with one subdir per app (loader.html + es5-*.js + polyfill.js + RECEIPT.json each) and RECEIPT-INDEX.json at zip root.
- Per-app syntax gate stays: node --check per emitted .js; any FAIL aborts the run before publish.
- Phone setup recommendation: Safari -> github.com -> Share -> Add to Home Screen (app-like icon, stays logged in). The GitHub iOS app is optional: good for notifications, PR merges and viewing runs; its Actions support is view/cancel-only per community discussion 110751 (as of that thread), so the Run tap lives in mobile web. Merging a PR that touches `.github/workflows` from the app fails on token scope (same thread); PR #88 touches only `ci/workflows`, so app-merging it is safe.

### Compiler training corpus v1 (2026-09-16f, operator: "train the compiler with copious instruction sets")

- The INSTRUCTIONS registry in `tools/mac-es5-passthrough.ts` is the versioned instruction set: 13 common compile hazards/shims + per-app directives for discord-web and vencord-web (version tag 2026-09-16f-v1).
- Every CI run snapshots it into the bundle zip as INSTRUCTIONS.json and hashes it into RECEIPT-INDEX.json (`instructions_sha256`), so any on-Mac burn or CI log cites the exact corpus version it was built with.
- v1 covers: ff52 syntax floor and polyfill load order; ES2020+ lowering assertions; module-worker and WebCrypto KNOWN_LIMITATION policy (route real sessions to Chromium Legacy); core-js gaps listed as shim candidates (ResizeObserver, TextEncoder/TextDecoder, IntersectionObserver) with none auto-added; SRI/CSP non-porting; discovery-order rule; vencord UserScript header preservation.
- Growth rule: a new hazard or shim becomes an entry here WITH a receipt citation (CI log line or da.gd/lionone burn); no silent behavior changes. Candidate apps (youtube-web, soundcloud-web) join the registry only after a green fetch+transpile CI receipt (ToDo.md app build list).
