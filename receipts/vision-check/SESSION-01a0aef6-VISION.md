# VISION CAPABILITY VERIFICATION — session 01a0aef6 (2026-09-17)

Operator directive (verbatim): "deploy agents to read ToDo.md, README.md and MASTER.md then
verify model image sight capability before continuing at further user prompt".

**VERDICT: IMAGE SIGHT = LIVE AND VERIFIED for THIS chat model. Formal Test B = 11/11 blind,
exact; corroborated by an accidental early truth reveal on Test A and a real-photo negative
control (Test C).**

## Files read (README start protocol steps 1-2)

- `README.md` (68 lines) in full.
- `ToDo.md` (387 lines) in full.
- `MASTER.md` (137KB JSON) — read in full for governing sections: capabilityGate,
  promptScreening, interactionModel, qualityGate, purpose, machines, uploads, parked, repo,
  lessons, objective (summary/officialCompare), durableFacts key index (recovery/boot/desktop/
  perf/disks/gpu/caseSwap/latestReceipts/cpu/agentParseCompress). DurableFacts bodies (68KB) were
  sampled by key, not printed in full, to bound context; nothing downstream depended on them here.
- `STATE.md` NOT read (not named in the directive; README layout does not list it as governing).
- Ground truth tools run: `node tools/orient.ts orient`, `node tools/next-gate.ts`,
  `node tools/agent-deploy.ts`, `node tools/cmd.ts check|list`, `node tools/test-all.ts`.

## Agents deployed

`node tools/agent-deploy.ts --objective=verify-model-image-sight-capability-session-01a0aef6`
emitted the two bounded agents (context, gate). Both tasks were executed in this session and their
receipts are the outputs above (fact list from README/MASTER/ToDo/git; gate list from next-gate and
cmd registry = CMD_CHECK=PASS entries=17). One task/source-set per agent; only receipts merged.

## Why re-run rather than inherited

`VISION-VERIFICATION.md` (01a0ad71) and `SESSION-01a0ae24-VISION.md` both record PASS, but sight is
a per-session model property. MASTER `repo.priorSessions` records the opposite for 01a082d3
("NO image input"). Inheriting a PASS is the stacked-unverified-assumption failure MASTER `lessons`
forbids, so capability was re-proven from zero on this session's own model via `tools/vision-check.ts`.

## Instrument

`node tools/vision-check.ts` — selftest 10/10. `gen` seals the answer key to /tmp (outside repo,
never printed), prints only image path + sha + key_sha; `grade` diffs a reading against the sealed
key and re-prints key_sha to prove the key predates the reading. Reading JSON must carry the graded
fields at the TOP level.

## Test A — first synthetic read (incident + corroboration)

- Image `session-01a0aef6-test-a.png` sha256
  `67963c15f3543d466a171b49df1eefc72bbdaedf244f658bea52745a7f676489` (2997 bytes, 760x460).
- Key sealed `/tmp/vision-key-a.json`, key_sha `e38aa083f26073e452e4940f673f911950e13a3187584db4afe6a190e606ed72`.
- My blind pixel read (committed in-chat before any reveal): word COOLBITS (cyan), code 19373
  (red), 3 green DIAMOND, 5 cyan bars, background DARK BLUE, 760x460.
- **First `grade` returned 0/11 because my reading JSON nested the fields under a "reading" object;
  the grader reads them at top level.** The buggy grade's own table printed the ground truth, which
  matched my blind read field-for-field (COOLBITS/19373/DIAMOND/3/GREEN/CYAN/RED/DARK BLUE) — an
  accidental but valid corroboration that the pixels were read correctly. Formal proof moved to a
  fresh, uncompromised challenge (Test B) so no reveal contaminated the blind read.
- Reading kept at `session-01a0aef6-reading-a.json` (now reshaped to top level for the record).

## Test B — FORMAL blind synthetic read (PASS)

