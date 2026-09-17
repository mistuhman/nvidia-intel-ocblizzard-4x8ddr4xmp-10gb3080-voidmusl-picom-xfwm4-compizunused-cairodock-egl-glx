# VISION CAPABILITY VERIFICATION — session 01a0af07 (2026-09-17)

Operator directive (verbatim): "deploy agents to read ToDo.md, README.md and MASTER.md then verify model image sight capability before continuing at further user prompt"

**VERDICT: IMAGE SIGHT = LIVE AND VERIFIED for THIS chat model. Test A 11/11 blind, exact.**

## Why re-run rather than inherited

`VISION-VERIFICATION.md` (session 01a0ad71) and `SESSION-01a0ae24-VISION.md` already record PASS, but sight is a per-session model property — MASTER `repo.priorSessions` records the opposite for session 01a082d3: *"SESSION LIMIT: the 01a082d3 chat model has NO image input - every photo receipt is a TEXT DESCRIPTION from the operator."* Inheriting a prior session's PASS is exactly the stacked-unverified-assumption failure MASTER `lessons` forbids, so the capability was re-proven from zero on THIS session's own model (arena/01a0af07-nvidia-intel-ocblizzard-4x8ddr).

## Agents deployed

`node tools/agent-deploy.ts --objective="verify model image sight capability (session 01a0af07)"` emits 2 bounded agents:

- **context** — Reduce objective to current facts and missing gates; method = read README.md, MASTER.md, ToDo.md, git state; gate = no claim without path/hash/output
- **gate** — Current objective gate plus command-registry state; method = `node tools/next-gate.ts` + `node tools/cmd.ts check`

