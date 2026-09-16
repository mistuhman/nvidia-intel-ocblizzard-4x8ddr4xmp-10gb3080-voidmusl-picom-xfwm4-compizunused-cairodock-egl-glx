# Burn verification — 2026-09-16

**Receipt delivery: PASS. App compilation: HOLD. No repeat burn needed.**

## Three new text burns read

Read through the webhook API's full `text/plain` POST content, not its shortened GET summaries. Times below are the server's reported times; the target reports PDT, which was not changed.

| Receipt | Server time | Request UUID | Finding |
|---|---|---|---|
| `passthrough-CONTEXT.txt` | 16:24:20 | `8d9da9c2-6bf9-4ab2-a896-7015b8b55bca` | Readable, reported 3,685 bytes / 62 split lines. |
| `lion-compiler-context.txt` | 16:24:25 | `33b7117b-a153-40c0-9fc9-63e6b760cd70` | `CORPUS_SHA=MATCH`, `COMPILERCTX1_DONE`; reported 557 bytes. |
| `lion-one.txt` | 16:24:39 | `1c474145-b25a-41d8-a848-a68f333035bf` | Complete `LIONONE1_DONE`; reported 5,780 bytes. |

The v2 corpus's internal hash matches the compact source corpus:
`8583a1cbf2ca700725b50f973843e03ffd46a6dab1a70ab4a825d58de0899372`.
This proves the embedded corpus self-check passed, **not** that an app compiled or ran. The Desktop JSON was not independently uploaded; the page-fetch representation strips angle-bracket tokens from the companion, so its byte identity is not claimed.

## Why compilation remains on hold

1. A pinned Babel 7.29.7 fixture reproduced `343383572805058560n` becoming `BigInt("undefined")`. The v2 converter used `node.bigint`; Babel stores the digits in `node.value`.
2. Loading the exact previously shipped core-js 3.50.0 prelude into a fresh VM with native BigInt absent leaves `typeof BigInt` equal to `undefined`. This is corroborated by core-js's missing-polyfill documentation [1](https://core-js.io/docs/missing-polyfills). Merely fixing the digits does not implement BigInt arithmetic/comparison semantics.
3. Deferring unsupported regex literals into `new RegExp(...)` does not implement their semantics either; a throw can occur during module initialization.
4. GitHub Actions is now **active, zero runs**. The installed `.github/workflows` file is an older unpinned template, not the corrected `ci/workflows` source. No workflow was dispatched.

The earlier “GREEN” compile is retained as a historical **syntax-only** result and explicitly superseded as a runtime-readiness claim.

## Corrections made

- Fixed the Babel field; added decimal-above-2^53, hex, negative-number and absent-native-BigInt regression cases.
- Added `COMPATIBILITY.json`: known BigInt/deferred-regex hazards stop transpile and receipt with exit 4. Otherwise runtime status remains `UNVERIFIED`, not PASS.
- Added real-dependency compiler regressions before app fetching in the workflow source; pinned versions and the current session branch. The installed workflow still requires an operator update.
- Updated the downloadable context to v3 (`17c6a29a052ec7632064a56948874ef22b45ea5717a9b779e366407d5e1e5a7a`), with an explicit HOLD. This new corpus is **not** claimed as already burned on the Mac.
- Corrected canonical machine state and the One-page live/offline instructions. Stale branch/main command responses cannot replace the current safety snapshot (mocked page tests pass). The existing short link is unchanged.

## Target facts and limits

Lion **10.7.5 / 11G63**, MacPro3,1, x86_64, 10 GiB RAM; Arctic Fox **47.3** present. The name-only `/Applications` probe did not find Chromium. GTX 285 in Slot-1, x16, 1 GB; both Dell displays online at **1920×1080 / 60 Hz**.

**Root is now `start disk clone` (`/dev/disk3s2` at receipt time). Old wipe instructions are suspended.** Three Apple_RAID members and mounted 3 TB `Raid X` are visible; physical bays, RAID mode and health were not measured. Protect boot and all RAID members.

Firewall reports **disabled**. Only built-in audio appears in the captured audio section; MicPort presence is not established. `/Users` directory names do not establish active account count. No hardening, AirPort-reset or wipe completion is inferred; T5/T6 remain open. No target commands, app installation, reboot or disk mutation were released.

## Verification and next gate

Reproduce: `node tools/mac-es5-passthrough.ts selftest --compiler` using the pinned dependencies in the workflow source. Full-suite/budget results are recorded in `GATES.json`.

Two bounded verification lanes were used: source/compiler preflight and target-receipt/state verification. Relevant compiler, channel and Lion handoff sources plus the new receipt batch were read. Unrelated OC/imaging documents and the entire historical inbox were not re-audited; no new claims are made about those tracks.

**Next single task:** verify a real BigInt/regex compatibility implementation before a full app run. Updating the installed workflow alone does not resolve those blockers. No additional operator burn is needed now.

PR #89 is reviewable, not permission to compile or an approved merge. The operator alone decides merges; the agent never merges. Other open PRs at verification: #72, #60, #57, #34, #24, #23.
