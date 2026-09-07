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
| ✗ | Zip ties **through the fins**, "fan pins", double-sided tape alone | **Never.** Fin-piercing mounts saw through the core over time and the failure mode is coolant on a 3080. Ties used as a *clamp* around the panel, with the fans properly screwed to the rad, are a legitimate interim — **Appendix F (2026-09-05)**, which is the operator's actual live state. |
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

---

# Appendix D — Closed panel, 440 W, sealed metal box: the thermal plan (2026-09-02h)

**Operator, verbatim:** "rgb is only one face. which is fine i was thinking of buying new
fans anyway and it is a closed side panel, so we need really good thermals for it to work
in whats basically just a metal oven thats tightly packed"

## D.1 Two decisions fall out immediately

**1. Do not buy RGB fans for the radiator.** Closed side panel + solid bezel inner wall =
those four fans are **never seen** once the case is shut. RGB there is money spent on a
light inside a sealed box. The animated lighting the operator wants is already delivered
by the **light bar** (installed, working, `MASTER.md` 2026-08-30 CLOSED). The single-sided
ring question is therefore **moot** — the flip costs nothing, because nothing is visible
either way.

**Buy static pressure instead of colour.** Same budget, several °C.

**2. The "metal oven" framing is right in one way and wrong in another.** A closed box is
not an oven **if the flow-through is real**; it is an oven the moment intake CFM is
choked. The failure mode here is not the panel — it is the **orifice** (bezel perimeter
gaps). Everything below is ranked by how much CFM it buys per unit of effort.

## D.2 The number that decides everything

Air carries heat at a fixed rate. For a case in steady state:

```
ΔT (°C rise inside the case)  =  1.76 × Watts / CFM
```

(1 CFM of air ≈ 0.569 W per °C.) With the current load — GPU pinned **314 W** + CPU PL1
**125 W** + board/drives ≈ **~460 W**:

| Effective through-flow | Interior air rise over room | Verdict |
|---|---|---|
| 20 CFM | **+40 °C** | oven; thermal throttle guaranteed |
| 40 CFM | **+20 °C** | GPU inhales 41 °C air in a 21 °C room — fails the 81 °C gate |
| 60 CFM | +13.5 °C | marginal |
| 80 CFM | **+10 °C** | workable |
| 120 CFM | +6.7 °C | comfortable |

**Effective** is the operative word: not the fans' rated free-air CFM (4 × 60 = 240 CFM on
the box) but what actually gets through the bezel gaps, the rad, and out the back. A
restrictive intake can easily cut a 60 CFM fan to 20 CFM of real flow.

**So: the goal is ≥ 80 CFM of real through-flow, and the intake orifice is what caps it.**

## D.3 Levers, ranked by °C per unit of effort

**1. Open the intake orifice — the biggest lever by far, and currently the binding one.**
The bezel inner wall is solid; air enters only via perimeter clip-tab gaps. No fan can
out-muscle that: flow through an orifice goes as **√Δp**, so doubling fan pressure buys
only ~41 % more flow, while doubling the open area buys ~100 %. Options already on file:
the reversible **10–15 mm bezel standoff** (`MASTER.md` 2026-09-02b) is listed as the
"escalation lever if still starved" — **with a closed side panel and 460 W, promote it
from escalation to expected**. It is reversible, invisible from the front at the right
depth, and it is worth more than any fan purchase.

**2. Add a second exhaust — the second-biggest lever, and possibly free.** One rear
`FFAN1` cannot pass what four front fans push; the surplus stalls and recirculates. The
empty-chassis photo shows a **rear-top grinder opening** in addition to the front-middle
one. If that opening is not already occupied, a fan there (exhaust) roughly doubles the
outflow path and directly raises effective CFM. Hot air also *wants* to go there.

**3. Buy pressure-optimised fans, not airflow-optimised ones.** Through a rad **and** a
choked bezel, the spec that matters is **static pressure (mmH₂O)**, not free-air CFM.
Target **≥ 2.0 mmH₂O**, 4-pin PWM, and prefer the P-series/pressure variant where a
vendor sells both (e.g. Arctic **P**12 = pressure, **F**12 = flow). Four good pressure
fans at low RPM beat two loud ones — the push-pull doctrine already locked
(`MASTER.md` 2026-09-02c). Since nothing is visible, optimise price/performance/noise
only.