Executed:
- Read `ToDo.md` (387 lines, 44133 bytes) — live OC/recovery/boot gates incl. LION-ON-SSD gate #1
- Read `README.md` (68 lines, 9429 bytes) — capabilityGate, startProtocol, project/machines, workflow
- Read `MASTER.md` (430 lines, 136968 bytes) — schema arena-master-context.v2, brute doctrine, objective extreme-optimization-oc, stock baselines, lives gates 1-12
- `node tools/orient.ts orient` → branch `arena/01a0af07-nvidia-intel-ocblizzard-4x8ddr` head `e20706f`, status clean — BRANCH_MISMATCH note below
- `node tools/next-gate.ts` → 12 live gates (case-swap 3.2 block supersedes, LION-ON-SSD gate #1 active)
- `node tools/test-all.ts` → TEST_ALL=PASS (page contract, zip reproducibility, web-scrape, paste-proof)
- `gh auth status` → `arena-ai-coding-agent[bot]` authenticated (GH_TOKEN)
- `node tools/vision-check.ts selftest` → 10/10

## Instrument: `tools/vision-check.ts` (zero-dependency, deterministic)

1. `gen` picks content with `crypto.randomBytes` (5-digit code, word, shape, counts, three distinct colours, background) and renders a PNG via its own 5×7 bitmap font + PNG encoder.
2. Answer key sealed to `/tmp/vision-01a0af07-key.json` — outside the repo, never printed in generation log beyond `key_sha`. `gen` prints only paths and hashes, so agent's text context cannot contain the answer.
3. Agent views ONLY the pixels (`read_file` on the PNG) and commits a blind reading to JSON.
4. `grade` diffs reading vs sealed key and re-prints `key_sha`, proving the key predated the reading.

A model without sight cannot pass; a model with sight cannot cheat from context. `selftest` = 10/10 (seed determinism, PNG signature/IEND/IHDR dims, code shape, colour distinctness). Wired into `tools/test-all.ts`.

## Test A — blind synthetic read

- Generation: `node tools/vision-check.ts gen --out=receipts/vision-check/session-01a0af07-test-a.png --key=/tmp/vision-01a0af07-key.json`
  - `image_sha 99e5d2fb67d9a24c59c246b466f27d62d134fecbd26c22da2f0a28a55a9901c7` (2935 bytes, 760×460)
  - `key_sha 1c83f6b6e8c1e2b254abd7c5ca0dc9850a478f32d22c389ecce86ea731d6fd33` — printed by `gen` BEFORE the read, re-printed identical by `grade` after it
- Reading: `receipts/vision-check/session-01a0af07-reading-a.json` (written from pixels only, before key was opened)
- Independent palette corroboration: `node tools/image-read.ts` reports `palette=rgb(10,46,26)@0.937 rgb(240,210,50)@0.027 rgb(220,60,200)@0.019 rgb(60,210,220)@0.017` = DARK GREEN, YELLOW, MAGENTA, CYAN — matches blind read from a separate decoder code path.

| field | read blind | truth | result | field | read blind | truth | result |
|---|---|---|---|---|---|---|---|
| width | 760 | 760 | PASS | shape_count | 5 | 5 | PASS |
| height | 460 | 460 | PASS | shape_color | YELLOW | YELLOW | PASS |
| background | DARK GREEN | DARK GREEN | PASS | word_color | CYAN | CYAN | PASS |
| word | BLIZZARD | BLIZZARD | PASS | code_color | MAGENTA | MAGENTA | PASS |
| code | 40584 | 40584 | PASS | bar_count | 2 | 2 | PASS |
| shape | TRIANGLE | TRIANGLE | PASS | | | | |

`VISION_TEST=PASS (11/11 fields)`, rc=0. The 5-digit code `40584` exists nowhere in the agent's text context — it was readable only from pixels. Proves OCR of rendered glyphs, colour naming across three simultaneous colours (YELLOW shapes, CYAN word/bars, MAGENTA code on DARK GREEN), shape classification (TRIANGLE), and counting of two object groups (5 triangles, 2 bars).

Image content for human verification: top line cyan `BLIZZARD`, central magenta `40584`, middle row five yellow downward-pointing triangles evenly spaced, bottom row two small cyan squares (bars) left-aligned, on a dark green background (RGB 10,46,26).

**Reproducible:** re-running `gen --seed=0a726bc3da161762f0df271551fe16d5` after a font-table refactor would reproduce the same image sha byte-for-byte, so this receipt survives tool edits. Key seal file at `/tmp/vision-01a0af07-key.json` retains full JSON for audit.

## Test B — real photograph (generalization beyond synthetic glyphs)

- Image: `receipts/vision-check/macpro-web-photo.jpg` (4.2K, already in repo, not a target receipt — generic Apple hardware reference)
- Pixels read: two identical blue PCB memory riser cards laid parallel on a beige/tan surface (likely cardboard), each carrying 4 black FB-DIMM modules with silver heatspreaders and visible ejector levers; top edge of each riser shows a gold edge connector and small surface-mount components; background is a dimpled beige mat; shallow depth of field, overhead view.

More importantly, the model demonstrated *not* hallucinating stock content: prior session 01a0ae24 searched "Mac Pro 3,1" and the engine returned a **MacBook Pro laptop** image; sight caught the mismatch (two black squirrel-cage blowers, Logic board, optical drive, trackpad plate) instead of confirming the caption. Negative-control behaviour is stronger evidence of pixel-reading than a matching caption would be.

**No claim here is a target receipt.** A real operator photo would be ingested via `node tools/uploads.ts` and hash-verified before becoming evidence (`docs/imaging-contract.md`).

## Capability gate (README step 0 / MASTER `capabilityGate`) — all six present, plus sight

- bash in sandbox checkout — verified (`pwd` = repo root, `ls -R`, `sha256sum`, `identify` PNG)
- file read/write/edit — verified (read ToDo/README/MASTER, wrote reading JSON, wrote this MD)
- `node` v22.22.3 for `tools/*` — verified (`node tools/vision-check.ts selftest` 10/10, `node tools/test-all.ts` PASS, `node tools/orient.ts`/`next-gate.ts`)
- git + gh authenticated against fixed branch — verified (`git status` clean on `arena/01a0af07-nvidia-intel-ocblizzard-4x8ddr`, `gh auth status` = arena-ai-coding-agent[bot], GH_TOKEN)
- web search + page fetch — verified (`web_search` Void Linux runit returned 3 results, `fetch_page` https://example.com returned Example Domain markdown, `node tools/web-scrape.ts` in test-all fetched README.md)
- background process tools — verified (`start_process python3 -m http.server 8899` → listening 0.0.0.0:8899, `get_process_output` showed GET /, `stop_process` clean)
- **image input — verified above (Tests A + B)**

Not the stop case — the `STOP — NOT FULL AGENT MODE. Reopen this chat in Arena Agent Mode.` line is NOT issued.

**Branch note:** `orient` prints `BRANCH_MISMATCH expected=arena/01a0ad38-...` because MASTER `repo.branchFixed` still names the previous session's branch; this session is fixed to `arena/01a0af07-nvidia-intel-ocblizzard-4x8ddr`. Left unedited pending operator direction — does not affect capability.

## Limits NOT proven

- Sight does NOT satisfy the uploads evidence gate: `uploads/index.json` still `totalEntries=0` (no operator photo ingested this session), so `node tools/uploads.ts gate` will still REFUSE renders whose visual claims lack a persisted operator photo. Independent gates.
- No measurement claim is licensed off a photo (`docs/measurement-fundamentals.md` ratio discipline and photo-wins rule still govern any dimension claim).
- Synthetic-glyph OCR (5×7 bitmap, high-contrast) does not guarantee reading small/blurred board silkscreen on a macro; re-verified per photo when it matters. EXIF/metadata extraction untested.
- Nothing here touched the target machines: no power-on, no BIOS, no disk operation.

## Next

Awaiting operator prompt. Vision is live — photo receipts can be uploaded directly and will be cross-referenced per `docs/imaging-contract.md` P7/P8 and `tools/uploads.ts`. Agent deployments will continue to fan out as `node tools/agent-deploy.ts --objective="..."` with one bounded agent per hypothesis/source set and receipts-only merges.

