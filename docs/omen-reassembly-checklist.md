# OMEN 45L reassembly — phone checklist (2026-08-27, post-recovery)

Written for a phone screen, one phase at a time. **Cord out for every phase. Power on only
where a phase says to.** If a plug does not seat with light pressure, stop — it is the wrong
header, never the wrong amount of force.

Board landmarks used below (all confirmed from operator photos this session):

- **Top-left, near the CPU socket:** two **4-pin CPU power** sockets, `FAN1`, `FRONT-AUD`
- **Right edge, top to bottom:** `LCFAN`, `F-SMB`, `TFAN/LCFAN2`, `PB`, `FFAN3`, `FFAN2`,
  `SPWR` (24-pin), `FRONT-USB1`, `FRONT-USB2`, `12V GRB LOGO RGB`
- **Bottom edge:** `SATA1`–`SATA4`, `CMOS`, `FDO/PSWD/BBR`, `PWR_LED`, `MUSB`,
  `CPU FAN RGB`, `12V GRB`, `FRONT FAN RGB`, Wi-Fi card
- **Accessory hub** = `M82868-001` **LED BOARD** on the back of the tray: SATA power in,
  `CPU RGB` out, `LOGO` out (marked *caution: 5V only*), plus its cable to the board

---

## Phase 0 — safe state

1. Machine off, **wall cord out**.
2. Hold the case power button **20 seconds** to drain.
3. Both side panels off if possible; most fan/front-panel cables route behind the tray.

## Phase 1 — core (already done, verify only)

| Item | Where |
|---|---|
| 24-pin | `SPWR`, right edge, latch clicked |
| CPU power ×2 | the two 4-pin sockets, top-left |
| `PB` | 2-pin, right edge — **this one was the blocker before** |
| GPU 6+2 ×2 | into the 3080 |
| Monitor | on the **3080's** DisplayPort |

No power-on needed if all five are already true.

## Phase 2 — cooling (this is what `90B` is about)

The `M82880-002` LCS 240 has **three** leads: the **pump** (off the block on the CPU) and
**two radiator fans**. Front intakes and the rear fan are separate.

| Lead | Header |
|---|---|
| Pump (from the CPU block) | `FAN1` first — if `90B` persists, `LCFAN` |
| Radiator fan 1 | `LCFAN` |
| Radiator fan 2 | `TFAN/LCFAN2` |
| Front intake | `FFAN2` |
| Front intake | `FFAN3` |
| Rear fan | already connected per operator |

Fan plugs are 4-pin with a plastic tab that lines up with the notch. A 3-pin seats to one
side of a 4-pin header, aligned to that tab.

**POWER-ON TEST 1.** Report: is `90B` gone? Are the radiator fans turning? Is the pump
buzzing? If `90B` persists with everything above connected, move **only** the pump lead
between `FAN1` and `LCFAN` and retest once.

## Phase 3 — front panel

| Cable | Header |
|---|---|
| Wide block, ~19–20 pins | `FRONT-USB1` (USB 3) |
| 9-pin, labelled USB | `FRONT-USB2` / `MUSB` |
| 9-pin marked `HD AUDIO` | `FRONT-AUD`, top-left |
| 2-pin | `PWR_LED`, bottom edge |

No power-on required; folded into the next test.

## Phase 4 — accessory hub (`M82868-001` LED board)

**Do this one alone.** It is the standout suspect for the original instant-cycle.

1. SATA power lead from the PSU → the hub.
2. Hub's data/control cable → its motherboard header.
3. `CPU RGB` and `LOGO` leads → their headers. **`LOGO` is marked 5V only — never put it on
   a 12V header.**

**POWER-ON TEST 2.** Report:

- boots normally → hub cleared, original cause stays unattributed but harmless
- **instant cycle returns** → **the hub was the fault**. Unplug it, keep the machine. HP's
  own community answer says 45L owners run fine with that board unpowered; the only loss is
  OMEN lighting control

## Phase 5 — BIOS, once it boots clean

1. **F10** at POST.
2. **Load setup defaults.**
3. Memory: **XMP 3733** (HP's factory DIMM `M85222-001` is a DDR4-3733 part).
   **Never the 4000 custom profile** — that preceded the crisis.
4. Save and exit → **Escape** → ZBM → `nvme/ROOT/void`.

## Phase 6 — storage, later and separately

Extra HDDs/SSD go in **after** several clean boots, **one drive per power-on**. Adding SATA
disks renames `sd*` nodes, and this is a ZFS-root machine — do not stack that on top of a
fresh recovery.

## Do not

- Force any connector.
- Touch the `CMOS` or `FDO/PSWD/BBR` caps. They are irrelevant now and were never the fault.
- Load or benchmark the CPU until the pump is confirmed spinning.
