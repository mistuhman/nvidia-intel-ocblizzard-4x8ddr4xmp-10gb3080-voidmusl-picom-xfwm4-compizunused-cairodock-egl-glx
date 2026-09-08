# Case-swap plan — 2009 Mac Pro (A1289) transplant, phased and gated

Date: 2026-09-07b (session 01a07de8)
Status: **ACTIVE PROJECT PATH.** Operator amended the constraint: "im clearly willing to
make compromises… the answer is never about how its impossible, but rather possible… just
need to take it one step at a time." This plan supersedes the decline verdict in
`docs/case-swap-macpro-verdict.md` (which remains the record of the no-mod claim and the
source of every constraint this plan has to engineer around).
Companion facts: `docs/case-swap-3-2-beep.md` (gate 12 ladder), `docs/case-swap-rad-mount.md`
(rad/airflow doctrine), `docs/case-swap-hdd-mount.md` (ZFS rules that outrank mounting).

## Preamble — why the bench-first order makes this safe (not blocked)

Gate 12 is open: the board beeps 3.2 in the APEX. The amended 2026-09-05b ladder's pending
wave is Step 0 (zero-power capacitor audit). A transplant does NOT stack variables if the
board is proven BEFORE it moves:

- Taking the board out of the APEX and POSTing it on the bench is the single most
  isolating test the 3.2 classes have: it physically removes M3 (hose/pump-block tension),
  M0-A1 (case-side cap/standoff shorts), forces the M1 reseat, and decouples M4 (the two
  4-pin CPU plugs get re-seated on an open board). It is the transplant's first physical
  step AND the gate-12 ladder's best version — same work, one purchase.
- The owed inverse (F10 XMP 3733 / M2) happens at the first clean bench POST.
- Only a board that POSTs clean on the bench, three cold boots in a row, is allowed
  inside the Mac Pro. If it never POSTs on the bench, we never spent a cut on the Apple case.

## Governing rules (unchanged)

1. One physical change per power-on; a changed beep code = STOP (new class).
2. Zero-power protocol between states: cord out (no rocker on that PSU), hold button 20-30 s.
3. ESD bench: wood or the anti-static bag, wrist strap if available, no carpet.
4. Log the interface, not just the value (how every fan/header/PSU/tray fix is attached).
5. Measure before any cut; metal removal has no inverse; keep every Apple part (bag/label) —
   teardown is reversible until the first cut, and the first cut happens ONLY at the
   Phase-2 operator gate after Phase-1 measurements.
6. `zpool export` before the drives move; `/dev/disk/by-id` only; one drive per power-on.

## Phase 0 — Bench (closes gate 12), zero cuts, all existing parts

Step 0a (THIS WAVE — the pending audit, relocated to better conditions):
- Cord out, button held 20-30 s. Strip the APEX down to the bare board: GPU out, AIO pump
  block off (note orientation/even-pressure on re-fit later), DIMMs out, 24-pin + both
  4-pin CPU out, NVMe stays seated on board unless it blocks light.
- Step-0 capacitor audit EXACTLY as specified 2026-09-05b: bright oblique light, macro
  photo with neighbouring DIMM slots in frame, five looks (fillets, body vertical, nothing
  touching, sleeve/seal clean, pads match neighbours), report WHICH ZONE the bent cap is in.
- **2026-09-07 amendment (M6, see docs/case-swap-3-2-beep.md §2b):** the same zero-power
  strip adds the socket receipts, in strict order AFTER the cap photos: (1) note which pump
  fasteners were tight vs loose and photograph the **paste imprint** on the block face and
  IHS before unbolting is finished and before anything is wiped; (2) **2026-09-07c
  least-harm change: NO CPU lift** — the pin inspection is replaced by the in-place
  re-clamp (lever full open, board kept horizontal, eyes-level seat check, even planar
  press through the window, full-travel latch; procedure in the beep doc section 2b);
  (3) power stays off until the receipt returns. The CPU lift survives only as the
  contingency branch if the re-clamped board still beeps 3.2.
