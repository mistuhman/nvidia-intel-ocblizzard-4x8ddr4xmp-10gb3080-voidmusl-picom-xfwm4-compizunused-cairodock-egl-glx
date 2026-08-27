# Next chat — OMEN BlizzardOC no-POST rescue

## What to do first

1. Run `node tools/stall-check.ts`
2. Read `MASTER.md` — this file is the source of truth for hardware facts, closed classes, and the active objective
3. Read `docs/hardware-retrospective.md`
4. Read `docs/omen-free-recovery-runbook.md`
5. Only then: run `node tools/recovery-research.ts --plan` or equivalent web search on the **open search classes**

---

## The one-sentence problem

HP OMEN 45L BlizzardOC (board SSID 8917, Z690, i7-12700KF, RTX 3080) does an **instantaneous power cycle with zero feedback** — no beep, no POST, no USB enumeration — preventing the validated HP recovery stick from ever being read. It cut power before memory init.

---

## Machine identity (hard facts, no guessing)

| Item | Value |
|---|---|
| Chassis | HP OMEN 45L GT22-0xxx |
| Board | HP BlizzardOC, SSID **8917**, Z690, 4× DDR4 288-pin |
| BIOS | AMI **F.51** (F.57/sp167160 NOT applied) |
| CPU | Intel **i7-12700KF** 12C/20T, LGA1700, **no iGPU** |
| GPU | NVIDIA **RTX 3080 10GB** (pci 10de:2216) |
| RAM | 4×8GB Kingston **HP37D4U1S8MR-8X**, DDR4, XMP **3733 MT/s @ 1.4V** |
| Last attempted RAM | Custom 4000 22-24-55 Gear2 **1.50V** booted; **1.55V** failed to boot |
| PSU | OMEN 45L 850W-class, **no rear switch**, cord-out isolation only |
| User | `sd` |
| OS last booted | Void glibc, kernel 6.18.35-tkg-bore, NVIDIA 595.91.07, ZFS 2.4.3, ZBM 3.1.0 |
| Display | dual monitor 4480×1440 |
| Boot path | NVMe → ZBM → Void; BootCurrent 0002, BootOrder 0002,0008 |

### Storage (untouched)
- **nvme0n1** 953.9G: p1 ESP 512M vfat UUID 5010-EA01; rest = zpool nvme, root nvme/ROOT/void
- **Sabrent USB3 1.8T** (sda): keep disconnected during recovery

---

## What happened leading to this

1. Operator was running DDR4 4000 MT/s @1.50V custom profile — **booted OK but never stability-validated** (no stress-ng, no memtest)
2. Operator attempted DDR4 4000 MT/s @**1.55V** in BIOS
3. Machine failed to boot after the 1.55V attempt
4. Multiple trial-and-error resets followed: CMOS cap moves, power cycling — all produced the same immediate cycle
5. BBR jumper (slide toward FDO/PSWD/BBR text) was tried once — **FAIL** (no LED, same pattern)
6. Clean HP recovery stick (HP_TOOLS, single FAT32 partition, 08917.bin+sig) was tested in three ways: Win+V, Win+B, plain power-on — **all FAIL, USB never enumerated**
7. Ventoy multi-partition layout was wiped, stick rebuilt to single HP_TOOLS FAT32 — still no enumeration
8. USB content verified: `HP\BIOS\New\08917.bin` (~16.38 MB) + `08917.sig` (1 KB)
9. HP SoftPaq sp167160 (F.57) is available on the Windows helper PC but **not yet applied to OMEN**
10. Board now resets before POST, before memory init — fault moved earlier than the memory OC

---

## Board photo-map (known headers)

| Header | Location | State |
|---|---|---|
| **PB** (power button) | 2-pin near 24-pin/USB; red on one pin | Real power path; unplugged = no change |
| Brown/black 2-pin by PWR_LED | — | **Not** power path |
| **CMOS** (3-pin) | Center bottom, small blue cap | Moved, restored — same cycle |
| **FDO/PSWD/BBR** (3-pin) | Above SATA3 | Blue cap on **LEFT pair** (away from text); right pin open; **not moved** |
| OMEN logo LED | Case LED on own controller board | Lit on AC standby, **no diagnostic value** |

