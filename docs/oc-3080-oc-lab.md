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
target receipt: **power.limit = power.default_limit = power.max_limit = 320.00 W** (no raise is
possible, the model and the applier both refuse >100 %), **clocks.max.graphics 2100 MHz** (projected
clocks are clamped there, and offsets past +165 are flagged as dead), Coolbits **live**. It assumes power
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