**4. Clear the corridor.** "Tightly packed" is itself a thermal setting. Cables crossing
the front-to-rear path, a drive cage in the stream, or the PSU intake facing a solid wall
each cost real CFM. Route every cable out of the corridor between the rad and the rear
fan, and confirm the PSU (top-back) has an unobstructed intake — the operator's own
flagged open item (`docs/case-swap-sff-triage.md` §10).

**5. Remove watts instead of moving air — the lever unique to this rig, and it is
already proven.** The OC campaign measured it: at the **95 % knee (304 W)** the card
scored **8576–8599 vs 8717 stock (−1.6 %)** at **79–80 °C**, and at **90 % (288 W)** it
scored 8447 (−3.1 %) at **77 °C** — 3–4 °C cooler than stock for ~1–3 % score. In a
sealed box, **16–32 W removed at the source is worth more than the same watts fought with
airflow**, and it costs a percent of a benchmark nobody watches. Same logic for the CPU:
PL1 is writable (MSR 0x610, lock bit 0) and it is a power-limited KF. The daily profile
candidate `cp90-m400-pl95` is now also the *thermal* answer, not just the efficiency one.

**6. The spare non-RGB fan as a VRM/CPU spot fan** (Step 3, already accepted) stays
worth it: in a packed box the dead zone around the VRM has no natural flow.

## D.4 Fan shopping spec (nothing visible, so buy performance)

- **Size/count:** 4 × 120 mm for the rad sandwich (+1 if the rear-top opening gets a
  second exhaust). Reuse the existing rear `FFAN1` fan and the spare non-RGB for the spot
  duty.
- **Static pressure:** ≥ 2.0 mmH₂O; ≥ 2.5 preferred given the double restriction.
- **PWM 4-pin**, so the fan curve can idle them quietly and only ramp under load.
- **Noise:** with 4 fans on a rad, low-RPM-high-count is the quiet configuration; a fan
  that hits its pressure spec at lower RPM is worth paying for.
- **Class examples** (price ladder, all pressure-oriented): Arctic P12 / P12 Max at the
  value end; be quiet! Silent Wings, Noctua NF-A12x25, Phanteks T30 at the premium end.
  Verify the current spec sheet at purchase time — this is a class recommendation, not a
  benchmarked receipt.
- **Skip ARGB entirely** unless a fan happens to be cheaper with it.

## D.5 Headers — the count now binds

Available: `FAN1` (pump), `LCFAN`, `TFAN/LCFAN2` (rad pair), `FFAN1` (rear exhaust),
`FFAN2`, `FFAN3`. That is the pump + **5** fan headers, and the EC's `90B` check watches
the named ones.

Planned fans: 2 push + 2 pull + rear + (optional second exhaust) + VRM spot = **6–7**.
So **1–2 Y-splitters** are needed. Rule unchanged: splitters are allowed on the
**non-watched pairs only** (the pull pair, the spot fan) — **never on the pump**, and
`FFAN1` keeps a real fan with a real tach because that is the header that cleared `90B`.

## D.6 How this gets proven

Unchanged, and it is now doing double duty as the fan-purchase verdict:

1. `etc/rad-cut-postdiag.block` root paste-back — tach receipt first, no exceptions.
2. Superposition 1080p Extreme + `dmon`: **PASS = GPU ≤ 81 °C and CPU ≤ 70 °C at fan %
   at-or-below the old case.**
3. If it fails, the ladder is already ranked: bezel standoff → second exhaust →
   power-trim to the 304 W knee → (last) front-rad-to-exhaust, which remains rejected
   while it is the only intake.

The pre-cut **9079** Superposition result was recorded in this chassis before the rad
opening existed and does not represent the final airflow — it is a reference point, not
the baseline.

## D.7 Sources

