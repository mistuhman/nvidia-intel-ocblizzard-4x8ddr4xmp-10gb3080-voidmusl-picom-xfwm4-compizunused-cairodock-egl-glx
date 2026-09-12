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