PSU has **no rear rocker switch**. Isolation = cord-out + hold power button 20–30s.

---

## Closed test classes — do not repeat

These have been tested and produced no change. They are **closed as classes**, not filenames:

| Class | Result |
|---|---|
| 3-pin CMOS cap move | ❌ FAIL — same instant cycle |
| 3-pin FDO/PSWD/BBR slide (toward label) | ❌ FAIL — no LED, same pattern |
| USB recovery + Win+V | ❌ FAIL |
| USB recovery + Win+B | ❌ FAIL |
| USB recovery + plain power | ❌ FAIL |
| Ventoy multi-partition stick | ❌ FAIL |
| Clean single-partition HP_TOOLS stick | ❌ FAIL |
| Front-panel PB isolation | ❌ FAIL |
| Zero-DIMM / minimal bench | ❌ FAIL |
| CR2032 removal | ❌ FAIL |
| Pump / 0-RPM | ❌ FAIL |
| Wall vs UPS | ❌ FAIL |

**Jumper and USB+hotkey classes are closed. Cap left pair, cord out.**

---

## Open search classes — these are what a new chat must work

1. **HP SoftPaq sp167160 contents** — does it contain `HpBiosUpdate.efi`? What does it look like when extracted on a non-OMEN host? (Windows PC, Mac, Linux) — inspect only, no OMEN touch
2. **BlizzardOC 8917 board-specific recovery literature** — is there a service manual, board view, or forum post for this exact board that describes recovery paths other than the 3-pin cap or USB?
3. **OMEN 45L PSU/EC sequencing** — the board resets before it reaches USB. What is the EC/PSU interaction that causes an instant cycle? Is `PS_ON#` held low? Is there a board-level protection trip?
4. **Owned instrument plans** — only if the operator reports a tool they have (3.3V SPI programmer, DMM, logic analyzer)

---

## What "free" means here

- No purchasing (no SPI programmer, no replacement board, no new PSU)
- No external escalation (no shop, no HP support call, no forum post)
- The recovery USB stick is already built and verified correct
- The F.57 BIOS (sp167160) is available on the Windows helper PC
- The only remaining free diagnostic is either a **BBR jumper confirmation** (which pair on THIS board) or a **read-only firmware inspection** (sp167160 contents)
- The only remaining free power-on is a **properly identified BBR attempt** (not a guess)

---

## The BBR situation

The `FDO/PSWD/BBR` 3-pin has **not been moved**. The blue cap is on the left pair (away from the silkscreen text). The other pair is the unproven BBR candidate. The one prior BBR-shaped attempt was a slide toward the text — which is the WRONG direction if BBR is the right pin. The runbook says to identify the exact BlizzardOC BBR pin position from a photo or exact source before attempting.

**BBR is still an open free option if the correct pin pair can be identified.**

---

## The sp167160 situation

sp167160 (F.57) is a Windows `.exe` SoftPaq. It was downloaded and verified. The key questions:
- Does it contain `HpBiosUpdate.efi`?
- Can it be extracted on a non-Windows host without running the Windows `.exe`?
- Does `HpBiosUpdate.efi` have any specific requirements about the board state (POST required? recovery mode required?)? This matters because the board doesn't POST.

**If HpBiosUpdate.efi requires a running OS or POST, it cannot help here.**

---

## The operator's directive

> "maybe we make a prompt including everything claude needs to know to fix this? and for free"

The operator wants a single comprehensive context document for a fresh chat. No guessing, no relabeling closed classes, no power-ons without a named discriminator. Search or halt.

---

## Next action for this chat

Write the comprehensive prompt to `docs/next-chat-prompt.md` (done). Commit and PR. Then the operator opens a new chat with this repo and that file as the context anchor.

If the new chat also stalls on the same closed classes: **Achtung, Halt!** and search a genuine open class or halt again.
