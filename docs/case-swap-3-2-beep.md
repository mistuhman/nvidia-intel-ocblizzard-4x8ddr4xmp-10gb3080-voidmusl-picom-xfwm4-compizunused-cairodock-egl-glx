# POST blocked: HP 3 long + 2 short (major/minor 3.2) after the case swap (2026-09-05)

**Operator report, verbatim:** "everything thats necessary for post is assembled but when i
turn it on i get the beeps 3 long 2 short about 6 times after power cycling" + "nothing is
plugged incorrectly and cmos wasnt reset" + "aio is not mounted right since its using zipties
to mount to the front as there are no screw holes for it or screws long enough nor are there
tools necessary for drilling screw holes" + "an important note about the case is that its an
apex pc389".

---

## 1. The decode (HP's own numbering, corroborated on THIS board)

HP desktop firmware beeps **major/minor** codes: **long beeps = major, short beeps = minor**,
and the EC repeats the group ~5 times then stops (`docs/open-classes-pass3.md` recorded exactly
that repetition rule from this board's own 2026-08-27 behaviour).

| Code | HP wording | Meaning |
|---|---|---|
| **3 long 2 short = 3.2** | "The embedded controller has timed out waiting for BIOS to return from **memory** initialization" | **memory subsystem never came back from MRC** |
| 3 long 3 short = 3.3 | "...timed out waiting for BIOS to return from **graphics** initialization" | the code this repo already **observed on this exact board** with the 3080's 6+2 unplugged (`docs/open-classes-pass3.md` "THE OMEN POSTS AGAIN") |

External corroboration for 3.2 on HP desktops: HP Community "3 long beeps followed by 2 short"
threads resolve to the memory table entry and to *reseat / one-stick-at-a-time* (h30434
threads 7858264, 8338000, 8840842; r/pcmasterrace 1hpirjt quotes the EC memory wording, and
notes one machine turned out to be **one bent socket pin**). The 3.3↔graphics half of the
scheme is verified locally, so the 3.2↔memory half is the right read of this family.

**What this excludes.** It is not a fan/`90B` code, not a thermal code, not a PCIe/GPU code,
not a PSU-latch code (a hard short latches the PSU silent — that was the whole 2026-08-25
crisis shape). And per the operator's own words, cabling is not the variable being reopened:
the reseat below is a *differential test*, not an accusation.

**What it does NOT exclude: the zip-tie AIO.** On LGA1700 the memory controller's pins live in
the same socket grid as the core pads, so **cooler mounting pressure is a memory fault class**:
documented as "if the cooler mounting pressure is uneven or excessive, it can slightly flex the
PCB around the socket, affecting pin contact in the memory controller area" (DRAM-light
troubleshooting guides), and "improper pressure can result in problems ranging from the system
not booting to **memory channels not working**" (Gamers Nexus LGA1700 ILM/contact-frame work,
smallformfactor.net 2022-06-27). Field reports match: an HP-desktop owner with this exact
3-long-2-short fixed it by pulling the heatsink, cleaning and re-pasting (h30434 8338000).
A rad hung on zip ties pulls on the hoses, and the hoses pull on the block.

## 2. Cause classes, ranked for this machine

| # | Class | Why it fits | Discriminator |
|---|---|---|---|
| **M1** | **DIMM not fully seated** after the swap (184 mm-wide case, hand access around the rad/hoses) | the #1 documented cause of 3.2; needs 20-30 lbf of even pressure on a DDR4 latch to click both ends | reseat pass, one power-on |
| **M2** | **The never-validated 4000 MT/s @ 1.45 V profile (r3) still keyed** | PROVEN live 2026-08-30 06:44 UTC — `dmidecode` read Configured Memory Speed **4000 @ 1.45 V** on all four DIMMs *after* a CMOS-reset screen, and per `MASTER.md` gate 11 the inverse (F10 → XMP Profile 1 3733) was **parked, never executed**. Z690 retrains by rebooting; a hard training failure is what makes the EC give up on BIOS | 1-DIMM boot → trains at JEDEC → reach F10 and read it |
| **M3** | **Block seating / hose tension from the zip-tie rad mount** (M3 = C5 of `docs/case-swap-sff-triage.md`) | the mount is explicitly "not right" per the operator; tension on the pump block = uneven ILM pressure = memory-channel contact | loosen ties so the stack is unloaded, confirm the block is flat and all four fasteners snug diagonally, one power-on |
| **M4** | Power-path seating on this board's two 4-pin CPU sockets (HP trap 1 in `docs/case-swap-sff-triage.md` §0) | a half-seated 4-pin browns the VRM mid-MRC; POST is not reached so it looks like memory | push until the latch clicks (do this in the M1 pass) |
| **M5** | Socket pin damage / board flex from the move | last-resort class; one forum resolution to this exact code was a single bent pin | **do not pull the CPU** — standing rule (LGA1700 pins bend easily, `docs/bios-flash-decision.md`); bright-light look only |

