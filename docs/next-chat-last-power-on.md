# Next chat — last power-on briefing (2026-08-26)

Operator: first message **README.md**, then this file. Deploy every tool/agent.
Do **not** power the OMEN until the briefing is absorbed and **one** next action is named.

## Objective

Stop the instant power-cycle so F.57 recovery USB can be read, boot Void, then extreme-optimization-oc.
Operator: no more random cables. Die trying. Free path only. No external escalation.

## Machine (do not re-identify)

HP OMEN 45L GT22, board **BlizzardOC SSID 8917**, BIOS was **F.51**. i7-12700KF (no iGPU), RTX 3080 10GB, 4x8 HyperX DDR4. Void on nvme/ROOT/void via ZBM.

## Cause still on the table

**Mechanism A candidate:** corrupted UEFI **SPI** setup varstore after the OC attempt. The operator's BIOS-versus-Void application accounts conflict, so the write itself is not proven. Zero-DIMM still no POST (hang upstream of memory). **CMOS jumper does not wipe SPI.** That is why CMOS fail does not kill A.

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
| Which two pins are normal and which position is BBR on this exact BlizzardOC header? | next photo, operator eyes |
| Does `sp167160.exe` contain `HpBiosUpdate.efi` and its signed siblings? | any accessible host; Windows is not required |
| Is an owned 3.3 V SPI programmer/clip or suitable DMM/logic probe available? | operator inventory |
| Is `PS_ON#` being released by the board or dropped by PSU protection? | instrument measurement, only if safely identified |

The 7.34 GB one-partition `HP_TOOLS` stick is **not** an unknown anymore: HP creation passed,
then plain power produced the same immediate loop with no USB activity. Do not repeat it or its
Win+V/Win+B combinations. The two alternate sticks are not the primary next test; they are a
fallback only if the BBR/media artifact path requires them.

## Selected next action — HALT, then a new chat searches a new class

Jumper class and USB class are **closed**. Do not select BBR, CMOS, or another stick.
`node tools/stall-check.ts` must print HALT_NEW_CHAT. The spinning chat says:
`this doesnt work, i need a fresh chat with new context`.

## Retired — BBR preflight (do not run)

1. Keep the OMEN unplugged and the PSU switch off. Photograph the untouched `FDO/PSWD/BBR`
   header straight-on with the blue cap still installed. The photo must show all three pins,
   current cap orientation, nearby labels, and enough board context to establish left/right
   orientation. Do not move the cap.
2. If `sp167160.exe` exists on any currently accessible host, inspect or extract it without
   executing anything on the OMEN. Windows is not required. Report whether it contains
   `HpBiosUpdate.efi`, `.s09`/`.s12`/`.s14`/`.sig` siblings, and the exact `.bin`/signature files.
   Preserve the existing validated stick; if the SoftPaq is unavailable, do not block BBR on it.
3. Report whether a 3.3 V SPI programmer/clip or DMM/logic probe is already owned. This is
   inventory, not a purchase request.

## One-test rule for the last power-on

Only after the header mapping is confirmed and the operator explicitly opts in: use the
existing verified HP media with **BBR only**, leaving FDO and PSWD untouched. Move the cap once
to the documented BlizzardOC BBR position, power on once, and watch the stick LED, speaker,
screen, and time to power-off. **Pass** = recovery activity, beeps, HP output, or a materially
longer powered interval. **Fail** = the same silent immediate cycle with no activity. Stop
either way; do not try another jumper position, hotkey, cable, or USB permutation. If it
fails, remove AC power and return the cap to its documented normal position before leaving the
case; that is the rollback, not a second test.

If BBR passes, use the signed F.57 EFI flasher if the SoftPaq contains it, or let the verified
BBR recovery finish without interruption. If BBR fails and an owned SPI instrument exists, the
next step is a read-only chip-identification/dump plan. If neither exists, the next useful
free evidence is a safe PS_ON#/rail measurement rather than another media retry.

After a real flash: Escape = ZBM, F10 = BIOS. Memory 3733 XMP. efivarfs ro. No setup_var from OS.

## Agents next chat must run

`orient.ts orient` · context agent · one hypothesis per remaining unknown · verify agents against this file and `docs/omen-free-recovery-runbook.md` · `test-all.ts` · `pr-budget.ts main 405`.
