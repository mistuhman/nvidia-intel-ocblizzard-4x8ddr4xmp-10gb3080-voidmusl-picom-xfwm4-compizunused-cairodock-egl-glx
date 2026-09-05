# Mounting the SATA drives in the Apex PC-389-C — solid, no drilling, swappable with the power off (2026-09-05)

**Operator, verbatim:** "still need to mount the hdd's like shown in the picture ... the hdd's
need to be mounted solidly and easily interchangeable when the pc is off."

**Photo received with the operator's follow-up (2026-09-05).** What it shows, read as a receipt:
the case's own grey-painted **flat drive plates (sleds)** held in a stack of three, each carrying a
row of 3.5" side-mount holes plus a bent-up locating lip, two of them with bare-steel **spring
tabs** and a rectangular slot at the outboard end; a **2 TB 3.5" drive with a white spec-table
label resting label-up on top** (that is the Toshiba **DT01ACA200** — a member of the `bulk`
stripe, so it is *out of its bay* while `bulk` is expected to import: §4); the white-painted front
**drive column** with its rectangular bay-guide slot and a Phillips at the top corner behind the
hand; SATA/power looms hanging in the lower front.

**Operator's request, verbatim:** "this is the photo of the hdd arrangement i want for better
access. example photo, not where itll be but in that region further back in the case so when the
door opens i have access directly to the hdd's with no dvd drives blocking it and also with a cover
or this other ssd holder i have thats the same dimensions of an hdd but holds two ssd's with the
same mounting screw points as an hdd"

Translation of the intent, and it is a good one: **per-drive sleds on the existing column,
relocated rearward so the drive faces clear the 5.25" cover plane, pulled straight out at the
opened side panel — with the 2x2.5"-in-HDD-footprint SSD tray used as just another sled in the
same geometry.** That is §1's rank 2 taken to its proper conclusion, and for *this* access goal
it beats the bought 5.25" caddy, so **§1b is the recommendation.**

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

**Update after the photo (2026-09-05): for this operator's stated goal — direct access at the
opened side panel, no DVD blanks in front — §1b's relocated-sled plan is the pick, and it is
*cheaper* than rank 1 because it spends hardware already in the case.** Rank 1 stays the answer if
they ever want the drives up front behind a removable bezel instead.

**Buying list if rank 1 is chosen:** one 5.25"→2x3.5" caddy per two drives, **M3x5** pan-head
(machine-screw) for the bay sides, one **40 mm silicone/rubber washer per drive** (anti-vibration
between drive and tray), and a **right-angle SATA cable** per bay if the run is tight. Nothing
long, nothing that needs a drill, nothing that needs the panel off a live machine.

## 1b. The operator's arrangement, specified so it is solid and not merely removable

The sled idea is right; what separates "solid" from "the drive walks out on vibration" is six
conditions. All of them are satisfiable with the parts in the photo plus M3x5 screws.

1. **One plate per drive, never a drive on a drive.** In the photo the top drive is resting on the
   stack — that is fine as a carried-in hand-stack, but as a mounted state a 2 TB spinning drive
   sitting on another drive's cover couples their resonances and flexes both cases.
2. **Capture the plate at two points minimum, the drive at four if the plate allows.** The
   drive-side screws are the structural joint: 2 side + 2 bottom M3x5 if the plate has both
   patterns, and **never longer than 5 mm** (a 6 mm+ screw can reach the board on the underside).
   A plate held by its single front screw is a lever, not a mount.
3. **Kill the forward-walk path deliberately.** The bent lip and the spring tab are locating
   features; they must bear on a **solid edge**, not ride in a smooth open slot. Add one captive
   thumb-screw (or a 6 mm washer + a quarter-turn of a hand driver) at the plate's front edge, so
   "pull out" is something you choose, not something vibration decides.
4. **PCB-side contact rule, corrected against the photo:** the drive lying **label-up = PCB down on
   the plate** is acceptable — drive vendors rate any orientation and the cast cover is the heat
   path. What is *not* acceptable is a proud bolt head, a burr, or a ground edge crossing the bare
   board: a strip of kapton/polyimide or a 0.5 mm fibre washer under the PCB fixes it without
   changing the mount.
5. **The 2x2.5" SSD tray is a peer sled, not an add-on.** Because it carries the HDD hole pattern
   it goes in the same slot with the same two screws, at the same depth, one per bay position. Do
   not stack it on top of an HDD plate.
6. **Keep the intake honest.** The relocated drives must not shade the front rad opening or block
   the corridor to the rear `FFAN1` (this case's whole airflow plan is orifice-limited —
   `docs/case-swap-rad-mount.md` Appendix D). Leave >=15 mm clear around the connector end so the
   sled can be pulled with the cables still seated.

**Relocating rearward, without a drill** — three ways, in order of preference:

| | How | What it costs | Check first |
|---|---|---|---|
| **A** | Use the **rearward hole row of the column itself.** Cheap mid-tower drive columns carry two or three fore-aft hole rows precisely because 3.5" and 5.25" drives want different depths. If the column has them, the move is free: same screws, one row further back. | 10-second look with a flashlight | Do the **cable-reach test** (below) before committing |
| **B** | Bolt the plates to the **rear-most M3 holes of the 5.25" bay rails** (the rails are drilled front-and-rear for optical drives). The drives then sit behind the cover plane — no DVD blank in front of them, which is the access the operator asked for — while every thread used is factory. | free; M3x5 + 4 washers | The drive face ends up level with the bay opening, so the "cover" they mentioned is a 5.25" blank on the *outside* if they want it closed |
| **C** | **Slotted-angle sub-frame** (41 mm Unistrut, two short lengths) bolted to A or B holes, with the plates riding the slots. Spring/tube nuts in the strut channel. Slots give ~13 mm of free adjustment per row, so the depth becomes a choice instead of a constraint. | ~$10 of hardware, grinder to cut, no drilling of the case | Keep the frame out of the intake orifice |
| ✗ | Floor-mounted side-by-side | — | **Physically impossible here:** case interior width is 184 mm, two 3.5" drives side by side are ~203 mm |
| ✗ | Hanging drives off the top-mounted PSU's underside, or sharing the rear fan's holes | — | Refused: PSU screws carry a spinning drive = vibration into the PSU shell and a strain-gauge on the case; the rear holes belong to `FFAN1`, the header that cleared `90B` |

**The measurement that decides it (before anything is moved):** with the plate + drive at the
intended rearward depth, can a **SATA data cable and a SATA power lead reach both drives with a
50 mm service loop and zero tension** while the sled still pulls straight out? The HP M83827-001
harness and the board's SATA ports are laid out for the *factory* bay depth, so a rearward move of
more than ~60 mm can silently convert "instant access" into "unplug six things every time". If the
reach fails, the fix is **B** (in the plane of the rails, minimal offset) or a right-angle SATA
connector on the drive side, not a longer cable daisy-chained.

**And the standing gate:** nothing new gets bolted in while gate 12 (`docs/case-swap-3-2-beep.md`)
is open. Step 0 first — the capacitor — then the boot, then this, one change per power-on.



## 2. Fitting rules (rank 1, rank 2 and §1b, and why each one exists)

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