- Sensible-heat relation ΔT = 1.76 × W / CFM (air ≈ 0.569 W per CFM per °C) — standard
  psychrometrics, computed here from ρ = 1.2 kg/m³ and cp = 1005 J/kg·K.
- Orifice-limited flow scales as √Δp (hence area beats fan pressure) — the
  already-recorded doctrine in `MASTER.md` caseSwap 2026-09-02c.
- Pressure-vs-airflow fan naming (Arctic P = pressure, F = flow) — PC airflow guides,
  retrieved 2026-09-02.
- GPU power/score/temperature tiers 320 W→8635 @ 80 °C, 304 W→8576/8599 @ 79–80 °C,
  288 W→8447 @ 77 °C, stock 8717; CPU PL1 125 W / PL2 241 W, MSR 0x610 lock bit 0 —
  `MASTER.md` durableFacts.gpu / durableFacts.cpu, `receipts/gpu-oc-receipts.json`.
- Bezel standoff as the reversible escalation lever, solid bezel inner wall, rear-top and
  front-middle grinder openings, PSU intake open item — `MASTER.md` caseSwap
  2026-09-02/b/c, `docs/case-swap-sff-triage.md` §10.

---

# Appendix E — The riser kit is the one thing that can break this build (2026-09-02i)

**Operator, verbatim:** "the rear is gonna have an exhaust, and theres an extra rgb fan
with non working rgb for vrm's. as for the fan purchase, thats up to me, im buying them
alongside a riser kit solely for aesthetics because sometimes i take the side panel off
to look at my cool pc, which is why the lightbar is there too. though i still want to
optimize for the case being closed, since that's the extremity of encapsulating the
airlfow"

## E.1 Settled, no further discussion

- **Rear exhaust: confirmed.** `FFAN1` keeps its real fan and real tach (the header that
  cleared `90B`).
- **VRM spot fan: confirmed** — the spare RGB fan with dead lighting. Dead RGB is
  irrelevant for that role; it is buried at the VRM.
- **Fan purchase: operator's call.** Noted and respected. Appendix D's pressure spec
  (≥ 2.0 mmH₂O, 4-pin PWM) stands as information, not as a gate. The panel-off viewing
  habit makes RGB on the rad a legitimate purchase reason after all — Appendix D.1's
  "never seen" argument is **narrowed**: they are unseen *while closed*, which is most of
  the time, but not always. Buying lit fans is not a mistake, it is a preference with a
  known cost of zero thermal impact.
- **Design target: closed-panel worst case.** Correct instinct, and it is the right one to
  optimise for — a build tuned for panel-off is a build that throttles when shut.

## E.2 The riser kit is NOT in the same category, and it needs a receipt before purchase

A vertical GPU mount is not a cosmetic change in this chassis; it is a **thermal change,
and specifically the one that attacks the component this build is already tightest on**.

The measured relationship, from multiple independent sources:

| GPU-fan-to-panel clearance | Solid panel | Mesh/open panel |
|---|---|---|
| 10–15 mm | **+5 to +15 °C**, throttling risk | — |
| ~20 mm | still a meaningful delta | near-neutral at 20 mm+ |
| 25–30 mm+ | borderline acceptable, still warmer | neutral |
| Panel off | no penalty | no penalty |

Community and reviewer testing puts common cases at **+7 to +13 °C** (one LTT-forum
report: 67 °C horizontal → 75 °C vertical on a 2080, same game) and notes GPU output
losses of **3–8 %** once throttling starts.

**Why that number is fatal here, specifically:**

- The 3080 already runs **80–81 °C** at the 314 W pin in the *old, roomier* chassis
  (`MASTER.md` durableFacts.gpu). The stop rule is **83 °C** and the new-case PASS gate
  is **≤ 81 °C**.
- **80 °C + even the mildest vertical penalty (+5 °C) = 85 °C = past the stop rule
  before the case is even closed.** The +10 to +15 °C end of the range is not a
  discussion; it is a throttling machine.
- This is an **older SFF case with a solid side panel**. Vertical mounting is *only*
  neutral with mesh at 20 mm+ or with an open bench. Neither applies.
