# Case mod — 240mm AIO + sawn front fan bank in the SFF (top-rear PSU), 2026-08-31

Operator request, verbatim: *"i need to put my 240mm aio in here with the top rear psu
config and sawing off that lower drive bay with my fine grit handsaw so i can mount front
fans there for the gpu and rear exhaust. the front of the case is plastic though and i have
2 intake fans with rgb and 1 non rgb intake fan and 1 rear exhaust fan"*

This is the physical build partner to `docs/case-swap-sff-triage.md`. Workshop procedure
here; electrical diagnosis there. The cooler is the HP M82880-002 LCS 240 (STATE.md):
radiator ~277×120×27 mm, 2×120 mm fan mounts, ~82 mm depth with fans.

## 0. Why this mod is also a thermal fix

Gate-11 receipts show the 3080 hitting **85 °C** during Superposition in the SFF (80 °C
in the 45L, triage §5b CLOSED line). The 3080 is power-pinned at ~314 W with high
transients (durableFacts.gpu) — in an SFF with a solid front it was starving for intake
air. A direct front intake aimed at the GPU face is the correct lever and it stays inside
every standing rule: reversible (the bay is a sacrifice part), no firmware interface, one
variable per power-on.

## 1. Demand list from the message (delivered in order)

| # | Demand | Where |
|---|---|---|
| 1 | 240mm AIO into the SFF with the top-rear PSU layout | §2, §3 |
| 2 | Saw off the lower drive bay with a fine-tooth handsaw | §4 |
| 3 | Mount front fans on the cut to feed the GPU | §5, §6 |
| 4 | Keep the rear exhaust working with it | §6 flow map |
| 5 | Plastic-front constraints (mounting + vents) | §5 |
| 6 | Use exactly: 2 RGB intakes, 1 non-RGB intake, 1 rear exhaust | §6 header/fan map |

## 2. Radiator placement — the rule that decides everything

The pump must never be the highest point of the loop (triage class B4/D: the 45L ran the
rad top-mounted; rad-below-pump = air in the block = thermal trip, exactly what "mounted
snug" failed to prove before). Decision tree for the top-rear PSU layout:

- **PSU occupies top-front too** → radiator goes **front-high** (where the upper part of
  the bay column is), intake through the rad. Top edge of the rad must sit at or above the
  pump block. Short OEM tubes make this the usual answer; measure first (§3).
- **Top-front is clear** → radiator **top-front**, intake or exhaust, rad above pump —
  best orientation for air, tubes bend easiest.
- **Never**: radiator low/front-bottom below the pump, and never rad-exhaust blowing at the
  GPU (recirculation; the GPU then eats CPU waste heat).

Push-only: an M82880-002 in an SFF has no room for push-pull; do not plan it.

## 3. Measure before the saw touches metal

1. **Tube-reach test with everything live**: hold the rad at the chosen spot, set the pump
   block on the socket, confirm tubes reach without a kink at the block. A dry-fit failure
   AFTER cutting is the classic modder loss — do it on full plastic first.
2. **Fan-bank line-up**: the cut must leave the 120 mm opening square over the GPU intake
   fan faces (~3–6 cm clear ahead of the card, note which way the fans blow: sticker side
   = exhaust side, open-face side intakes — front fans mount with the logo/sticker facing
   INTO the case).
3. **Bezel clearance**: refit the plastic front with a fan held in position — 120 mm fans
   are 120 mm squares; if the bezel will not clip back on, the bezel vents must be widened
   in the same session (§5).
4. **What must survive the cut**: the front flange/return bend of the sheet metal (keeps
   the whole front rigid), bezel clip tabs, and anything routed BEHIND the bay — front I/O
   wiring, ground strap. Unplug the new-case front I/O from the board before any panel work
   (triage fact 3: HP front-panel pinouts are not guaranteed standard).
5. Photos of the case before cutting — receipts for the next session, same as the swap doc.

## 4. The saw job (fine-grit handsaw — right tool, right order)

1. **Empty or entomb the case.** Best: board, GPU, drives OUT (the swap already loosened
   them; this is the cheap moment to redo standoffs + paste). If they stay in: seal with
   plastic sheeting + tape over every vent, fan, and header; damp towels on the bottom.
   Conductive metal swarf kills boards; this is THE risk of the job.
2. Mask the cut line with painter's tape (protects the plastic from chipping and gives the
   blade a visual guide). Layout with a square, not freehand.
