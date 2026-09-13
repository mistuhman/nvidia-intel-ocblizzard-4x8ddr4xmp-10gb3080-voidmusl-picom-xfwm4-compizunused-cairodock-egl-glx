# Mac Pro 3,1 — physical inventory log (append-only)

One dated entry per inventory pass. Sources: uploads perception receipts (agent-memory seqs),
photos, prior session receipts. UNKNOWN beats GUESSED; open items ship as photo requests.

## Entry 2026-09-12 (session 01a097ba) — interior overview, case on its back, open side up

Source: chat-attachment:macpro31-interior-2026-09-12 (agent-memory seq 62; two identical
copies; bytes NOT persisted — re-attach or drop into uploads/ when hash-locked bytes are
needed for a plate ref or pixel-audit).

| Zone (G-20 canon) | Observed | Confidence |
|---|---|---|
| Optical/DVD compartment (upper-left) | present, two rectangular openings, screws visible | HIGH |
| PSU compartment (upper-right) | plain cover, closed | HIGH |
| Drive bays 1-4 | FOUR sleds installed and closed, worn bare aluminum, orange latch dots, RED STICKER rightmost | HIGH |
| Bay numbering | digits 3, 4 readable toward left, 1 near red sticker; full order unreadable | MEDIUM |
| Sled contents (drives?) | NOT determinable from angle — loaded-vs-empty UNKNOWN per bay | UNKNOWN |
| CPU compartment | dual-CPU metal cover in place | HIGH |
| GPU | black dual-slot card, curved finned blower shroud, seated; DVI-class bracket right rail; silkscreen SLOT2 - X16 legible; silhouette consistent with GTX 285 | HIGH (identity MEDIUM) |
| GPU power | TWO 6-pin PCIe connectors dangle UNPLUGGED over the CPU cover | HIGH — reconciled in entry 2 |
| Memory cage (lower-right) | riser area populated (blue PCBs, purple caps); FB-DIMM count unreadable | MEDIUM / count UNKNOWN |
| Front intake | dark mesh strip at left edge | HIGH |
| Outside frame | coiled light-blue ethernet patch cable on desk | HIGH |

### Open items (photo requests, every time until covered)
1. Straight-on shot of the four sled latch faces, numbers legible + whether a drive sits in
   each — binding the receipted bay map (entry 3) to the physical etched digits.
2. Top-down of each memory riser: FB-DIMM count per riser (A/B).
3. GPU power state confirmation (entry 2 discriminator) + shroud close-up for card identity —
   note: AMD card swap is APPROVED (lion-workflow.json nextAction), so identity close-up
   expires when the swap happens.
4. When the AMD card arrives: label/model photo BEFORE install (new inventory entry).

Cross-refs: MASTER macGuide G-20/G-21 canon; docs/macpro-guide-refs/ (7 hash-verified);
docs/macpro-guide-facts.json. Next inventory entry appends below with its own date + source.

## Entry 2026-09-12b (session 01a097ba) — GPU power reconciliation (photo vs boot receipt)

Receipts:
- A: 2026-09-09 (MASTER latestReceipts, session 01a085aa) — Mac assembled, booted, online,
  10.6.8 desktop + Arctic Fox launched. Video chain demonstrably worked; GTX 285 normal
  operation requires its 2x 6-pin booster feed (inference flagged, not a receipt).
- B: 2026-09-12 photo (seq 62) — both 6-pin connectors dangle UNPLUGGED over the CPU cover.
- C: docs/lion-workflow.json nextAction (2026-09-12) — "chassis session first (Mac powered
  OFF; force-off at idle blind login is journal-safe) - (0) install AMD card + digital cable
  (APPROVED with conditions: Mac-EFI or no boot screens; keep old card until new POSTs +
  displays; new Dell-real-EDID identity should dodge the 1440p poison)". Close-out owes
  RESCUE1 (blind at 1440p) — the display chain is currently unreliable at the operator's
  Dell 1440p monitor.

