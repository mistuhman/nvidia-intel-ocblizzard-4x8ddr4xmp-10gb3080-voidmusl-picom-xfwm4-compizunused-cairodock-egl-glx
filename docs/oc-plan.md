# OC Campaign Plan — 12700KF + RTX 3080 10GB (official benchmarks + meter)

Target: Void Linux, kernel 6.18.35-tkg-bore, NVIDIA 595.84, ZFS root, daily-driver XFCE/compiz.
Objective: official, comparable benchmarks at stock and at every undervolt/OC step, with watts/temps/clocks logged every second.

## Meter rule (same every run — this is the whole method)

Run the same benchmark set at stock, then again after every change. Compare:

| Run label | Geekbench CPU | Geekbench GPU | Superposition score | Peak GPU W | Peak GPU C | Peak card temp | CPU PkgW | Repo file |
|---|---|---|---|---|---|---|---|---|
| stock | (paste URL) | (paste URL) | (paste) | | | | | oc/base |
| step1 +60/+250 | | | | | | | | oc/oc |
| step2 | | | | | | | | oc/oc |

## Compare with other users (official)

- Geekbench 6: result URL uploads automatically, browse at geekbench.com/browse. CPU and GPU scores comparable with other Linux x86_64 runs.
- Unigine Superposition: free Linux build runs the benchmark and posts to the global leaderboard (benchmark.unigine.com/leaderboards). Same preset every run; 1080p Extreme is the comparison preset if offered, else 1080p Standard/High and note it.

Why not 3DMark: UL does not accept valid results from Linux/Proton (official statements, 2026). Not comparable; skipped.

## Tooling (installed by oc-p6-install.block)

gwe 0.15.5 (GreenWithEnvy, Void repo — upstream archived but packaged and functional; use for offsets, power limit, fan curve).
Fallback if GWE breaks: nvidia-settings CLI in docs/oc-3080-gwe-recipe.md.
Meters: nvidia-smi dmon (GPU CSV), turbostat (CPU package watts, C-state residency), lm_sensors, nvtop.

## Phases

1. Safety + power inspection (oc-p5-safety-root, oc-p5-safety-user) — storage, services, configs, power limits, kernel log, Coolbits live check.
2. Official stock baseline (oc-p7-baseline) — the meter bar.
3. GPU step 1: +60 core / +250 mem in GWE, bench, meter (oc-p8-gwe-oc).
4. GPU refinements: +90/+400, then +120/+500 and (only after PSU plug count confirmed and card allows) +10% power limit (review in docs/oc-3080-gwe-recipe.md — stay under ~83 C and no crash/artifacts for 3 runs).
5. CPU: Linux park-equivalent only (oc-p10-cpu-run: governor/EPP for benches). Real CPU OC = BIOS, docs/oc-cpu-bios-checklist.md, operator-only.
6. Report into repo (this table), then decide persistence: GWE apply-at-login profile after 1 week of daily-driver stability.

## Gates

- Every target-changing block: rollback first (in block header), then forward, then ls -l gate.
- Coolbits must be LIVE (log out/in) before GWE offsets show. p5 user block proves it.
- No power limit change until the operator confirms PSU brand/watts (label) and the exact number of 6+2 plugs into the card.
- GPU stop rules: crash/artifacts/power spike over card limit/bent 84 C = revert to previous step (step rule in recipe doc).
- CPU BIOS: operator does and reports; we validate with the same bench set + stress-ng 15 min.