3. Start the cut from a drilled pilot hole or a corner, clamp a straight board as a saw
   guide, support the waste side so the panel cannot flex. Light strokes, let the teeth
   work — a fine blade pressed hard flexes thin sheet and rips.
4. Rough-out of the interior cage is faster and cleaner with tin snips/nibblers; save the
   saw for the straight visible edges.
5. **Deburr**: half-round file on the cut edges, then fine sandpaper, anywhere a cable,
   tube, or fan frame will touch. Then wipe the edge and seal it — rubber U-trim,
   electrical tape, or a silicone bead; bare sawn steel also flashes rust within weeks,
   so paint or seal the edge itself.
6. New holes in sheet metal (fan bolt clearance, cable pass-through): **step bit**, not a
   twist bit — twist bits grab sheet steel and scar the panel. Plastic: normal bit, slow
   speed, backing board behind to stop crazing.
7. **Swarf sweep before reassembly, not after**: magnet on every surface, inside and out
   (behind the tray, PSU corners, under standoffs), canister vacuum, damp cloth, then a
   flashlight sweep. No compressed air while anything sensitive is near — it redistributes
   exactly what you are trying to remove. Tap the case outdoors and sweep once more; finish
   with the magnet over the board tray.
8. Cord out, hold the case button 20–30 s before anything is plugged (this PSU has no
   rocker — the only isolation is the cord).

## 5. The plastic front — mounting and breathing

