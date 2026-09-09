# Case-swap plan — 2009 Mac Pro (A1289) transplant, phased and gated

Date: 2026-09-07b (session 01a07de8)
Status: **PIVOTED 2026-09-08 — KEEP-AS-MAC (transplant CLOSED).** The operator confirmed the
reopen: the Mac Pro 1,1 reassembles as a daily-driver macOS+Windows dualboot; the 8917
re-hosts in the APEX with a different rad/cooler layout. See "PIVOT 2026-09-08i" at the end
of this file — it supersedes every transplant-phase instruction; the governing rules below
carry over unchanged.
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
   WITHDRAWN 2026-09-08 by operator ("DIYing nibbled grater metal is not better")
   — NO mesh cutting for I/O. Recommendation moves to (c+) buried I/O + the
   operator's extension variant: internal male ports extended to female panel-mount
   at the Apple rear via slot covers/brackets, zero cut. GPU ports need no extension
   (3080 bracket faces the slot covers directly once aligned).

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

## Teardown receipt — 2026-09-08c optical bay + PSU questions (Wave G)

Operator report + photo: memory-cage hidden bottom screws OUT (operator report,
accepted per truth order); DVD drive OUT (photo: optical-bay left cavity open, right
bay cover still in); GPU 6-pin power UNPLUGGED (both connectors dangling free); GPU
identified EVGA GeForce GTX 285 (alien upgraded card — rear bracket screws stay treated
as alien fasteners); PCI-bracket macro from the 2026-09-08b wave still owed. STUCK:
backplate screws at the rear of the opened optical bay — type/cause unverified (wrong
driver vs threadlocker vs rivet class). PSU verdict shipped: Mac PSU stays a kept Apple
part, never wired to the 8917 (proprietary pinout, ~980 W multi-rail, no off-shelf ATX
adapter; custom harness = unproven class on a gate-12 board); single OMEN 800 W ATX
powers the transplant, no dual PSU (load math + sequencing risk). Next authorized
physical action: ONE macro photo of the stuck backplate screws, no tool contact —
classification before force.

## Teardown receipt — 2026-09-08d tool inventory (Wave G)

Operator tool photo (3 identical frames): yellow DeWalt cordless drill/driver on the
shelf — STAYS STOOD DOWN per the 2026-09-07h hand-tools-only ban, parked off the
bench; pruning shears + red electric shears = unnecessary for teardown, off the bench
(first cut only at the Phase-2 gate); tape measure KEEPS (Phase-1 dims ride on it);
black I/O shield on the shelf stays unbent (dress piece for tidy-I/O option B if it is
the 8917 factory shield, else bagged as an Apple part — unverified which); compressed
air kept capped until cleaning waves; T-handle drive type unverified (Torx T10/T15 = keep,
hex-only = park); magnetic Phillips / Torx hand drivers / rubber band + locking pliers /
bags + labels + bright light are the staged kit (pliers/band staged, not authorized).
Bench board + PSU at frame left (POST "8.8" rig) is not part of this teardown — left
alone. Boards never touch the carpet (ESD rule 3); work stays on the shelf/bag. Kit trim
shipped as information only — the authorized single physical action remains the
backplate-screw macro from 2026-09-08c (still owed); bracket macro queued behind it.

## Teardown receipt — 2026-09-08e backplate macro classified (Wave G)

Operator close-up (NEW — prior frames were wide interior / optical-bay / tool-shelf
shots; this macro was not sent before): optical-bay cavity with the drive out.
CLASSIFIED MIXED: (a) the two screws at the ends of the top horizontal latch bar show
Torx recesses = removable class, hand Torx only; (b) the lower shelf domed posts show
NO drive recess at this resolution = rivet/press-fit class (provisional — a shallow
Torx cannot be fully excluded at this angle, but they are not the retention path and
get no test-turns). Black flex draped across lower-left left untouched. PCI-bracket
macro remains queued behind this wave. Authorized single action: remove ONLY the two
top-bar Torx screws (driver must seat fully with zero wobble, else stop), bag + label,
then stop with no force on the plate and no touch on the lower posts; report whether
the bar/plate frees. Expectation set: the plate itself may be shell-riveted
(leave-class); the rad tunnel opens via the lower cage removals, not this plate.

