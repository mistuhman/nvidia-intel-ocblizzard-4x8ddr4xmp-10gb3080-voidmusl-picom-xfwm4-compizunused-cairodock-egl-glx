# AMD GPU swap wave — Mac Pro 3,1 (receipts-first, one change per power-on)

Status: **APPROVED with conditions** (lion-workflow.json nextAction, verbatim): "install AMD
card + digital cable (APPROVED with conditions: Mac-EFI or no boot screens; keep old card
until new POSTs + displays; new Dell-real-EDID identity should dodge the 1440p poison)".
DECIDED 2026-09-12 (workflow status): AMD card + digital cable in ONE chassis session with
the HDD swap — one chassis session, still ONE CHANGE PER POWER-ON inside it.

## Receipts this wave stands on
- Display poison: 1080p = proven VGA ceiling; selecting 1440p on the VGA-HDMI chain blinds
  with no revert (RES1); RESCUE1-6 all metered, still blind (safe mode, port switch, and
  single-user rm failed; rm result UNREPORTED). Monitor: Dell S2725QS via VGA-HDMI.
- GPU: GTX 285 seated, SLOT2-X16 silkscreen (seq 62); its 2x 6-pin boosters UNSEATED
  (seq 62; intent H1 swap-prep vs H2 knocked loose — operator words owed).
- Card identity/model/power: UNKNOWN until the label photo (uploads gate claim 4). Nothing
  below assumes a card model.
- Bay map: Bay 1 = Lion (NEVER erase); buildup wipe target TBD — NOTHING DESTRUCTIVE until
  the operator names it (Bay 1 = destroys Lion).

## Measurement table (freeze BEFORE layout of the session; measurement-fundamentals S1-S5)
| object | dimension | source | tolerance |
|---|---|---|---|
| AMD card | length mm | S1 ruler photo | ±2 mm |
| AMD card | slot width (1x/2x) | S1 label+bracket photo | exact count |
| AMD card | power connectors (type x count) | S1 label photo | exact |
| AMD card | TDP / min PSU | S4 vendor page cited | exact |
| Chassis | slot-to-sled-cage clearance mm | S1 ruler photo | ±3 mm |
| Boosters | 6-pin vs 8-pin class match to card | S1 photo | exact; never adapt without a receipted cable class |
Unmeasured cells render/decide as GHOST (S5) — the session does not proceed on guesses.

## Gate ladder (each power-on gets its own receipt)
- G0 ZERO POWER: card label photo -> ingest (covers claim 4) + measurement table frozen.
  While the chassis is open, capture the standing claims in the same round: sled latch faces
  (claim 1), riser top-downs (claim 2). Answer the 6-pin question in words (claim 3).
- G1 SWAP: GTX 285 out (lever/latch gentle), AMD in SLOT2 (same x16 slot), powered via its
  receipted connectors; GTX 285 stays within reach until the new card POSTs + displays
  (condition, verbatim). If H2 (knocked loose): say so — the GTX inverse needs reseated pins.
- G2 CABLE: Dell digital cable (HDMI/DP per card ports) — the real-EDID identity. VGA stays
  connected as fallback until digital proves out.
- G3 FIRST POWER-ON: expected = Mac-EFI boot screens OR no screens until the OS (condition);
  garbage/partial screens = the Mac-EFI condition class is violated -> STOP, photograph,
  revert inverse. No power-on loops.
- G4 DISPLAY VERIFY: desktop at digital 1080p first; only then may higher modes be TRIED
  (digital chain removes the 1080p VGA ceiling; a digital blind = NEW class, metered, no
  loops). If still blind: delete-retry of display prefs WITH ls verification (quoted from
  nextAction) — the unreported-rm mistake is not repeated.
- G5 CLOSE-OUT READS: About This Mac + GPU reads (owed close-out), new inventory entry,
  red-sticker bay recorded (claim 1 receipt).
- G6 HDD SWAP + RAID: its own wave after G5; wipe target named by operator FIRST.
- INVERSE (documented before forward): power off -> AMD out -> GTX 285 in SLOT2 -> both
  6-pins reseated -> VGA cable -> boot = the proven 2026-09-12 1080p state.
- STOP RULES: prohibitory/garbage screens with AMD (G3); blind at digital 1080p after the
  full ladder (G4); any new beep code (HP board is out of circuit — this is the Mac, but the
  rule stands: a changed code is a new class).

## Receipts to paste back per gate
Photo or words per G-number, one message per gate. The wave is complete when G5 lands its
inventory entry and the uploads gate covers claims 1-4.
