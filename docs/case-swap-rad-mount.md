# Mounting the 4-fan 240 stack in a case with NO radiator mounting points (2026-09-02d)

**Operator question, verbatim:** "how do i properly mount this four fan aio to this case
that doesnt have mounting points for it?"

Context this answer is built on (all from repo receipts, nothing assumed):

- Cooler = HP **M82880-002 plain LCS 240** (`STATE.md`), pump block on `FAN1`,
  rad fans on `LCFAN` + `TFAN/LCFAN2` (`90B` EC watches those names).
- Fan stack **LOCKED push-pull** (`MASTER.md` caseSwap 2026-09-02c): the rad's own two
  fans **push** on the bezel side, two RGB fans **pull** on the inside.
- Position **LOCKED**: front-middle, **vertical**, intake; tube-end at the
  **upper-middle** of the rad (just below the DVD/bay cover), hoses drop straight back
  to the CPU at the same height, **pump never the loop's high point**, rad bottom edge
  **30–40 mm clear of the floor**.
- The front-middle **opening is already cut** with the angle grinder and swarf-cleaned;
  the stock plastic bezel **stays on** and its inner wall is **solid** (air enters only
  through perimeter clip-tab gaps) — so the rad **gasketed to the metal opening** is
  part of the airflow plan, not just cosmetics.
- Rules that apply: one physical change per power-on; `etc/rad-cut-postdiag.block`
  tach receipt before ANY bench; metal removal has no inverse.

---

## 0. The core principle: the case is not the mount — the *sandwich* is

A radiator never hangs off "radiator mounting points". What actually carries the load in
every case on earth is **eight fan screws pulling a fan frame, the panel, and the rad
into one rigid sandwich**. The panel's only job is to be a flat plate with 4 (or 8) holes
in the right places. Your case has no holes → **you make the holes**. That is the whole
job, and it is the *correct* method, not a bodge.

So the ranked answer is:

| Rank | Method | When |
|---|---|---|
| **1** | **Through-bolt sandwich**: push fan → panel → rad, one bolt per corner | Default. Your cut opening + push-pull layout is exactly the geometry this wants. |
| 2 | **Drilled panel + rad screwed to panel, fans on both faces separately** | If the sandwich bolt length can't be sourced. |
| 3 | **Angle-bracket frame** (aluminium/steel angle bolted to the drive cage + floor, rad bolted to the angle) | If the cut panel is too flimsy, warped by grinder heat, or the hole positions would fall on the formed/curved section. |
| 4 | Commercial universal rad bracket (Bykski B-ST-2FN-V2 class, slotted steel, ~$24) | Only if you want a bought part; functionally = method 3. |
| ✗ | Zip ties through the fins, "fan pins", double-sided tape alone | **Never.** Fin-piercing mounts saw through the core over time and the failure mode is coolant on a 3080. |
| ✗ | Drilling the radiator | **Never.** The tanks/channels are pressurised. |

---

## 1. Method 1 in full — the through-bolt sandwich (recommended)

### 1.1 Stack order, bezel → inside

```
[plastic bezel]  [air gap]  [PUSH fan #1+#2 (rad's own)]  [METAL PANEL]  [RAD]  [PULL fan #3+#4 (RGB)]
                            <- long 6-32 bolts: fan + panel + into rad -->      <- short screws: fan into rad -->
```

The push fans end up in the bezel cavity, outside the metal panel; the panel is clamped
between the push fans and the rad. That clamp **is** the mount. Load path: rad weight →
8 bolt shanks in shear → panel → case. No bracket, no adapter, nothing to sag.

### 1.2 Weight sanity check (why this is enough)

240 rad ≈ 1.0–1.3 kg filled, 4 × 120 mm fans ≈ 0.15 kg each → **≈ 1.7–1.9 kg total**.
Vertically mounted, that is ~0.24 kg of *shear* per bolt across 8 bolts in 1 mm steel.
Steel sheet in shear at #6 bolt diameter is good for two orders of magnitude more. The
only real risks are (a) hole placement, (b) screws bottoming into the rad core, (c)
vibration — all handled below.

### 1.3 Hardware

