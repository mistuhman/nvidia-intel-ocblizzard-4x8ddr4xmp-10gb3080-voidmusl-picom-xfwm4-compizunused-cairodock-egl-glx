# OMEN free recovery runbook — kill the power-cycle, then flash, then boot Void

Operator directive 2026-08-26. This is the shared medium. It is free, reads on a phone,
and we do it one action at a time. No external escalation. If a
step does not produce a clear result, stop, report the exact behavior, and we pick the
next single test together.

## Goal

1. Make the OMEN stop the immediate rapid power-cycle.
2. Get it to stay powered long enough for the new BIOS to be read.
3. Flash the fresh BIOS (F.57 / `sp167160` / `08917.bin`, already built and verified).
4. Boot Void from the ZBM menu and finish the strong, free CPU/GPU optimization objective.

## Why this order matters

The OMEN currently cuts power before it reads the USB stick, so no stick, key-combo, or
hotkey can matter yet. Three free checks change that. Only after one of them makes the
board hold power do we bother with the flash.

## Ground rules (do these before every power-on test)

- Main power switch OFF, cord OUT of the wall rear, power button held 20-30 seconds.
- Only the 3080, RAM, wired keyboard, monitor, and power attached. No HDD, no wireless
  dongle, no mouse, no Ethernet, no stick unless a step says to.
- One action at a time. Do not chain steps.
- If the board stays on and reaches a beep or any HP screen, stop and report it. That is
  a pass.

## Stick choice (on the separate Windows machine)

From the Windows Disk Management photo 2026-08-26:

- **Stick A — preferred:** Disk 3, Removable, 491 MB, FAT, Healthy Active Primary. This
  is the clean single-partition alternate stick.
- **Stick B — not preferred:** the 375 GB Ventoy stick (exFAT `I:` plus `VTOYEFI` 32 MB).
  Multi-partition; leave it alone unless Stick A genuinely fails.

### Step 0 — put the verified recovery payload on Stick A (Windows, no commands)

1. Open the existing verified clean recovery stick (the one with `HP`, `Hewlett-Packard`,
   `EFI` folders and `HP\BIOS\New\08917.bin` + `08917.sig`) in File Explorer.
2. Select everything in its root, copy it.
3. Open Stick A (`F:` in the photo), paste.
4. Confirm the same three top-level folders exist on Stick A, and that
   `F:\HP\BIOS\New\08917.bin` and `08917.sig` are present. `08917.bin` should be about
   16.4 MB and the `.sig` about 1 KB.
5. Safely eject both sticks. Report the Stick A free-space used.

If the 491 MB stick is too small to take the payload, do not format it blindly — report
the copy error and we will use Stick B or a third candidate.

## Photo receipts (do this before ANY shorting or cable removal)

We do not guess which pins are power. Send these pictures, in order, with the OMEN
powered off (cord OUT, PSU switch off, power button held 20-30s):

1. **Full board** — side panel off, phone straight above, flash on, whole motherboard
   visible and in focus.
2. **Bottom edge of the board** — the front-panel header lives there on almost every
   board; get close enough to read the white text labels on the PCB.
3. **The front-panel cable bundle** — where the case's small wires plug in. Do not
   unplug yet; just show the connector and its labels. If the connector is part of a
   combined HP hookup, show the whole connector head.
4. **Any label near a connector** — `F_PANEL`, `FP`, `PANEL`, `PWRSW`, `PWR`, `PWR_SW`,
   `PB`, `LED`, `PWR_LED`, `RESET`, `RST`. Crisp close-up, flash on, text readable.
5. **CPU cooler/pump header area** — same subject for Check 2, so we can identify
   `CPU_FAN` / `CPU_OPT` / `AIO_PUMP` / `PUMP_FAN` in the same pass.

Reference note for identification (not your board yet): HP Omen/Intel-style front panels
use the standard Intel layout where **Power Switch = pins 6 and 8**, Power LED = 2 and 4,
HDD LED = 1 and 3, Reset = 5 and 7, pin 10 no-pin, pin 9 reserved. We only act on that
after the photos confirm which pins are exposed and which pins the case cable currently
occupies.

## Free power-path checks (OMEN side — do these before any flash)

### CLOSED 2026-08-26 (do not repeat) — photo receipts + Check 1 + CMOS

