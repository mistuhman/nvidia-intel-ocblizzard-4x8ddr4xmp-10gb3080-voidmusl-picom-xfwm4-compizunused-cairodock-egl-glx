# nvidia-intel-ocblizzard-4x8ddr4xmp-10gb3080-voidmusl-picom-xfwm4-compizunused-cairodock-egl-glx

**If the operator's first message is "README.md", that is the whole instruction. Cold-start and get to work.**

## Prompt screening (every message, this chat and every future one)

Read every operator message with high-definition screening before acting. Decompose it into a numbered demand list: every clause, every named file, tool, syntax, format, and prohibition is its own requirement. Deliver every item or report it as skipped with a reason. Latest instruction wins over earlier ones. Full rule: `MASTER.md` → `promptScreening`.

## Capability gate — step 0, before anything else

Operator directive 2026-09-01: **if this chat's model does not have the full agent mode feature list, it just stops.** Verify every one of: bash in the sandbox checkout, file read/write/edit, `node` for `tools/*`, git + gh authenticated against the fixed branch, web search + page fetch, background process tools. If ANY is missing, reply with exactly:

```
STOP — NOT FULL AGENT MODE. Reopen this chat in Arena Agent Mode.
```

…then end the turn. No degraded-mode work, no advice-only fallback, no simulated or role-played tool output, no substitute workflow invented on the spot. Stopping cold with that line is the correct behavior; a model that "tries anyway" is the failure mode this gate exists to catch. Full rule: `MASTER.md` → `capabilityGate`.

## Start protocol

Run in one pass, parallel where independent:

1. Read `MASTER.md` in full. It is JSON context, not prose policy: workflow rules, brute doctrine, the `objective`, machines, constraints. Read `ToDo.md` for the operator's live gates.
2. Gather as much context as possible before touching anything: every `docs/` file relevant to the objective, `git log`, and all previously returned target receipts. Report what was NOT read.
3. Establish ground truth with `node tools/orient.ts orient` and `node tools/next-gate.ts`. Mac Pro Lion SSD pickup: also `node tools/lion-status.ts` (source `docs/lion-workflow.json`; prose `docs/lion-ssd-handoff.md`).
4. Deploy bounded agents: one task, source set, hypothesis, or verification target per agent (`node tools/agent-deploy.ts --objective=...`). Brute first: exhaust free context and searches before any hardware action; merge only receipts.
5. Commands go to the operator directly in CHAT as pasteable bash blocks. One command per line, console-safe (no chaining, no tricky redirects), root blocks start with `id -u`. No registry ceremony, no `?(name)` tokens. Operator pastes output back; agent reads it, quotes verdict, attributes cause, then proposes next single knob.
6. Never send a second wave before the first wave's output arrives.
7. bash -n + console-hygiene check every block before pasting.
8. Before delivery, run `node tools/test-all.ts` and `node tools/pr-budget.ts main 405` unless the operator explicitly ordered a larger refactor.
9. Report: objective, agents used, receipts, unverified limits, gate, next action.

## Project

Live reversible overclocking campaign on the operator's physical Void Linux desktop (post-recovery: the OMEN 45L POSTs and boots clean). Active objective `extreme-optimization-oc`: minimum processes/memory with the beauty stack intact, then EXTREME optimization and overclocking of the i7-12700KF and RTX 3080 10GB with Geekbench 6.7.1 + Unigine Superposition 1080p Extreme as the official meter (stock baselines recorded in MASTER durableFacts). Live gates and storage work (boot order, AHCI-vs-RAID, SATA zpools) are tracked in `ToDo.md`; one knob at a time, granular, metered. Target changes require an exact inverse and an operator gate.

## Machines

| | Agent sandbox | Target |
|---|---|---|
| What | ephemeral git checkout | operator desktop, user `sd` |
| Has | git, gh, node, python3, jq | X11, NVIDIA RTX 3080 10GB, Intel 12700KF (KF = no iGPU), 32GB DDR4 XMP 3733, HP BlizzardOC Z690 |
| Lacks | GPU, X server, ffmpeg, browser | nothing relevant |
| Can | author, verify syntax, commit | execute, observe, judge |

Second physical machine (keep-as-Mac): Mac Pro 1,1 / A1186, Snow Leopard 10.6.8 on Lion SSD Base, Arctic Fox 47.3. Lion-from-SSD goal, links, and nextAction: `docs/lion-ssd-handoff.md` / `node tools/lion-status.ts`.

## Workflow

Agent ↔ operator reciprocity loop: pasteable command block out → operator runs on target and pastes output back → verdict quoted + cause attributed → next single knob. One wave at a time.

