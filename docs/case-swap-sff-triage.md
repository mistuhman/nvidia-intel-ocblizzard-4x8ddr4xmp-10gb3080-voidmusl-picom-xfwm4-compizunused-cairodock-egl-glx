# Case swap triage — BlizzardOC 8917 into an older SFF case (2026-08-30)

**Event.** Operator completed the transfer out of the OMEN 45L chassis into an older,
smaller case. Everything mechanical that matters is asserted done: AIO mounted snug,
all motherboard screws and standoffs in the right places, GPU slotted and supported.
Known-open issues: **PSU placement** and **space constraints** (SFF).

**Symptom on first power-on:** the machine **power-cycled**, then **booted to a CMOS reset**.

That it booted *at all* is the single most useful fact in this document. A hard dead short
latches a PSU off or holds it in protection; it does not eventually present a BIOS screen.
So the hardware is fundamentally alive and the fault is marginal, not fatal.

**Operator owns power-ons.** Nothing below powers the machine on without a named gate.

---

## 0. The five HP facts a generic case-swap checklist will get wrong

These come from this repo's receipts, not from general knowledge. They are the whole reason
this document exists.

| # | Fact | Why it bites during a case swap |
|---|---|---|
| 1 | **CPU power is TWO 4-pin sockets**, top-left by the socket — not one 8-pin EPS | They sit in the worst possible corner for SFF cable routing. A hard bend walks one of them out. **One loose 4-pin still lets it POST, then dies the moment the VRM loads.** |
| 2 | **Power button is `PB`, a bare 2-pin header** — not a standard 9-pin F_PANEL | The new case's button has to be adapted. An improvised splice that is pinched by a panel = a held or intermittent power signal = **continuous power cycling**. A standard Intel 9-pin block *can* be seated over those 2 pins so only the power pins land, but it must be aligned deliberately. |
| 3 | **HP front-panel USB / HD-AUDIO pinouts are not guaranteed standard** | HP's own upgrade guidance warns the front-panel power/USB/audio headers "may use proprietary headers or non-standard pin-outs" and that connecting them improperly can damage the board. A mis-keyed front I/O block can pull 5VSB to ground → protection trip → instant cycle. |
| 4 | **PSU is standard ATX (M83827-001, 800W) but has NO rear rocker switch** | Isolation is **cord out of the wall**, plus holding the case button 20–30 s to drain. Never treat "PSU off" as a step on this machine. |
| 5 | **The EC watches specific fan headers** (90B is a tach check, not a temp check) | Pump → `FAN1` (fallback `LCFAN`); rad fans → `LCFAN` / `TFAN-LCFAN2`; front intakes → `FFAN2` / `FFAN3`; the one that cleared 90B before is **`FFAN1`**. Any header left empty after re-routing in the new case re-raises the `CPU Fan (90B)` prompt. |

Board form factor: BlizzardOC 8917 is **Micro ATX** (secondary sources — Digital Trends 45L
review, HP community teardown), so it should drop onto an mATX/ATX standoff pattern.
**Verify by eye in the new case** — OEM and older cases often have *fixed, non-removable*
standoff bumps instead of screw-in posts, and a bump that does not line up with a mounting
hole is a direct short under the board.

---

## 1. Cause classes, ranked

Ranked by fit to *cycling **then** booting to a CMOS reset*, with this machine's history.

### Class C1 — DDR4 retrain loop → firmware CMOS fallback  ← highest prior
The board was last left on a **4000 MT/s @ 1.45 V custom profile that was NEVER stability-
validated** (MASTER ladder r3, risk band "severe"). Z690 retrains memory by **rebooting**;
a profile that fails to train produces exactly a run of power cycles. After N failures the
firmware gives up, resets CMOS to JEDEC defaults, and boots — which is precisely the
reported sequence. Corroborated externally: on Z690, "the reboots is part of memory
training," and "BIOS resetting itself is most likely memory or storage related — suspect
memory first."

A case swap is the perfect trigger for a marginal profile: the board is unbolted and
re-bolted (new flex), the AIO block is remounted (new socket pressure — see C5), and the
DIMMs have been handled.