Silkscreen from operator photos: **`PB`** = real 2-pin power button (red on one pin). The brown/black 2-pin by `PWR_LED` is **not** the power path. Case button still cycled with that unplugged. With **`PB` unplugged**, plugging the wall cord **auto-cycled** (lights on). Check 1 **FAIL**.

**`CMOS`** 3-pin blue cap (center bottom, not `FDO/PSWD/BBR`): moved to the other pair ~20s, restored. Same instant cycle. CMOS **FAIL**. That does **not** kill Mechanism A (SPI varstore ≠ coin-cell CMOS).

Pump/0-RPM **closed by operator**: fans run during the cycle, then everything dies. No more cable guesses unless the operator names the test. Next-chat briefing: `docs/next-chat-last-power-on.md`.

### Check 1 — bypass the front-panel power button

This is the test that separates a power-circuit fault from a firmware fault.
ONLY after the photo receipts above confirm the exact two PWR_SW pins.

1. OMEN off, PSU off, cord out, hold power 20-30s.
2. Unplug only the case power-button cable pins from the motherboard power-switch header
   (`PWRSW` / pin 6 and 8 in the standard Intel layout). Do not touch reset, HDD LED, or
   power-LED pins.
3. Briefly touch the two power-switch header pins with a metal screwdriver blade for less
   than a second, then remove the screwdriver.
4. Watch what happens.

- **Pass:** the board comes on and stays on, beeps, or shows any HP screen — the case
  power button/header is the cause. Free fix; report and we set the permanent workaround.
- **Still the instant cycle:** put the case button cable back after the test and go to
  Check 2. Do not keep shorting pins.

### Check 2 — CPU cooler / AIO pump header

Some boards refuse to finish POST and shut back off when they see zero RPM on the CPU
fan or pump header.

1. OMEN off, PSU off, cord out, hold power 20-30s.
2. Find the cooler/pump cable and the header it belongs on (`CPU_FAN`, `CPU_OPT`,
   `AIO_PUMP`, or `PUMP_FAN`). Confirm it is fully seated.
3. If you unplugged and re-seated it, power on and watch the cooler spin immediately.

- **Pass:** cooler/pump spins right away and the board does not cycle — cool
  signal/re-seat was the cause. Free; report.
- **No change:** go to Check 3.

### Check 3 — remove the RTX 3080 entirely

The board speaker beeps on its own, without any display, so pulling the GPU is a safe
isolation test and does not hide diagnostics.

1. OMEN off, PSU off, cord out, hold power 20-30s.
2. Remove the 3080 and both its 6+2 power cables from the PSU.
3. Leave one DIMM in, 24-pin ATX and CPU EPS 8-pin seated, keyboard in a rear port, no
   stick, no other USB.
4. Power on.

- **Pass:** the board beeps or gets to any HP screen with the GPU out — the GPU power
  path / PSU rail is the culprit. Free; report and we re-test with a single 6+2 first.
- **Still instant silent cycle:** reinstall the 3080, restore its 6+2, stop, and report.
  That is the deciding result: the fault is in the board's own power-up path, not media.

## Flash — only after a Check 1-3 pass

1. Reinstall the 3080 and both 6+2, all DIMMs, keyboard in a rear port.
2. Stick A in a **rear** USB port. OMEN off, PSU off, cord out, hold power 20-30s.
3. Plug power, PSU on, press power once, **let it sit in the dark for a full 40
   seconds** — an HP flash can look like a black screen for a while.
4. If nothing after 40s, try once: hold **Win + V**, press power, keep holding **Win + V**
   up to 40s. Then once more with **Win + B**. Then a plain power-on with the stick in.
5. Watch the stick's activity LED. A blinking LED means firmware is reading it.
6. If the flash starts, do not touch power. Let it finish.

Report what you saw at each step, including any beep, any HP screen, any LED blink, and
how long the board stayed on.

## After a successful flash

- Press Escape at the HP splash to reach the ZBM menu (Escape is ZBM, not BIOS).
- Boot Void from NVMe, then run the post-recovery read-only probe and re-add boot order.
- Keep memory at 3733 XMP; never write firmware setup variables or DIMM SPD from the OS.

## If the free checks all produce the identical instant cycle

Stop. Do not repeat them or make guesses. Report the exact sequence and we design the next
single free discriminator together from the actual behavior. The point is not to keep
trying the same thing — it is to keep narrowing the fault with one free test at a time.