## Teardown receipt — 2026-09-08f Torx tool-gap + I/O/fan/tray concerns (Wave G)

Operator report: NO Torx driver in the kit ("ill look later") — the top-bar Torx pair
from 2026-09-08e is TOOL-GATED until the operator sources one; the sourcing itself
needs no wave, operator reports when a driver is in hand. Planning turn, no physical
wave shipped: the three transplant concerns answered on paper — rear I/O is the 8917's
own standard cluster + factory shield (nothing Apple in the signal path; tidy-I/O
ladder (a)/(b)/(c) decides at the Phase-2 gate on measurement #3); Apple fans benched
not adapted (proprietary 4-pin, voltage-controlled not PC-PWM, adapters not recommended
per macrumors receipts; cooling = OMEN tach fans on EC-watched headers + standard
140 mm PWM on free headers/splitters with one-at-a-time 90B proving); board screws to
a tray plate on standoffs at the mATX pattern, tray anchored to existing shelf + bottom
case screws (Laser Hive receipt — drill the plate, never the shell), offset dictated by
slot-cover alignment. Queue unchanged: top-bar pair (tool-gated) → bracket macro.

## Teardown receipt — 2026-09-08g operator redirect: extensions, risers, fans (Wave G)

Operator verdict on prior answers: "kind of terrible" (accepted, not defended).
I/O: operator's extension plan ACCEPTED — internal male ports extended to female
panel-mount at the Apple rear via slot covers/brackets, zero cut; nibbled-mesh option
(b) WITHDRAWN by operator, ladder is now (a) kit vs (c+) buried + extensions; passive
USB3 extensions stay short (~1 m max), no hubs on boot-critical ports, LAN routes via
slot-cover gap. Tray: donor-plate fabrication DEFERRED — pivot to on-hand
risers/standoffs fit-test; space-vs-anchor distinction recorded (risers set board
height for slot alignment, anchoring decides after the dry fit). Fans: adapter path
assessed honestly (connector repin = easy half; Apple voltage-control vs HP PWM+tach =
hard half; only no-electronics path is fixed 12 V full-blast with no 90B credit) and
abandon path RECOMMENDED (quad-stack rad + single rear exhaust + hidden dead-RGB spot
= the existing header budget: FAN1/LCFAN/TFAN-LCFAN2/FFAN1/FFAN2/FFAN3 + one Y-splitter
on a non-watched pair); operator's either/or recorded, choice owed. Queue reordered per
latest-wins: riser inventory (current, zero-power) → top-bar pair (tool-gated) →
bracket macro. Authorized single action: ONE photo of all on-hand standoffs/risers
(plus any rails/plates/screws for mounting) grouped with the tape measure in frame,
with count + thread if known.

## Teardown receipt — 2026-09-08h operator reopens keep-as-Mac; transplant HALTED (Wave G)

Operator redirect (verbatim core): the original plan was a usable companion Mac for
video editing + dual-booting Mac OS X; early transplant friction means "not worth it
to proceed"; the 8917 + rad are still in the APEX ("all it needs is some quick
rethinking and refinement"); old generic cases are "the exact opposite of proprietary".
TRANSPLANT HALTED pending the decision confirm — no further teardown, no turning, no
removals. Nothing was cut, so reversal stays possible (parts-bagging UNVERIFIED —
inventory before any reassembly wave). Agent verdict shipped: YES, keep-as-Mac is the
better option. Honest 1,1 capability set with receipts: 32-bit EFI, Lion 10.7.5
official cap, El Capitan 10.11 max via boot.efi workaround, GTX 285 Tesla = no Metal
(Metal needs AMD HD 7xxx+ / Nvidia Kepler 6xx+; cheapest flashed boot-screen card is
the GT 120 class) — so video editing = period software (FCP7/CS6-era) / proxy
workflows / Linux-side heavy lifting, and the realistic best outcome is vintage macOS
+ modern Linux dual-boot on 8 Xeon threads with 4 sleds (dual-boot target unverified).
APEX pivot accepted with the physics carried, not dropped: hose asymmetry measured in
photo-3 stands; the operator's rethink + the still-owed bench POST proof are the next
phase (gate 12 never closed — the board must POST before ANY path proceeds). Queue
frozen: riser inventory / top-bar pair / bracket macro all superseded by the decision.

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

## UPDATE 2026-09-09 (session 01a085aa) — Mac is ASSEMBLED & ONLINE; browser bootstrapped

Supersedes the "mid-reassembly / R0 owed" state below. Operator confirmed + photo-verified:
the Mac Pro 1,1 is **fully assembled, booted, online**, running **Mac OS X 10.6.8**, with
AirPort Utility already seeing the Time Capsule. The reverse-Wave-G reassembly queue (R0–R7)
is therefore effectively DONE up through a working desktop. Daily-driver work is now software.

This session bootstrapped a modern-engine browser onto the box (dead Safari → macintoshrepository
HTTP → TenSixFox → clock fix → GitHub → **Arctic Fox 47.3 mac32 + libc++.from-MP.10.6.mac32**,
launched). Full operator-verified recipe + traps (TLS1.0 curl dead end, 2001-clock/HSTS wall,
PPC-vs-Intel, broken 64-bit libc++ `___emutls_get_address`, the `from-MP` vs `from.MP` filename
trap) live in **`docs/case-swap-macpro-daily-driver.md`**. Libreboot is NOT possible on the
tower (coreboot supports only the MacBook 1,1/2,1, not the 5000X-chipset Mac Pro); anonymity
goals move to the OS/network layer. Destructive drive backup→swap→wipe→clean-install→new-admin
track is defined there and NOT started.

## PIVOT 2026-09-08i — KEEP-AS-MAC CONFIRMED (transplant CLOSED)

Operator directive (verbatim core, session 01a082d3): "get this case working back together so
it can be used as a daily driver dualboot for mac os x alongside my apex pc with a different
rad layout so we can use the mac for the airport utils and video editing aswell as
windows/mac/source port apps." This confirms the 2026-09-08h reopen. The Mac Pro 1,1 (A1186,
2006 model year per the 2026-09-07h receipt) STAYS a Mac; the 8917 transplant into it is
CLOSED. Nothing was cut, so the reversal is pure reassembly. This section supersedes every
transplant-phase instruction above; the governing rules (one action per message, zero-power
protocol, log the interface, no forcing alien fasteners) carry over unchanged.