- **Thread:** AIO rads are almost universally **6-32 UNC**; a minority are **M4**.
  **Verify before buying:** take one of the rad's own supplied short screws to the
  hardware store, or thread-check it — 6-32 and M4 will cross-thread each other and
  ruin the rad boss. HP shipped this cooler with its own screw set; if you still have it,
  those short ones are your *pull-side* screws.
- **Long bolts (push side, ×8 if you bolt all corners, ×4 minimum diagonals):**
  length = push-fan thickness (25 mm) + panel (≈1.0–1.2 mm) + **engagement into the rad
  boss**. Standard safe engagement is **5–6 mm**. So **31–33 mm** → buy
  **6-32 × 1¼" (32 mm)**, the exact size sold as "radiator screws".
  *If the rad's boss depth measures less than 6 mm, drop to 1⅛"/30 mm.*
- **Washers:** a washer under every head (spreads load on the fan frame) and, ideally,
  a **thin rubber/silicone washer** at the fan-to-panel interface (vibration).
- **Optional gasket:** 2–3 mm self-adhesive foam or rubber strip around the perimeter of
  the metal opening, so the rad face seals to the panel. Per the locked airflow doctrine
  this stops the push fans recirculating around the rad instead of through it.

### 1.4 Screw-depth safety (the one irreversible mistake)

Too-long screws puncture the rad's water channels. There is no inverse — that ends the
cooler.

1. Take one long bolt, thread it into an **empty rad corner boss by hand** (no fan, no
   panel), count turns until it stops or gets stiff, back it out, measure how much of the
   shank went in with a caliper or by marking with tape. That number is your **boss
   depth**.
2. Required bolt length = 25 (fan) + panel thickness + (boss depth − 1 mm margin).
   Buy/cut to that; if the only bolts you can get are longer, add washers to eat the
   difference — **never** rely on "it felt tight".
3. Tighten by hand, **snug only** (~0.5–1 N·m, i.e. finger-tight plus an eighth turn).
   Alternating diagonal pattern, like a wheel.

### 1.5 Drilling the panel (do it OFF the case)

1. **Panel off the case, on a board, away from the machine.** Same electrical gate as the
   cut (`docs/case-swap-rad-cut.md` §4): swarf is conductive and this rig's silent
   failure mode is ZFS corruption.
2. **Use the fan as the drill template, not a ruler.** 120 mm fans are **105 × 105 mm**
   hole spacing, but marking that freehand across a 240 mm span accumulates error.
   Instead: hold the *rad with one fan on it* against the panel in its final position
   (tube-end at upper-middle, bottom edge 30–40 mm off the floor, tubes routing straight
   back to the block with no kink), and mark through the fan's own corner holes with a
   fine marker or a centre punch.
3. **Dry-fit first, mark second, drill third.** Before any hole: check the rad clears the
   GPU zone, the drive/bay covers, and that the **bezel still seats** — you already have
   the bezel dry-seat depth as a Step-1 check; the push fans live in that cavity, so
   push-fan thickness must fit inside the bezel gap.
4. **Centre punch every mark** (a drill bit walks on painted sheet and one walked hole
   ruins the alignment), pilot **2.5–3 mm**, then final:
   - clearance hole for #6 (3.5 mm shank) = **3.8–4.0 mm**;
   - clearance for M4 = **4.3–4.5 mm**.
   Slightly oversize is *good* here — it gives you alignment slack across 8 holes.
5. **Deburr both faces** (countersink bit or a larger drill spun by hand), then **wipe,
   vacuum, magnet-sweep** — the full grinder-swarf protocol, again, before the panel goes
   anywhere near the board.
6. Optional but nice: touch paint or clear on the bare drilled edges (rust).

**Only drill 4 holes first** (one per fan, diagonally opposite corners of each fan).
Test-fit the whole stack. If it hangs straight and true, drill the other 4. If you got a
position slightly wrong, you have only spent 4 holes.

### 1.6 If you'd rather not put machine screws through the panel

Two equally valid variants of the same sandwich:

- **Rivnuts (threaded inserts):** drill 4.5 mm, set a 6-32 or M4 rivnut in the panel;
  now the panel has real threads and the rad can be unbolted/rebolted forever without
  loose nuts behind it. Needs a rivnut tool (a bolt-and-nut "poor man's setter" works for
  4 inserts).
