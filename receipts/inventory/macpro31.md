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
| GPU power | TWO 6-pin PCIe connectors dangle UNPLUGGED over the CPU cover | HIGH — OPEN ISSUE |
| Memory cage (lower-right) | riser area populated (blue PCBs, purple caps); FB-DIMM count unreadable | MEDIUM / count UNKNOWN |
| Front intake | dark mesh strip at left edge | HIGH |
| Outside frame | coiled light-blue ethernet patch cable on desk | HIGH |

### Open items (photo requests, every time until covered)
1. Straight-on shot of the four sled latch faces, numbers legible + whether a drive sits in
   each (gate #1 names Bay 3 = MX500 Lion SSD — the mapping must be receipted, not assumed).
2. Top-down of each memory riser: FB-DIMM count per riser (A/B).
3. GPU end close-up: are the booster 6-pins seated now? (Machine booted 2026-09-09; the
   photo shows them unseated — reconcile which is current.)
4. GPU shroud/bracket close-up to confirm GTX 285 identity.

Cross-refs: MASTER macGuide G-20/G-21 canon; docs/macpro-guide-refs/ (7 hash-verified);
docs/macpro-guide-facts.json. Next inventory entry appends below with its own date + source.
