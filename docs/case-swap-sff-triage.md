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

## 0b. Cold boot vs warm reboot — the decisive discriminator (2026-08-30)

Operator receipt: **it reaches Void. It power-cycles on every cold boot from off. Warm
reboots are always clean.** It also cold-cycled with Void **before** the swap.

That last clause reframes the job: the swap did not create this fault, it **aggravated a
pre-existing cold-only one**. The fix is not "undo the swap" — it is "find what only happens
cold."

A warm reboot skips exactly five things. The fault is one of them.

| Cold-only step | How it fails | Tell |
|---|---|---|
| **Full memory training (MRC)** | retrain loop → cycle → firmware gives up → CMOS reset | slower cycles, fans spin 10–30 s each time; 2–4 cycles then boots |
| **Simultaneous device inrush** — pump, 6 fans, 4 SATA drives, GPU, VRM caps, all at once | rail sag or OCP → dropout | fast rhythmic cycles, 1–3 s, starting the instant the button is pressed |
| **AC-present RTC/CMOS backing** | a weak CR2032 loses settings **only** when AC is off | clock/date wrong after a cold boot, correct after a warm one |
| **Full PCIe cold reset + link training** | GPU trains badly in the new case | card lands at x8, or `PCIe Bus Error` in dmesg |
| **Firmware re-posting stored settings** | `After Power Loss` reverted by the reset → every dropout self-restarts | cycling continues *after* the original trigger is gone |

**Software is the initiator only if the resets happen after the HP splash** — Linux has not
loaded before then. Firmware *settings* are still software, though: `After Power Loss`,
`Memory Fast Boot`, XMP. They live in CMOS, which is exactly what got reset. That is the
software-hardware interface on this machine.

Read the rhythm and the sequence before changing anything:

- How many cycles, and how long is each one?
- Does the HP splash appear **before** the first reset, or not at all?
- Does ZBM appear **between** cycles? If yes, the fault is past firmware and moves into
  ZBM / ZFS / the early kernel.

## 0c. Cold-boot probe receipt — 2026-08-30 06:44 UTC (operator paste-back)

Interface: root shell, `etc/case-swap-coldboot-probe.block` (operator started at `date`,
skipped `df`/`uptime`/`product_name`/`board_name`/`lsblk`; `efibootmgr -v` was typed as
`efibootmgr -v0` and returned empty). Same paste arrived twice; timestamps identical, so
it is one receipt.

Operator quotes, verbatim:

- "it does it randomly, ~3 times"
- "warm reboots like when my pc crashes and i shut it off then turn it on again are seamless"
- "and while this was generating my pc crashed and i rebooted"

| Probe | Value | Verdict |
|---|---|---|
| `date` vs `hwclock -r` | 06:44:32 UTC vs 06:44:31.932070+00:00 | **RTC healthy.** CR2032 is not the cold-only tell. AC-present CMOS class is **down**. |
| BIOS | F.51 | unchanged |
| `dmidecode` Configured Memory Speed | **4000 MT/s @ 1.45 V on all four DIMMs** (`HP37D4U1S8MR-8X`, locators DIMM 1–4) | **The CMOS reset did NOT wipe r3.** C1 is still live. Gate 10's "most likely wiped" line is wrong. |
| `free -g` | 31 | all four sticks enumerated |
| Package temp | 47 °C | idle-healthy; not a thermal trip |
| `hp-isa-0000` fan1/fan2 | **0 RPM** | tach gap, not a cycling tell. 90B is a prompt, not a ~3-cycle loop. No `fan*_input` nodes returned. |
| `zpool status` | `nvme`/`fast`/`bulk` ONLINE, 0 CKSUM | not a pool fault |
| GPU | 3080 present, 41 °C, 27 W / 320 W, **width 16 / 16**, gen 2 current / 4 max | PCIe class **down** (x8 would have been the tell; gen 2 at P5 idle is ASPM, not a bad seat) |
| `dmesg -T --level=err,warn` | no MCE, no EDAC, no `PCIe Bus Error`, no nvme reset. ACPI `AE_AML_BUFFER_LIMIT` / `hp_bioscfg 0x300a` / yeetmouse udev — pre-existing HP/WMI noise | Linux is **not** the cold-cycle initiator. The runtime crash during generation is a *separate* 4000-shaped event (unvalidated IMC), not a new class. |
| `last -x reboot` | 06:42 still running, 06:17 still running (unclean previous), plus historical `Fri Jan 1 00:01` / `00:04` CMOS-clock stamps | previous session did not shut down cleanly; RTC-epoch stamps are **historical**, not this boot |

