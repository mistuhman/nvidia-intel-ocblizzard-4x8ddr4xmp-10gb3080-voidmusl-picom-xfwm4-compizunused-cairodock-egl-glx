# 12700KF — BIOS overclock checklist (operator-only, in BIOS)

Linux cannot change CPU ratio/voltage; ParkControl is Windows-only. This is the safe path for this rig (ZFS root, daily driver, 850W-class OMEN 45L custom PSU).

## Target (from MASTER.md operator direction)

- P-cores 50x (5.0 GHz), E-cores 40x (4.0 GHz), Vcore 1.28V start, 1.30V then 1.32V max allowed.
- XMP is already running (4x8GB DDR4 XMP, repo name says so) — leave it.

## BIOS order (enter once, change in this order)

1. Save current stable config to a named profile (e.g. STOCK-20260825) — this is the rollback.
2. CPU ratio: P-core 50, E-core 40. Leave ring/cache ratio at stock unless unstable.
3. Vcore mode: Fixed/Manual (not Auto) 1.28V, then only raise to 1.30V → 1.32V if a lower voltage fails validation.
4. LLC (load-line calibration): medium / Turbo level (set exactly the same every time — it changes the effective voltage under load).
5. Leave enabled: Speed Shift (HWP), C-states, EIST, AVX offset 0 (stock), Hyper-Threading.
6. Leave disabled: nothing new. Do NOT enable a V/F offset point table; keep it fixed-ratio for validation.
7. Save + exit. Always wait for a clean boot before stressing.

## Validation protocol (after each voltage step)

1. Boot into Linux, open terminal: `sensors` then check the CPU package is near idle temp (35-45 C) and all cores are visible.
2. `stress-ng --cpu 24 --timeout 900 --metrics-brief` (15 min all-thread). Watch in a second terminal: `turbostat --quiet` (PkgWatt, Bzy_MHz, C6) and `sensors`.
3. Then the full official bench set: Geekbench CPU + GPU, Superposition (same preset).
4. PASS = no WHEA/mce errors in `dmesg -T -l err`, no reboot, no throttling below 4.9 GHz P-core under load, CPU temp under 95 C (honest Alder Lake limit — 100 C is the absolute shutdown point).
5. FAIL = any crash/reboot/screen issue or 95 C+ — revert voltage to previous step in BIOS, or back to STOCK profile, and report.

## Linux-side "park" equivalents (already in oc-p10-cpu-run.block)

- Bench mode: `cpupower frequency-set -g performance` + `-e balance_performance`; back to `powersave` + `balance_power` after.
- C-states stay ON for daily use (idle watts). Deep idle can be trimmed only for OC validation runs, never for daily, and only via documented kernel cmdline — ask first.
- E-core/P-core split: this kernel shows P=0-15, E=16-19. IRQ 149 (GPU) pinned to CPU4, IRQ 151 (NIC) to CPU18 (P and E core respectively); persisted setup is a separate step after OC is stable.

## Report back after each BIOS validation

Sensors snapshot, turbostat summary PkgWatt + max Bzy_MHz, dmesg err count, Geekbench/ Superposition URLs. The benchmark table in docs/oc-plan.md is the scoreboard.
