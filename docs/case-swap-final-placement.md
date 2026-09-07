# Case-swap final placement — RECONSTRUCTED (2026-09-05)

**Status of this file:** `MASTER.md` cited `docs/case-swap-final-placement.md` from the
2026-09-02 sessions, but the file was never committed — the chat that authored it is not in this
repo. It is reconstructed here from the durable ledger entries in `MASTER.md`
`durableFacts.caseSwap` (2026-09-02, 02b, 02c, 02d, 02e, 02f, 02g, 02h, 02i) so a later chat
does not re-litigate settled placement. Where this file and `MASTER.md` disagree, `MASTER.md`
wins, because it carries the receipts.

## 1. What is LOCKED (do not reopen)

| Item | Locked value | Source |
|---|---|---|
| Case | **APEX PC-389-C** — ATX mid tower, thin steel, 444 x 184 x 406 mm, **top-mounted PSU**, 3x5.25" + 2x3.5" external + 4-5x3.5" hidden bays, not tool-less | operator 2026-09-05 + Newegg N82E16811154095 / apextechusa pID=119 |
| PSU | **top-back**, seated (photo receipt 2026-09-02) | caseSwap 2026-09-02 |
| Radiator | 240 mm M82880-002, **front-middle, vertical, INTAKE**, **upper-middle vertical** position: tube-end just below the DVD/bay cover, **not** absolute top, not bottom (hose could not reach the CPU through the GPU zone; tank-absolute-top conflicted with the drive-bay covers — both withdrawn) | caseSwap 2026-09-02 (orientation supersession), 02 placement lock |
| Loop geometry | pump/CPU block **lower** than the tank; tube-end above the block top; rad bottom edge 30-40 mm clear of the floor; air collects at the rad top above the tube-end | same |
| Fan stack | **push-pull, 4 fans, all four blowing the same way**: bezel -> rad's own pair (push) -> rad -> RGB pair (pull) -> interior -> GPU/VRM -> rear `FFAN1` exhaust | 2026-09-02c/e/f/g |
| Fans | rad's 2 mains + existing rear exhaust on `FFAN1` + spare non-RGB (dead RGB) as **VRM/CPU spot fan**; bottom GPU feeder **withdrawn** (solid floor = recirculation); fan purchase is the **operator's call** (pressure-optimised is information, not a gate) | 02b/c/i |
| Bezel | **stays ON**; inner wall is solid (no louvers to strip); air enters through perimeter clip-tab gaps; rad gasketed to the metal opening; mesh-vent bezel cut **withdrawn** (no tooling for a clean front cut + "it'll never look good unless it shipped that way"); reversible 10-15 mm bezel standoff promoted to *expected* given closed panel + ~460 W | 02b/c/h |
| Side panel | closed-panel is the **design target** (a build tuned panel-off throttles when shut) | 02h/i |
| Headers | `FAN1` pump / `LCFAN` rad / `TFAN`-`LCFAN2` rad / `FFAN1` rear exhaust (the header that cleared `90B`) / `FFAN2` rad pull / `FFAN3` VRM spot = 6 fans into 5 fan headers -> **one Y-splitter**, on the second rad pull fan, never the pump | 02h/i |
| Riser kit | **rejected as an unqualified purchase**; qualified by one measurement — GPU fan-face to closed-panel inside: >=30 mm proceed, 20-30 mm only with an accepted 81 C+ result, <20 mm on a solid panel do not buy for closed use. The 3080 already runs 80-81 C at the 314 W pin, stop rule 83 C | 02i Appendix E |
| LED hub M82868-001 | standing prime suspect for the August instant-cycle crisis: never install while a cold-boot cycling fault is open; RGB path = 3 clean cold boots first, then the hub alone as the single changed variable, 5 V LOGO header only | durableFacts.caseSwap |

## 2. Corrections that the case identity forces (2026-09-05)

1. **The side panel is not solid steel.** Product photos of the PC-389-C show punched **vent
   fields** and a circular knock-out in the side panel. Appendix E's vertical-GPU penalty band
   (+5-15 C) is quoted for a *solid* panel; a perforated panel sits between "solid" and "mesh".
   The measurement gate in `docs/case-swap-rad-mount.md` Appendix E.3 is unchanged — but if the
   operator's panel is the vented version, +5 C is the more likely end of the range, not +15 C.
   Verify by eye; do not buy the riser on this inference.
2. **Case depth is 406 mm with a top-mounted PSU.** A 313 mm 3080 plus an ~80 mm-thick push-pull
   rad sandwich in the front column is close. **Measure GPU nose to rad/fan face** once the stack
   is lashed; if the card fouls it, the sandwich moves up (still above the block) rather than the
   card moving.
3. **There is no 120 mm front fan position in this case** (80 mm front / 90 mm rear per spec), so
   the grinder opening *is* the front intake and the airflow doctrine has no factory alternative.
4. **The drive column occupies the same front region as the rad opening.** HDD mounting is solved
   in `docs/case-swap-hdd-mount.md` using existing bay holes, and it must not borrow the panel
   area the rad needs.
5. **Drive mounting is settled as sleds, not caddies** (photo receipt 2026-09-05b): the case's own
   flat drive plates, relocated rearward in the front column (route A/B/C in
   `docs/case-swap-hdd-mount.md` §1b), SSDs riding a 2x2.5"-in-HDD-footprint tray as a peer sled.
   Zero drilling, M3x5 only, and it is constrained by a cable-reach measurement, not by hardware
   availability.
6. **Beep-code context:** the case-swap qualification gate (11) is now joined by a hard POST
   block — HP **3.2** (3 long + 2 short) = *EC timed out waiting for BIOS to return from memory
   initialization* — see `docs/case-swap-3-2-beep.md`. A zip-tied rad pulling on the pump block is
   on that ladder, because LGA1700 mounting pressure is a memory-contact variable.

## 3. Gate sequence, unchanged

One physical change per power-on -> first power-on with the side panel off, hand-spin all four
fans, listen for scrape -> `etc/rad-cut-postdiag.block` FULL paste-back read before any bench ->
Superposition 1080p Extreme + dmon, **PASS = GPU <= 81 C / CPU <= 70 C at fan % at-or-below the
old case** (and with the panel CLOSED; if a riser is ever fitted, closed is the condition that
counts) -> only then do the OC tracks resume, at XMP 3733 r0 and nothing above it.

## 4. Docs that carry the detail

- `docs/case-swap-rad-mount.md` — §0-§5 sandwich/measurement plan, Appendix A direction check,
  Appendix B pressure terminology, Appendix C the RGB trade-off, Appendix D sealed-box thermal
  plan, Appendix E the riser gate, **Appendix F the zip-tie reality + the no-drill permanent fix**.
- `docs/case-swap-rad-cut.md` — cut protocol, grinder non-negotiables, swarf clean (§3b/§3c/§4).
- `docs/case-swap-sff-triage.md` — the five HP-specific traps, cold-vs-warm discriminator, cause
  classes, the photo shot list.
- `docs/case-swap-3-2-beep.md` — the current POST block and its ladder.
- `docs/case-swap-hdd-mount.md` — drive mounting in this chassis + the ZFS rules that outrank it.