**Attribution.** The ~3 random cold cycles, warm-after-crash-then-power-on seamless, first
post-swap CMOS reset, *and* the runtime crash while the previous reply was generating, are
one class: **Z690 MRC retrain on the never-validated 4000 MT/s @ 1.45 V profile (C1).**
Warm path skips full MRC. A crash that is only a short power-off leaves the IMC warm /
training cache intact, so the next button-press looks "seamless." Sitting off does a full
retrain; 2–4 firmware reboots then a boot is the textbook Z690 training loop.

**C1 is not self-resolved.** Standing rule "do not re-apply 4000" still holds — the
correct move is the inverse: take it off.

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

**This class is NOT self-resolved.** Probe 2026-08-30 06:44 UTC: all four DIMMs still
**Configured Memory Speed 4000 MT/s @ 1.45 V.** The CMOS-reset screen did not clear r3
(HP NVRAM / dual-BIOS / "load previous" — unattributed; the value is what matters).
Operator rhythm "~3 times", random, cold-only, matches the 2–4 training-reboot tell.
*Do not put 4000 back; take it off.* Next knob is F10 → XMP Profile 1 (3733 @ 1.35 V),
which is ladder r0. Ladder r3 stays blocked until the case swap is qualified **and** r0
has a real suite pass.

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
- Read the **memory speed** in Advanced. Probe already proved it is **4000 @ 1.45 V**, so
  C1 is still live. The Gate A *change* is XMP Profile 1 (3733 @ 1.35 V) — one knob.
  After that cold boot, `dmidecode` must report Configured Memory Speed **3733 MT/s**,
  not 4000 and not a silent train-down.
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

- **Do not install the M82868-001 lighting board yet.** It is the standing prime suspect for
  the original cycling fault and it is fed straight from the PSU. See section 5b.
- **Do not re-apply the 4000 MT/s @ 1.45 V profile.** It was never validated and it is the
  leading suspect. The CMOS reset removed it; treat that as a fix, not a loss.
- **No CPU or GPU stress** until Gate D's thermal/tach receipt is read. Cooling state must be
  proven by tach data, not by the fact the block feels snug.
- **Cord out + hold button 20–30 s** is the only valid isolation. This PSU has no switch.
- **One physical change per power-on.** Multi-variable changes are what left the original
  fault unattributed.
- The `CMOS` and `FDO/PSWD/BBR` caps stay where they are. Do not jump them.

## 5b. Getting RGB back — the M82868-001 lighting board

The hub is the **standing prime suspect for the original instant-power-cycle crisis**. It was
deliberately left unplugged to keep it out of circuit, and the cause was never attributed.
Note *how* it is powered: **SATA power straight from the PSU**, not from the board. That is
exactly why it was capable of tripping the PSU side — and exactly why it is the wrong thing
to add while a cold-boot cycling fault is still open.

**Do not install it now.** Two reasons:

1. It would stack a second unexonerated variable on top of an unresolved fault. That is
   precisely the mistake that left the August cause unattributed.
2. The machine is *already* cycling cold. Adding load to a rail that is itself a suspect
   cannot help, and if it tips the machine into no-POST we lose the ability to read anything.

