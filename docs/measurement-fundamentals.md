# Measurement Fundamentals for Imaging Agents (v1, 2026-09-12)

Operator directive 2026-09-12: an instruction set that GROUNDS image agents — development
proceeds steadily (one measurement class per step) and every measurement must line up with
real-life physical constraints. Subject-agnostic rules; worked example: Mac Pro 3,1.

## 1. The source ladder (a dimension without a source is an ERROR)
S1 operator photo receipt (uploads/ or chat perception receipt — persisted bytes outrank chat-only)
S2 repo facts files with citations (docs/macpro-guide-facts.json, docs/macpro-storage-facts.json)
S3 hash-verified public refs (docs/macpro-guide-refs/ + refs.json digests)
S4 vendor/Apple spec, cited inline
S5 nothing — then the number is UNMEASURED: render it as ghost/outline, never as a hard claim.

## 2. Steady development (one measurement class per pass)
Before layout, freeze a MEASUREMENT TABLE for the plate: object, dimension, source (S1-S5),
tolerance. One class per pass (chassis box -> bay pitch -> part lengths -> clearances), the
same pacing as one-knob-at-a-time hardware waves. A table cell may only change with a new
receipt (photo, ref, spec) — never to make a render look right.

## 3. Ratio discipline (geometry must survive arithmetic)
The canonical camera is parametric, so in-scene percentages must equal real ratios within
tolerance (default ±3%): chassis box W:H, part W:H, spacing/counts (4 sleds = 4, always),
alignment axes. Checks run twice: P3/P4 on the scene IR math, P8 pixel-audit on the render.
A failed ratio is an ERROR finding (P9) and the deduction (P10) patches the IR so the next
prompt hash moves.

## 4. Reality wins
When a photo contradicts the baked scene (count, orientation, label, position), the PHOTO
WINS: patch the IR + note the discrepancy in the ledger. Never render a known-stale layout.
Open measurement gaps go to the operator as numbered photo requests — every time, until
covered (uploads gate).

## 5. Worked example — Mac Pro 3,1 anchors (cite with the number)
- Chassis 511 x 206 x 475 mm H x W x D (Apple tech specs, S4-HIGH)
- Front: 2x 5.25 optical slots top; 4x 3.5" sled bays below, slide front-to-rear (S3+S2)
- 3.5" drive 101.6 x 147 x 26.1 mm (S4); sled face carries latch + orange dot (S1)
- PCIe slots: silkscreen SLOT2 - X16 photo-receipted 2026-09-12 (S1); slots 1-2 x16 class (S3)
- GPU class GTX 285: dual-slot, ~267 mm long, 2x 6-pin power (S3 estimate — measure before use)
- Memory: 2 risers A/B x 4 FB-DIMM each (S2/S3); FB-DIMM ~133 mm body + tall heatsink (S4 approx)
- Canon zones G-20: DVD upper-left, PSU plain upper-right, sleds in a row above GPU,
  CPU cover between fan tray and RAM, exhaust + full I/O at rear (S2, operator-verbatim)

## 6. Agent loop integration
Every plate pass reads uploads/RECENT.md (short-term) + pulls the memory stack for the
subject (long-term) BEFORE perceiving; cites the measurement table cells in the prompt's
HARDWARE ANCHORS line; refuses to invent a number (S5 -> ghost). Inventory log:
receipts/inventory/<machine>.md, append-only, one entry per pass with photo requests.
