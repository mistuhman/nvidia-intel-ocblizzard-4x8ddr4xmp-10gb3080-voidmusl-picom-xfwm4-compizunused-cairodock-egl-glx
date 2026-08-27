# 3080 OC lab — test before applying (GitHub workflows + tools)

Companion to `docs/oc-3080-gwe-recipe.md`. The recipe says WHAT to set; this says how the lab
proves a step is worth pasting, and how a metered receipt becomes a verdict.

## Hard truth, repeated

Ampere on Linux exposes **no per-point voltage curve**. Every "undervolt graph" here is a
**power-limit trim** graph: watts on one axis, Superposition score on the other. Anything that
claims an Afterburner-style V/F curve on this stack is wrong.

## Pieces

| Piece | What it does |
|---|---|
| `tools/lib/gpu-model.ts` | anchors (MASTER stockBaseline), the clock/power/score model, the recipe caps, the stop rules |
| `tools/gpu-oc-plan.ts` | `ladder` (recipe steps), `sweep` (all knob combinations, ranked), `blocks` (console-safe apply + inverse) |
| `tools/gpu-curve.ts` | the undervolt graph: ASCII, CSV and SVG; refits itself against real receipts |
| `tools/gpu-bench-parse.ts` | dmon + Superposition + Geekbench text → one normalized run record, stop rules applied |
| `tools/gpu-oc-verify.ts` | ranks the ledger, says ADVANCE / HOLD / REVERT / REBENCH, emits the GWE profile spec |
| `scripts/gpu-oc-apply` | target-facing applier: `probe`, `apply`, `verify`, `meter`, `powerlimit`, `revert` — all quoting lives here so chat blocks stay console-safe |
| `receipts/gpu-oc-receipts.json` | the ledger; the only thing that outranks the model |
| `scripts/gpu-dmon-summary` | reduces a 47 KB dmon log to peaks + a 3-line block the parser eats — no giant pastes |

## Workflows

> Sources live in `ci/workflows/`. Activate them once with `sh scripts/install-github-workflows.sh`
> (copies to `.github/workflows/`) — the agent GitHub App has no `workflows` push scope.

| Workflow | Trigger | Use |
|---|---|---|
| `ci/workflows/oc-tools-ci.yml` | push / PR | syntax, MASTER JSON, all selftests, shellcheck, byte-determinism, PR budget |
| `ci/workflows/gpu-oc-lab.yml` | manual | pick ranges → ranked candidates + undervolt graph + pasteable blocks (lint-checked) as artifacts and a job summary |
| `ci/workflows/gpu-clock-feature-matrix.yml` | manual / weekly | one job per knob class: core-only, memory-only, power-trim, combined, efficiency-hunt; also re-proves the caps and the step-4 gate |
| `ci/workflows/gpu-receipt-ingest.yml` | manual | paste dmon + Superposition (+ Geekbench) for one step → verdict, refitted curve, GWE profile, ledger commit |

## Undervolt **and** overclock (operator directive 2026-08-27)

Standard practice for a card of this vintage, and the right call here: the 3080 is pinned at 314 W
of a 320 W limit at stock, so raw clock is capped by watts, not by silicon. The pair is
`node tools/gpu-oc-plan.ts ladder --uvoc`:

| tier | core | mem | power | what it is for |
|---|---|---|---|---|
| `uvoc-1` | +60 | +250 | 90 % | first pair, should be near score-neutral |
| `uvoc-2` | +90 | +400 | 85 % | |
| `uvoc-3` | +120 | +500 | 80 % | usual daily sweet spot on a pinned 3080 |
| `uvoc-4` | +120 | +500 | 70 % | quiet/cool profile, real score loss |
| `uvoc-max` | +150 | +600 | 75 % | most clock a deep trim can hold |

The verdict engine now walks it that way: a clean full-power step advances to **its own trimmed
twin** before it advances to more clock.

## nvidia-settings will lie to you

Receipt 2026-08-27: `apply 60 250` printed *"Attribute 'GPUGraphicsClockOffset' assigned value 60."*
and exited 0 — and the read-back was **0**. The `...AllPerformanceLevels` attributes are also
permission-denied on this Coolbits value while the per-level form is allowed. `scripts/gpu-oc-apply`
therefore assigns `[gpu:0]/ATTR[LEVEL]` (level auto-detected from `GPUPerfModes`), reads the value
back, fails loudly on mismatch, and treats any `ERROR` line as failure regardless of exit code.
`sh gpu-oc-apply caps` probes exactly which writes this session permits.

