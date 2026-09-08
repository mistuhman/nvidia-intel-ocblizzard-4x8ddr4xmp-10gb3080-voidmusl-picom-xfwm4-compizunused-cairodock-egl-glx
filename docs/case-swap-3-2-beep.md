# POST blocked: HP 3 long + 2 short (major/minor 3.2) after the case swap (2026-09-05)

**Operator report, verbatim:** "everything thats necessary for post is assembled but when i
turn it on i get the beeps 3 long 2 short about 6 times after power cycling" + "nothing is
plugged incorrectly and cmos wasnt reset" + "aio is not mounted right since its using zipties
to mount to the front as there are no screw holes for it or screws long enough nor are there
tools necessary for drilling screw holes" + "an important note about the case is that its an
apex pc389".

**Operator, 2nd message (2026-09-05), verbatim:** "before i do anything, one step at a time, and
key note. one of the capacitors was bent but not damaged, i bent it back straight."

**Pacing directive, reaffirmed and now binding for this ladder: ONE step per wave, operator
reports back before the next step ships.** (Same rule as the placement work, `MASTER.md`
caseSwap 2026-09-02c.) The steps below are therefore to be read as a queue, not a checklist to
run in one sitting — **Step 0 is the only step shipped now.**

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

**What 3.2 does NOT mean is "the memory sticks are bad."** It means BIOS never returned from
training — which also covers anything that stops the **memory power rails** (VDDQ/VPP) from
coming up, or a decoupling cap in that zone that is shorted, open, or leaning into a neighbour.
That is why the bent-and-restored capacitor report is **Step 0**, ahead of every reseat, and not
a footnote.

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
| **M0** | **The bent-and-restored capacitor** (operator: "one of the capacitors was bent but not damaged, i bent it back straight") | Ranking changed by this report: this is the one item in the whole event that is *new physical damage to the circuit*, it happened during the same work window, and a re-straightened electrolytic can (a) leave a lead sitting against a neighbour pad/trace = a rail shorted toward ground, (b) crack its sleeve at the seal or lift a pad, (c) break its solder fillet = an open decoupling cap. On a Z690 board the VDDQ/VPP memory-filtering caps sit in exactly the zone a hand reaches through when working the front of an 184 mm case, and a shorted memory rail produces *this* code: BIOS never returns from MRC, the EC times out at 3.2. "Not damaged" is an operator judgement made without a close look, and it is cheap to verify. | **zero power, by eye + bright light, no tools** — Step 0, before any power-on |
| **M1** | **DIMM not fully seated** after the swap (184 mm-wide case, hand access around the rad/hoses) | the #1 documented cause of 3.2; needs 20-30 lbf of even pressure on a DDR4 latch to click both ends | reseat pass, one power-on |
| **M2** | **The never-validated 4000 MT/s @ 1.45 V profile (r3) still keyed** | PROVEN live 2026-08-30 06:44 UTC — `dmidecode` read Configured Memory Speed **4000 @ 1.45 V** on all four DIMMs *after* a CMOS-reset screen, and per `MASTER.md` gate 11 the inverse (F10 → XMP Profile 1 3733) was **parked, never executed**. Z690 retrains by rebooting; a hard training failure is what makes the EC give up on BIOS | 1-DIMM boot → trains at JEDEC → reach F10 and read it |
| **M3** | **Block seating / hose tension from the zip-tie rad mount** (M3 = C5 of `docs/case-swap-sff-triage.md`) | the mount is explicitly "not right" per the operator; tension on the pump block = uneven ILM pressure = memory-channel contact | loosen ties so the stack is unloaded, confirm the block is flat and all four fasteners snug diagonally, one power-on |
| **M4** | Power-path seating on this board's two 4-pin CPU sockets (HP trap 1 in `docs/case-swap-sff-triage.md` §0) | a half-seated 4-pin browns the VRM mid-MRC; POST is not reached so it looks like memory | push until the latch clicks (do this in the M1 pass) |
| **M5** | Socket pin damage / board flex from the move | last-resort class; one forum resolution to this exact code was a single bent pin | ~~do not pull the CPU~~ — **amended 2026-09-07, see
  M6/2b**: in-place re-clamp first (least-harm 2026-09-07c); sanctioned bench lift only on continued 3.2 |

## 2b. 2026-09-07 amendment — the ILM admission (new class M6, co-leading)

**Operator report, verbatim (2026-09-07):** "halfway through building while the mobo was out, i
unseated the cpu lever about 10% of the way, and without applying a little bit of pressure on the
cpu i pushed it back into place from there. and then later mounting the aio pump 90 degrees to
the right on top of it. could it be because of that?"

**M6 — socket-seat integrity, in two sub-mechanisms:**

