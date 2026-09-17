# VISION CAPABILITY VERIFICATION — session 01a0ae24 (2026-09-17)

Operator directive (verbatim): "deploy agents to read ToDo.md, README.md and MASTER.md then
verify model image sight capability before continuing at further user prompt".

**VERDICT: IMAGE SIGHT = LIVE AND VERIFIED for THIS chat model. Test A 11/11 blind, exact.**

## Why re-run rather than inherited

`VISION-VERIFICATION.md` in this directory already records a PASS, but it belongs to session
**01a0ad71**. Sight is a per-session model property — MASTER `repo.priorSessions` records the
opposite for another chat: *"SESSION LIMIT: the 01a082d3 chat model has NO image input - every
photo receipt is a TEXT DESCRIPTION from the operator."* Inheriting a prior session's PASS is
exactly the stacked-unverified-assumption failure MASTER `lessons` forbids, so the capability
was re-proven from zero on this session's own model.

## Instrument: `tools/vision-check.ts` (new, zero-dependency, deterministic)

1. `gen` picks content with `crypto.randomBytes` (5-digit code, word, shape, counts, three
   distinct colours, background) and renders a PNG via its own 5x7 bitmap font + PNG encoder.
2. The answer key is sealed to **`/tmp/vision-key-a.json` — outside the repo, never printed**.
   `gen` prints only paths and hashes, so the agent's text context cannot contain the answer.
3. The agent views ONLY the pixels and commits a reading to JSON.
4. `grade` diffs reading vs key and re-prints `key_sha`, proving the key predates the reading.

A model without sight cannot pass; a model with sight cannot cheat from context.
`selftest` = **10/10** (seed determinism for key and PNG bytes, different seeds differ, PNG
signature/IEND/IHDR dims, code shape, colour distinctness). Wired into `tools/test-all.ts`.

## Test A — blind synthetic read

- Image `session-01a0ae24-test-a.png` sha256
  `52bc6bcfb0783e31d7d28f1855847b5602b9ad90196c37ebe26fdacb0f325f69` (2919 bytes, 760x460)
- Reading `session-01a0ae24-reading-a.json`
- Key seal `key_sha fe59fbe45bee264cc06e1caefdd2b5321e25c5d799d21b094bf0955b53216464`
  — printed by `gen` BEFORE the read, re-printed identical by `grade` after it.

| field | read blind | truth | | field | read blind | truth |
|---|---|---|---|---|---|---|
| width | 760 | 760 PASS | | shape_count | 3 | 3 PASS |
| height | 460 | 460 PASS | | shape_color | YELLOW | YELLOW PASS |
| background | BLACK | BLACK PASS | | word_color | RED | RED PASS |
| word | ZFSBOOT | ZFSBOOT PASS | | code_color | CYAN | CYAN PASS |
| code | 47780 | 47780 PASS | | bar_count | 5 | 5 PASS |
| shape | CIRCLE | CIRCLE PASS | | | | |

`VISION_TEST=PASS (11/11 fields)`, rc=0. The 5-digit code `47780` exists nowhere in the agent's
text context — it is readable only from pixels. Proves OCR of rendered glyphs, colour naming
across three simultaneous colours, shape classification, and counting of two object groups
(3 circles, 5 bars).

**Independent corroboration:** the repo's own decoder, `node tools/image-read.ts`, reports
`palette=rgb(12,12,14)@0.93 rgb(240,210,50)@0.031 rgb(220,40,40)@0.022 rgb(60,210,220)@0.017`
= black background, yellow, red, cyan — matching the blind read from a separate code path.

**Reproducible:** re-running `gen --seed=<key.seed>` after a later refactor of the font table
reproduced the same image sha256 byte-for-byte, so this receipt survives tool edits.

## Test B — real photograph (generalization + negative control)

- Query "Mac Pro 3,1 Early 2008 tower interior open side panel logic board"; result saved to
  the git-ignored `image-search/` scratch dir, sha256
  `da33603a138309032d0011221bc29d5d8c53e8b98e50540d8f5ff956cbf997f5` (51417 bytes).
  Not committed: an unrelated stock web photo with zero evidentiary value for either target.
- Source: iFixit guide 831, *MacBook Pro 15" Unibody Late 2008/Early 2009 Logic Board Replacement*

**The search returned the WRONG SUBJECT and sight caught it.** The photo is a 15-inch unibody
MacBook Pro LAPTOP face-down with its lower aluminium case lifted by a bare right hand — NOT a
Mac Pro tower. Read from pixels: two black squirrel-cage blower fans top-centre/right; dark
green logic board with ribbon connectors and a bright green RAM module at centre; black-wrapped
optical drive upper-left; hard drive lower-left with a white label; teal-blue adhesive pads and
a grey trackpad plate inside the removed cover; drilled speaker grille right of centre.

Stronger than a matching photo would have been: the model read pixels instead of confirming the
caption it was handed. **No claim here is a target receipt.**

## Capability gate (README step 0 / MASTER `capabilityGate`) — all six present, plus sight

bash in checkout / file read-write-edit / `node` v22.22.3 (`test-all.ts` = `TEST_ALL=PASS`) /
git + gh authed as `arena-ai-coding-agent[bot]` on `arena/01a0ae24-nvidia-intel-ocblizzard-4x8ddr` /
web search + page fetch / background process tools / **image input (Tests A+B)**.
Not the stop case — the `STOP - NOT FULL AGENT MODE.` line is NOT issued.

**Branch note:** `orient` prints `BRANCH_MISMATCH expected=arena/01a0ad38-...` because MASTER
`repo.branchFixed` still names the previous session's branch; this session is fixed to
`arena/01a0ae24-nvidia-intel-ocblizzard-4x8ddr`. Left unedited pending operator direction.

## Limits NOT proven

- Sight does NOT satisfy the uploads evidence gate: `uploads/index.json` is still
  `totalEntries=0`, so `node tools/uploads.ts gate` still REFUSES renders whose visual claims
  lack a persisted operator photo. Independent gates.
- No measurement claim is licensed off a photo (`docs/measurement-fundamentals.md` unchanged).
- Synthetic-glyph OCR does not guarantee reading small/blurred board silkscreen on a macro;
  re-verified per photo when it matters. EXIF/metadata extraction untested.
- Nothing here touched the target machines: no power-on, no BIOS, no disk operation.