- Receipt: the macro photo + zone report + paste/pin/pad photos, in chat, before any power.

Step 0b (next wave, after receipt read): bench minimal POST — board on non-conductive
surface, ONE known-good DIMM in A2, bench-top: 24-pin + both CPU 4-pins in, GPU in (KF has
no iGPU; needed for video), back-panel PSU on, momentary short of the 2-pin PB header with
a screwdriver. Pump block mounted per beep doc 2c: whichever 90-deg step
gives TRUE hose slack (180-deg approved 2026-09-07d - four conditions: equal finger-start
engagement on all posts, corner-press flat test, slack ties + jiggle test, pump never
highest). Listen: 3.2 again → M2/M5 classes per the beep doc, one measured step each.
Splash → in F10 load XMP Profile 1 (3733 @ 1.35, the owed M2 inverse), F10 save, three
clean cold boots, then power off. Board is now PROVEN and the transplant is unlocked.

## 2026-09-07e — The hose-length argument (Cryo-Chamber inheritance) — the fit case, accepted

Operator (verbatim, parts): "this is why i suggested the mac pro case… one hose is longer
than the other since its meant for the cryo chamber upper compartment." Photo-3 receipt
(2026-09-07): board back in the APEX, block re-mounted (180-deg), hoses running a taut
diagonal across the board with the rad/fans parked low — "no slack". **Accepted:** hose
length is FIXED and asymmetric by design (the loop was tuned for the OMEN 45L Cryo Chamber
offset upper compartment), so rotating the block only re-aims the exit — it cannot add hose.
In a 184x406 mm box the rad-to-socket distance defeats relaxed hoses at ANY legal
orientation, and taut hoses are exactly the M3/M6b block-rocking load class we just
diagnosed. The APEX as a host for THIS cooler closes on physics: no more APEX power-ons are
worth paying for; it becomes the donor shell. This is the first form-factor argument for the
Mac Pro that survives engineering review.

