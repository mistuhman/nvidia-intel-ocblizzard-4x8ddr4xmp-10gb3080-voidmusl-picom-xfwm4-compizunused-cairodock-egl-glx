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

The OMEN cuts power before the validated recovery stick is read. Repeating the clean stick,
another port, or another keyboard combination cannot repair that pre-USB failure. Research
found a more direct untested path: the board exposes an `FDO/PSWD/BBR` header, and independent
Omen reports describe BBR as the path that forces boot-block recovery. Those reports are on
other boards, so their pin numbers are not transferable. We identify the BlizzardOC position
first, then decide whether the operator wants one BBR attempt.

## Ground rules (before any BBR test)

- Main power switch OFF, cord OUT of the wall, and power button held 20-30 seconds.
- Keep only the reported 3080, RAM, wired keyboard, monitor, and power attached. No HDD,
  wireless dongle, mouse, Ethernet, or extra USB device.
- Do not move `FDO` or `PSWD`; BBR is the only candidate under consideration.
- One physical change and one power-on only. If recovery activity begins, do not interrupt it.
- A failed result is still a result: stop and report it rather than trying another jumper pair.

## Media and firmware artifacts

The rebuilt 7.34 GB FAT32 `HP_TOOLS` stick with `HP\BIOS\New\08917.bin` and `08917.sig`
was already tested and produced the same immediate cycle with no LED/activity. Preserve it;
do not format it or repeat its Win+V/Win+B attempts.

The research pass found two non-vendor Linux projects that extract or invoke HP's signed EFI
flasher. `Rixmerz/hp-omen-bios-flash-linux` was verified only on an OMEN 15 / board 8787;
`Ocean-Moist/hp-bios-flash-linux` was verified only on an Insyde OmniBook. Neither proves
compatibility with AMI BlizzardOC 8917. The useful pre-power question is whether `sp167160.exe`
contains `HpBiosUpdate.efi` and its matching signature files. A raw `.bin` must not be wrapped
in a guessed capsule or altered firmware image.

### Step 0 — no-power preflight

1. Keep the OMEN off. Photograph the untouched `FDO/PSWD/BBR` header straight-on with the
   blue cap still installed. The photo must show all three pins, the cap orientation, nearby
   silkscreen, and enough board context to establish left/right. Do not move the cap.
2. If `sp167160.exe` is available on any currently accessible host, inspect or extract it
   without executing anything on the OMEN. Windows is not required. Record whether it contains
   `HpBiosUpdate.efi`, `.s09`/`.s12`/`.s14`/`.sig` siblings, and the exact image/signature names.
   Preserve the validated USB source; if the SoftPaq is unavailable, do not block BBR on it.
3. Report whether a 3.3 V SPI programmer/clip or a DMM/logic probe is already owned. This is
   inventory only; do not buy or connect hardware by assumption.
4. Send the photo and artifact/instrument receipt back before any power-on.

This preflight is not a firmware attempt. It resolves the only missing board-specific fact
before we name the last power-on.

## Historical photo receipts — complete; do not repeat

The board, bottom edge, front-panel bundle, labels, and cooler-header photos were already
captured and mapped. They established `PB` as the real power-button header, `CMOS` as the
small center-bottom clear cap, and `FDO/PSWD/BBR` as a different untouched jumper. No new
photo, short, cable removal, or jumper move is part of the BBR preflight.

## Closed power-path checks — do not repeat

The photo mapping and prior target receipts are complete. `PB` was confirmed as the real
power-button header; the brown/black pair beside `PWR_LED` was not the power path. With
`PB` unplugged, cord-in still triggered the same automatic cycle (**FAIL**). The labeled
`CMOS` cap was moved to the other pair for about 20 seconds and restored; the cycle was
unchanged (**FAIL**). Fans run during the cycle, so the pump/zero-RPM theory is closed.
The prior minimal-bench, zero-DIMM, and clean recovery-media attempts also produced no
usable POST or USB activity. Do not repeat cable, GPU, DIMM, CMOS, or current-stick tests.

`FDO/PSWD/BBR` remains a separate optional jumper experiment, not an implied next step. It
requires the operator to explicitly name it first; do not move that cap by inference.

## One BBR power-on discriminator

This is the only scheduled next power-on, and it requires the Step 0 photo and artifact
receipt plus explicit operator opt-in. The exact BlizzardOC BBR pair must be read from that
photo or an exact BlizzardOC source; do not use the 5–6 or 1–2 numbers reported for other
Omen/HP boards. Use the existing verified recovery stick, not an unverified alternate.

1. With the PSU off, cord out, and power button held 20-30 seconds, confirm the 3080, RAM,
   wired keyboard, monitor, and power are the only attached hardware.
2. Insert the existing verified `HP_TOOLS` stick in a rear motherboard USB-A port. Leave
   `FDO` and `PSWD` in their normal untouched state.
3. Move the blue cap once from its confirmed normal position to the confirmed BlizzardOC
   BBR position. Power on once with no Win+V or Win+B. Watch the stick LED, speaker, screen,
   and exact time to power-off. Do not interrupt a recovery/flash interval.
4. **Pass:** LED/read activity, beeps, HP output, or a materially longer powered interval.
   Stop and report. **Fail:** the same silent immediate cycle with no activity. Stop and
   report. If it fails, remove AC power and return the cap to its documented normal position;
   that is the rollback, not a second test. Do not try another header position or media
   permutation.

If BBR passes, leave the board alone until we identify whether the HP-created recovery tree
or the signed `HpBiosUpdate.efi` path is the correct flash artifact. If a flash completes,
power off, remove AC, restore the cap to its documented normal position, then use Escape for
ZBM and F10 for BIOS.

## If the BBR test produces the identical instant cycle

Stop. Do not repeat either recovery stick, repeat Win+V/Win+B, or make another cable/jumper
change. Report the exact header position, media identity, LED result, screen/speaker result,
and time to power-off. The next free discriminator is an owned, safe instrument (read-only
SPI identification/dump or PS_ON#/rail observation), not another guess.