- **Bolt + nyloc nut:** through-bolt with a nut on the far side. Free, but you need
  access behind the panel while tightening, and the nut must be **nyloc or thread-locked**
  — plain nuts back off with fan vibration.

---

## 2. Method 3 — the bracket frame (fallback, if the panel can't be trusted)

If the grinder heat warped the panel, or the correct hole positions land on the formed
"shape transforms" section, don't fight it:

1. Two lengths of **20 × 20 mm aluminium angle** (or steel strap), cut a little longer
   than the rad.
2. Bolt each angle to the rad's **fan-screw bosses** (the same 6-32/M4 holes — no new
   holes in the rad, ever), one angle per long edge.
3. Bolt/screw the free flange of each angle to **existing holes** in the case: the
   top-front drive cage, the floor, or the front-panel flange. Existing holes first;
   drill the *case*, never the rad.
4. Slot the bracket holes (file a round hole into a 5 mm slot) so you can slide the rad
   into exact height before final tightening.

This is exactly what the commercial "universal radiator bracket" is; you're just making
it from $6 of angle.

---

## 3. Vibration, noise and the pump

- Rubber washers or thin foam tape at **fan→panel** and **rad→panel** interfaces. Metal
  fan frame bolted hard to a big flat steel panel is a drum; it is the single biggest
  noise source in a front-mounted rad build.
- **Do not let anything touch the cut edge.** Hoses, fan wires, the RGB pigtails: a raw
  ground edge will chafe through a hose. Deburr, and add edge trim or a fold of tape
  anywhere a hose or wire passes.
- **Hand-spin all four fans** with the power off after mounting; listen and feel for
  contact with the panel, screw heads, tabs, or a cable tie.
- **Orientation still rules:** tube-end at the rad's upper-middle, rad's high point above
  the CPU block, pump not the highest thing in the loop. A rad mounted "properly" but low
  gurgles and then cooks the CPU — this is the one placement error that damages hardware
  silently.
- **Headers unchanged:** pump → `FAN1`, rad fans → `LCFAN` + `TFAN/LCFAN2`. The two extra
  (pull) fans go to `FFAN2`/`FFAN3` — and remember `FFAN1` is the rear exhaust that
  cleared `90B`. **Any watched header left empty re-raises the 90B prompt.**
  If you run short of headers, a Y-splitter on the two pull fans is fine (they are the
  non-watched pair); never splice the pump.

---

## 4. Order of operations (one change per power-on)

1. **Dry-fit** the rad + one fan against the panel, in position; verify bezel seats,
   GPU clearance, hose reach without kink, bottom edge 30–40 mm off the floor.
2. **Measure** the rad boss depth and the panel thickness → decide bolt length.
3. **Panel off, drill 4 holes**, test-fit, drill the remaining 4, deburr, clean.
4. **Full swarf protocol** (`docs/case-swap-rad-cut.md` §4) before the panel goes back.
5. Assemble the sandwich, snug diagonally, gasket the perimeter.
6. **Connector recheck** (`docs/case-swap-rad-cut.md` §5): the improvised 2-pin `PB`
   adapter first, both 4-pin CPU sockets, 24-pin, both GPU 6+2, 4× SATA data, CR2032.
7. **First power-on with the side panel off**, listening for fan scrape.
8. Root shell → paste `etc/rad-cut-postdiag.block` → return the FULL output.
   **No Superposition, no Geekbench, no stress until that tach receipt is read.**
9. Only then the new-case thermal baseline gate: Superposition 1080p Extreme + dmon,
   PASS = GPU ≤ 81 °C / CPU ≤ 70 °C at fan % at-or-below the old case.

---

## 5. Measurements to send back before buying anything

| # | Thing | Why |
|---|---|---|
| 1 | Rad fan-screw **thread**: 6-32 or M4 (test with a known screw) | wrong thread destroys the boss |
| 2 | Rad **boss depth** in mm (hand-thread a bolt, measure insertion) | sets max bolt length; too long punctures the core |
| 3 | **Panel thickness** (≈0.8–1.2 mm) | adds to bolt length |
| 4 | Push-fan thickness (25 mm standard?) and **bezel cavity depth** | the push fans must fit in front of the panel under the bezel |
| 5 | Opening height vs rad height, and clearance to the bay cover above / floor below | confirms the upper-middle tube-end position still lands |

