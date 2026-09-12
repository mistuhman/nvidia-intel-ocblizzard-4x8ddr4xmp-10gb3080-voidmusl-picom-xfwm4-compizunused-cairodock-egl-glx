# Mac Pro Chassis Guide — Next Chat Handoff — Refinement Needed

**Status 2026-09-12:** User says current renders are terribly inaccurate, needs granular accuracy refinement. Workspace organized for next chat to continue passes.

## Current Baseline
- Style: Black and white efficient line art ONLY, Helvetica, Japanese compactness, uniform sidepanel every plate same position, LEGO input solid + output ghost transparent 40% dashed arrow.
- Tool: `tools/mac-guide-art.ts` P0-P10 compile loop, selftest 15/15 PASS deterministic dbd13383b4fc, lint 0 errors 1 warn coverage, ledger RESIDUAL=0 FIXPOINT nextPass=4.
- Scene: `docs/macpro-guide-scene.json` v3-bw-lego-accurate, 8 plates, accurate to operator photos 2026-09-12 photo-1 (Mac Pro side open) and photo-2 (OMEN board).
- Facts: `docs/macpro-guide-facts.json` 13 facts G-01..G-13.
- Style contract: `docs/macpro-guide-style-bw.md` v3 with tokens black-line ghost-40 white-paper helvetica lego ghost transparent arrow uniform sidepanel japanese compactness accurate hardware black and white.
- Current renders: `docs/macpro-guide-bw-g01-overview-p3.png` through `g08-boot-verify-p3.png` 8 plates 1536x1024 audit PASS all, sha256 cfc3c075, e8b1eb31, 8a1c55fc, cf157779, a24826ea, e1f2e599, 58fb3049, 5be6e808.
- Archive: `receipts/mac-guide/archive/` contains p1 Quake color and p2 first BW attempts (16 files) — do not use, inaccurate.
- Combined guide: `docs/macpro-chassis-guide-8step-bw.md` v3 points to p3 images.

## Operator Photos Ground Truth (re-upload in next chat)
- **Photo-1 Mac Pro 3,1 Early 2008 side open case on side:** Top 2 optical bays empty metal covers each with rectangular cutout bottom screw top and bottom, middle row 4 HDD bays horizontal left to right each silver metal blank plate small screw right side red square sticker on rightmost Bay4 blank, lower left large metal memory cage cover, lower right windows show blue PCB purple caps and drive backplane with 4 slots, right PCIe GTX 285 double-wide black blower EVGA label two 6-pin power rear dangling black cables, no force lower bracket screw captive, WD Green HDD white label green stripe on desk left, Apple Time Capsule white on desk right, Bay1 bottom Bay4 top upright.
- **Photo-2 OMEN ATX board:** Board mounted in case Micro ATX LGA1700 socket center EMPTY paste residue gray ILM lever metal frame, 4 DIMM slots right of socket black vertical, NVMe M.2 blue label below CPU, PCIe x16 silver below that, rear I/O left honeycomb vent pattern 5 PCIe slot covers, CR2032 coin bottom left near PCIe slots, OMEN AIO pump block black OMEN logo dangling front bottom on case floor hoses black thick, 2x120 fans vertical rad mount right side black, 8-pin CPU top left, 24-pin ATX right edge middle, front panel headers bottom.

## What User Says Is Still Inaccurate
- HDD placement never correct despite requests — needs front→rear slide, handle lever front captive thumbscrew, M3x5 4 screws PCB down bare steel spring tabs bent locating lip, Bay1 bottommost Bay4 topmost upright, ghost 20mm OUT to fully seated IN PUSH.
- Components incredibly inaccurate — passes are for refining detail and granular accuracy, need to iterate P4 layout, P5 stylecheck, P6 emit with more accurate prompts.
- Instructions need clear compact flow uniform sidepanel every time with steps explained in wording like LEGO set each movement/action recorded input and output (e.g., power cable IN solid at start, END ghost transparent partially out with arrow).
- Style must stay black and white lines, Japanese compactness, Helvetica font only — no color, no gray fill, no shading.

## Next Chat Tasks
1. Re-upload operator photos (Mac Pro and OMEN board) so vision model has them.
2. Read `README.md`, `MASTER.md`, `docs/macpro-guide-style-bw.md`, `docs/macpro-guide-scene.json`, `docs/macpro-guide-facts.json`, `tools/mac-guide-art.ts`, `receipts/mac-guide/pass-ledger.json`.
3. Run `node tools/mac-guide-art.ts selftest` and `lint` to confirm baseline.
4. Refine scene IR for granular accuracy: update nodes x/y/w/h if needed, add more accurate details from photos (optical cover cutouts, red sticker Bay4, spring tabs, OMEN pump dangling bottom hoses, CR2032 location, honeycomb pattern, 5 PCIe covers, etc.).
5. Emit prompts for pass 4: `node tools/mac-guide-art.ts prompt --plate=gXX --pass=4` (8 plates).
6. Generate images with `generate_image` using prompts that include black-line ghost-40 white-paper helvetica lego ghost transparent arrow uniform sidepanel japanese compactness accurate hardware black and white, no-color no-gray-fill no-shading, plus accurate hardware description.
7. Audit each: `node tools/mac-guide-art.ts audit --file=docs/...`
8. Register: `node tools/mac-guide-art.ts render --plate=... --pass=4 --file=...`
9. Deduct: `node tools/mac-guide-art.ts deduct` → RESIDUAL=0 FIXPOINT.
10. Update `docs/macpro-chassis-guide-8step-bw.md` to point to p4 images.
11. Run `node tools/test-all.ts` and `node tools/pr-budget.ts main 405` before delivery.
12. Commit and push to same branch `arena/01a093b6-nvidia-intel-ocblizzard-4x8ddr`, update PR #81.

## Files to Keep
- `docs/macpro-guide-bw-g*-p3.png` current best baseline
- `docs/macpro-guide-style-bw.md` v3 tokens
- `docs/macpro-guide-scene.json` v3
- `docs/macpro-guide-facts.json`
- `tools/mac-guide-art.ts` v3
- `receipts/mac-guide/pass-ledger.json` + `receipts/mac-guide/prompts/*p3.txt`
- `docs/macpro-chassis-guide-8step-bw.md` v3

## Files Archived (do not use)
- `receipts/mac-guide/archive/*p1.png` Quake color inaccurate
- `receipts/mac-guide/archive/*p2.png` first BW inaccurate

## Constraints Still Binding
- All pre-existing repo doctrine: prompt screening numbered demand list, capability gate stop-cold, no registry ceremony, pasteable console-safe blocks one command per line no chaining, one wave at a time, test-all + pr-budget before delivery, never switch branch.
- Do not erase Lion SSD Base, no destructive disk operation until wipe target explicitly named.
- Never use da.gd/lionfix, da.gd/lup, TinyURL.
- tools/lion-phone-agent.ts WITHDRAWN.
- Truth order: operator report > target command output > repo files > git history > external web.
- Style: black and white efficient styling only, black and white lines, Japanese compactness, Helvetica font only.

## PR
- PR #81 https://github.com/mistuhman/nvidia-intel-ocblizzard-4x8ddr4xmp-10gb3080-voidmusl-picom-xfwm4-compizunused-cairodock-egl-glx/pull/81
- Branch `arena/01a093b6-nvidia-intel-ocblizzard-4x8ddr` base `main`

## Next Action for Operator
Re-upload the two Mac Pro and OMEN board photos in next chat, plus any close-ups of HDD sleds (handle, spring tabs, M3x5 screws) and optical bay bracket, so next agent can refine granular accuracy further.