### Track A — Mac Pro reassembly to daily driver (reverse Wave-G, one action per message)

Current state from receipts (2026-09-07i → 2026-09-08h):

- OUT: both memory riser cards (whether DIMMs are still mounted on them is UNVERIFIED — the
  inventory decides), all 4 HDD sleds + drives, DVD drive, the memory cage's 2 bottom screws
  (the cage itself is still seated; its 4 corner screws are captive and loosened), both GPU
  6-pin power leads (unplugged).
- IN: logic board, EVGA GTX 285 (PCI-bracket screws are captive-style; the lower interface
  stays UNRESOLVED between preload and partial seizure — reassembly only ever re-snugs,
  never forces), Apple ~980 W PSU (it powers the Mac again — the "never wired to the 8917"
  verdict was transplant-scoped), top-bar Torx pair (never removed; the Torx tool-gate is
  MOOT for keep-as-Mac since nothing more needs to come out), right optical bay cover.
- UNKNOWN until inventory: the rear cage fan (no removal receipt — assumed still latched in
  with its cable attached), and where every removed screw/bag lives ("parts-bagging
  UNVERIFIED" per 2026-09-08h).

Queue (each step ships ONE action, receipt before the next):

- **R0 (NEXT, still owed 2026-09-09) — zero-power parts inventory.** 1030 HDMI path DECLINED this session; 285 stays. Mac unplugged, report in words (photos OK — this chat has vision):
  (1) both risers — DIMMs still mounted? any A/B or slot markings? (2) the 4 sleds — labels
  (Scratch Disk / Backup / …), which bay each came from if known; (3) the DVD drive + any
  fasteners that came out with it; (4) the two cage bottom screws + any bag of loose
  screws; (5) is the rear cage fan still seated with its cable attached? (6) both GPU 6-pin
  leads visible and undamaged. This is the pre-reassembly inventory mandated by 2026-09-08h
  and it is zero-risk. Photos are optional this session: the 01a082d3 agent has NO image
  input, so every photo receipt is a TEXT DESCRIPTION from the operator.
- **R1 — memory cage:** confirm fully seated, reinstall the 2 bottom screws, snug the 4
  captive corners hand-tight (they stay captive — never pull them out). If the fan was
  disturbed at any point, its cable and 3-latch slide go home BEFORE the cage screws.
- **R2 — risers back in:** original bays (keyed), ejector levers open, press evenly, close
  levers. If DIMMs were separated from the risers: STOP and report — the 1,1 pairs DIMMs
  ACROSS risers (slot 1 of riser A + slot 1 of riser B) and the original pairing must be
  restored exactly; the pairing is unknowable from photos alone if the cards were mixed.
- **R3 — sleds back into the front bays:** slide until the latch catches (the extraction
  interlock trick is not needed going in). No data action required — the copy-off rule was
  transplant-scoped; drives were only pulled, never opened.
- **R4 — DVD drive back into the optical bay**, fasteners per the R0 inventory.
- **R5 — GPU power and bracket:** replug BOTH 6-pin leads until latched; re-snug the PCI
  bracket screws — the upper normally, the lower gently with a STOP at resistance (seating
  direction is the opposite of the seized extraction direction; the interface remains
  classified-unresolved and gets no force).
- **R6 — first power-on smoke test:** side panel on, cord in, power button; hold Option at
  the chime → Startup Manager → report every volume icon shown. A fan ramp that settles in
  the first seconds is normal 1,1 behaviour. This receipt inventories the OS situation
  (which macOS is installed, if any; whether a BOOTCAMP/Windows volume already exists).
- **R7 — OS/dualboot wave, decided by R6:** target macOS = El Capitan 10.11 via the
  boot.efi workaround if not already present; then Boot Camp Windows per the software set
  below.

### Track A software capability set (search receipts, 2026-09-08)

- macOS ceiling: Lion 10.7.5 official; El Capitan 10.11 max via the Piker-Alpha-class
  boot.efi workaround (receipts: apple.stackexchange.com/questions/273724,
  lowendmac.com/2006/mac-pro-mid-2006/, forums.macrumors.com/threads/1890435). NEVER
  install Security Update 2018-001 or later over the mod (it breaks boot.efi on 1,1/2,1 —
  lowendmac warning). El Capitan is the target because the use cases need it:
- AirPort Utility: AU 6.3.x requires OS X 10.7.5+ (macupdate.com receipt) → runs on El
  Capitan. Legacy (802.11n/Ethernet-era) base stations need AU 5.6.1 + the 10.8-10.11
  launcher (bristleconeit.com receipt). WHICH base station the operator runs is an R7-time
  question.
- Video editing: FCPX 10.3.x requires El Capitan 10.11+ (Apple Community receipt) and uses
  OpenCL, not Metal — the GTX 285 is OpenCL-capable and field-benchmarked workable for FCPX
  (tonymacx86 receipt); iMovie 10.1.x is the lighter fallback. Honest ceiling: 8 Xeon
  threads + 1 GB VRAM + no hardware H.264/HEVC engines = 1080p/proxy workflows, not 4K;
  the APEX/3080 stays the heavy encoder.
- Windows dualboot: Boot Camp on the 1,1 officially tops out at Windows 7 (proven, Boot
  Camp 4-era drivers; reddit.com/r/applehelp/3enpt9 receipt). Windows 10 x64 is
  community-proven via patched install media or a 7→10 in-place upgrade, with no Apple
  Win10 driver package and option-boot to switch OSes (reddit + quora receipts). Windows 7
  is EOL — for a networked daily driver, Windows 10 via the patched-media route is the sane
  target; final call at R7.
- Source ports: 64-bit 10.6-10.11-era builds exist for the major engines (GZDoom, the
  Quake family, ECWolf class); exact per-title compatibility gets verified when the
  operator names the ports (unverified today).

### Track B — APEX re-host with a different rad layout (gate 12 first, unchanged)

1. **B1 = the owed bench POST wave** (Phase 0 Step 0b above, verbatim): board out of the
   APEX onto the bench, floated rad on a shoebox (top above the block, both hoses relaxed
   on the table plane = the real hose-budget receipt), five-looks M0 eyeball (zone = MUSB =
   conditional PASS), ONE known-good DIMM in A2, GPU + GPU power, 24-pin + both 4-pins,
   pump on FAN1 (a 90B prompt is EXPECTED — Enter past it), momentary screwdriver short of
   the 2-pin PB header, splash → F10 → XMP Profile 1 3733 @ 1.35 V (the owed M2 inverse) +
   read After Power Loss = Off → 3 clean cold boots. A 3.2 = STOP, branch per
   docs/case-swap-3-2-beep.md (CMOS-cap M2 force → contingency socket lift, which re-arms
   only on continued 3.2 after the in-place fix).
2. **B2 = rad-layout decision** (the operator's "quick rethinking and refinement"). The
   2026-09-07e physics receipt closes ANY in-APEX position for THIS loop (fixed asymmetric
   hoses vs a 184×406 mm box — rotation re-aims, it never lengthens). Two purchase-class
   candidates, both legal with the already-cut front opening:
   - **B2a (recommended): a tower air cooler.** Height-measured first (184 mm-wide case →
     expect ~150-160 mm usable; measure board-top to side panel), LGA1700 kit included,
     its fan on the EC-watched FAN1 header for 90B credit. Kills the entire M3/M6b hose
     class; cheapest and most reliable; the OMEN AIO retires to the parts shelf.
   - **B2b: a different 240/280 AIO with symmetric ≥350-400 mm hoses**, front-mounted via
     the no-drill parts route (Appendix F: bracket-to-existing-holes + 6-32×32 screw pack,
     or 41 mm slotted angle). Keeps the AIO class the EC tach set was proven on.
   - Top-mounting the EXISTING loop inside the APEX is CLOSED by the same physics receipt.
3. **B3 — re-host + standing gates:** etc/rad-cut-postdiag.block tach receipt →
   Superposition 1080p Extreme + dmon PASS (GPU ≤81 °C / CPU ≤70 °C at fan % ≤ old case,
   side panel CLOSED) → OC resumes at XMP 3733 r0 only.

### Risks / unknowns added by the pivot

- Riser reinstallation assumes the risers came out as units; separated DIMMs pause the
  queue at R2 until the pairing is restored.
- The lower GPU bracket screw stays unresolved-between-classes; reassembly only re-snugs.
- Which macOS is currently on the sleds is UNKNOWN until R6; if El Capitan is already
  installed, check the Security Update level before any OS updates (2018-001 rule).
- AirPort base station model unknown → AU 6.3.x vs 5.6.1+launcher decided at R7.
- The 8917's four DIMMs are OUT on the bench (2026-09-07f receipt) — the bench POST wave
  seats exactly one in A2; the other three return only after the PASS.