## Sources

- Universal DIY rad bracket exists as an off-the-shelf part (slotted steel, dual-120):
  Bykski **B-ST-2FN-V2**, ~$24 — retrieved 2026-09-02.
- Rad/fan screw standard is **6-32 UNC**, radiator screw sets sold as mixed
  5 mm + 30 mm, and washers are the standard anti-over-insertion measure (XSPC 6-32 set;
  Corsair Hydro fan mounting screw kit ships 8 screws + 8 washers + 8 short rad screws) —
  retrieved 2026-09-02.
- Fin-piercing "fan pin"/zip-tie mounts wear the core and are rejected by practitioners;
  correct answer is a bracket or a proper sandwich — r/projectcar radiator fan mounting
  thread, retrieved 2026-09-02. Applied here as: never pierce, never drill the rad.
- Rig-specific rules (headers/90B, one change per power-on, swarf gate, orientation,
  bezel doctrine): `MASTER.md` durableFacts.caseSwap, `docs/case-swap-rad-cut.md`,
  `docs/case-swap-sff-triage.md`, `STATE.md`, `etc/rad-cut-postdiag.block`.

---

# Appendix A — Airflow direction check (operator question 2026-09-02e)

**Operator, verbatim:** "since the rgb side faces inside the case and that same side is
intake, and opposite that side is the aio fans intaking from the radiator out the front
of the case. is that config right? considering rear is already exhaust"

## A.1 Verdict

**The *positions* are right. The *direction* as described is wrong — or at least
ambiguous in the one way that matters.**

In a push-pull sandwich **all four fans must blow the SAME way**. There is no
"one side intakes, the other side intakes from the rad." Push and pull are named from
the *radiator's* point of view, not from each fan's:

- **push** = fan on the upstream face, blowing INTO the rad
- **pull** = fan on the downstream face, sucking THROUGH the rad and blowing on out

Both fans move air in the **same direction**. The correct chain for your locked layout:

```
outside air → bezel gaps → [PUSH: rad's own 2 fans] → RADIATOR → [PULL: 2 RGB fans]
   → case interior → over GPU/VRM → rear FFAN1 exhaust → out
```

Every arrow points the same way: **front → back**.

Your sentence reads as though the front pair is moving air **out the front** while the
RGB pair moves air **into the case**. That is two fans fighting across one radiator:
net flow ≈ 0, both fans stall in each other's pressure, noise goes up, CPU coolant
climbs, and the rear exhaust then pulls its make-up air backwards through the rear
honeycomb and the PSU. It is the single most common AIO mounting error and it is
invisible until you measure — which is exactly what the post-cut gate exists for.

## A.2 So is "RGB side faces inside = intake" correct?

**Yes — and it is the right way round for both cooling and looks.**

- The RGB pull pair sits on the inside face and blows **into the case**. Correct.
- The rad's own push pair sits between the bezel and the panel and must **also** blow
  **into the case** (i.e. through the rad, toward you-in-the-case, away from the bezel).
- Rear `FFAN1` exhausts. Correct — and it is now the **only** exhaust, which is fine
  because the front stack is the only intake. One-way flow, no dead zones.

Aesthetically it also lands right: the RGB rings face the window/interior; the plain
push fans hide in the bezel cavity.

## A.3 How to verify direction (do this before a single screw)

Do **not** trust the blade shape by eye and do not trust your skin at low RPM.

1. **Frame arrow** — most fans have a small moulded arrow on the side of the frame
   showing airflow (a second arrow shows rotation; ignore that one).
2. **Sticker/hub rule** — air exits **toward the label/hub-strut side**; the open blade
   side is the **intake** side. This holds on virtually all PC fans (Noctua documents it
   explicitly). The strut-and-cable "ugly" side is the outlet.
3. **Tissue test (authoritative)** — power the fan on the bench, hold a strip of tissue
   at each face: pulled toward = intake face, blown away = outlet face. This is the only
   method with no exceptions. Do it once per fan and mark the outlet face with a dot of
   tape.