Reconciliation: receipt B is the latest PHYSICAL evidence, so current 6-pin state = UNSEATED.
Cause classes:
- H1 (leading): deliberate unplug preparing the APPROVED AMD card swap during the powered-off
  chassis session — photo state and nextAction align (chassis open, covers on, Mac off).
- H2: knocked loose during sled/HDD handling.
Discriminator (operator-held, zero-risk while powered off): were the 6-pins unplugged on
purpose for the swap? If H2, re-seat both before any power-on; if H1, leave unseated — the
GTX 285 feed is moot once the AMD card goes in (AMD card's own power needs = new receipt).
No boot receipt exists after the unplug, so NO claim "the Mac boots in this state" is made.

## Entry 2026-09-12c (session 01a097ba) — bay map reconciliation (receipted vs photo)

Receipted map (docs/lion-workflow.json volumes, corrected 2026-09-12 — canonical, supersedes
MASTER gate-12 wording "Lion from the Bay 3 MX500 clone", which is STALE):
- Bay 1 = "Lion SSD Base" (disk0s2) — LION 10.7 INSTALLED AND BOOTING via installer-app path
  (login + Andromeda desktop @1080p verified; was SL 10.6.8). 19.4 GB free of 999.9 GB.
  erase: NEVER.
- Bay 2 = NO receipt names it — contents UNKNOWN (photo shows the sled closed).
- Bay 3 = MX500 CT1000 "start disk clone" (disk1s2) — SL start-disk clone; was the recorded
  Lion destination, superseded by the Bay 1 install; migration only if operator asks.
- Bay 4 = "Mac OS X Install ESD" (disk2s2) — SPARE (ESD-boot matrix exhausted, bypassed by
  installer app); do not remirror; erase/repurpose only on explicit operator direction.
Photo cross-ref (seq 62): etched digits 3, 4 toward the left, 1 near the red-sticker sled
(MEDIUM) — binding physical etch order to this receipted map stays an open photo request
(open item 1). Which physical sled carries the red sticker (bay number) unrecorded.
Doc typo noted: workflow.json volumes[].media fields read transposed/typo'd (Bay 1 media
"starrt disk clone", Bay 3 media "Lion"); roles/locations are self-consistent — logged as
agent-memory discrepancy, owner agent, UNRESOLVED.
README + MASTER lionMac statusNote updated this commit to the achieved Bay 1 state.

### Standing photo requests (re-issued every turn until covered)
1. Sled latch faces straight-on (bay numbers + drive presence per sled, red-sticker bay).
2. Top-down of each memory riser (FB-DIMM count).
3. Operator words: were the 6-pins unplugged on purpose (H1) or knocked loose (H2)?
4. AMD card label/model photo before install (when it arrives).

## Entry 2026-09-12d (session 01a097ba) — chassis session IN PROGRESS: WD Greens on scene

Source: chat-attachment:macpro31-bay-work-2026-09-12b (seq 70; 6 identical copies, bytes NOT
persisted) + operator words verbatim: "pins unseated" (seq 69).

| Item | Observed | Confidence |
|---|---|---|
| Drives on scene | TWO WD Green drives angled in the bay area mid-work; right label legible: WD10EAVS Caviar GP GreenPower (1TB class, Mdl -00D7B1 class, Product of Thailand, ~2012 date); left = second WD Green (model partial) | HIGH (2nd model MEDIUM) |
| sled covers | remain latched above, orange dots, red sticker at right | HIGH |
| cable harness | 4-line black bundle, two velcro straps, routed to the bays, connectors waiting | HIGH |
| GPU | GTX 285 still seated (shroud + fins, SLOT2-class silks); 6-pins not in frame | HIGH |
| GPU 6-pin state | operator words: "pins unseated" — state CONFIRMED unseated; intent (H1 deliberate swap-prep vs H2 knocked loose) still not explicitly answered | words receipt |
| frame contents | no risers/DIMMs, no bay digits, no AMD card yet | — |

Reading: this matches the receipted session arc — HDD swap step (3) + the 4x1TB Green plan
(macGuide directive): the WD10EAVS Greens are MAC-side drives entering freed bays, not the
OMEN bulk pair (ST2000NM0033 / DT01ACA200, 2TB, different labels). Two of four Greens
visible; total count on scene UNSEEN.

