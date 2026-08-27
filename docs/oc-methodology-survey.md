# OC methodology survey — software to hardware (this rig, 2026-08-27)

Requested 2026-08-27: "parse all sorts of documentation and methodology for overclocking from
software to hardware." Companion to `oc-plan.md` (what we do) — this file is the *why and how it
works* for every lever, in one place, with receipts. State column = this rig as of WAVE-17.

## How to read

Per lever: what it physically does / what the receipts say on THIS rig / next move / risk /
inverse. The ledger (`receipts/gpu-oc-receipts.json`) outranks every projection below.

## 1. GPU — RTX 3080 10GB (GA102), driver 595.91.07, X11 + Coolbits 28

### 1.1 The only real knobs on Linux

Pascal and newer: the NVIDIA Linux driver exposes **no voltage control** — GWE, nvidia-settings,
and NVML all confirm it (GWE issue 118 "undervolt not exposed"; community: "The Nvidia Linux
driver simply does not offer to directly set any voltages. You can only try some overclocking +
lower the power target at the same time to get lower voltage for similar clocks"). The full Linux
surface is:

| Knob | Interface | This rig |
|---|---|---|
| Core clock offset | `nvidia-settings -a [gpu:0]/GPUGraphicsClockOffset[N]` (Coolbits 28) | per-level writes ONLY; AllPerformanceLevels is permission-denied (WAVE-3 receipt) |
| Memory transfer-rate offset | `[gpu:0]/GPUMemoryTransferRateOffset[N]` | 1 unit = 2 MHz mclk (transfer-rate ratio confirmed WAVE-4) |
| Power limit | `nvidia-smi -pl <W>` (root) | 100 W floor .. 320 W max == default; **no raise possible** (WAVE-2 receipt) |
| Fan | `[fan:N]/GPUTargetFanSpeed` | auto; 30 % at idle |
| PowerMizer mode | `[gpu:0]/GPUPowerMizerMode` | stock adaptive (0) |
| Perf levels | read `GPUPerfModes` | 5 levels, load level = 4 (WAVE-4 receipt) |

Per-level write form and "write to the top valid index" is the upstream-confirmed method
(NVIDIA open-gpu-kernel-modules discussion #236, arisu3 2025: "Rather than
GPUGraphicsClockOffsetAllPerformanceLevels, change GPUGraphicsClockOffset[N] where N is the
largest valid index"). Clock offsets beyond ~200 MHz stop moving voltage (xor2k, same thread).
NVML equivalents (`nvmlDeviceSetGpcClkVfOffset`, `nvmlDeviceSetMemClkVfOffset` — mem offset
×2, `nvmlDeviceSetPowerManagementLimit`) exist since driver 555.85; not needed while
nvidia-settings works.

### 1.2 Power-pin physics (the whole 3080 story)

Stock meter: **314 W of the 320 W limit at stock, 81 C** — the card is already power-pinned
before any OC. Consequences, all measured on this rig:

- A core offset under the pin retains ~25 %: +60 offset → loaded pclk 1920 vs stock 1905
  (WAVE-13). More offset does not buy proportional clocks while watts are capped.
- A memory offset fully realizes (9626 = 9501+125 at +250) but 1080p Extreme is not memory-bound
  here, and the faster mclk steals power from the core under the pin (WAVE-13/14).
- Therefore score upside from GPU OC at 100 % PL is ~1-3 %, and the real levers are the
  **power-trim tiers** (watts down, clocks follow, cooler, quieter) — the uvoc ladder
  (`node tools/gpu-oc-plan.ts ladder --uvoc`). Windows-style curve undervolting on the same card
  community-lands at ~0.9 V / 1950-1995 MHz / ~240-250 W avg / ~4 C cooler; on Linux we
  approximate that with PL trim + offsets (r/linux_gaming receipts).
- Metered so far: stock 8717 (1 draw) / +60+250@100 % 8635 / +60+250@90 % 8447 (3-run median,
  spread 0.66 %) / +90+400@95 % 8576 (knee, −1.62 % vs stock, best Min FPS 51.16, 304 W).

### 1.3 Idle GPU (operator goal: near-zero at all times)

- A video wallpaper (our mpv + xwinwrap HEVC loop at 4480x1440) **cannot** coexist with near-zero
  GPU idle — decode + upscale + compositor refresh keep the card awake. Options: static image
  (0 % class), on-demand video, or accept the cost. This is a desktop-state decision, not a
  tuning one.
- X11 + NVIDIA idle utilization pinned 20-35 % is a **known xorg.conf artifact**: `Option
  "MetaModes" "... {ForceCompositionPipeline=On}"` / TripleBuffer / composition-pipeline options
  do it; removing them returned a 3090 to 0-1 % idle (r/openSUSE receipt). Check
  `/etc/X11/xorg.conf.d/20-nvidia.conf` in the idle inventory wave — if it carries such options,
  that is the single highest-value idle fix available.
- Floor on this card: ~15-25 W draw at 0-1 % util regardless of settings (driver + 4K-class
  framebuffers); "near zero percent" = utilization %, not watts.

## 2. CPU — 12700KF (Alder Lake, 8P+4E, no iGPU)

### 2.1 Firmware reality (receipted, 2026-08-25)

HP BlizzardOC 8917 exposes **memory OC only** in F10 — no CPU ratio, Vcore, or LLC, even with
Extreme Unlocked. No published unlocked image; F.57 flash is one-way and security-only.
LibreBoot/coreboot: CLOSED CLASS (no Z690/OMEN 45L in LibreBoot's supported list; only Z690
coreboot ports are MSI PRO Z690-A/Z790-P; this board's Boot Guard kills modified images).
Plundervolt mitigations block OS voltage offsets (HP staff).

### 2.2 The MSR ladder (the live path)

What is locked is *firmware lock bits*, not silicon — the K multiplier is unlocked in silicon and
the bits are inspectable (and sometimes writable) from Linux (`docs/bios-flash-decision.md`):

| MSR | Meaning | Move |
|---|---|---|
| 0x194 bit 20 | OC lock | read-only probe first; if set, ratio/Vcore stays closed |
| 0x150 | OC mailbox (voltage) | intel-undervolt only if the lock reports unlocked |
| 0x1ad | turbo ratios | read what the firmware programmed |
| 0x610 / 0x611 | PL1 / PL2 (+Tau, clamp bits) | **the lever** |

PL1/PL2 mechanics (setPL tooling + Intel threads): PL1 = long-duration limit, PL2 = short boost
limit (Tau seconds, then drops to PL1; clamp bits force-throttle). OEM boards ship PL2 well under
silicon max — that is the free headroom on a power-limited KF. Community practice for 12700K/ KF:
PL2 200-250 W is the stable band on good air cooling (MCE/4095 W is the "unlimited" profile and
hits 100 C on this part — do not); set PL1 = PL2 to avoid the Tau drop-off for sustained work;
setting limits too *low* causes instability while the CPU chases unreachable turbo (tomshardware
12700K thread). The setPL script writes both the RAPL sysfs limits and MSR 0x610 and then disables
the MMIO (MCHBAR) threshold + locks the PCU bit so microcode can't rewrite it — persistence for
the power-on session; a runit service re-applies per boot (CPU knob persistence is still an open
gate in MASTER).

Guardrails: 100 C is the throttle point, 105+ the shutdown cliff; the 12700KF is a hot part —
PL2 raises are metered with turbostat (PkgWatt, Bzy_MHz, TjDelta) + `sensors` + the official
bench set, one value at a time, inverse = restore the read-back defaults (recorded before the
write).

Already landed on the OS side: governor powersave + EPP, BORE kernel, IRQ pinning (GPU=CPU4,
NIC=CPU18) — the cheap half of the CPU win.

## 3. Memory — 4x8 GB DDR4-3733, 2DPC (IMC-bound)

- 2 DIMMs per channel is what limits this 12700KF IMC (rated DDR4-3200, lower at 4-DIMM);
  the die is still UNVERIFIED — die ID is a prerequisite for anything beyond 3866.
- Ladder: 3733 (live, XMP) → 3800@1.35 → 3866@1.40 → 4000@1.45 (target) → 4000@1.50 (ceiling).
  1.55 V FAILED to boot — never repeated.
- Booted ≠ stable: on a ZFS root the failure mode is silent corruption, so every step gates on
  stress-ng --vm + memtester + clean zpool scrub (`docs/oc-ddr4-4000-lab.md`, `scripts/ram-validate`).

## 4. System / OS — processes and idle (operator goal: minimum + near-zero)

- Method: inventory first (`ps -eo` sorted by pcpu/pmem, `uptime`, nvidia-smi idle, the xorg
  conf), then cut one process/merge one role per wave, meter before/after (durableFacts.perf is
  the scoreboard: 12 G used / 18 G avail, GPU idle 25 %→ target 0-1 %).
- Known consolidations on this rig (from prior sessions): omen-sqm is CAKE SQM — KEEP; dangling
  persistenced/zfs-zed/rc.local runsvdir links already removed; picom stays masked; the beauty
  stack (compiz-reloaded + cairo-dock + wallpaper) is frozen and accepted — changes to it are
  their own operator-gated waves, and the video wallpaper is the one item structurally at odds
  with "GPU idle near zero at all times" (see 1.3).
- Compiz/X11 levers if the compositor shows up hot: vblank mode (xpresent/glx/off via
  xfconf-query), plugin-level effects (our golden profile af457926 already trims these),
  `__GL_YIELD=USLEEP` (proven to matter, WAVE-era receipt).
- runit is the service layer: "singular efficient ones" = one runsvdir-supervised service per
  role with a log, instead of scattered autostart entries — the persistence decision (CPU knobs +
  GPU profile at login) lands here.

## 5. Cross-cutting method (non-negotiable)

1. Meter every step: dmon (GPU) + turbostat (CPU) + sensors + the official compare set. No meter,
   no verdict.
2. One knob (or one uvoc tier) per wave; every target-changing step ships with its inverse.
3. Variance: ≥2 runs per condition before a delta is trusted (the 0.66 % three-run spread on
   1080p Extreme set the noise floor).
4. Ledger outranks model; the model is queue-ordering only and refits against receipts.
5. Stop rules are hard: 83 C GPU, artifacts, driver reset, 100 C CPU, ZFS corruption → revert +
   record the failure.
6. Log the interface, not just the value: HOW a setting was applied (F10 / MSR / sysfs /
   nvidia-settings / runit) is part of the receipt — recovery differs by mechanism.

## Sources

- NVIDIA open-gpu-kernel-modules discussion #236 "Undervolting support" (per-level offset form;
  NVML offset APIs since 555.85; offset ≳200 MHz stops moving voltage)
- r/linux_gaming "Undervolting on linux, 30th series" + "I don't understand how undervolting my
  GPU on linux works" (no voltage on Linux; PL + offset as the workaround; 3080 290 W / −155 MHz
  example)
- r/nvidia "RTX 3080 undervolt - your experience" (Windows curve targets 0.9 V @ ~1950-1995,
  ~240-250 W avg)
- github.com/horshack-dpreview/setPL (PL1/PL2 via RAPL sysfs + MSR 0x610 + MCHBAR PCU lock)
- tomshardware "12700K - TDP and PL2 settings" (0-4095 W range, Tau, clamp bits, MCE/4095,
  too-low limits cause instability)
- r/openSUSE "NVIDIA high idle GPU utilization in X" (ForceCompositionPipeline/MetaModes/Triple
  Buffer xorg options → 20-35 % idle; removal → 0-1 %)
- forum.xfce.org #19100 (compositor vblank xpresent/glx/off)
- libreboot.org 2024-02-25 release notes (supported-hardware list; no Z690/OMEN)
- in-repo receipts: MASTER durableFacts (WAVE-2..17), docs/oc-3080-gwe-recipe.md,
  docs/oc-cpu-bios-checklist.md, docs/bios-flash-decision.md, docs/oc-ddr4-4000-lab.md
