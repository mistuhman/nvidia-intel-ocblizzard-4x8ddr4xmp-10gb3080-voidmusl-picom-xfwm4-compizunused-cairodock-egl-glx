# OC Campaign Plan — 12700KF + RTX 3080 10GB (official benchmarks + meter)

Target: Void Linux, kernel 6.18.35-tkg-bore, NVIDIA 595.84, ZFS root, daily-driver XFCE/compiz.
Objective: official, comparable benchmarks at stock and at every undervolt/OC step, with watts/temps/clocks logged every second.

## Meter rule (same every run — this is the whole method)

Run the same benchmark set at stock, then again after every change. Compare:

| Run label | Geekbench CPU (SC / MC) | Geekbench GPU + API | Superposition score + preset | Peak GPU W | Peak GPU C | Peak pclk MHz | CPU PkgW peak | Bzy_MHz peak | Repo file |
|---|---|---|---|---|---|---|---|---|---|
| stock (2026-08-25 06:20 UTC, in flight) | (paste URL) | (paste URL + Vulkan or OpenCL) | NOT RUN YET | | | | | | oc-meters/*-stock.* |
| step1 +60/+250 | | | | | | | | | oc-meters/*-oc1.* |
| step2 | | | | | | | | | oc-meters/*-oc2.* |
| BIOS 50P/40E @1.28V | | | | | | | | | oc-meters/*-bios1.* |

### Meter capture rules (learned 2026-08-25, non-negotiable)

1. **Meters go to files, never to the terminal.** `turbostat -i 1` without `--Summary` prints one row per logical CPU per interval — 20 threads x ~12 min = ~14k lines, interleaved with the benchmark's own stdout, so the scrollback dies and the evidence is lost. Use `--Summary` (1-line system summary per interval) plus `--out <file>`; fall back to a shell redirect if that build lacks `--out`.
2. **Never `cat` then `rm` a meter.** Summarize it with awk and leave the file in `/home/sd/oc-meters/` named `<metric>-<runlabel>.csv`. The file is the receipt.
3. **Record the compute API.** Geekbench 6 only offers the GPU APIs present on the system (Vulkan and/or OpenCL) and NVIDIA OpenCL needs its own runtime package. If OpenCL appears or disappears mid-campaign the GPU score moves for reasons unrelated to the overclock. Pin it, write it in the table.
4. **Label the baseline honestly.** "Stock" here means stock CPU/GPU knobs — the p2/p3 system diet (ARC 4G, swappiness 1, nmi_watchdog 0, autostart diet) persists across reboot and is part of every row.
5. **CPU knobs do not survive reboot** (proven 06:20 UTC: governor back to `powersave`, EPP back to `balance_performance`). Re-apply bench governor/EPP after every reboot, or persist via a runit service, and say which one the row used.
6. **Sanity band for this CPU:** browser.geekbench.com lists the 12700KF at 2255 SC / 14367 MC; cpu-monkey at 2528 / 14129. Treat SC 2250-2550 and MC 13200-14400 as the valid-stock window — outside it, suspect thermals, background load, or a wrong governor, not a real result.

### Stock pre-flight state (receipt 2026-08-25 06:20 UTC)

| Item | Value |
|---|---|
| Root disk | 918G, 101G used, 817G avail, 11% |
| intel_pstate | active, no_turbo=0, max_perf_pct=100, min_perf_pct=17 |
| Governor / EPP | powersave / balance_performance (stock — earlier tuning did not persist) |
| GPU idle | RTX 3080, driver 595.84, P3, 57.09 W / 320.00 W, 37 C, 1275 MHz core, 5001 MHz mem |
| Geekbench | 6.5.0 Build 603552 at /opt/geekbench/Geekbench-6.5.0-Linux, symlinked to /usr/local/bin/geekbench6 |
| Platform | HP OMEN 45L GT22-0xxx, board HP 8917, BIOS AMI F.51, kernel 6.18.35-tkg-bore, 31.1 GB |

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