### Updated photo requests (re-issued until covered)
1. Sled latch faces straight-on: bay numbers + drive per sled + red-sticker bay (claim 1).
2. Riser top-down: FB-DIMM count per riser (claim 2).
3. AMD card label/model photo when it arrives (claim 4) — still the G0 gate for the swap.
4. Drive manifest: how many WD Greens total (2 of 4?), full model strings, and which bays
   they land in — needed before the RAID-format wave names its target.

## Entry 2026-09-12e (session 01a097ba) — resolutions: 6-pin intent, bay numbering, donor cards

Source: operator words verbatim "unplugges for card swap, i have a 9800gt aswell. left to
right is bay 1-4 i showed the riser and dimm count already on the motherboard and riser"
(seq 71) + chat photo x4 (seq 72): two donor cards on the bench.

| Claim | Resolution | Receipt |
|---|---|---|
| GPU 6-pin intent (H1 vs H2) | **H1 CONFIRMED** — unplugged on purpose for the card swap | operator words (seq 71) |
| Bay numbering | **LEFT TO RIGHT = BAY 1-4** — supersedes the entry-1 MEDIUM etched-digit read (misread/partial; correction logged). Red-sticker sled = rightmost = **BAY 4** | operator words (seq 71) |
| Bay map (volumes) | unchanged: Bay 1 = Lion SSD Base, Bay 3 = MX500 clone, Bay 4 = Install ESD (red sticker on the ESD spare sled), Bay 2 = unreceipted | workflow.json + words |
| Riser/DIMM count | operator asserts already shown "on the motherboard and riser" — no legible riser photo persisted to my records (chat-only photos seq 62/70 carry no readable count); RECEIPTED total = 10 GB (workflow.json machine line). Per-riser breakdown stays open at LOW priority, non-blocking; do not invent | words (seq 71) + machine line |
| Donor cards | LEFT: EVGA e-GeForce 9800 GT (fire shroud, 2x DVI). RIGHT: **ATI Radeon, blue PCB, radial blue fan + ATI logo, single-slot-class bracket, 6-pin-class power on top edge — HD 4870-class cooler family**; exact SKU / Mac-vs-PC firmware / 1-vs-2 6-pin NOT readable → G0 still owes the model sticker | photo (seq 72, HIGH present / MEDIUM class) |

### Reading
The swap card is the ATI Radeon (AMD, as approved); the 9800 GT is a second donor. Era check
(S4, cited-class): 10.7 Lion natively drives HD 4870-class and 9800 GT; the GTX 285 was the
Option-boot picker card (boot screens proven), and a PC-ROM Radeon/9800 GT means the
pre-approved condition "Mac-EFI **or no boot screens**" applies — future Option-boots would
need Startup Disk instead until a boot-screen card goes back in. Inverse stays: GTX 285 +
reseated 6-pins + VGA = proven 1080p state.

### G0 status (docs/amd-swap-wave.md)
PARTIAL: cards on scene + class receipted; still owed for G0 close: exact Radeon model
(sticker, e.g. HD 4870 512MB/1GB), Mac vs PC edition, and its power connector count (1x vs
2x 6-pin) — the machine's two booster cables already on site cover the 2x case.

### Updated photo requests
1. AMD card model sticker / exact SKU + power connectors (G0 blocker — words work too).
2. WD Green drive manifest: count + full models + target bays.
3. Riser/DIMM per-riser breakdown (LOW, non-blocking).

## Entry 2026-09-12f (session 01a097ba) — dual-donor proposal: electrical verdict

Operator words (seq 74): both donors are 1x 6-pin each; the Mac's two 6-pin booster leads are
available; proposal = run Radeon + 9800 GT together in place of the GTX 285, gated on
"performance/stats prove something".

Power budget (PCIe CEM spec S4): each x16 slot 75W + its own 6-pin aux 75W = ~150W/card
envelope on this board (one aux lead per slot, that is why two exist).
- 9800 GT ~105-125W -> fits 1x 6-pin with margin. OK.
- Radeon: if HD 4870 (~150W) it sits AT the envelope on a single 6-pin (OEM single-6pin
  4870s are clocked to fit); if 4850 (~110W) fits with margin. -> SKU still owed (words OK);
  overload symptom = shutdown/stall under 3D load, metered, revert.