Then mount so that **all four outlet faces point into the case**.

## A.4 The intake-vs-exhaust question for THIS rig (why intake is still right)

The general trade-off: a **front rad as intake** gives the best coolant/CPU temps
(rad sees room air) and costs the GPU a few degrees (case ambient rises). A front rad as
**exhaust** does the reverse. Published side-by-side testing shows the intake orientation
moving coolant ~3–5 °C and CPU ~7–11 °C in its favour, while other builders measure
GPU/VRM penalties of ~4–6 °C when all rads are flipped to intake. It is genuinely
case-dependent.

For this chassis the argument is not close, for a reason specific to your build:

- The bezel inner wall is **solid** and the floor is **solid** (the bottom GPU feeder was
  withdrawn for recirculation). The front-middle rad opening is therefore the **only**
  fresh-air path in the case.
- If you flip the rad to exhaust, the case has **two exhausts and zero intakes**. Every
  cubic metre the GPU breathes gets sucked backwards through the rear honeycomb, the
  slot bracket, and the PSU — the worst possible source, and it recirculates its own
  exhaust.
- The CPU is a 125 W-PL1 part behind a 240 rad; the 3080 is the pinned 314 W part. But
  starving the GPU of intake air hurts it far more than pre-warming its intake by the
  3–6 °C a CPU-only 240 rad adds.

**So: front rad = intake, rear = exhaust, and that is the config to build.**

Pressure balance is fine as-is: four fans pushing through a restrictive rad and a
restrictive bezel roughly matches one unobstructed rear exhaust — slightly positive if
anything, which keeps dust out.

**This stays a hypothesis until it is metered.** The existing gate already tests exactly
this: after `etc/rad-cut-postdiag.block`, the new-case baseline is Superposition 1080p
Extreme + `dmon`, **PASS = GPU ≤ 81 °C and CPU ≤ 70 °C at fan % at-or-below the old
case's**. If the GPU number fails and the CPU number passes by a mile, *then* the
front-rad-to-exhaust flip becomes the next single knob — with a bezel standoff or a
second intake path as the alternative lever. Do not pre-emptively flip it.

## A.5 Sources

- Push/pull = fans on both faces moving air the **same** direction; opposed fans give
  ~zero net flow — overclockers.com push/pull thread, retrieved 2026-09-02.
- Airflow direction identification (frame arrow, label/hub-side = outlet, tissue test);
  a single reversed fan is worth several °C — PC airflow direction guides, retrieved
  2026-09-02.
- Front rad intake vs exhaust measured both ways (intake: coolant −3.5…−5.4 °C, CPU
  −7…−11 °C; all-rads-intake elsewhere: GPU +4 °C, GDDR6 +5 °C, VRM +6 °C) —
  overclockers.com AIO position analysis and overclock.net multi-rad test, retrieved
  2026-09-02.
- Rig-specific: solid bezel inner wall + withdrawn bottom feeder (`MASTER.md`
  caseSwap 2026-09-02b/c), rear exhaust on `FFAN1` and the 90B header map
  (`docs/case-swap-sff-triage.md` §5), GPU pinned 314 W / 80–81 °C vs 83 °C stop rule
  (`MASTER.md` durableFacts.gpu), thermal gate (`MASTER.md` caseSwap).

---

# Appendix B — "front positive, rear negative": the terms, and why the described stack is backwards (2026-09-02f)

**Operator, verbatim:** "all four fans are intaking from inside the case, if it were
placed in there. since the rad's intake fans are facing the rad, intaking from the rgb
fans through the rad and from the inside of the case to the front of the case. im just
confused on the right fan configuration for the radiatior because isnt it front positive
rear negative for the best positive pressure? since you dont want heat dissipating to the
front onto the desk but rather behind the pc where there is no person"

## B.1 Verdict — two half-truths that cancel out

1. **The stack you describe is internally consistent** (all four fans same direction ✓,
   the Appendix A error is fixed) — **but it is a front EXHAUST**, not an intake.
   Air path as you wrote it: case interior → RGB fans → rad → bezel → out the front.
