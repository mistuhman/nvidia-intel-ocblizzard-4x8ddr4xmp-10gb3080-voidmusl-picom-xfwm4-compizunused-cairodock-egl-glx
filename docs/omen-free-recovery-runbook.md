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

The OMEN currently cuts power before it reads the USB stick. The validated clean recovery
stick, front-panel `PB` check, CMOS check, and pump check have now all produced the same
instant cycle, so do not repeat them. The remaining free media discriminator is one
previously untested physical stick; only after that result do we decide whether a flash
attempt has a reason to run.

## Ground rules (do these before the single next power-on test)

- Main power switch OFF, cord OUT of the wall rear, power button held 20-30 seconds.
- Only the 3080, RAM, wired keyboard, monitor, and power attached. No HDD, no wireless
  dongle, no mouse, no Ethernet, no stick unless a step says to.
- One action at a time. Do not chain steps.
- If the board stays on and reaches a beep or any HP screen, stop and report it. That is
  a pass.

## Recovery-media state and the remaining media discriminator

The verified clean source is the rebuilt **Disk 3**, a single-partition 7.34 GB FAT32
`HP_TOOLS` stick containing `HP`, `Hewlett-Packard`, `EFI`, and
`HP\BIOS\New\08917.bin` plus `08917.sig`. Its plain-power recovery attempt already
produced the same immediate cycle with no stick activity; do not repeat that stick or its
Win+V/Win+B combinations.

The operator has two other physical sticks, but their capacities, formats, models, and
Windows disk numbers are not yet recorded. Do not call either one Stick A or Stick B until
Windows Disk Management identifies it. Disk 1 (1.863 TB DATA) and Disk 2 (931.50 GB Windows)
are protected; do not select, format, clean, repartition, or write either disk.

### Step 0 — identify and prepare one alternate stick (Windows, no commands)

1. Keep the OMEN off. In Windows Disk Management, record the candidate's physical disk
   number, model, capacity, and partition layout. Leave all disks unchanged.
2. Select exactly one removable candidate only after its identity is unambiguous. If it
   already contains the verified HP tree, confirm the files rather than rebuilding it.
3. Otherwise copy the verified source tree in File Explorer, without formatting or
   repartitioning. Confirm `HP`, `Hewlett-Packard`, `EFI`, and
   `HP\BIOS\New\08917.bin` plus `08917.sig`; the `.bin` is about 16.4 MB and the `.sig`
   about 1 KB.
4. Safely eject the selected alternate stick and report its model, capacity, free space,
   and the exact payload paths. If it cannot hold the tree, stop and report; do not erase
   it and do not silently fall back to another disk.

This preparation is not a firmware attempt. The OMEN stays powered off until the media
receipt passes and the one next power-on is explicitly named.

## Historical photo receipts — complete; do not repeat

The board, bottom edge, front-panel bundle, labels, and cooler-header photos were already
captured and mapped. They established `PB` as the real power-button header, `CMOS` as the
small center-bottom clear cap, and `FDO/PSWD/BBR` as a different untouched jumper. No new
photo, short, cable removal, or jumper move is part of the alternate-media test.

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

## One alternate-stick power-on discriminator

This is the only scheduled next power-on. It requires the Step 0 Windows receipt above:
one untested physical stick has an unambiguous model, capacity, partition layout, and verified
HP recovery tree. If that receipt is not available, keep the OMEN off.

1. With the PSU off, cord out, and power button held 20-30 seconds, leave only the reported
   3080, RAM, wired keyboard, monitor, and power attached. Keep the external HDD, wireless
   dongle, mouse, Ethernet, and all other USB devices out.
2. Insert the **selected alternate stick** in a rear motherboard USB-A port. Do not use the
   already-tested 7.34 GB source stick.
3. Power on once with **no Win+V or Win+B**. Watch the stick LED, monitor, speaker, and the
   exact time until the board either stays on or cuts power. Do not interrupt a flash or a
   long blank-screen interval.

- **Pass:** the stick LED blinks, the board stays on materially longer, beeps, or shows HP
  output. Stop and report exactly what happened; this provides a reason to consider recovery.
- **Fail:** the board repeats the same immediate cycle with no stick LED/activity. Stop and
  report the timing; do not retry this stick, the source stick, or another hotkey combination
  in the same test.

## Flash — only after an alternate discriminator pass

Use the selected alternate stick only if the discriminator showed LED/read activity or a
materially longer powered interval. Keep the 3080, RAM, keyboard, and monitor configuration
that produced the receipt. Initiate one HP recovery attempt using the normal plain-power
procedure, allow a full blank-screen interval, watch for the LED, and never interrupt power
if flashing begins. Do not stack Win+V, Win+B, or another physical change automatically;
name and gate any separate invocation with the operator first.

After a successful flash, press Escape at the HP splash for ZBM, use F10 for BIOS, load
safe defaults with memory at 3733 XMP, and keep efivarfs read-only. Never write setup
variables or DIMM SPD from Void.

## If the alternate test produces the identical instant cycle

Stop. Do not repeat either recovery stick, repeat Win+V/Win+B, or make another cable/jumper
change. Report the exact media identity, LED result, screen/speaker result, and time to
power-off. That is the end of the media discriminator; the next free action must be designed
from those receipts, not guessed in advance.
