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
