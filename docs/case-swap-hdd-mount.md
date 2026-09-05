# Mounting the SATA drives in the Apex PC-389-C — solid, no drilling, swappable with the power off (2026-09-05)

**Operator, verbatim:** "still need to mount the hdd's like shown in the picture ... the hdd's
need to be mounted solidly and easily interchangeable when the pc is off."

**The picture did not arrive in this chat** (no image in the sandbox, and no attachment marker in
the message). Everything below is built from the case's own published geometry; send the photo
and this doc gets a confirmation pass against it before a single screw is ordered.

## 0. The chassis, from its own spec sheet (not guessed)

APEX **PC-389-C** (Apex Computer Technology / Supercase / Allied), the case the board moved into:

| | |
|---|---|
| Type | ATX mid tower, **steel, thin-gauge**, no side window |
| Dimensions | 444 H x 184 W x 406 D mm (17.48 x 7.24 x 15.98 in) — a **shallow** box |
| Bays | **3 x external 5.25"**, **2 x external 3.5"**, **4 x internal (hidden) 3.5"** (Apex's own page says "total of 10 drive bays" with 5 hidden) |
| PSU | **top-mounted**, ATX12V, no included PSU |
| Fans | 90 mm rear + 80 mm front stock positions; side panel carries punched vent fields and a knock-out |
| Trays | **not tool-less** — a reviewer's own words: "there are sharp edges, and it is not a tool-less case" |

Consequences that matter here:

1. There **are** factory threaded holes in this case — in the 5.25" bay stack and in the hidden
   3.5" column — they are just not where the front-middle rad opening was cut. Every no-drill
   answer below spends those holes instead of making new ones.
2. A 406 mm-deep box with a top PSU is tight for a 313 mm 3080 **and** an 80 mm-thick push-pull
   rad sandwich in front of it. Measure GPU-to-rad clearance once the drives are placed.
3. 3.5" and 2.5" drives mount with **M3 x 5 mm** — the shortest screws in the box, which is why
   the "no screws long enough" problem that blocks the radiator does **not** apply to the drives.
   Longer than 6 mm can bottom out inside the drive; never a drill driver, hand driver only.

## 1. Ranked answers (solid + swappable + zero drilling)

| Rank | Method | Cost | Why it wins or loses |
|---|---|---|---|
| **1** | **5.25" to 2x3.5" HDD caddy with removable trays** (key-lock/thumb-screw class, e.g. ICY DOCK EZFit or any generic steel caddy) bolted into the **top-front 5.25" bays** using their existing side holes | ~$15-30 | Uses only factory holes + 4 short M3x5 per caddy; the tray is what makes it "easily interchangeable" — pull one thumb-screw/latch, slide the drive out with its sled. Rigid because the caddy is bolted to a bay cage, not to sheet steel. Also puts the drives above the rad opening, out of the cut edge. |
| **2** | **The case's own hidden 3.5" column, if it survived the rad cut** — and each drive pre-bolted to a **steel/aluminium L-sled** (2 x bottom M3x5) so swapping = 2 thumb-nuts, not 4 screws + a fumble | ~$0 if the column is intact | Factory position, correct spacing, drives below/independent of the rad. Loses to rank 1 only if the cut weakened the column or the rad sandwich fouls it. |
| **3** | **Slotted angle rack** (41 mm Unistrut / "eurostrut"): two lengths bolted to the 5.25" bay holes with M5 + spring/tube nuts, drives carried on the angle's slots | ~$8 of hardware | The zero-drill structural answer when you want the drives somewhere the bays are not. Slot pitch is 13 mm so alignment error is free, and every fastener is a nut + washer you can undo with one wrench. This is the same "angle bracket" fallback already approved for the radiator (`docs/case-swap-rad-mount.md` §2). |
| 4 | **2.5" SSDs:** a 2.5"→3.5" tray with a captive thumb-screw, dropped into any of the above | ~$5 | The MX500 (`/fast`) and the SV300 (L2ARC on `bulk`) have **no** mounting threads at all — 2.5" drives must ride in a tray/adapter, never loose. |
| ✗ | **Zip ties, rubber bands, foam + tape, "sitting on the floor"** | free | Rejected as a final mount for spinning media: nylon creeps and saws, a 3.5" drive resonating against a thin steel floor is a noise and a bearing-life problem, and the failure that actually kills data is **strain on the SATA + power connectors** with nothing carrying the mass. Acceptable only as tonight's restraint, under §3. |
| ✗ | **Drilling the case floor / front column** | — | Not on the table: no drill, and the operator's rule since the rad cut is existing holes only. |

