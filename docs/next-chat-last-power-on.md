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
| Does boot-block ever run (stick LED) if power is held another way? | next test, operator eyes |
| Will `FDO/PSWD/BBR` change the cycle? | operator must opt in |
| Is PS_ON dropping from firmware vs EC/protection? | not separated yet |
| Alternate 491 MB stick payload copy | Windows machine, not done this chat |

## One-test rule for last power-on

Name **one** action whose two outcomes split remaining hypotheses. Power on **once**. Log pass/fail. Stop.

If operator opts into **FDO**: photo of which two of three pins the blue cap occupies, then one move, 20s, **back**, one power. Pass = stays on / beep / HP screen. Fail = same cycle, FDO closed.

If operator opts into **flash again**: only after a reason the board will stay on longer than before (FDO pass, or documented boot-block that runs during the cycle). Same `08917.bin` media. Rear USB. Watch stick LED. Never interrupt mid-flash.

After a real flash: Escape = ZBM, F10 = BIOS. Memory 3733 XMP. efivarfs ro. No setup_var from OS.

## Agents next chat must run

`orient.ts orient` · context agent · one hypothesis per remaining unknown · verify agents against this file and `docs/omen-free-recovery-runbook.md` · `test-all.ts` · `pr-budget.ts main 405`.