**SATA data vs SATA power (operator 2026-08-30: four drives still need the four ports).**
The hub does **not** take `SATA1`–`SATA4` on the BlizzardOC. Those four are **data** and
stay on the two HDDs + two SSDs (`bulk` stripe + `fast` + L2ARC). The hub's gold fingers
are a **15-pin SATA power** edge, fed from the PSU, same as a drive's power plug. Drive
data and hub power do not compete. If the PSU is short one power plug, add a SATA-power
Y-lead on a PSU cable — never steal a motherboard SATA data port.

**The path to RGB, once a clean baseline exists:**

1. Get **three consecutive clean cold boots** with the hub still unplugged. That is the
   baseline; nothing else gets added until it holds.
2. Install the hub **alone**, as the single changed variable. Mount on the two plated
   holes with standoffs — **not against bare metal.** Then:
   - PSU SATA **power** (spare plug, not a drive's) → gold fingers on the hub
   - Hub lighting harness (`M82873-001` 2-pin / `M82874-001` 5/10-pin) → board RGB
     headers, **not** `SATA1`–`SATA4`
   - Hub outs: `FFAN ARGB` / `TFAN ARGB` to case fans; `LOGO` only if the 5V logo
     module is present
3. **`LOGO` is marked 5V only.** Never land it on a 12V `GRB` header.
4. One power-on. **Clean boot → hub cleared, RGB is yours.**
   **Cycling returns → the hub is the fault**; unplug the SATA *power* to the hub and
   keep the four drive data ports as they are.
5. If the hub does prove to be the fault, RGB is still reachable another way: a standard 5V
   ARGB controller on its own PSU feed, leaving the HP hub out of circuit permanently.

That order is not caution for its own sake — it is the fastest route to *keeping* RGB.

## 5c. Bluetooth with one antenna (SFF, 2026-08-30)

Operator: only the antenna labelled **2** is plugged into the M.2 wireless card.
Wanted: Bluetooth. Not wanted: Wi-Fi (Ethernet carries data). F10 4000 drop is parked
this wave.

The antenna does **not** go on the Realtek Ethernet PHY (`r8169` at `0000:02:00.0` in the
06:44 dmesg). It goes on the **M.2 Intel combo card** (iwlwifi already enumerated:
`iwlwifi_1-virtual-0` at 36 °C in the same probe).

Intel's own mapping (AC-8265 and later, including AX2xx): **Antenna 1 / AUX = Wi-Fi +
Bluetooth. Antenna 2 / MAIN = Wi-Fi only.** One cable on jack 2 gives the BT radio no
RF. The cable label "2" is not a reason to land it on jack 2.

**Probe 2026-08-30 (operator paste-back): the controller EXISTS.** `hci0` present,
rfkill soft/hard **no**, `bluetoothd` running 3151 s, `bluetoothctl show` **Powered: yes
Pairable: yes**, USB `8087:0026 Intel Corp. AX201 Bluetooth`, CNVi `8086:7af0` Alder
Lake-S PCH. `dmesg` was typed as `err,warn0` and returned empty. Software/firmware/USB
class is **closed**. A present `hci0` with no RF is the jack.

When that receipt is in: cord out, hold case button 20–30 s, lift the one cable off jack
2 / MAIN, snap it onto jack **1 / AUX**, leave jack 2 empty. U.FL is fragile — press
straight down, do not yank the pigtail. Wi-Fi unused is fine. Then one power-on and try
to pair. Do not F10 4000 in the same step.

Lighting board still out.

## Sources

- Board mATX / standard ATX PSU: Digital Trends OMEN 45L review; HP community teardown thread.
- Front-panel pinout hazard: HP "OMEN System Upgrades" tech take — proprietary headers,
  non-standard pin-outs, improper connection can damage the board.
- Z690 training reboots / BIOS self-reset points at memory: Tom's Hardware, overclock.net,
  Corsair and MSI Z690 threads.
- LGA1700 cooler pressure causing memory POST failures: ASUS Z690 thread (reseat + loosen
  AIO resolved it).
- All HP-specific facts (headers, PSU, `PB`, 90B): this repo's `docs/`, `MASTER.md`, `STATE.md`.