**Buying list if rank 1 is chosen:** one 5.25"→2x3.5" caddy per two drives, **M3x5** pan-head
(machine-screw) for the bay sides, one **40 mm silicone/rubber washer per drive** (anti-vibration
between drive and tray), and a **right-angle SATA cable** per bay if the run is tight. Nothing
long, nothing that needs a drill, nothing that needs the panel off a live machine.

## 2. Fitting rules (rank 1 and 2, and why each one exists)

1. **Drives screw into the tray/sled first, tray into the case second.** The mass is carried by
   M3 threads in the drive's own steel chassis — the only mount a 3.5" HDD is engineered for.
   Side threads on a 3.5" drive want **4** screws (two per side) for the resonance spec; if you
   only ever have two, put them both on one side *plus* a bottom screw.
2. **No load on the connectors.** Leave a ~50 mm service loop on both cables and route so pulling
   the sled straight out does not tug either plug. Right-angle SATA solves 90% of shallow cases.
3. **PCB faces away from bare metal.** Every 3.5" drive here has an exposed board; a bolt head or
   a ground edge across it is a dead drive. Orientation = **label up or PCB up**, and keep the PCB
   at least 10 mm off anything.
4. **Keep the drives out of the rad's raw cut edge and out of the air path that the intake needs.**
   A drive face planted on the front opening is both a short and a blocked radiator; orifice area
   is the binding constraint in this chassis (`MASTER.md` caseSwap 2026-09-02h: flow goes as
   sqrt(dp), area beats fan pressure).
5. **Nothing shares the radiator sandwich.** No drive, cable, or tie touches the rad, and the rad
   never hangs off a drive or its cage.
6. **Anti-vibration, not isolation.** One soft washer per drive kills the drum; full rubber
   floating is for quiet builds, and this build's stated priority is maximum airflow through a
   sealed box, not acoustics.

## 3. If a drive has to ride loose *tonight* (transitional, not the answer)

- Lay it on a strip of closed-cell foam / an old mouse-pad, PCB up, **flat on the case floor
  behind the PSU zone** — not on the drive cage edge, not against the cut.
- **One** zip tie loosely around each end, over a folded cardboard sleeve where it touches metal,
  cut flush and taped. The tie is a "do not slide" strap, never the mount.
- Cables supported on their own loop so the drive's weight never hangs on the plugs.
- Re-check at the next power-on, and the goal stays the caddy.

## 4. ZFS rules that outrank the mounting question (this is the part that costs data)

The four SATA drives are **live pools** (`STATE.md`): `fast` = MX500; `bulk` =
**ST2000NM0033 + DT01ACA200 in a stripe with NO redundancy** + SV300 L2ARC. Therefore:

1. **"Easily interchangeable" is a mechanical property, not a licence to pull a drive.** Pulling
   either half of `bulk` = the whole stripe is gone, including `/mnt/games`. If a drive is going
   out for real: `zpool export bulk` (the `fast` pool too if it is the one moving) **before**
   power-off, then swap cold, then `zpool import`. Never yank a live SATA disk.
2. **Power off + cord out before any drive move.** sd* nodes reshuffle on rescan; `/dev/disk/by-id`
   only, in every zpool command and any future fstab entry.
3. **One drive per power-on** — the standing gate from `ToDo.md`/`MASTER.md` (adding drives injects
   SATA boot entries and renames nodes under a ZFS root).
4. If the two *new* HDDs are being added while this stripe is being rethought, the pool-shape
   decision (ToDo Options A-D) comes **before** buying brackets: a mirror wants the two drives
   within reach of the same caddy and the same airflow; a stripe does not care.
5. After any swap: `zpool status` + `zfs list` pasted back, and a scrub baseline on anything newly
   mounted.

## 5. Gate

No new hardware goes in while the POST block in `docs/case-swap-3-2-beep.md` is open. The
machine has to boot first; drive mounting is the wave **after** the tach +
`etc/rad-cut-postdiag.block` receipt, one change per power-on.

## 6. Sources

- APEX PC-389-C specification sheet and retail listing (Newegg N82E1681154095 / apextechusa
  pID=119 / PCPartPicker `apex-case-pc389c` / pc-builder.io p29822): 3x external 5.25", 2x
  external 3.5", 4-5x internal 3.5", top-mounted PSU, 444 x 184 x 406 mm, "not a tool-less case",
  90 mm rear + 80 mm front fan positions. Retrieved 2026-09-05.
- 3.5" drive mounting convention (M3 x 5 mm, four screws for the resonance spec, PCB-side
  exposure) and 2.5" drives having no native chassis threads: drive vendor mounting manuals,
  standard practice.
- Airflow priority in this chassis and the "existing holes first" doctrine:
  `docs/case-swap-rad-mount.md` (Appendix D), `MASTER.md` durableFacts.caseSwap 2026-09-02c/f/h.
- Pool topology and by-id rule: `STATE.md`, `ToDo.md` (SATA -> zpool sections).
