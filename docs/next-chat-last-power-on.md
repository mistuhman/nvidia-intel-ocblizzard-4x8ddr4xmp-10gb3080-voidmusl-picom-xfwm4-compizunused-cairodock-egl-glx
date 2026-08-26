# Next chat — last power-on briefing (2026-08-26)

Operator: first message **README.md**, then this file. Deploy every tool/agent.
Do **not** power the OMEN until the briefing is absorbed and **one** next action is named.

## Objective

Stop the instant power-cycle so F.57 recovery USB can be read, boot Void, then extreme-optimization-oc.
Operator: no more random cables. Die trying. Free path only. No external escalation.

## Machine (do not re-identify)

HP OMEN 45L GT22, board **BlizzardOC SSID 8917**, BIOS was **F.51**. i7-12700KF (no iGPU), RTX 3080 10GB, 4x8 HyperX DDR4. Void on nvme/ROOT/void via ZBM.

## Cause still on the table

**Mechanism A:** corrupted UEFI **SPI** setup varstore after a chipsec-adjacent write from Void. Zero-DIMM still no POST (hang upstream of memory). **CMOS jumper does not wipe SPI.** That is why CMOS fail does not kill A.

## Photo-confirmed silkscreen (this session)

| Label | Where | What |
|---|---|---|
| **`PB`** | tiny 2-pin, red on one pin, near 24-pin/USB cluster | **real power button** |
| brown/black 2-pin near `PWR_LED` / Wi-Fi | bottom edge | **NOT** the power path (case button still cycled with it unplugged) |
| `PWR_LED` | bottom | LED only |
| `CMOS` | 3-pin, small blue cap, center bottom | RTC/CMOS clear — **EXECUTED, FAIL** |
| `FDO/PSWD/BBR` | 3-pin, larger blue cap, right of SATA | **NOT moved.** Factory-default / password / BBR. Different from CMOS. Operator refused further jumper/cable work this chat. |
| USB 3 19-pin empty, `FRONT-USB`, `TFAN`/`FFAN`, `SPWR`, RGB | — | not power-on |

GPU support bracket out on purpose. 3080 + both 6+2 in. All 4 DIMMs in.

## Closed tests (do not repeat)

1. **USB recovery** (Ventoy stick and clean one-partition HP_TOOLS with `08917.bin`+`.sig`): Win+V, Win+B, plain power. Instant cycle. **Stick never blinked.** Firmware never enumerated USB.
2. **Check 1 front panel:** shorted the **wrong** 2-pin (brown/black) → nothing. Case button with that unplugged → **same cycle**. Then **`PB` unplugged** + wall cord in → **auto-cycle, lights on**. Power request is **not** the case button. Check 1 **FAIL / closed**.
3. **CMOS cap** moved to the other pair 20s, restored, one power: **same cycle**. CMOS **FAIL / closed**. Matches “SPI varstore, not coin-cell CMOS.”
4. Pump/0-RPM: operator closed it. Fans **do** spin in the cycle then everything dies. Not a pump story.
5. Prior: minimal bench, CR2032 out with GPU out, zero DIMMs, no physical damage.

## Live facts (operator quotes)

- “as soon as i plug in the power cable it power cycles with the lights on”
- “same power cycle, fans and everything works”
- “not a pump issue. everything powers off when it power cycles, enough assumptions”
- “i dont wanna try another bs cable. i just wanna game”
- Leave **off**: cord out, PSU off. Do not idle-cycle.

## What a next agent must NOT do

- Guess cables, GPU-out, or FDO unless the operator **names** that test.
- Stack “maybe this header” into a conclusion.
- Repeat Win+V/B on the same stick/port combo already failed.
- Claim CMOS fail disproves Mechanism A.
- Escalation / paid path. Medium is this repo.

## What IS still unknown (holders)

| Unknown | Who |
|---|---|
| Does an untested physical USB stick enumerate before the board resets? | next test, operator eyes |
| Does boot-block ever run (stick LED) if a different physical medium is present? | next test, operator eyes |
| Will `FDO/PSWD/BBR` change the cycle? | operator must opt in; not scheduled |
| Is PS_ON dropping from firmware vs EC/protection? | not separated yet |
| Capacity, format, and identity of the two alternate sticks | Windows machine, before any copy |

The 7.34 GB one-partition `HP_TOOLS` stick is **not** an unknown anymore: HP creation passed,
then plain power produced the same immediate loop with no USB activity. Do not repeat it or its
Win+V/Win+B combinations.

## Selected next discriminator — alternate physical media

Do the preparation on Windows while the OMEN remains OFF. Open Disk Management and identify
one of the two untested sticks by physical disk number, model, capacity, and partitions. Do not
format, clean, repartition, or touch the two internal disks. On the selected removable stick,
copy the already-verified HP recovery tree from the clean source with File Explorer only; do
not make a new BIOS payload or alter the source. Confirm `HP`, `Hewlett-Packard`, `EFI`, and
`HP\\BIOS\\New\\08917.bin` plus `08917.sig`, then safely eject it.

## One-test rule for the last power-on

After the media receipt above, name **one** action and power on **once**: insert only that
selected alternate stick in a rear motherboard USB-A port alongside the already-reported
3080, RAM, wired keyboard, monitor, and power; use a plain power-on with no Win+V or Win+B.
Watch the stick LED, screen, speaker, and exact time to power-off. **Pass** = the LED blinks,
the board stays on materially longer, beeps, or shows HP output. **Fail** = the same immediate
cycle with no LED/activity. Stop either way and report the complete observation; do not re-test
the current stick or stack another change.

If the alternate test passes, flash F.57 only while the board is demonstrably staying powered
or reading the boot block. If it fails identically, alternate-media enumeration is weakened;
do not repeat media/hotkeys or move `FDO/PSWD/BBR` unless the operator explicitly opts in.

After a real flash: Escape = ZBM, F10 = BIOS. Memory 3733 XMP. efivarfs ro. No setup_var from OS.

## Agents next chat must run

`orient.ts orient` · context agent · one hypothesis per remaining unknown · verify agents against this file and `docs/omen-free-recovery-runbook.md` · `test-all.ts` · `pr-budget.ts main 405`.