2. **"Front positive, rear negative" is the right goal — and that goal is the OPPOSITE
   of what you described.** Positive pressure means **front blows IN**. You currently
   have front blowing OUT.
3. **Your heat-at-the-desk instinct is also right, and it argues for the same fix**:
   heat should leave out the back. Front exhaust does the exact thing you said you didn't
   want — it dumps the rad's hot air out the front, at the desk and at you.

So all three of your stated goals (positive pressure, heat out the back, not at the
person) point to **one** answer, and it's the one already locked in `MASTER.md`:
**front stack = INTAKE, rear `FFAN1` = EXHAUST.** Your description is that config
run in reverse.

## B.2 The vocabulary, pinned down

"Positive/negative pressure" is a property of the **whole case**, not of a wall:

| Term | Definition | How you get it |
|---|---|---|
| **Positive pressure** | intake CFM **>** exhaust CFM; case interior slightly above room pressure; air leaks OUT of every seam | more/stronger fans blowing **in** than out |
| **Negative pressure** | exhaust CFM **>** intake CFM; air is sucked IN through every unfiltered seam, grille, PSU gap | more/stronger fans blowing **out** than in |

There is no such thing as "the front is positive". The front is either **intake** or
**exhaust**. The standard, and the thing you actually asked for, is:

```
FRONT = intake (in)   →   [components]   →   REAR/TOP = exhaust (out)
```

Positive pressure = the intake side wins. With 4 front fans in and 1 rear fan out, you
are comfortably positive — dust enters only where you let it, not through every crack.

**What you described** is 4 front fans **out** + 1 rear fan **out** = **5 exhausts, 0
intakes** = strongly **negative**. Every cubic metre the 3080 breathes would be dragged
backwards through the rear honeycomb, the slot bracket gaps, the PSU shell, and the bezel
clip gaps — unfiltered, and partly its own re-inhaled exhaust. That's the worst case for
both dust and GPU temps, and this chassis has no other intake (bezel inner wall is
**solid**, floor feeder withdrawn — `MASTER.md` 2026-09-02b/c).

## B.3 The desk-heat question, answered properly

Heat is conserved: **every watt the machine burns leaves the box, whatever you do.** The
only choice is *where* it exits and *what it passes over on the way*.

**Front INTAKE (correct config):**
- Front face moves **room-temperature air inward** — the front of the case blows cool,
  not hot. Nothing warm at the desk.
- The rad's heat (CPU only, ~125 W PL1) enters the case as slightly warmed air, joins the
  GPU's ~314 W, and **all of it exits the rear** — behind the machine, away from you.
- Exactly the outcome you asked for.

**Front EXHAUST (what you described):**
- The front face becomes a heater aimed at the desk — CPU heat straight out the bezel at
  your hands and monitor stand.
- The rear fan still exhausts too, so GPU heat also goes back — but the case has to inhale
  from somewhere, and the only "somewhere" is unfiltered seams and the PSU.
- You get heat at the desk **and** negative pressure. Both of the things you wanted to
  avoid, at once.

## B.4 What "the rad's fans face the rad" actually means

Both pairs face the rad — that's what a sandwich is. What decides intake vs exhaust is
not which side of the rad a fan sits on, it is **which way every fan's outlet face
points**. Restating the target unambiguously:

```
BEZEL (front of case, faces the desk)
  ↑  ← this is where ROOM AIR ENTERS, moving INTO the page
[PUSH pair — rad's own fans]      outlet faces point INTO the case
[=== RADIATOR ===]
[PULL pair — RGB fans]            outlet faces point INTO the case
  ↓
CASE INTERIOR → GPU / VRM / DIMMs
  ↓
REAR FFAN1                        outlet face points OUT the back
```

Four outlet faces pointing at the motherboard. One outlet face pointing at the wall
behind the PC. Nothing pointing at you.

**Concretely, versus what you have in hand right now:** the RGB rings face the case
interior (correct, per Appendix A) and those RGB fans must **blow away from the rad,
into the case**. The rad's own fans, on the bezel side, must **blow toward the rad**, i.e.
also into the case. If your current mental picture has air travelling interior → rad →
bezel, **flip all four fans 180°** (or equivalently, flip the whole assembled sandwich).