- Combined ~220-275W vs GTX 285 ~189-230W: +50W worst case on a 980W Apple PSU = trivial.
- Mechanics: 3,1 has two x16 slots (Apple spec S4); Radeon single-slot + 9800 GT dual-slot
  = 3 slot covers of 4. Fits.

Stats verdict (honest, pre-bench): Mac Pro EFI runs NO CrossFire/SLI, so two GPUs add ZERO
gaming FPS. The pair's real wins: more displays + a second OpenCL compute device (10.7
drives both natively). Single-card gaming: GTX 285 >= Radeon/9800 GT, so replacing it is a
display-chain upgrade and likely an FPS downgrade. The metered bench (G4 reads + a timed
source-port/OpenCL run per config) will prove exactly this.

Sequencing (one change per power-on): G1 Radeon alone in SLOT2 + its 6-pin -> G2 digital
cable -> G3 power-on -> G4 display verify -> G5b SECOND change = add 9800 GT in SLOT1 + its
6-pin, power-on, confirm both GPUs in About This Mac > Graphics/Displays -> G5c reads.
Inverse unchanged: GTX 285 + both 6-pins + VGA = proven 1080p state.
G0 status: power class CLOSED for both donors (1x 6-pin each, words); exact Radeon SKU +
Mac/PC edition remain the only G0 item (drives the 4870-vs-4850 margin note).

## Entry 2026-09-12g (session 01a097ba) — 3870 Mac Edition receipted: G0 COMPLETE

Operator words (seq 77): "3870 mac edition"; both donors 1x 6-pin (seq 74). Receipted card =
ATI Radeon HD 3870 Mac & PC Edition (2008): 512MB GDDR4, 2x dual-link DVI, single-slot,
TDP ~106W (S4 class specs). Consequences:
- POWER: 106W vs 150W per-card envelope = comfortable margin. The 4870-margin question is
  CLOSED. Both boosters now free for the G5b 9800 GT add.
- FIRMWARE: Mac Edition = EFI firmware -> BOOT SCREENS + Option-picker EXPECTED on the 3,1.
  The approved "or no boot screens" condition flips to its better branch (verify at G3;
  PC-ROM behavior would be the discrepancy class).