- **Never self-tap a fan screw into plastic** — the thread wedges and the bezel cracks
  along the stress line. Three good patterns, best first:
  1. **Through-bolt**: drill out the fan's 5.5 mm corner holes' positions in the
     metal/plastic, M4 (or #6-32) machine screws + **washers both sides** + nut
     (nyloc if you'll never remove it, plain + one turn if you will). Hand-tight + a
     quarter turn; a wrench overtightens and crushes/creeps the plastic.
  2. **Mount to the metal you kept**: leave a strip of the bay's sheet metal behind the
     plastic and fan-screw into that; the plastic bezel then just clips over it.
  3. **Plastic expansion anchors** (M4 sleeves) where no metal can be bridged —
     acceptable for a light 120 mm fan, weaker over time with vibration.
- **Vibration**: plastic panels resonate; rubber washers between frame and panel, or a
  foam strip where the bezel presses a fan corner.
- **The real plastic-front problem is open area.** OEM bezels often vent <40 % of a fan's
  face; three fans fighting a nearly-solid bezel move nothing. If you are already cutting,
  open the bezel's vent over the fan bank (mesh + washable foam behind it keeps dust
  outside and makes the positive pressure an asset).
- Positive pressure check with this plan (3 intakes vs 1 rear + PSU): air LEAKS OUT every
  seam and gap, so the case dusts through unfiltered slits — put mesh/filter on the one
  big intake you cut and leave the leaks as exhausts. That is the right trade in a dusty
  house with an old chassis.

## 6. Flow map — the operator's exact 4 fans + the AIO

Assumption stated for correction: the **2 RGB fans are the radiator fans** (they were the
hub-lit TFAN pair in the 45L) and the **non-RGB intake is the spare front fan that cleared
90B on FFAN1**. If that mapping is wrong, the count changes and so does the pressure plan —
say so and this table gets re-cut.

| Position | Fan | Direction | Header (EC-watched) | Lighting |
|---|---|---|---|---|
| Rad, front-high (or top-front) | RGB #1 | intake through rad | `LCFAN` | hub `TFAN ARGB` |
| Rad, second mount | RGB #2 | intake through rad | `TFAN-LCFAN2` | hub `TFAN ARGB` |
| CPU block | pump | — | `FAN1` (fallback `LCFAN`) | — |
| Sawn lower bay | non-RGB 120 | intake → GPU face | `FFAN1` (the header that cleared 90B) | hub `FFAN ARGB` if RGB-capped |
| Rear | rear 120 | exhaust | rear header | — |

- `FAN1`, `LCFAN`, `TFAN-LCFAN2`, `FFAN1`, rear: **no header may end up empty** — the 90B
  prompt is a tach check, not a temp check (triage fact 5). If the front bank has 3
  physical mounts but you mount 1 fan, the spare goes on the remaining `FFANx` or on the
  hub, never just left unplugged.
- **Hub/RGB**: LOGO is 5 V only, never a 12 V `GRB` header (triage §5b). The hub's
  second SATA-shaped edge stays out of `SATA1–SATA4` (drive data lives there).
- **PSU (top-rear)**: if its fan faces INTO the case, the PSU is your second exhaust and
  happily drinks the GPU's rising heat — leave the top panel vents open. If it faces UP
  through the top panel, it self-cools and the rear fan carries the case alone: prop the
  PSU on its rubber feet with ≥5 mm gap and keep the front intakes unobstructed.

## 7. Gates — after the mod, same rules as the swap

1. Reassembly is **one wave**: magnet/vacuum receipt done → F10 → **Thermal page all
   numeric** (this is the post-cut tach gate; the 0 RPM `hp-isa-0000` fan1/fan2 from the
   2026-08-30 probe must become real numbers with fans re-seated) → 3 clean cold boots.
2. Then boot Void (Escape → ZBM → `nvme/ROOT/void`) and paste back
   `etc/case-swap-coldboot-probe.block` in full — it now doubles as the post-mod
   thermal/tach receipt.
3. **No CPU or GPU stress until that receipt is read.** Standing rules unchanged:
   4000 MT/s r3 stays UNPROVEN and un-reapplied; XMP 3733 remains the baseline; one
   physical change per power-on (the sawed bay + remount is THIS wave — the hub, the
   drives, everything else stay as they were).
4. If the pump block came off: new paste, even torque, and re-verify the memory training
   lesson (LGA1700 clamp pressure is a known POST-fault source — triage §C5/Sources).

## 8a. Receipt — empty-case photo, 2026-08-31 (chat attachment, not repo-persisted)

Operator: "everything is out currently". The photo (case on a dresser, side panel and
plastic bezel off; front to camera-right, rear to camera-left) changes three plan items:

1. **Top-rear PSU plate confirmed** — rectangular cable window + two bare screw holes at
   the rear half of the top. The front half is open rail with visible screw holes: if they
   are 120-pitch (105 within-fan / 225 outer-outer), the 240 rad bolts to **top-front**
   without drilling; that is the pump-low optimum and needs no new holes.
2. **The 5.25" cage is tool-less** (oval rail-latch cutouts, screws only at the top
   bracket) and the 3.5" trays sit on floor pads: **unbolt before sawing**. Saw only what
   is riveted. Keep the cage top rail regardless — it doubles as the rad mount. Do not cut
   the front return bend.
3. **Pre-drilled 120 patterns may already exist in the front metal** (vertical round-hole
   row at fan height on the front wall): if the non-RGB intake lines up, it bolts to steel,
   not plastic. The bezel then only needs vent windows — round every inside corner of a
   bezel cut and stop-drill cut endpoints (ABS crack-starters).

Open checks the photo cannot settle (tape measure in frame, or one more photo each):
rad hole pitch on the top rail; tube reach from a top-front rad to the mATX socket
(fall-back = front-high mount, same RGB fans pushing through); rear fan hole alignment
into a likely-140 honeycomb; and **the four SATA drives need decided homes** (bulk HDDs +
2 SSDs lived in the bay column) before the cut line is drawn — keep the floor tray
positions or sacrifice-and-re-drill one basket section. Housekeeping accepted in the empty
state: damp-cloth + magnet swarf/debris sweep (dark specks visible on the floor), standoff
audit, AIO re-paste, sawing off-dresser with the panel clamped.

## 8b. Operator decision 2026-08-31 (photo 2): FRONT-vertical mount, no native rad holes

Operator: "old case, no rad mount... front mount for space and aesthetics, cut out the
bottom rack and cover it up with the slot covers." Dry-fit photo = rad+fan stood vertical
at mid-depth; the assembly reads ~64 % of interior height, clear space to tray and front.