## 3. The ladder — one power-on per change, in this order

Zero-power between attempts: **cord out, hold the case button 20-30 s** (this PSU has no rocker,
STATE.md/`docs/case-swap-sff-triage.md` §0 fact 4). Do not loop power-ons waiting for the EC.

1. **Step 1 — reseat pass (free, no tools, no parts).** Cord out: release the zip-tie tension on
   the rad so the hoses carry zero load; check the pump block sits flat with all four fasteners
   snug in a diagonal pattern; pull and re-install all four DIMMs with even pressure until both
   clips click; confirm both 4-pin CPU plugs, 24-pin and both GPU 6+2 click home. One power-on.
   **Pass = HP splash.** **Fail = 3.2 again → step 2.**
2. **Step 2 — one DIMM only, slot A2** (second from the CPU; HP's own guidance for a 1-stick
   test is "the slot closest to the processor" — if the board silkscreen names a 1-DIMM slot,
   obey the silkscreen). Trains at JEDEC, far easier than 4 DIMMs at 4000. **Pass = memory class
   confirmed (M1 or M2), go straight to step 3 via F10.** Fail = 3.2 → move the stick to the
   other end (B2/B1) for one more power-on, then to step 4.
3. **Step 3 — kill the profile, in the interface that owns it: F10 → Advance → memory/XMP
   Profile 1 (3733 @ 1.35 V), and read `After Power Loss` = Off.** This is the inverse that has
   been owed since 2026-08-30 (gate 10/11) and it is the only *logged* way to change memory on
   this board — the Void-side efivar write is the mechanism that preceded the 2026-08-25 crisis
   and stays forbidden. Then re-add DIMMs two at a time, one power-on each.
4. **Step 4 — no splash at all after steps 1-3:** the 3-pin `CMOS` cap clear is the only way to
   force JEDEC without BIOS access. Expect it possibly **not** to clear the profile (receipt
   2026-08-30: a firmware CMOS reset left 4000 keyed) — that is itself the result, and it moves
   the fault off "stale settings".
5. **Step 5 — block off, clean and re-paste, re-seat at even pressure** (the fix the HP-forum
   owner reported for this code). CPU stays in the socket; do not lift the ILM with the CPU in.
6. **Step 6 — socket inspection by eye** (bright light, angle, nothing metal near the pins),
   then the standing verdict: board/CPU class, and the bench returns as the instrument
   (`docs/omen-free-recovery-runbook.md`).

**Rollback for the whole ladder:** every step is a reseat or a BIOS menu read; nothing is
permanent except step 5's paste (inverse = re-paste). No drilling, no new parts, no firmware
flash (BIOS flash stays irreversible on 8917/Boot-Guard, `MASTER.md` hardConstraints).

## 4. Safety rails while beeping

- **Never run it with the block unloaded or the pump unplugged.** `FAN1` = pump; the 3.2 loop is
  low-power so no thermal damage, but a loose block + a fan-spinning test is how IHS contact
  damage gets *created*. The ties get loosened, not the block left proud.
- Rad hanging on ties during this ladder is **fine** — it carries no load path to the socket as
  long as the hoses are slack. Mount quality is an airflow/vibration problem (Appendix F of
  `docs/case-swap-rad-mount.md`), not the beep cause, except through the M3 tension path.
- If the pattern **changes** (any different long/short group, or 2 long 2 short = HP BIOS
  recovery), stop and report it — a changed code is a new class, not progress on this one.
- No OC work at any point: gate 11/12 still blocks every GPU/CPU/DDR4 track, and gate 10
  (r3 validation) is suspended, not closed — **take 4000 off, never re-apply it.**

## 5. What comes back in the receipt

The single number that decides the branch: **does the machine reach the HP splash after any of
these steps, i.e. is F10 reachable?** Everything else (beep count, whether the block looked
tensioned, which slot worked) is context. Paste `etc/case-swap-mem-3-2-post.block` (root,
read-only) from Void as soon as it boots: it reads Configured Memory Speed/Voltage per DIMM,
MCE/EDAC, and the fan tachs — the receipt that proves whether M2 was live all along.