Worse, the level index itself was wrong: `GPUPerfModes` on this card lists **perf=0..4** and the
load level is **4** (memclock 9501 / memTransferRate 19002), not the 3 that older recipes assume. An
offset written to level 3 is an offset the benchmark never sees. The applier now auto-detects the
top level, applies there strictly, mirrors to the level below best-effort, and prints both.

## Loop

1. **Plan** — `node tools/gpu-oc-plan.ts ladder`, or run `gpu-oc-lab` with your ranges. Blocked rows
   are blocked for a reason (caps from the recipe, the step-4 PSU gate, the 83 C stop rule).
2. **Paste** — one step, one wave. Apply + meter blocks in the user shell; power-limit blocks in a
   root shell. Every step ships with its inverse.
3. **Meter** — `sh gpu-oc-apply meter STEP_ID 300` writes `~/oc-meters/STEP_ID.dmon.csv` while
   Superposition 1080p Extreme runs. Same preset forever, or the comparison is void.
4. **Ingest** — run `gpu-receipt-ingest` (or `gpu-bench-parse` locally) with the pasted output.
5. **Judge** — `gpu-oc-verify` prints ADVANCE / HOLD / REVERT / REBENCH with the reason, plus the
   best-score step, the best pts/W step, and the daily recommendation inside the loss budget.

## What the model is and is not

It projects from the MASTER stock receipts (score 8717, pclk 1935, mclk 9501) plus the 2026-08-27
target receipts: **power.limit = power.default_limit = power.max_limit = 320.00 W, Min Power Limit 100 W** (no raise is
possible, the model and the applier both refuse >100 %), **clocks.max.graphics 2100 MHz** (projected
clocks are clamped there, and offsets past +165 are flagged as dead), Coolbits **live**, and the
measured stock meter (`gpu-stock-671-superpos.csv`, 535 samples): **314 W peak, 81 C peak, pclk 1905**.
The card is already pinned at its power limit at stock with 2 C of thermal headroom, so the verdict
engine treats clock offsets as thermally near-free and points the campaign at the trim tiers for the
real wins. `gpu-curve --measured=` fits `referenceW` against score **and** watts (a score-only fit is
degenerate whenever a run was not power-limited) and reports the RMSE. It assumes power
grows with clock^1.35, that a clock offset keeps ~70 % of its value while the board is pinned at the
power limit, and that Superposition 1080p Extreme is 75 % core / 25 % memory bound. Every projected
number is printed as `projected_*` and is only a queue-ordering aid. `gpu-curve --measured=` refits
the two untrusted anchors against real runs and reports the RMSE.

## Local quick start

```bash
node tools/gpu-oc-plan.ts ladder
node tools/gpu-oc-plan.ts sweep --core=0:150:30 --mem=0:800:200 --pl=70:100:10 --sort=eff --top=10
node tools/gpu-curve.ts curve --core=120 --mem=500 --pl=60:100:5 --svg=out/curve.svg
node tools/gpu-oc-plan.ts blocks --core=60 --mem=250
node tools/gpu-bench-parse.ts parse --id=cp60-m250-pl100 --core=60 --mem=250 --dmon=out/dmon.txt --superposition=out/super.txt --append=receipts/gpu-oc-receipts.json
node tools/gpu-oc-verify.ts verify --receipts=receipts/gpu-oc-receipts.json --emit-gwe=out/gwe.json
```

## Gates that still bind

- Coolbits must be live (operator log out / log in, never a VT switch) before any offset applies.
- Power limit **above 100 % is impossible** (max == default == 320 W): the planner errors, no flag
  overrides it, and `scripts/gpu-oc-apply` refuses it outright.
- Core `+150` / memory `+700` are hard caps in both the planner and the applier.
- Any artifact, crash, driver reset, or sustained 83 C = revert to the previous step, and record it
  with `--artifacts` so the ledger keeps the failure.
- GWE "apply on login" stays OFF until a week of clean daily use.
