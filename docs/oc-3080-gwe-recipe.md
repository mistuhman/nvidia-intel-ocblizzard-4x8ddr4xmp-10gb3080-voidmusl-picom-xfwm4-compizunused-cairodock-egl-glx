# 3080 10GB — GWE recipe (conservative Linux overclock + soft undervolt)

## Hard truth first

Linux does NOT expose the per-point voltage curve (Pascal and newer; NVIDIA removed it). Windows Afterburner-style "undervolt" is not possible on Linux. The Linux equivalents are:

- **Soft undervolt / power trim:** lower power limit (reduces watts and heat; clocks drop only when the limit trips).
- **Clock-to-power tuning:** clock offsets plus a power limit, tuned against the same benchmark = the meter.
- Fan curve control: GWE does this (CoolBits 16 bit, already enabled).

## Requirements

- CoolBits 28 LIVE — **CONFIRMED 2026-08-27**: `nvidia-settings -q GPUGraphicsClockOffset -t` and `-q GPUMemoryTransferRateOffset -t` both print `0`, no error. Card ceiling from the same receipt: `clocks.max.graphics 2100 MHz`, so offsets past +165 are dead.
- gwe installed (Void `gwe` 0.15.5). Launch: `gwe` in the X session.

## Steps (one at a time; bench + meter between each)

| Step | Graphics offset | Memory offset | Power limit | Notes |
|---|---|---|---|---|
| 0 (stock) | 0 | 0 | stock (probe shows e.g. 320W) | baseline |
| 1 | +60 | +250 | stock | first run |
| 2 | +90 | +400 | stock | if step 1 clean |
| 3 | +120 | +500 | stock | if step 2 clean; HOLD here for a week of daily use before more |
| 4 | ~~+10% power~~ **DEAD** | — | — | IMPOSSIBLE on this card: receipt 2026-08-27 shows power.limit = power.default_limit = power.max_limit = 320.00 W. There is no headroom to unlock; the only power knob is trimming DOWN (see docs/oc-3080-oc-lab.md undervolt tiers). |

Do not exceed +150 core or +700 memory on the 3080 10GB without a 3rd-party cooler review; GDDR6X runs hot. 3080 10GB typical safe zone: core +100..+150, memory +400..+800 for daily.

## Stop rules (any of these = revert to previous step)

1. Any crash, freeze, black screen, or driver reset during bench.
2. Any visual artifacts (sparkles, stripes, flicker).
3. Card temp above 83 C sustained during the whole Superposition run.
4. Peak power above the card's own max limit shown by nvidia-smi (e.g. 320W/350W class) — see p5 output.
5. Fan at 100% still can't hold temp — revert.

Revert in GWE: set both offsets to 0, apply. OR CLI fallback below.

## GWE specifics

- Pop-up for "Coolbits" is expected if it was never live — that is the log-out/in gate, not a bug.
- Profile tab: "Persist profile" / apply-on-startup should stay OFF until the week-long daily test passes (then enable after operator OK).
- Power limit slider may be grayed out on some cards; nvidia-smi -pl is the root fallback, but do NOT raise it before step 4 gate.
- Fan tab: leave automatic until step 3 passes; then only curve for noise, never to mask heat.

## CLI fallback (local terminal only — quotes will be stripped by the web console)

```bash
# apply step 1 (GPU 0, performance level 3)
nvidia-settings -a "[gpu:0]/GPUGraphicsClockOffset[3]=60"
nvidia-settings -a "[gpu:0]/GPUMemoryTransferRateOffset[3]=250"
# read back
nvidia-settings -q GPUGraphicsClockOffset -t
# reset
nvidia-settings -a "[gpu:0]/GPUGraphicsClockOffsetAllPerformanceLevels=0"
nvidia-settings -a "[gpu:0]/GPUMemoryTransferRateOffsetAllPerformanceLevels=0"
```

## Persistence

GWE offsets reset on X restart by design; enable the GWE "apply profile on login" only after the operator OK from one week of stable daily driving. Meter evidence stays in /home/sd/oc-meters/*.csv and docs/oc-plan.md table.