**This class is already self-resolved.** The CMOS reset wiped the 4000 profile. *Do not put
it back.* Ladder r3 stays blocked until the case swap is qualified.

### Class E1/C4 — improvised power button / momentary rail loss
A pinched or intermittently shorting `PB` adapter sends repeated power signals. A momentary
drop during a CMOS write also produces "CMOS checksum invalid." Both explain cycling *and*
the reset, and both are consistent with "everything is improvised."

### Class A1 — stray conductor under the board
Extra standoff in a non-hole position, or a dropped screw behind the tray. This is the
number-one generic case-swap fault. Intermittent contact = cycling.

### Class B2/B3 — connector walked out under SFF cable strain
The two 4-pin CPU sockets and the two 6+2 GPU connectors are the likely ones. Cable bend
radius in a small case is the mechanism. Symptom is load-dependent: POST is fine, it dies
when current rises. The 3080 is a hard load — it ran pinned at ~314–320 W with transient
spikes well above that, on an 800 W unit. **Never daisy-chain its 6+2s.**

### Class C2 — After Power Loss reverted  ← check this first, it may be ongoing
`After Power Loss` was deliberately set to **Off** (it was cleared as the cause of the old
cord-in auto-cycle). **A CMOS reset restores BIOS defaults**, which on this class of AMI/HP
firmware is commonly *On* or *Last State*. If it reverted, every momentary rail dip becomes
an automatic restart — i.e. **the cycling could now be self-sustaining even after the
original trigger is gone.** Read it in F10 before doing anything else.