**Order correction, operator 2026-09-07g ("it needs to reach from where the final position
would be; if it doesnt mount from there, the case just wont work"):** the hose-reach test IS the
case go/no-go and it only counts from the FINAL rad position inside the Mac Pro — APEX reach
attempts are moot (already closed on physics). Zero-power Wave G (geometry) therefore jumps the
queue: (1) strip the Apple guts (bag/label everything; memory/backplane cage and fan cages out =
the rad tunnel opens) — ORDER for the A1186: sleds pull out the front first; then BOTH memory
riser cards (ejector levers, lift straight up); then the memory cage — its four
logic-board-side screws are CAPTIVE (they stay in the cage; do not try to pull them out), and
the iFixit guide notes TWO MORE short screws on the case bottom panel plus a fan that must
slide partway into the cage on three latches; expansion cards come BEFORE the logic board
(PCI bracket = 2 captive screws, then release the locking clip at the front of the card slot
and pull the card straight up), logic board always LAST. References:
https://www.ifixit.com/Guide/Memory+Cage+with+Rear+Fan+(Early+2008)+Replacement/25939 ,
official Apple 1,1/2,1 teardown PDF via
https://www.ifixit.com/Teardown/Mac+Pro+First+Generation+and+2nd+Generation+Teardown/122781 ,
video: https://www.youtube.com/watch?v=_tUVMVjqVw0);
 (2) the mATX board's position is dictated by PCIe slot-cover alignment —
the 8917's primary x16 has FOUR discrete slot-level choices, 20.32 mm apart, so the board offset
is a fit-search knob, not a guess; set the board DRY at the chosen level (no screws) on an ESD
bag; (3) place the rad+fans DRY at the lower-front tunnel final position; (4) offer the block to
the socket and route both hoses to their barbs. PASS = BOTH hoses at <=80% of free length in
relaxed loops with the block able to mount planar (finger-start all four) AND rad top above
socket (pump-never-highest). Free reach levers if tight: block clocking, rad height in the
tunnel, slot-level choice, rad depth across the 206 mm width. FAIL after all four levers = the
case is out on measurement, nothing cut, nothing lost. Then the bench POST wave proves the board
(same floated-geometry, now informed by real numbers).

**Constants that travel to ANY chassis (unchanged):** the pump block is never the highest
point of the loop; rad tube-end placement decides where air lives (tube-end at/near the
rad upper portion); BOTH hose ends relaxed (the jiggle test governs); rad fans bolt
frame-to-frame to the rad (sandwich rule, docs/case-swap-rad-mount.md); header discipline —
the cooler-own OMEN fans stay on the EC-watched headers (pump FAN1, rad LCFAN/TFAN-LCFAN2),
the 140-class case fans are ADDITIONS on free headers/splitters, and the spare OMEN tach
keeps a hidden home for 90B.

**New pipeline (supersedes fit-the-APEX work):**
1. **Table-bench POST wave** (pending; also the first GEOMETRY REHEARSAL): board out of the
   APEX onto the bench, rad floated beside it on a shoebox — rad top above the block, both
   hoses lying relaxed on the table plane. Cleanest M-class isolation AND a free proof of
   the real hose budget. ~~Power stays gated on the owed M0 cap macro~~ **UPDATE 2026-09-07f: zone = MUSB (front-I/O USB header zone) = the ELSEWHERE branch = conditional PASS; the five-looks eyeball runs inside the bench wave before power, then the wave proceeds.**
2. **Phase 1 measurements** (below) plus three additions: (H1) measure EACH hose separately,
   block barb to rad barb along its natural arc — the asymmetry becomes the ALIGNMENT SPEC:
   short hose to the near rad barb, long hose to the far barb; (H2) front-door inner face to
   the front-fan-bay depth and the bay height where the 140s go — the rad stack candidate;
   (H3) READ THE MODEL LABEL (rear/bottom edge serial/EMC): operator messages name both 2009
   (A1289/4,1) and 2006 (1,1 family); the cheese-grater shell is a shared family so this
   plan stands either way, but the power-button harness, fan cages and removable
   memory-riser bays differ by generation.
3. Rad target geometry in the Mac Pro: lower-front tunnel intake behind the perforated door,
   rad top above socket height, offset chosen so NEITHER hose exceeds ~80% of its free
   length; the asymmetric pair maps naturally: short leg to the near barb, long leg to the
   far barb. Removing the Apple memory/backplane cage assembly opens exactly this volume.
4. **Tidy-I/O ladder** (Phase-2 decision rides Phase-1 numbers; beauty rule applies):
   (a) Laser Hive backplate + I/O shield — cleanest, paid, some rear-mesh cutting;
   (b) DIY nibbled rear-mesh window dressed with the board OWN factory I/O shield — free,
   tidy at arm length, minimal and disguised; (c) buried I/O + slot-bay plates — zero cut,
   function tax. Recommendation stands at (b), gated on the cavity math.

## Phase 1 — Donor teardown + measurement inventory (zero power, no cuts yet)

Remove (keep everything, bag/label): sled cache check FIRST (see data rule below), then
Apple PSU (custom shroud unit), logic board slide-out tray (carries CPUs + Apple RAM
cages), backplane, PCIe fan cage, optical cage, HDD cage + the four sleds (KEEP — these
are the raid-grade drive mount), front door harness (power button + LED), any misc shields.
The memory-cage space claim the operator named is real: with the Apple tray/cages out, the
entire center volume is free — our 4x8 Kingston DDR4 rides the 8917, not the case.

DATA RULE: the sleds in the photo are labeled "Scratch Disk" and "Backup". If the Mac Pro
or its disks hold anything needed, copy it off FIRST (the disks are plain SATA — they can
be read on the target later via the SATA stack; export = power off before any drive move).

Measure (ruler/caliper; numbers ship to chat, decide Phase 2 on receipts):
1. Front-door inner face → drive-cage front plane (rad+fans depth budget; rad stack ~52 mm).
2. Freed front-middle height/width with cage out (240 rad vertical fit behind the door mesh).
3. Back wall: clear mesh zone above the slot covers (candidate I/O-shield window) and the
   slot-cover spacing vs the 8917's slot positions (slot alignment FIXES tray offset).
4. PSU bay internal W×H×D vs the OMEN ATX 150×86×~160-180 mm + rear inlet geometry.
5. Left-wall flat area + existing shelf/bottom screw positions (the Laser Hive's own tray
   "fastens to the Mac Pro case using the shelf screws as well as the bottom case screws" —
   proof that existing case holes can carry a new tray with NO shell drilling:
   https://thelaserhive.com/kits/powermac-g5-conversion-products/motherboard-tray/).
6. GPU corridor: PCIe zone with the Apple fan cage out (the 313 mm 3080 fits this class of
   case; the guide cage is removable).
7. Power-button harness: connector ID + continuity check (which two pins close on press;
   LED pins optional). Documented conversion precedent incl. front-panel functionality:
   https://www.tonymacx86.com/threads/laverdas-new-a1289-2010-mac-pro-pc-build-incl-front-panel-functionality.306044/
8. Every proprietary standoff/peg that protrudes where the tray must sit (they are
   press-fit/riveted; hammer-out per the mastergrade log is one option, Dremel-flush the
   other — decision at Phase 2, zero power:
   https://mastergrade.wordpress.com/2020/11/17/sleeper-pc-mac-pro-part-two/).

## Phase 2 — Operator gate: tray + I/O strategy (decide on Phase-1 numbers)

- **2A Full kit path**: Laser Hive ATX+PSU kit £80-90 + front-panel kit £55 + rad brackets
  £20 (~£155-180, order-by-email). Cleanest. Their backplate still means cutting the rear
  mesh around the PCI zone (their own PDF: "rock the part back and forwards until the PCI
  slots come out" — mesh-level cut, then their brushed-aluminum backplate dresses it).
- **2B DIY hybrid (uses what we have)**: tray = donor plate (aluminum/steel/acrylic scrap;
  drill the PLATE, not the shell) anchored to existing shelf + bottom screws per receipt
  above; rear I/O = controlled mesh window with nibbler+file (the rear is fine mesh; a
  159×45 mm window dressed with a standard brushed I/O shield reads near-stock at 1 m;
  NOT load-bearing), OR buried-I/O + slot-bay USB plates (zero cut, function tax); PSU =
  strap-plate on existing PSU-bay holes or floor-mounted on rubber against the rear mesh.
- Both keep the aesthetic rule honestly: nothing visible from the front door changes.

## Phase 3 — Rad + airflow map (fits the operator's 140 acceptance + OMEN tach rule)

- Fan thesis operator-approved in spirit: 2×140 class front intake + 140 exhaust in a
  perforated shell trivially meets the Appendix-D target (dT = 1.76×W/CFM; ≥80 CFM real
  through-flow for ~460 W ⇒ ≤+10 C interior rise; the APEX never had this volume).
- **90B discipline (fan compromise, engineered)**: the EC watches named headers. Keep the
  OMEN 4-pin tach fans ELECTRICALLY alive on their headers — a fan only has to report a
  tach and move air, it is allowed to be foam/strapped ANYWHERE it helps (behind the rad
  zone, over the VRM, near the GPU intake). New 140 mm fans join on free headers/splitters;
  ONE generic fan may replace an OMEN fan on a watched header at a time, and each swap is
  proven with `etc/omen-90b-fan-probe.block` before the next. That is "abandon the OMEN
  fans" decomposed into steps the firmware can't punish.
- Rad placement candidates (Phase-1 numbers decide): **A** front-middle vertical intake in
  the freed cage zone behind the perforated door (best: cool air, huge mesh, short hoses,
  rad top above pump satisfied); **B** rear-mesh exhaust mount (uses the 140 exhaust slot;
  warms nothing at the desk but feeds the CPU case-warmed air). Appendix-A flip rules and
  the pump-never-highest rule carry over unchanged from `docs/case-swap-rad-mount.md`.
- The Apple fans do not come along (proprietary harness/profile; benched, not adapted).

## Phase 4 — Assembly, one change per power-on

Order: tray+board → PSU → GPU → one drive (NVMe first: boot proof) → rad → fans → remaining
drives one per power-on with `zpool status`/export discipline per `docs/case-swap-hdd-mount.md`.

## Phase 5 — Boot + thermal gates (same meters as every prior swap)

`etc/case-swap-mem-3-2-post.block` FULL paste on first Void boot; 3 clean cold boots;
then the rad-cut-postdiag analog tach receipt; then Superposition 1080p Extreme + dmon,
PASS = GPU ≤81 C / CPU ≤70 C with the panel ON. Pre-swap reference: 9079 in the OMEN 45L
(pre-cut), stock 8717.

## Phase 6 — OC resume

Gate E unchanged: XMP 3733 r0 validated first, GPU daily profile (cp90-m400-pl95) re-armed,
then the CPU/DDR4 ladders per existing docs. OC stays locked out until Phase 5 passes.

## Teardown receipt — 2026-09-08 GPU PCI-bracket screw classification

Operator photo receipt: the Mac Pro GPU remains installed. Both rear PCI-bracket screw heads turn but do not rise, which is consistent with captive screws. The upper screw turns with normal captive-screw behavior. The lower screw has substantially higher resistance and then stops; it is unresolved between bracket preload and partial seizure. No screw was forced, drilled, heated, gripped with pliers, or removed with a powered driver.

**Current gate:** GPU retention is a classification gate, not a removal gate. The GPU stays installed. The next physical action must be issued separately after this receipt; no further turning is authorized until the lower screw/bracket interface is resolved with a close inspection. This receipt supersedes the earlier over-broad instruction that bundled GPU removal with other teardown actions.

## Teardown receipt — 2026-09-08b full-interior photo (Wave G)

Operator photo receipt (case upright, side panel off, open left side): memory-cage
windows show EMPTY channels (riser cards OUT, visually confirmed); the cage itself is
still seated; GPU still installed, ribbed shroud, BOTH 6-pin power connectors populated
with cables routed left; the rear PCI-bracket pair (upper + lower dark screws) visible
at the rear mesh — the lower screw stays UNRESOLVED between bracket preload and partial
seizure, so the classification gate above still holds: no turning, no GPU removal;
optical bays still in; hand tools only on the bench (adjustable wrench, hex key, bits —
powered driver stood down). Next authorized physical action: ONE straight-on macro photo
of the two rear bracket screws, no tool contact, no turning — the close inspection that
resolves the lower interface before the board+cards unit slide.

## Risks / unknowns (honest list)

- Power-button harness pinout: continuity-probe homework, not a blocker (worst case = a
  discreet momentary button; the HP board takes a bare 2-pin short).
- Apple PSU-bay shelf may foul the ATX PSU (Phase-1 number 4 decides bracket vs floor).
- Riveted vs screwed Apple internals: anything riveted becomes its own decision gate
  (hammer-out vs Dremel-flush vs leave).
- Rear mesh window cosmetic result (2B): acceptable-by-decision at Phase 2, operator gate.
- Sled-cage removal for rad zone (candidate A) costs the 4-tray mounting; mitigation =
  sleds retained individually bolted elsewhere or 2-sled half-cage. Phase-1 numbers decide.
- If the board never POSTs on the bench (Phase 0), the Mac Pro path pauses automatically —
  no Apple part modified, zero sunk cost.