- The GPU is currently the **only** component being fed directly by the front intake
  corridor; vertical mounting rotates the card into the intake path *and* faces its fans
  at a sealed steel wall.

**Verdict: as an unqualified purchase, the riser is REJECTED for closed-panel operation.
As a qualified one, it has exactly one gate — clearance.**

## E.3 The clearance gate — measure before you buy

Vertical mounting is defensible **if and only if** the measured distance from the
**GPU fan intake face to the inside of the closed side panel is ≥ 25–30 mm**, and better
still if the panel can be vented in that zone.

Measure now, with nothing bought:

1. Hold the 3080 in the intended vertical position (or lay a straightedge where the card
   would sit — riser brackets typically place the card **40–60 mm** off the motherboard
   plane, i.e. much closer to the panel than a slotted card).
2. Measure fan-face to panel-inside. Write the number down.
3. **≥ 30 mm** → proceed, expect a small penalty, prove it at the gate.
   **20–30 mm** → proceed only if you accept a likely 81 °C+ result and a power-trim to
   compensate. **< 20 mm with a solid panel** → do not buy the riser for closed use.

**A note on the card's thickness:** a 3080 is typically 2.2–2.7 slots (~50–60 mm). In an
SFF chassis the vertical position frequently leaves **10–20 mm**, which is the failing
band. That is why this needs a tape measure, not an opinion.

## E.4 If the clearance fails but the riser is still wanted

Ranked, all compatible with "closed panel is the design target":

1. **Buy the riser, run it panel-off only** — mount vertically when the machine is on
   display, and accept that closed operation stays horizontal. Costs a five-minute swap,
   and the riser is not wasted.
2. **Vent the side panel in the GPU zone.** The grinder is already in the toolkit and the
   panel is already a modified part. Mesh or a hole field opposite the GPU fans converts
   the "solid panel + vertical" worst case into the "mesh panel + vertical" near-neutral
   case. Same irreversibility rule: measure, mark, cut off the machine, full swarf
   protocol.
3. **Pre-compensate with the power trim.** Running the daily profile at the **304 W knee**
   costs 1.6 % of the score and returns ~1–2 °C, and **288 W** returns ~4 °C for 3.1 %
   (`receipts/gpu-oc-receipts.json`). That is a real, already-proven lever — but it buys
   less than the vertical penalty costs at < 20 mm, so it is a supplement, not a fix.
4. **Skip the riser.** Horizontal keeps the card in the intake corridor and keeps the
   81 °C gate reachable. The light bar plus lit rad fans already deliver the panel-off
   show.

## E.5 Header budget — now final

| Header | Fan | Tach watched |
|---|---|---|
| `FAN1` | pump | yes (90B) |
| `LCFAN` | rad fan | yes |
| `TFAN`/`LCFAN2` | rad fan | yes |
| `FFAN1` | **rear exhaust** | yes (cleared 90B) |
| `FFAN2` | rad pull fan | — |
| `FFAN3` | **VRM spot fan** (dead-RGB spare) | — |

Fans to connect: 4 rad + 1 rear + 1 VRM = **6**. Headers available: 6 (incl. pump) = 5 for
fans. **One Y-splitter is required**, and it goes on the **second rad pull fan** paired
with `FFAN2` — a non-watched position. **Never split the pump.** If a second rear-top
exhaust is added later, it splits with the VRM spot fan on `FFAN3`.

## E.6 What is now gating the build

1. **Measure the vertical clearance** (E.3) — decides the riser purchase, and it is the
   only open question that can invalidate the thermal plan.
2. Rad mounting proceeds regardless (§1–§5); fan direction flip-in-place (Appendix C.2);
   bezel standoff promoted to expected (Appendix D.3).
3. Gate unchanged: `etc/rad-cut-postdiag.block` tach receipt → Superposition 1080p Extreme
   + `dmon`, **PASS = GPU ≤ 81 °C / CPU ≤ 70 °C at fan % at-or-below the old case** —
   and if the riser is fitted, that gate is run **with the side panel closed**, because
   closed is the stated design target.