## Layout

- `MASTER.md` — JSON context: screening rule, chat workflow, brute doctrine, objective, machines, constraints.
- `ToDo.md` — operator-directed live checklist (OC + storage gates); operator-owned.
- `tools/` — TypeScript agent tools (`orient.ts`, `next-gate.ts`, `agent-deploy.ts`, `paste-proof.ts`, `block-lint.ts`, `pr-budget.ts`, `test-all.ts`, `web-scrape.ts`, `github-files.ts`, `recovery-research.ts`, `lion-status.ts`, `lion-mirror-sl-test.ts`). Run with `node tools/<name>.ts`. `tools/lion-phone-agent.ts` is WITHDRAWN (stale 01a08a55 URLs) — do not run it to refresh links.
- Lion Mac (Mac Pro 1,1 / 10.6.8): `docs/lion-ssd-handoff.md` + `docs/lion-workflow.json`. Helper `lion-mirror.command` / `lion-mirror.zip`. Arctic Fox: `da.gd/lzr` (current zip, SHA-pinned), `da.gd/lmz` (branch zip, cache 12h), `da.gd/lpg` (Aqua attach/Burn). Never `da.gd/lionfix` or `da.gd/lup`. Do not erase Lion SSD Base or start disk clone.
- `tools/` GPU OC lab (test before applying): `gpu-oc-plan.ts` (ladder / sweep / console-safe blocks), `gpu-curve.ts` (undervolt = power-trim graph, ASCII + CSV + SVG), `gpu-bench-parse.ts` (dmon + Superposition + Geekbench receipts), `gpu-oc-verify.ts` (ADVANCE/HOLD/REVERT + GWE profile), model in `tools/lib/gpu-model.ts`. Guide: `docs/oc-3080-oc-lab.md`.
- `ci/workflows/` — workflow sources (`scripts/install-github-workflows.sh` copies them to `.github/workflows/`; the agent's GitHub App cannot push that path): `oc-tools-ci.yml` (selftests, shellcheck, determinism, PR budget), `gpu-oc-lab.yml` (manual sweep + curve + pasteable blocks), `gpu-clock-feature-matrix.yml` (one job per knob class), `gpu-receipt-ingest.yml` (paste receipts, get a verdict, commit the ledger).
- Mac Pro art lab (operator directive 2026-09-10, reusable by operator and model): `node tools/mac-storage-art.ts` — imaging as a compile loop. Sources are `docs/macpro-storage-facts.json` (every claim cited, confidence-rated), `docs/macpro-storage-scene.json` (plate IR: nodes, boxes, labels, per-pass corrections), `docs/macpro-storage-style.md` (Quake-Live hex/AMOLED + skeuomorphic OS X icon contract), `docs/macpro-storage-prompts.jsonl` (verbatim operator prompts, lexed into a numbered demand list). Passes P0..P10: harvest → lex → resolve → typecheck → layout → stylecheck → emit → render → pixel-audit → critique → deduct. Gates: `node tools/mac-storage-art.ts lint` (0 errors required before any render) and `selftest` (18 checks). Loop: `prompt --plate=ID --pass=N` → render → `render --file=...` (deterministic PNG decode + luminance audit) → `findings` → `deduct`; a deduction is applied with `patch`/`node-add`/`note` on the IR so the next prompt hash moves, and the plate is finished only when the latest pass carries zero ERROR findings (`RESIDUAL=0 ... (FIXPOINT)`). Append the next instruction with `queue --add="..."` then `next`. Artifacts: `docs/macpro-btc-raid-{physical,logical}-p{1,2,3}.png` + deterministic `*-overlay.svg` text layers; ledger `receipts/mac-art/pass-ledger.json`. Context: `docs/session-2026-09-10-btc-raid-art.md`, `MASTER.md` → `macArt`.
- `tools/` DDR4 lab: `ram-oc-plan.ts` (XMP 3733 → 4000 MT/s ladder with risk bands, BIOS keying, validation suite, inverse), `ram-validate-parse.ts` (PASS/FAIL/UNPROVEN per gate), target runner `scripts/ram-validate`. Guide: `docs/oc-ddr4-4000-lab.md`.
- `receipts/` — the metered run ledgers (`gpu-oc-receipts.json`, `ram-oc-receipts.json`); `tests/fixtures/` — parser fixtures.
- `etc/` — target config files and reusable `.block` text.
- `scripts/` — target-facing installed tools.
- `docs/` — OC recipes (`oc-plan.md`, `oc-3080-gwe-recipe.md`, `oc-cpu-bios-checklist.md`) and recovery history.