- DISPLAY: dual-link DVI tops at 2560x1600; over DVI->HDMI to the Dell S2725QS expect
  1080p-class (not the panel's native 4K) - exactly the 1080p-lock goal; real-EDID digital
  identity is what ends the 1440p poison.
- G0 STATUS: COMPLETE. No open item blocks G1-G4.
Captive-screw guidance receipted this entry (video refs): the two "captive" thumbscrews hold
the PCI bracket BAR, not the card, and BY DESIGN never leave the bar (Wikipedia Mac Pro:
loosen by hand, will not fall out). "Take out" is the wrong target: loosen each 3-5 turns
CCW until the bar floats, lift the bar, free the card (front slot latch UP toward media
shelf, straight pull, never rock side-to-side; 2008 has no retaining rod). If a screw is
truly seized (not at its captive stop): hard-press Phillips + rubber band, locking pliers
per the 2026-09-07h decision tree, never drill. Videos: OWC install-videos portal
(eshop.macsales.com/installvideos) with an Early 2008 A1186-specific PCIe clip (EveryMac
Q&A links it) + iFixit guide 14161 (exact photos, incl. booster routing: slot 1 = LOWER aux,
slot 2 = UPPER aux -> the 3870 in SLOT2 uses the UPPER connector).
Riser split: operator states it is visible in every picture; chat-only bytes do not persist
and my perception could not resolve DIMM counts at delivered resolution - assertion logged,
numbers welcome as words anytime; LOW, non-blocking.

## Entry 2026-09-12h (session 01a097ba) — G1 IN PROGRESS: GTX 285 out; bracket bar casualty

Operator words (seq 79): "took out the retention bracket and the gtx. screws are unusable now
since i had to torsion them out. dusted all the metal particles out of the case."
Photo receipt (seq 80): SLOT2 empty, both slot silks legible, aux pair still unseated at
left, slot covers in place, rear opening exposed, board clean, pliers on scene.

| Item | State | Class |
|---|---|---|
| GTX 285 | REMOVED (bracket travels with the card; card intact, re-installable) | inverse intact |
| Bracket bar | REMOVED; its two captive screws DESTROYED by torsion ("unusable") | NEW OPEN ITEM — see below |
| Metal particles | operator dusted the case | verify with a magnet sweep before power-on |
| Aux 6-pins | still unseated (will feed 3870 upper + 9800 GT later) | matches plan |
| Sled digit etch | one digit readable second-from-left (reads like 4) — sits in tension with my entry-1 etch reads; operator words (left→right 1-4, red=rightmost) REMAIN the mapping; my digit reads at chat resolution are unreliable twice over | MEDIUM-UNRELIABLE, do not use |

### Bar-screw replacement (new open item — gates CASE-CLOSED daily use, NOT the bench test)
Function to restore = clamp the bracket bar so card brackets anchor to the chassis. Classes:
- R1 screws only: the captives are hand thumbscrews; if heads are torsioned out, extract the
  stub and fit a replacement (M3-class per 2006-2012 Mac Pro fastener convention — MEASURE
  the threaded hole pitch with the caliper before buying; never guess-thread).
- R2 whole bar: used Mac Pro PCI bracket assemblies are inexpensive used parts; harvest from
  a donor Mac Pro is the zero-spend route (operator decides purchases).
- A3 interim: BAR-LESS BENCH OPERATION IS ACCEPTABLE for G1-G4: the card seats in the slot
  and the bar only anchors the bracket — allowed while the case stays OPEN on the bench and
  the machine is not moved. NOT allowed as the daily closed-chassis state (card flex at the
  slot = contact fatigue class).
Sequencing rule stands: one change per power-on — bar-fix is its own later wave, never
stacked onto the first 3870 boot.

### G1 continuation checklist (zero-to-low risk, in order)
1. Bright-light inspection of SLOT2 + SLOT1 + the board under the old card for any screw
   stub, wire fragment, or dust remaining (magnet sweep of the shroud area too).
2. Pop ONE slot cover aligned to SLOT2 (cover stack at right, slotted screws).
3. Seat the 3870 Mac Edition straight into SLOT2 (never rock), bracket top edge where the
   bar will later clamp.
4. Upper aux 6-pin -> the 3870 (iFixit routing receipt: SLOT2 = UPPER connector).
5. Leave the bar off for now (bench-legal per A3); G2 digital cable; G3 power-on (boot
   screens EXPECTED — Mac EFI card); G4 desktop at digital 1080p, read back About This Mac.

## Entry 2026-09-13i (session 01a097ba) — G1b DUAL-GPU SEATED, bar-less holds, SSD bay question

Source: operator words verbatim "seems to be no issue without screws. the brackets and slots native to the mac case help with this a lot. now how do i access the ssd bay? the four bays are only hard drives. we need to put the 2.5in crucial boot ssd somewhere else. i have no conversion cables or anything fyi, i have 2 240gb kingston ssd's and the 1tb crucial boot drive" (seq 82) + chat-only photo chat-attachment:macpro31-dual-gpu-seated-2026-09-13 (seq 83, bytes NOT persisted — /home/user/uploads/ missing 5th check, re-request if hash/pixel-audit needed).

### Dual-GPU photo perception (capped confidence — chat-only, no persisted bytes)
| Item | Observed | Confidence |
|---|---|---|
| Bottom card SLOT2 | blue PCB, radial blue fan, single-slot, ATI logo class — **ATI Radeon HD 3870 Mac & PC Edition** (receipted seq 77) seated, bracket engaged in rear slot rail | HIGH (identity from prior receipt, not from this photo's resolution alone) |
| Top card SLOT3/4? | dark shroud, silver bracket, dual-slot silhouette — **EVGA e-GeForce 9800 GT** (receipted seq 72) seated above the 3870 | HIGH (class) |
| Bracket bar | ABSENT — case open, both cards held by slot connector + rear bracket slot + gravity | HIGH — matches operator words "no issue without screws" |
| Booster aux | TWO 6-pin black connectors dangling UNPLUGGED over CPU cover (left side) | HIGH |
| Memory cage | lower-right windows, DIMMs visible, count unreadable at chat resolution | MEDIUM-UNRELIABLE |
| Drive bays | four sleds above GPU, closed, orange dots | HIGH |
| Bench condition | bar-less, open case, pliers/screwdriver off-frame but orange handle visible right edge | HIGH |

### Bar-less verdict (A3 interim)
Operator words: "seems to be no issue without screws. the brackets and slots native to the mac case help with this a lot." — **CONFIRMED bench-legal per A3**: the Mac Pro 3,1 slot + rear bracket rail provides lateral retention; the bar only clamps the bracket top against vibration/transport. For G2-G4 bench (case OPEN, not moved) it holds. For CASE-CLOSED daily use: NOT allowed — card flex at slot = contact fatigue, vibration can walk the bracket out. Replacement still owes R1 vs R2 before daily closed state, NOT before bench test. Operator dusting of metal particles from destroyed captives still stands — magnet sweep before power-on.

### SSD bay question — decomposed
Operator demands (seq 82 numbered):
1. "seems to be no issue without screws." — bench hold receipt above.
2. "the brackets and slots native to the mac case help with this a lot." — explanation: slot connector + rear L-bracket slot = two-point retention; bar = third point for transport.
3. "now how do i access the ssd bay?" — there is **NO dedicated SSD bay** on Mac Pro 3,1 (fact G-02/G-03). All four bays are 3.5" SATA cable-free direct-attach (Bay 1 bottom to Bay 4 top, operator left→right 1-4). A 2.5" SSD lives in a 3.5" carrier sled (one screw or tape as interim) or in the optical bay via hidden SATA ports (needs cables).
4. "the four bays are only hard drives." — correct: 3.5" HDD bays, 3Gb/s, sleds with captive latch.
5. "we need to put the 2.5in crucial boot ssd somewhere else." — intent = free bays for HDDs per original mac-guide 4x1TB Green plan.
6. "i have no conversion cables or anything fyi" — inventory: no Molex→SATA power, no SATA data extension, no 2.5→3.5 adapter bracket.
7. "i have 2 240gb kingston ssd's and the 1tb crucial boot drive" — SSD inventory: 1x Crucial 1TB (MX500 CT1000 class, Lion SSD Base, disk0s2, Bay1, NEVER erase) + 2x Kingston 240GB (models UNKNOWN, need label photos for exact SKU).

### Where can the 2.5" SSDs live? (one change per power-on, purchase-gated)
- **Current location**: Bay 1 sled = Crucial 1TB Lion SSD Base (installer-app path, 10.7 booting). Bay 3 = MX500 CT1000 start disk clone (superseded). Bay 4 = Install ESD SPARE. Bay 2 = UNKNOWN. All 2.5" SSDs are currently in 3.5" sleds (needs verification — photo request below). This works today.
- **Freeing bays for 4x HDD**: the designed path per G-03/G-04/G-05 = move boot SSD to **lower optical bay** using the two hidden SATA II ports behind the front fan assembly (lift fan module 40mm, per G-16). That needs: (a) SATA data cable from hidden port to optical bay, (b) 4-pin Molex→SATA power adapter (optical bay has Molex, not SATA power), (c) 2.5→5.25 or 2.5→3.5 bracket for optical bay. **Without those cables (operator words) this move is BLOCKED** — purchase = operator decision.
- **Zero-cable interim options** (bench-legal, not daily-ideal):
  - Keep Crucial 1TB in Bay1 sled (one screw + tape as interim if sled holes don't line up — 2.5" drive 101.6x69.85mm vs 3.5" 147x101.6mm, S4). That keeps Lion boot proven.
  - The two Kingston 240GB SSDs can sit loose on the optical bay shelf (no power/data without cables) or in empty HDD sleds with one screw as well — but they have no data path until a SATA port is free or cabled. If Bay2 is empty, one Kingston can occupy Bay2 sled now, still using the bay's native SATA power+data (no extra cable needed — the bay itself provides both).
  - DO NOT stack SSDs on top of HDD sleds or let them short on metal — kapton/tape isolation.
- **Next physical step for SSDs**: photo the sleds out: which sled holds which SSD (label + bay). That decides whether Bay2 is free for a Kingston, and whether we need to order the optical-bay cable kit (SATA data + Molex→SATA power + bracket).

### Updated photo requests (re-issued every turn until covered, per imaging-contract)
1. Sled latch faces straight-on: bay numbers + drive per sled + red-sticker bay (claim 1) + which sled holds the Crucial 1TB vs Kingstons.
2. SSD label photos: Crucial 1TB (model/firmware) + both Kingston 240GB (exact SKU, e.g. A400/SA400) — needed for power/trim/compatibility.
3. Riser top-down: FB-DIMM count per riser (LOW, non-blocking) — operator says visible, bytes never persist.
4. WD Green drive manifest: count + full models + target bays (needed before RAID-format wave names wipe target; Bay1 = destroys Lion, NEVER).
5. Bar-screw replacement choice R1 vs R2 (+ thread measurement if R1) — owed before case-close daily use, NOT before bench test.
6. Booster routing: when powering on, confirm UPPER aux → 3870 (SLOT2), LOWER aux → 9800 GT (SLOT1) per iFixit 14161; photo of plugged state before G3.

### G1-G5 status after this photo
- G1: GTX 285 out COMPLETE, 3870 + 9800 GT both seated (dual-donor bench config) — operator jumped ahead from single-card G1 to dual-card G1b. Electrically OK per entry 12f (150W envelope each), but G3 power-on still owes booster plugs (currently UNPLUGGED per photo). One change per power-on still expects G2 digital cable before G3, but dual-card bench is acceptable if operator wants it as the G3 config — note as deviation from ladder (G5b merged into G1).
- NextAction remains docs/lion-workflow.json: install AMD card + digital cable APPROVED, HDD swap + RAID format, wipe target named before any destructive op. Nothing destructive until confirmed.

## Entry 2026-09-13j (session 01a097ba) — SLEDS OUT, SSD NOT IN BAY, 4x HDD plan clarified

Source: operator words verbatim "the bays do not have the ssd. the ssd cannot be in a bay because all 4 of them will have hdd's. theyre just out to put the gpu in easier" (seq 84) + chat-only photos x2 chat-attachment:macpro31-sleds-out-2026-09-13a (seq 85, bytes NOT persisted — /home/user/uploads/ missing 6th check).

### Photo perception (capped confidence)
| Item | Observed | Confidence |
|---|---|---|
| Sleds on top of chassis | 3 sleds stacked: top (circled 1 = Bay1), middle red sticker circled 2 = Bay2 (red sticker = Bay2 in this stack, but earlier operator words left→right 1-4 red=rightmost=Bay4 — discrepancy: red sticker appears on Bay2 sled here, not Bay4; operator mapping remains authoritative, my prior red=Bay4 read may be stale; log as tension), bottom circled 4 = Bay4 | HIGH present / MEDIUM bay mapping (operator words outrank my read) |
| Sled in machine | 1 sled still partially inserted lower-left, covering Bay1 area (maybe Bay1 sled with Lion? but operator says bays do NOT have SSD) | HIGH present / LOW identity |
| Bays | 3 bays empty above GPU, backplane connectors visible, no drives | HIGH |
| GPUs | dual GPUs still seated (bottom 3870 blue, top 9800GT/VEGA), boosters dangling UNPLUGGED | HIGH |
| SSD location | NOT visible in either photo — not on top, not in bays, not on floor of case in frame | HIGH — UNKNOWN |
| Optical bays | upper section with two rectangular cutouts (empty optical bay faceplates removed? screws visible) | HIGH |

### Correction receipted
Operator words supersede prior assumption: **"the bays do not have the ssd."** Prior entry 13i assumed Crucial 1TB in Bay1 sled — that is now **VOID**. Current state: bays EMPTY (or with HDDs waiting), SSDs somewhere else (desk? loose? need photo). Operator constraint: **"the ssd cannot be in a bay because all 4 of them will have hdd's."** = design intent = 4x HDDs occupy all 4 bays, SSD must live elsewhere (optical bay or alternative mount).

### SSD relocation — grounded options with NO conversion cables (operator words)
Mac Pro 3,1 facts (docs/macpro-guide-facts.json):
- G-02: 4 bays 3Gb/s cable-free direct-attach, Bay1 bottom Bay4 top, left→right 1-4 per operator.
- G-03: 2 hidden SATA II ports behind front fan assembly (lift fan module 40mm, per G-16 single fan module lifts).
- G-04: optical bays PATA/Molex, need Molex→SATA power adapter + SATA data from hidden ports.
- G-05: 2.5" SSD in lower optical bay bootable via hidden SATA, freeing all 4 bays.

**With no cables (current inventory):**
- **Option A (current zero-cable):** SSDs are OUT of machine (as bays are for HDDs). To boot Lion, you must put ONE SSD back into a bay temporarily, or you cannot boot. For G3 power-on verification, Bay1 must hold the Lion SSD (Crucial 1TB) — otherwise no boot volume. The HDDs cannot all 4 be installed until after G4 display verify, unless you accept no boot.
- **Option B (optical bay without cables):** physically place SSD on optical bay shelf (no power/data) — it will not boot. Needs cables.
- **Option C (interim tape):** tape SSD to interior floor/wall with no connection — not bootable.
- **Conclusion:** For G3/G4 first power-on + display verify, **put Crucial 1TB Lion SSD back into Bay1 sled** (even though final plan is 4x HDD). After G4 PASS, then order cable kit to move it to optical bay, freeing Bay1 for 4th HDD. The two Kingston 240GB SSDs cannot be used until a bay is free or cables arrive — they are spares for now.

### Sleds-out rationale
Operator words: "theyre just out to put the gpu in easier" — **CONFIRMED**: removing sleds gives clearance for PCIe booster routing and GPU seating (the black 6-pin bundle was trapped). This is the correct bench procedure. Sleds can be re-inserted after GPU power is routed.

### Updated photo requests (re-issued)
1. Where is the Crucial 1TB SSD right now? Photo of SSD + its label (model/firmware) + where you plan to mount it.
2. Both Kingston 240GB labels.
3. The 4x HDDs: are they the WD Greens from seq 70? Model + which bay each will occupy (Bay1-4 map). Needed before G6 names wipe target (Bay1 = destroys Lion, NEVER without explicit name).
4. Sled contents: which sled (1-4) currently holds which drive (if any) — your stack photo shows circled numbers 1,2,4 but red sticker on 2 vs earlier red=4 — confirm red sticker bay.
5. Bar-screw R1 vs R2 (before case-close).
6. Booster plugged state before G3 (UPPER→3870, LOWER→9800GT).

### G1-G6 status after clarification
- G1: GPUs seated, sleds out for access — OK bench.
- G2: digital cable still owes.
- G3: needs Lion SSD in Bay1 to boot (since SSD not in bays per current photo, G3 is BLOCKED until one SSD re-inserted).
- G6: 4x HDDs cannot occupy all 4 bays until SSD moves to optical bay with cable kit (purchase-gated). Interim: 3x HDDs + 1x SSD in bays, or postpone HDD install until after G4.

### Measurement table update (S1-S5)
| object | dimension | source | tolerance |
|---|---|---|---|
| Sled | width ~130mm, height ~25mm, length ~170mm (3.5" carrier) | S4 Apple spec | ±2mm |
| SSD 2.5" | 69.85x100x7mm (Kingston 240GB class) | S4 vendor | exact |
| Hidden SATA ports | behind fan assembly, 2 ports, 3Gb/s | S2 G-03 | exact count |
| Booster routing | SLOT1=LOWER aux, SLOT2=UPPER aux | S3 iFixit 14161 | exact |