### Class B4/D — PSU thermals and AIO orientation
- **PSU placement (the operator's own flagged issue):** if the intake fan now faces a solid
  panel or the floor with no gap, the unit overheats → OTP → cycle → cools → restart.
- **AIO:** the 45L ran its 240 rad **top-mounted**. If the rad is now below the pump, air
  collects in the block and the CPU thermally trips. "Mounted snug" is not the same as
  correctly oriented or correctly tensioned.

### Class C3 — 90B fan prompt
Prompts for Enter; does not cycle. Still must be cleared — an unspinning header left behind
in the re-route is the obvious cause. `Front Fan #1 = N/A` was the exact trigger before,
fixed by landing a fan on `FFAN1`.

### Class F — new-case front I/O short
Any standard HD-AUDIO / USB block plugged into an HP header with a non-standard pinout.
Unplug all new-case front I/O for the first clean-boot test.

---

## 2. Zero-power work — cord OUT, no exceptions

Do all of this before the next power-on. Cord out of the wall; hold the case button 20–30 s.

1. **Standoff audit.** Every standoff under the board must sit under a mounting hole.
   Remove any that does not. On a case with fixed bumps, mark each bump and check it against
   a board hole. Look under the board for a dropped screw.
2. **The two 4-pin CPU sockets** (top-left). Unplug and reseat both; confirm each latch
   clicks. Re-route so there is no hard bend within ~3 cm of the connector.
3. **24-pin `SPWR`** — latch clicked, no bend at the shell.
4. **Both 6+2 into the 3080** — fully seated, latched, **not daisy-chained**, no kink.
5. **`PB`** — whatever is adapted to it must be positively located and must not be pinched
   by a side panel. If it is taped, spliced, or loose, it is suspect #1 in Class E1.
6. **Unplug all new-case front I/O** (HD-AUDIO, USB) from the board headers. Front USB/audio
   buys nothing and is a live short risk on this board (fact #3).
7. **Fan headers** — pump on `FAN1`, rad fans on `LCFAN` / `TFAN-LCFAN2`, and any spare on
   **`FFAN1`**. Nothing critical left unplugged.
8. **CR2032** — seated flat, `+` up. The machine sat unplugged for the entire transfer; a
   marginal coin cell plus long AC-off loses settings on the first boot.
9. **AIO orientation** — the pump must not be the highest point in the loop. Prefer the rad
   top-mounted or at least with its top edge above the block.
10. **PSU intake** — confirm the fan has an unobstructed air path. This is the operator's
    flagged issue; give it a real gap, or flip the unit if the case allows.

---

## 3. Photo shot list

Straight-on, well lit, both side panels off where possible. Each shot maps to a class.

| # | Shot | Discriminates |
|---|---|---|
| 1 | Whole board, straight on, everything visible | overview, routing, GPU support |
| 2 | Each of the 4 board corners, close — screw + standoff + board hole aligned | A1 stray standoff |
| 3 | Behind the motherboard tray | A1 dropped screw, pinched cables |
| 4 | **Top-left corner: both 4-pin CPU sockets**, latches and cable bend visible | B2 |
| 5 | **The `PB` 2-pin header** and whatever is plugged into it, plus its cable route | E1 |
| 6 | **PSU as mounted** — fan orientation, gap to panel/floor, plus the label | B4 |
| 7 | **AIO**: block on the CPU + radiator position in the same frame, tubes visible | D |
| 8 | **GPU**: both 6+2 seated, bend radius, the support bracket | B3 |
| 9 | Bottom edge: `CMOS` cap, `FDO/PSWD/BBR` cap (must be untouched), CR2032 | C4, safety |
| 10 | Any improvised splice/adapter, close up | E1 |
| 11 | **The CMOS-reset screen itself**, exact text | C1/C2/C4 |

---

## 4. Gated power-on sequence

One step per power-on. Stop on the first anomaly and report.

**Gate A — BIOS read, no OS.**
Cord in, power on, `F10`.

- Read **`After Power Loss`**. If it is not **Off**, set it to Off. This breaks the possible
  self-sustaining restart loop (C2) before anything else is judged.
- Read the **Thermal** page. Every fan must show a number; `N/A` means a header is empty (C3).
- Read the **memory speed** in Advanced. It should now be JEDEC (2133/3200), **not 4000**.
  A 4000 reading means the profile survived and C1 is still live.
- Confirm the clock/date is wrong. A wrong clock *confirms* a real CMOS reset rather than
  a benign checksum prompt.
- Save and exit.

**Gate B — clean-boot proof.** Three consecutive cold boots (cord out 20 s between each)
that reach the HP splash with no cycling and no `90B`.

**Gate C — boot Void**, Escape → ZBM → `nvme/ROOT/void` explicitly.

**Gate D — read-only OS diag** (root, read-only; paste full output). Establishes whether the
transfer disturbed anything electrical before a single OC knob is touched:

- `dmidecode -t memory` → **Configured Clock Speed**. Proves whether the profile is gone.
- `dmesg` sweep for MCE / EDAC / `PCIe Bus Error` / `nvme` resets.
- Fan tachs + temps (`sensors`, or the existing `etc/omen-90b-fan-probe.block`).
- `zpool status` on `nvme`, `fast`, `bulk` — all ONLINE, zero checksum errors.
- `nvidia-smi` — card present at full link width (`x16`, not `x8`). A GPU the SFF case forced
  to re-seat badly often lands at reduced width.

**Gate E — only then** does the OC campaign resume, and it resumes at **XMP 3733 (r0)**,
not 4000.

---

## 5. Standing rules for the duration of the swap

- **Do not re-apply the 4000 MT/s @ 1.45 V profile.** It was never validated and it is the
  leading suspect. The CMOS reset removed it; treat that as a fix, not a loss.
- **No CPU or GPU stress** until Gate D's thermal/tach receipt is read. Cooling state must be
  proven by tach data, not by the fact the block feels snug.
- **Cord out + hold button 20–30 s** is the only valid isolation. This PSU has no switch.
- **One physical change per power-on.** Multi-variable changes are what left the original
  fault unattributed.
- The `CMOS` and `FDO/PSWD/BBR` caps stay where they are. Do not jump them.

## Sources

- Board mATX / standard ATX PSU: Digital Trends OMEN 45L review; HP community teardown thread.
- Front-panel pinout hazard: HP "OMEN System Upgrades" tech take — proprietary headers,
  non-standard pin-outs, improper connection can damage the board.
- Z690 training reboots / BIOS self-reset points at memory: Tom's Hardware, overclock.net,
  Corsair and MSI Z690 threads.
- LGA1700 cooler pressure causing memory POST failures: ASUS Z690 thread (reseat + loosen
  AIO resolved it).
- All HP-specific facts (headers, PSU, `PB`, 90B): this repo's `docs/`, `MASTER.md`, `STATE.md`.