## B.5 Verification is unchanged and mandatory

Tissue test on the bench (Appendix A.3), tape-dot the outlet face of every fan, then
mount with all four dots facing the motherboard. Then the gate, unchanged:
`etc/rad-cut-postdiag.block` tach receipt → Superposition 1080p Extreme + `dmon`,
**PASS = GPU ≤ 81 °C / CPU ≤ 70 °C at fan % at-or-below the old case.**

Front-exhaust remains a *legal* fallback experiment **only** if that meter shows the CPU
failing while the GPU passes wide — the reverse of the failure mode this chassis is set
up for. It is not the build target.

## B.6 Sources

- Positive vs negative pressure defined as intake CFM vs exhaust CFM, front-in/rear-out
  as the standard layout, and "all fans intake / no exhaust path" listed as a top
  airflow mistake worth 15–20 °C on the GPU — PC airflow direction guides, retrieved
  2026-09-02.
- Front rad as intake vs exhaust, measured deltas both directions — overclockers.com AIO
  position analysis; overclock.net multi-rad intake-vs-exhaust test, retrieved
  2026-09-02.
- This chassis: solid bezel inner wall, withdrawn bottom feeder, rear exhaust on `FFAN1`,
  thermal PASS gate — `MASTER.md` durableFacts.caseSwap 2026-09-02b/c/e;
  `docs/case-swap-sff-triage.md` §5; `etc/rad-cut-postdiag.block`.

---

# Appendix C — Confirmed direction, the fix that preserves RGB, and a correction (2026-09-02g)

**Operator, verbatim:** "i know which way the fan spins and intakes ive had the pc run
before and know what each fan is set to and what fan face dictates it. im not just
guessing. and it goes interior > rgb intake from interior > rad > rad fans intake from
rad > bezel." … "i still reaally want rgb fans because they animate though, but its not a
necessity"

## C.1 Receipt accepted — verification track CLOSED

The operator has run this hardware and knows each fan's faces. **The tissue test is
withdrawn as a requirement**; Appendix A.3 stands only as reference for anyone else. The
direction is now an operator receipt, not a hypothesis:

```
CONFIRMED CURRENT: interior → RGB pair → RAD → rad's own pair → bezel → out the front
```

That is a **front exhaust**, all four fans coherent, no opposed pair. Appendix B's verdict
is unchanged and now rests on a receipt: 4 front-out + 1 rear-out = **5 exhausts, 0
intakes**, and this chassis has no other fresh-air path. It must be reversed.

## C.2 CORRECTION to Appendix B.4 — do NOT flip the whole sandwich

Appendix B.4 said "flip all four fans 180°, **or equivalently, flip the whole assembled
sandwich**." **The second half of that is wrong and is retracted.**

Rotating the assembly 180° would:

- move the **hose/tank end to the opposite side**, breaking the locked upper-middle
  tube-end position and the "hoses drop straight back to the CPU at the same height, no
  GPU-zone pass-through" routing (`MASTER.md` ORIENTATION SUPERSESSION 2026-09-02); and
- move the **RGB pair to the bezel side**, where they are invisible behind a solid bezel.

**Correct fix: unscrew each fan and flip it 180° in its own position.** Nothing moves:
rad stays put, tube-end stays upper-middle, RGB pair stays on the interior face, rad's own
pair stays bezel-side. Only the four airflow directions reverse.

Result:

```
TARGET: bezel → rad's own pair (push, now blowing INTO the rad)
        → RAD → RGB pair (pull, now blowing INTO the case)
        → interior → GPU/VRM → rear FFAN1 → out the back
```

## C.3 The RGB cost of that flip — the real question

The RGB fans **do not move**. They stay on the interior face where they are seen. What
changes is **which of their two faces points at the viewer**: today the lit face points
into the case (you see it) and the fan inhales from the case; after the flip the fan
exhales into the case and **whichever face carries the ring now points at the radiator**
if the lighting is single-sided.

So the outcome depends on one thing only, which the operator can check in seconds with
the fans in hand:

| Lighting construction | Effect of the in-place flip | Action |
|---|---|---|
| **Ring lit through the frame edge / translucent both faces** (very common on white-ring fans, and what the photo's thick white rings suggest) | RGB stays visible | **Flip and you lose nothing.** Done. |
| **Diffuser only on one face** | The lit face turns toward the rad; you see a dark frame | Pick an option in C.4 |

**Check:** power the ARGB and look at the *other* face, or hold the unpowered fan to a
light — if the ring glows/diffuses on both sides, the flip is free.

## C.4 Options if the lighting really is single-sided

Ranked, with the airflow requirement (front = intake) held fixed and non-negotiable:

1. **Do nothing — accept the dark face.** Cheapest, zero risk. Note the honest question
   first: **does this case even have a side window?** It is an older SFF case with a
   **solid** front bezel inner wall; if there is no window, interior RGB fans are only
   ever seen with the panel off, and the animated lighting the operator wants is already
   being carried by the **light bar** (installed and working, `MASTER.md` 2026-08-30
   CLOSED). If there is no window, this whole trade-off is moot — flip and move on.
2. **Reverse-blade ARGB fans.** This exact problem is a product category: reversed blades
   move air the "wrong" way relative to a normal fan so the lit face stays toward the
   viewer while the airflow goes the other way (Thermaltake CT120 / CT120 EX Reverse ARGB,
   and several generic 3-packs). Two of them replace the RGB pull pair, lighting faces the
   interior, air still goes bezel → interior. **This is the clean answer if the window
   exists and the flip really does hide the light.**
3. **ARGB frames/halos.** Thin lit rings (Phanteks Halos class) that mount on either face
   of *any* fan — keeps the current fans and their known-good airflow, adds light on the
   face you choose. Also the fallback if reverse-blade fans in the right size/colour are
   not available.
4. **Swap the pairs:** RGB pair to the bezel side, plain pair inside. **Rejected** —
   the bezel inner wall is solid, so the RGB would be sealed inside a dark cavity: all
   cost, no light.
5. **Keep front-exhaust to preserve the current lit face. Rejected** — that is the
   0-intake configuration; it fails both stated operator goals (positive pressure, heat
   away from the desk) and starves a 314 W GPU. Aesthetics do not outrank the only
   fresh-air path in the chassis.

**Any new fan added under option 2 or 3 is its own change:** it lands on `FFAN2`/`FFAN3`
(pump stays `FAN1`, rad fans `LCFAN` + `TFAN/LCFAN2`, `FFAN1` stays the rear exhaust that
cleared `90B`), and RGB power for a non-HP fan goes to a standard 5 V ARGB source — never
12 V, and not through the M82868-001 hub's `LOGO` output.

## C.5 Net effect on the build plan

- **Nothing about the mounting changes.** The sandwich, hole pattern, bolt length,
  gasket and swarf gates in §1–§5 are unaffected by fan direction.
- **One extra step before final assembly:** flip the four fans in place, keeping the rad
  and hose end exactly where they are.
- **Decision needed:** window or no window, and single- or double-sided ring. Those two
  answers pick the RGB option by themselves.
- Gate unchanged: `etc/rad-cut-postdiag.block` tach receipt → Superposition 1080p Extreme
  + `dmon`, **PASS = GPU ≤ 81 °C / CPU ≤ 70 °C at fan % at-or-below the old case.**

## C.6 Sources

- Reverse-blade ARGB fans exist specifically so lighting stays visible while airflow runs
  the other way — Thermaltake CT120 Reverse ARGB Sync / CT120 EX Reverse ARGB product
  pages; multiple 120 mm reverse-blade ARGB 3-packs, retrieved 2026-09-02.
- Lighting-visibility-vs-airflow is a known build conflict; standard remedies are
  clear-blade/hub-lit fans, fans lit on both faces, or add-on ARGB frames
  (Phanteks Halos) — Tom's Hardware "Change Fan Direction" thread, retrieved 2026-09-02.
- Rig-specific: solid bezel inner wall and light bar working (`MASTER.md` caseSwap
  2026-08-30 CLOSED / 2026-09-02c), hose/tube-end orientation lock (ORIENTATION
  SUPERSESSION 2026-09-02), header map and 90B (`docs/case-swap-sff-triage.md` §5),
  5 V-only ARGB rule (`MASTER.md` caseSwap RGB path).