## E.7 Sources

- Vertical GPU clearance/temperature relationship: 10–15 mm solid panel = +5–15 °C and
  throttling risk; 20 mm+ with mesh = near-neutral; 25–30 mm+ recommended minimum;
  3–8 % performance loss once throttling — vertical GPU mount guide, retrieved
  2026-09-02.
- Corsair: vertical mounting "will usually have a negative impact on GPU temps… typically
  done purely for aesthetic reasons"; the deciding variable is fan-to-panel proximity —
  retrieved 2026-09-02.
- Field measurement 67 °C horizontal → 75 °C vertical (RTX 2080, same workload) —
  Linus Tech Tips forum thread, retrieved 2026-09-02.
- This rig: 3080 pinned 314 W at 80–81 °C, 83 °C stop rule, 304 W→79–80 °C and
  288 W→77 °C tiers, 81 °C PASS gate — `MASTER.md` durableFacts.gpu / caseSwap,
  `receipts/gpu-oc-receipts.json`.

---

# Appendix F — The zip-tie reality: the case is an APEX PC-389-C and there is no drill (2026-09-05)

**Operator, verbatim:** "aio is not mounted right since its using zipties to mount to the front
as there are no screw holes for it or screws long enough nor are there tools necessary for
drilling screw holes" and "an important note about the case is that its an apex pc389. which was
in the previous chat".

The case identity was missing from this repo (the chat that established it was never committed)
and is now recorded: **APEX PC-389-C** — ATX mid tower, thin steel, 444 x 184 x 406 mm,
**top-mounted PSU**, 3 x external 5.25" + 2 x external 3.5" + 4-5 x internal hidden 3.5" bays,
90 mm rear + 80 mm front fan positions, **explicitly not tool-less** (Newegg N82E16811154095 /
apextechusa pID=119, retrieved 2026-09-05). It has no 120 mm front fan mount at all, which is
why the front-middle opening had to be cut, and why §1's "make the holes" plan met a case with
no rad holes and a toolbox with no drill.

## F.1 Verdict: ties are an acceptable *clamp*, never a *cantilever*, and never the hose anchor

Three separate failure modes have to be separated, because the phrase "not mounted right" is
covering all three:

| Mode | Mechanism | Status |
|---|---|---|
| **Load through the fins** | tie or pin bears on the corrugated fin pack; saws a channel; coolant into the case | **Never.** Unchanged from §0. |
| **Cantilever on ties** | rad + 4 fans (~1.9 kg) hangs from nylon at one face only, so the stack pivots, the ties creep, and the raw ground edge of the grinder cut saws the ties | **Rejected as permanent.** Tolerable as interim under F.2. |
| **Tension into the pump block** | the rad moves, the hoses pull, the block tilts on the IHS | **This one is not cosmetic.** Uneven/excessive LGA1700 mounting pressure flexes the PCB around the socket and disturbs **memory-controller pin contact** — documented as "not booting / memory channels not working" (Gamers Nexus LGA1700 ILM work; DRAM-light guides), and an HP desktop owner's 3-long-2-short was cleared by reseating the cooler (`docs/case-swap-3-2-beep.md` §1-2). This is the one live path by which a bad rad mount could be part of a POST failure. |

Static strength is not the question: 8 ties x ~22 kg loop tensile (9 mm UV-black nylon) is an
order of magnitude over 1.9 kg. **Nylon creep against a warm rad, and abrasion at a cut edge,
are the questions.**

## F.2 Zip-tie mount, done correctly (the version that is allowed to run while the POST block is open)

The trick is that **the rad is not tied at all** — the fans are bolted to the rad with the rad's
own short screws (the ones that came with the HP M82880-002; short screws are the part this
build has), and then the *finished sandwich* is lashed to the panel. The ties then carry only
stack-to-panel clamp force, and the load path is fan frame → rad frame, exactly as designed.

1. **Bolt all four fans to the rad first**, diagonally, snug not forced. Push pair on the
   bezel side, RGB pull pair inside (Appendix A/B/C direction, all four outlets facing into the
   case). Weight is now held by threads, not by nylon.