- **Orientation**: vertical column, tubes at TOP (as demoed) = pump below rad top = correct
  air-bubble geometry for this case.
- **Mount method, in order**: 1) measure the front wall's existing fan grid — 105 mm
  within-fan pitch means the rad's 4 corners share the standard 240 pattern
  (105/15/225) and bolt straight to the sheet with M4/#6-32 + washers + nuts.
  2) If 140-pitch (124.5): fan-screw mount — fans bolt to wall, rad to fans (30 mm screws),
  the standard no-mount solution for ~1 kg. 3) Slotted holes = 120/140 universal, slide to
  align.
- **Rack cut**: the 5.25 cage STAYS (top-front); the louvered lower rack is the cut zone,
  the RGB-rad column sits above it, the non-RGB GPU intake lands on the nearest CLEAN hole
  grid — do not bolt fans to floating sawn sheet. Slot covers = blanking only, never over
  a live fan face (louvers baffle). Keep the front wall's return flange; cut rack side
  flanges only.
- **Clearances to verify dry-fit**: rad top endcap + tubes vs retained 5.25 cage floor
  (if tight, that frame joins the same saw session); tube reach with the BLOCK SEATED on
  the socket, fresh paste, even torque (LGA1700 pressure = POST-fault class); GPU face to
  intake stack (budget ~55 mm).
- **Flow map unchanged**: 2× RGB = rad intakes, non-RGB = GPU intake, rear = exhaust,
  pump `FAN1`, rad fans `LCFAN`/`TFAN-LCFAN2`, front `FFAN1` — no header left empty;
  F10 Thermal all-numeric is still the first boot gate after reassembly.

## 8. Unverified / limits

- Exact case model never named by the operator; every dimension here assumes a standard
  120 mm fan grid and the M82880-002 rad. Verify by tape measure against §2 before cutting.
- OEM tube length: assumed short (45L was a top-rad design); the tube-reach test in §3.1
  is the receipt that settles it.
- Whether the rad came with its own separate fans vs the two RGB units is ASSUMED
  (RGB = rad fans) — flagged in §6, correct it and the table changes.
- No target measurements in this document: everything hardware-labeled traces to
  `STATE.md`, `MASTER.md` durableFacts, or `case-swap-sff-triage.md`; the saw/mount
  material is standard workshop practice (fan bolt/nut pattern corroborated 2026-08-31),
  not observed data.

## 8c. Order correction + lighting plan (operator, 2026-08-31)

Operator: "cut first — if the radiator doesn't go in the front then two or more intake fans
do." Correct: the rack cut is branch-independent, so sawing precedes any rad/fan mounting
decision. §8b dry-fit checks move AFTER the cut; the cut itself is gated only by the
mark-photo (line short of the return flange, fan grid holes intact, solid metal around
every future bolt hole).

Lighting (later steps, physical notes only):
- Lightbar strip hides INSIDE the front crossbar channel; LEDs face the crossbar's open
  slot so it acts as the emitter — drop-in + adhesive, wire exits through an existing
  hole, connector end left reachable. Do not cut the crossbar to fit it (it is a brace).
- LOGO module goes behind the plastic bezel's bottom vent strip, stuck to the bezel's
  inner face (not floating in the now-open rack window), LEDs close to the plastic so
  light actually leaks through the vents instead of scattering. LOGO stays 5V only (triage
  §5b rule — unchanged by relitigation).

## 8d. Cut-line gate — photo 3 verdict, 2026-08-31

Operator photo (case on its back, carpet): yellow tape X on the bay panel top = rad+2-fan
zone vs the slotted crossbar (kept; also lightbar housing per §8c). "Marked area is the
minimum clearance for 2 fans/rad." Verdict: approved, three amendments — (1) +30 mm at the
tube-end for endcap/braid bend, else mount tubes-down; (2) crossbar top+bottom mounting tabs
stay in the keep zone; (3) cut on the waste side, panel wood-sandwiched and clamped —
carpet gives no support. Next gate after cut+deburr+seal+sweep: open-zone photo, then the
§8b hole-pitch decision for the mount method.