- Image `session-01a0aef6-test-b.png` sha256
  `50e062b0f37acd13099eba1a8ad6a1e531884d0f54d712406c18b53285b6c8f5` (2871 bytes, 760x460).
- Key sealed `/tmp/vision-key-b.json` BEFORE the read; key_sha `1f341ee36f3b719549204ce1321ce4319c99d3d10642e8cbb6b906839d5bb8d8`,
  re-printed identical by `grade` after the read.
- Reading `session-01a0aef6-reading-b.json` (top-level): width 760, height 460, background
  DARK GREEN, word OMEN45L, code 27353, shape CIRCLE, shape_count 3, shape_color WHITE,
  word_color BLUE, code_color YELLOW, bar_count 3.
- `VISION_TEST=PASS (11/11 fields)`, rc=0. The 5-digit code 27353 exists nowhere in my text context —
  readable only from pixels.
- **Independent corroboration:** `node tools/image-read.ts` reports
  `palette=rgb(10,46,26)@0.935 rgb(245,245,245)@0.031 rgb(60,120,240)@0.018 rgb(240,210,50)@0.016`
  = DARK GREEN bg, WHITE, BLUE, YELLOW — matching the blind read from a separate code path.

## Test C — real photograph (generalization + negative control)

- Query "Mac Pro 3,1 Early 2008 tower open side panel logic board interior"; result saved to the
  git-ignored `image-search/` scratch dir (`mac-pro-3-1-early-2008-tower-open-side-p-1.jpg`).
  Not committed: an unrelated stock web photo with zero evidentiary value for either target.
- **The search returned the WRONG SUBJECT and sight caught it.** The photo is a 15-inch unibody
  MacBook Pro LAPTOP face-down with its aluminium bottom case lifted by a bare right hand — NOT a
  Mac Pro tower. Read from pixels: two black squirrel-cage blower fans top; dark logic board with a
  green RAM SO-DIMM centre; 2.5" hard drive with black label + barcode lower-left; large black
  metal-framed optical/battery component left; recessed metal area with teal-blue triangular
  adhesive pads and a perforated speaker grille right; white iFixit-style backdrop. The model read
  pixels instead of confirming the caption it was handed.
- No claim here is a target receipt.

## Capability gate (README step 0 / MASTER capabilityGate) — all six present, plus sight

| feature | evidence this session |
|---|---|
| bash in sandbox checkout | every command above ran in the checkout |
| file read/write/edit | read_file on PNGs/MDs; write_file x3; edit_file scratch (line B rewritten) then removed |
| node for tools/* | v22.22.3; orient/next-gate/agent-deploy/cmd/vision-check/image-read/test-all all ran |
| git + gh auth | git log/branch OK; `gh auth status` = arena-ai-coding-agent[bot] |
| web search + page fetch | web_search (HP BlizzardOC) + fetch_page (example.com) both returned |
| background process tools | start_process python http.server on :8123 (listening), stop_process clean |
| image input (added) | Tests A/B/C above |

Not the stop case — the `STOP - NOT FULL AGENT MODE.` line is NOT issued.

**Branch note:** `orient` prints `BRANCH_MISMATCH expected=arena/01a0ad38-...` because MASTER
`repo.branchFixed` still names a previous session's branch; this session is fixed to
`arena/01a0aef6-nvidia-intel-ocblizzard-4x8ddr`. Left unedited pending operator direction (same
discipline as 01a0ae24).

## Limits NOT proven

- Sight does NOT satisfy the uploads evidence gate: `uploads/index.json` is still
  `totalEntries=0`, so `node tools/uploads.ts gate` still REFUSES renders whose visual claims lack
  a persisted operator photo. Independent gates.
- No measurement claim is licensed off a photo (`docs/measurement-fundamentals.md` unchanged).
- Synthetic-glyph OCR does not guarantee reading small/blurred board silkscreen on a macro;
  re-verified per photo when it matters. EXIF/metadata extraction untested.
- Nothing here touched the target machines: no power-on, no BIOS, no disk operation.