2. **Tie spec:** 9 mm (0.30 in) wide, UV-black, self-locking head, min 300 mm long, **8 ties** —
   two per fan-corner cluster, laced so each corner of the panel is pinched between tie pairs
   (a single tie per corner can roll; a crossed pair cannot).
3. **Never a tie inside the blade circle.** Path = through the outermost corner holes of the fan
   frames (the four-hole corners, not the centre), around the back of the panel.
4. **Protect the cut edge:** every tie that crosses the grinder edge gets a wear sleeve — a fold
   of EPDM/foam, a slit piece of old bezel plastic, or a rubber grommet. Deburr first; a raw edge
   is a saw waiting for 200 hours of vibration.
5. **Cut tails flush, heads tucked to the non-blade side, and tape the cut ends** so a stray tail
   cannot wander into a fan.
6. **Hose rule (the POST-relevant one):** with the ties fully slack, the stack must hang on its
   hoses at zero tension — i.e. the block carries **no** rad load. Then set the ties snug, not
   crushing. Leave a service loop so the block sees pure axial clamping. Re-check the block after:
   flat, no rock, all four fasteners snug in a diagonal pattern.
7. **Perimeter gasket stays part of the plan** (foam strip rad-to-panel): a floppy mount is also
   an air-leak mount, and this chassis is orifice-limited (Appendix D.2).
8. **Re-inspection schedule while it is the live mount:** 24 h (warm-settled creep), then weekly
   for a month. Any gloss on the ties near an edge = that tie is cut and the mount is down.

## F.3 The permanent, still zero-drill fix (two real options, neither needs a drill)

| | Option | What it costs | Why it is safe to run closed-panel |
|---|---|---|---|
| **1** | **Buy the two missing parts, not the tool.** A universal 240 mm rad bracket that bolts to **existing** case holes (Bykski B-ST-2FN-V2 class, or a 5.25"-bay-mounted rad bracket), plus a **6-32 x 1 1/4 in (32 mm) radiator screw pack** (and M4 if the thread check says M4). | ~$24 + ~$8, mail order | This is §1's method-1 sandwich with the "no holes / no long screws" problem solved by a $8 pack of screws instead of a drill — the long bolt is a consumable, the drill is the thing we do not own. Bracket uses the drive-column holes that already exist in this case (§0 above; see also `docs/case-swap-hdd-mount.md` rank 1, which spends the same holes). |
| **2** | **Slotted-angle frame** (41 mm Unistrut/eurostrut x 2 short lengths + strut/spring nuts + M5 bolts + washers): the angle's slots take both the case-side bolts and the rad's fan bolts, so **no hole is ever made in anything**; slots give 13 mm of alignment freedom. | ~$10 of hardware, grinder only | Same geometry as §2's aluminium-angle fallback, minus the drilling. Cut the angle with the grinder that already cut the panel, deburr, and keep the frame clear of the intake orifice. |
| ✗ | Rivnuts in the panel, or drilling the panel per §1.5 | — | Both need a drill. Off the table while the tool inventory is what it is. |

**Neither option is this week's job.** The POST block (`docs/case-swap-3-2-beep.md`) gates
everything, and the standing rule is one physical change per power-on — the rad is currently
mounted, whatever its flaws, and it stays exactly as it is until the machine boots and the tach
receipt is read.

## F.4 Gate (unchanged, restated so it cannot be skipped)

1. Fix the **tension** path now (F.2 step 6) — it is free, and it is the only rad-mount item with
   a plausible link to the beeps.
2. Then, and only then, the ladder in `docs/case-swap-3-2-beep.md` §3.
3. First power-on stays **side panel off**, listening for fan scrape (hand-spin all four first).
4. Then `etc/rad-cut-postdiag.block` FULL paste-back before any bench; then the new-case thermal
   baseline gate (Superposition 1080p Extreme + dmon, PASS = GPU <= 81 C / CPU <= 70 C at fan %
   at-or-below the old case).