- **M6a — clamped off-seat.** Opening the ILM lever ~10% relieves the load plate. The 12700KF
  was then free to settle/shift a fraction of a millimetre during the build (board out, board
  being moved). Re-closing from that position *without* pressing the CPU flat first can clamp it
  floated or tilted. On LGA1700 the memory-channel lands live in the socket field, so marginally
  landed pins = marginally trainable memory = **exactly 3.2's shape**, and exactly this machine's
  history: cold cycles "~3 times, randomly", warm reboots clean (contact resistance migrates
  with temperature; MRC retries find it eventually), a runtime crash, a 9079 bench run that
  **worked** on 2026-08-30 (contact was good-enough then), then degradation to hard 3.2 after
  the panel cutting / hole drilling / zip-tie mounting / HDD handling phase — i.e. it tracks
  mechanical disturbance, which no settings class does.
- **M6b — the rotated pump.** A 90°-rotated AIO block is a memory fault class in its own right
  (§1's citations: uneven ILM pressure ⇒ "memory channels not working"): if the bracket is not
  square-symmetric, engaging it rotated can leave fastener heights uneven; and even a symmetric
  bracket re-routes the hoses into a new preload. Uneven IHS load rocks a marginally-seated CPU.

**Bench photo 2 receipt (2026-09-07):** plate fully open, lever up; CPU visibly seated in-frame from above, no gross rock; full-face IHS imprint reads broadly centered with NO stark one-edge squeeze = no gross-tilt evidence (marginal contact is sub-visible and the functional test still decides); DIMMs still installed (1-DIMM A2 config belongs to the bench wave); lever arm + latch visibly normal = over-closed-latch not supported. Operator hypothesis (horizontal pump load forced the latch too far) received and corrected in section 2c.

**What M6 predicts — the receipts to look for:**
1. **Paste imprint** on the IHS and block: skewed/thinned pattern, paste squeezed to one edge,
   or a bare corner = tilt under load. Photograph BOTH surfaces **before unbolting the pump is
   finished and before anything is wiped**; note which fasteners were tight vs finger-loose.
2. **Pin-field pattern break** in the socket (bright raking light, four angles) — a bent pin
   sparkle line vs a perfectly uniform field.
3. **Differential result:** pins clean + a careful full-travel re-seat + symmetric pump mount =
   POST returns on the first bench attempt ⇒ M6a closed by assembly. Pins disturbed ⇒ repair
   branch (few pins: mechanical straighten under magnification; many: board class re-verdict).

**Least-harm re-sequencing, operator directive 2026-09-07c ("i dont wanna take it out
really") — binding:** the wave-1 lift is WITHDRAWN; do-not-pull stands again, and the lift is
demoted to contingency-only (it re-arms ONLY if the in-place correction still fails to POST).
The functional M6a test becomes the **in-place re-clamp**, the waves single physical change:

1. Zero power; board flat and kept HORIZONTAL the whole time — tilting the board while the
   plate is open is the actual pin-bending event, vertical pressure is not.
2. Release the lever to FULL open; let the plate rise on its own hinge.
3. Eyes-level check: the CPU should sit flush in the frame. If it is visibly rocked, photo
   it as-is FIRST (the tilt is the evidence), then press it home gently at the IHS center.
4. Even planar pressure straight down through the plate window (clean fingertip or silicone
   pad, a few lbf at center; NEVER one corner — re-tilting it is this steps only mistake).
5. Plate down by its hinge; lever swept to full latch. The end-of-travel force is spec —
   that stiffness IS the clamping force, not a symptom.
6. Power stays off; the receipt (what the CPU looked like when the plate opened, plus the
   two photo sets below) comes back before the bench power wave ships.

What it gives up: the pin-field photo (visual bent-pin proof). What it keeps: the branch
decision — success after a correct re-clamp is functionally equivalent M6a evidence, closed
by function (same acceptance class as the LED hub). On success the pins are never seen, which
is the whole point of least harm. Still owed this wave (zero-power, observation only): the
block-face paste imprint photo and the M0 DIMM-zone cap macro.

Next wave AFTER receipt, one power-on: bench minimal POST — 1 DIMM in A2, GPU in, 24-pin +
both 4-pins, pump in its DESIGNED orientation (bracket square-symmetry check first), diagonal
snug, zero hose preload, existing paste fine for a 60 s F10 trip (re-paste at final assembly).
Splash -> F10 -> XMP 3733 (the M2 inverse) -> 3 cold boots. Still 3.2 -> the straight-up lift
ships NEXT with necessity on record (board flat, carrier ears, covered socket, photos).

**Standing-rule amendment (M5 "do not pull the CPU").** The rule protected an *undisturbed*
socket from needless risk. The operator's admission means the socket was already disturbed in
the build window; a photo-only diagnosis is now impossible without lifting, since the pin field
is hidden under the CPU. The rule is therefore **suspended exactly once**: on the bench, board
flat, CPU lifted **straight up by the carrier ears** (no sliding, no tilt, nothing metal near
the socket), photos taken, socket covered with its protective lid (or clean rigid equivalent),
CPU **not reinserted** until the photos have been read. The re-seat itself ships as its own
wave after the receipts — one change per wave still holds. **WITHDRAWN 2026-09-07c** — superseded by the least-harm re-sequencing directly above; this lift procedure survives only as the contingency branch.

## 2c. The latch hypothesis, corrected (2026-09-07)

Operator, verbatim: -i think i know the problem, horizontal load from the aio pump forced
the latch down too far. how do i fix this for free?-

Half right, one correction. The ILM lever is a cam that parks under a FIXED catch: it cannot
be forced down too far - its closed position is the same every time, and both bench photos
show the arm + latch as normal. What horizontal hose load from a zip-tied rad against a
90-deg-rotated block CAN do (and is the live mechanism, = M3 meets M6b) is rock the block
and rock the CPU UNDER a correctly-closed plate - pin contact goes uneven and memory
training starts failing. No latch involvement is needed, and no latch damage is in evidence.

The fix is free either way, because it is the same three moves: F1 close the socket
correctly (the wave re-clamp: flush check, planar center press, full latch); F2 de-load the
hoses (slack the ties so rad weight sits on the ties, hoses in relaxed loops carrying no
load); F3 at reassembly, mount the block in its DESIGNED orientation with diagonal snug -
if the hoses only reach rotated, that is exactly the failure the Mac Pro bracket deletes
permanently (Phase 2-3, zero-cost DIY route).

Postscript 2026-09-07d (operator: -upside down-, upright leaves no hose slack): **180-deg block rotation is APPROVED.** Block rotation in 90-deg steps is legal on the square LGA1700 mounting pattern BECAUSE the governing rules are hose load and planar pressure, not cosmetics. Conditions: (a) all four fasteners finger-start and engage with equal thread showing on every post ANY fastener needing force = stop, bracket is not square-symmetric in this rotation; (b) block flat - eyes-level, no rocking when pressed corner-to-corner; (c) hoses exit in relaxed bends with zero preload - tie the RAD so its own weight is on the ties, then the jiggle test: move the hose ends by hand, the block must not move; (d) pump-never-highest unchanged (rad tube-end upper-middle stays above the block on the CPU). The earlier 90-deg mount failed (c) - taut hoses rocked the block; a slack 180-deg mount satisfies all four.

**What M6 does NOT replace.** M0 (bent cap) stays Step 0 and runs FIRST at the bench strip —
a shorted memory rail is independent of socket seating and is the only class that can do
*damage at the next power-on*. M2 stays live until the F10 XMP-3733 inverse executes at the
first successful bench POST (the 1-DIMM JEDEC boot is the ladder's M2 test; the profile was
never un-keyed).

## 3. The ladder — one power-on per change, in this order

Zero-power between attempts: **cord out, hold the case button 20-30 s** (this PSU has no rocker,
STATE.md/`docs/case-swap-sff-triage.md` §0 fact 4). Do not loop power-ons waiting for the EC.

0. **Step 0 — capacitor audit. No power-on in this wave.** Cord out, button held 20-30 s, bright
   light, phone macro photo, nothing metal in your hand.
   - **Where is it?** The answer decides everything: in the **DIMM zone** (between/around the four
     slots, or the row ahead of them toward the front) = memory rail decoupling = **this is your
     fault class**, stop and report. Under the CPU/socket area or near the VRM = power path, report.
     Anywhere else (audio, front-edge, USB, chipset side) = note it, and continue to Step 1.
   - **Five looks at the cap itself:** (1) both leads soldered with a shiny fillet at the board,
     not floating; (2) the body stands vertical, not leaning into a neighbour; (3) **nothing is
     touching it** — a pad, a trace, a via, the DIMM slot's plastic backstop, a screw head, a
     heatsink underside; (4) the sleeve is uncracked at both ends and there is no electrolyte
     stain / crust at the seal or on the board under it; (5) the two pads around it have the same
     look as their neighbours (a lifted pad shows as a pale ring or a bare copper island).
   - **If a lead is against something:** do not "un-bend it a bit" and power on. Insert a dry,
     **non-conductive** separator (a sliver of plastic from a zip-tie offcut, folded paper, a
     fibreglass pen shaft) and leave it there only as a *diagnosis aid* — a proper repair is a
     soldering iron. Report which way it moved the beeps before doing anything else.
   - **If it is clean but in the memory zone:** that is still an answer — proceed to Step 1 and
     tell me, because it changes what Step 2 is worth doing.
   - **While the light is in there, one 10-second look-only sweep** (no changes, this wave observes
     only): a dropped screw or a standoff bump under the board (class A1), a pinched cable behind
     the tray, the CR2032 sitting in its clip, and anything else that moved *because your hands
     moved that capacitor*. A bent cap is evidence of reach into the component side, and reach has
     a habit of leaving more than one mark.
   - **No DMM on this rig** (`ToDo.md` "no special tools (no DMM, no 3.3V SPI)"), so this step is
     eyes and light, and the photo is the instrument.
   - **Pass = report the location + the five looks; only then does Step 1 ship.**

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

**Wave 0 has a different, cheaper receipt: no paste-back at all.** One macro photo of the
capacitor with its neighbours and the closest DIMM slots in frame, the board lit obliquely so a
leaning lead shows a shadow, plus one sentence naming the zone it lives in (between/around the
DIMMs | under/around the socket or VRM | elsewhere). Power stays off for this step; the
`etc/case-swap-mem-3-2-post.block` block ships with the wave that ends in a boot.
