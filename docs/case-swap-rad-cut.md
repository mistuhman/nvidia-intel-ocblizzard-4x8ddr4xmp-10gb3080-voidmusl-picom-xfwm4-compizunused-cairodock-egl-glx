# SFF rad-opening cut — plan review + protocol (2026-09-01)

**Operator message, verbatim:** "i dont have a c clamp but i can just counter it with my
strength. and the top of the tape line is just above bare minimum for the rad and more
than enough for 2 fans so ill saw only a bit above it. and thats the absolute length i
can saw since the shape transforms"

Reading: a panel opening in the new SFF case for the M82880-002 LCS 240 radiator + its
two 120 mm fans. The tape line marks the cut; the panel's formed/curved section beyond
it ("the shape transforms") caps the maximum cut length. This rig runs a ZFS root, a
3080, four SATA drives and an improvised 2-pin `PB` adapter — all of which a panel cut
can damage if done carelessly. Material removal has NO inverse: this document exists to
keep the one irreversible step of the case swap careful.

## 0. Demand list and verdicts

| # | Operator statement | Verdict |
|---|---|---|
| 1 | No C-clamp; will counter the workpiece with hand strength | **REJECTED as a plan** — not because of strength, rigidity. A hand is a spring, not a clamp: the panel stores each stroke and slaps back, the saw grabs, the line wanders, and the last third of the cut (thin, flexible offcut) is exactly where it snatches. Hands near a blade + a fresh sheet edge is the classic laceration pair. Use a substitute below — none require buying a clamp. |
| 2 | Tape-line top = just above bare minimum for the rad, more than enough for 2 fans | **Consistent with the hardware.** Nominal 240-class rads are 275–278 mm overall *including end tanks*; two 120 mm fans need only ~240 mm of frame. The rad IS the binding length. But "bare minimum" means the margin is already spent — see §1 before cutting. |
| 3 | Will saw "only a bit above" the tape line | **Right instinct, under-sized bit.** Cut **3–5 mm proud**, file back to the line. Budget: saw kerf 1–1.5 mm + blade wander 1–2 mm over a long freehand cut + file/deburr 1–3 mm. 1–2 mm of margin does not survive finishing. |
| 4 | That is the absolute sawable length; the shape transforms beyond it | **ACCEPTED as a hard limit.** A rolled/formed edge cannot be tracked cleanly and is usually structural. Consequence: the *panel* stops being the adjustable — the *rad position* becomes it (§2). |

## 1. Measure before the first stroke

- **Measure the actual M82880-002 rad with the tape**, not a nominal number: overall
  length including BOTH end tanks, width, thickness. Nominal 240 rads run 275–278 mm —
  a 3 mm difference is the whole margin here.
- **The hose end needs more than the tank face.** Fittings + the first hose bend want
  roughly 30–40 mm past the end tank. With a capped cut length, orient the rad so the
  **hose end faces the roomier side** of the opening. The fan-only end needs nothing
  extra.
- **Leave mounting flange.** 120 mm fans mount on 105 × 105 mm hole spacing. The
  opening must stay inside the fan footprint so ≥8–10 mm of flat panel remains around
  it for screw holes and a gasket seal — do not cut the flange away chasing rad length.
- **If the opening is only an airflow path** (rad mounts inside, panel is just a vent),
  it does not need rad length at all — the fans' swept area (~2 × 110 mm circles) is
  the effective requirement. Only if the rad itself must pass through the opening is
  the full envelope binding. Confirm which case this is before sawing.
- **Check the saw frame clears the curve.** Before cutting, dry-run the saw along the
  full line and confirm the frame does not hit the transformed section near the end.
  Plan where the stroke ends; finish the last few mm by file, not by forcing the blade.

## 2. Work-holding without a C-clamp (ranked, none require buying anything)

1. **Screws through existing holes into a scrap board.** Case panels have vent/fan
   hole patterns. Wood screws through 2–4 existing holes into a plank/plywood make the
   panel dead rigid — better than a C-clamp, which only grips one edge.
2. **A straight batten as a saw guide.** Screw a straight wood strip exactly along the
   cut line so the blade rides against it. Kills chatter AND makes the cut straighter
   than any taped line.
3. **Board sandwich + body weight.** Panel flat on scrap wood, second board ON the
   panel just behind the line, kneel on it. Weight along a line beats two hand points
   and keeps both hands off the blade path.
4. **Zip ties through the holes** to a table leg or bench frame — fast, adequate.
5. **If the panel stays on the case:** the case is the clamp. Non-slip mat under it,
   panel horizontal, kneel/weight the case, cut low and slow. Support BOTH sides of
   the cut line — an overhanging offcut is what chatters.
6. Never grip the offcut, never hold work between knees, never saw toward any hand.

## 3. Saw technique

- Fine tooth for sheet steel: hacksaw 24–32 TPI, or jigsaw with a bi-metal blade
  (≥21 TPI) at its slowest speed. An oscillating multi-tool with a metal blade is the
  gentlest option if the panel is cut in place (least vibration into the case).
- **A fresh blade.** Dull blades grab and jump — that exact mechanism is what turns
  "I'll hold it" into an injury.
- Light strokes, let the blade's own weight cut. Force = wander + grab.
- The painter's tape already on the panel protects paint and stops the blade skating —
  cut on the waste side of the line, finish with the file.
- Jigsaw: burrs form on the top face (upstroke) — put the show face down, tape under
  the shoe. A drop of oil/wax on the line helps everything.
- PPE: safety glasses (metal slivers), gloves for *handling and filing* the cut panel,
  not while sawing near the blade.

## 4. The electrical gate — swarf kills this specific rig

Steel filings are conductive. One shaving across the motherboard, the GPU PCB, or into
the PSU is an instant short — and this machine's silent-failure mode is ZFS corruption,
not just a crash.

- **Best: cut the panel off the case** (or strip the case). If sawing in place:
- **Cord out, hold the case button 20–30 s** — this PSU has no rocker switch, cord-out
  is the only isolation.
- Bag or cloth-tape over the GPU, motherboard, PSU intake, and the four SATA drives'
  connectors before the first stroke.
- After cutting: vacuum, then blow, then inspect with a light from several angles —
  the PSU intake and the GPU backplate are where filings hide. Check inside the panel
  lip. Do not power on until this is done.
- **Deburr the full edge** (file tilted ~45° both faces, then 150–220 grit). A raw
  sawn edge will saw through fan wires, rad hoses, and fingers over time. If a wire or
  hose can ever touch the edge, tape it or fit edge trim.

## 5. Vibration recheck — the saw shakes exactly the old suspects

The August lesson: when a fault gets worse during work, suspect the work. Sawing the
case transmits shock into every connector that was on the fault list. Before power-on,
re-verify:

1. The **improvised 2-pin `PB` adapter** (runner-up suspect E1/C4) — not pinched, not
   shaken off its splice.
2. Both **4-pin CPU sockets** (top-left corner — worst case for transmitted shock).
3. 24-pin `SPWR`, both GPU 6+2.
4. Four **SATA data** cables (a walked cable = a "missing" drive on next boot, and
   sd-letter renaming on this rig).
5. **CR2032** seated flat (bottom edge) — a knocked cell plus this board's history of
   CMOS resets is a confusing combination for free.

## 6. Orientation, headers, first power-on

- **Rad above pump:** the rad's top edge must stay above the CPU block. SFF cases make
  it easy to mount the rad low; if the pump becomes the loop's high point it gurgues,
  then cooks the CPU. Hoses not kinked by the cut edge.
- **Headers stay as they were:** pump `FAN1`, rad fans `LCFAN` + `TFAN/LCFAN2`. Any
  header left empty re-raises the `90B` prompt. If NEW fans are added at this opening,
  they go to `FFAN1`/`FFAN2`/`FFAN3` — remember `FFAN1` is the one that cleared 90B
  before.
- **Hand-spin both fans with power off** — confirm no contact with the cut edge, screw
  heads, or panel tabs.
- **One physical change per power-on.** The cut + remount is the one change; no other
  cable/route/fan changes in the same power-on.
- **Post-cut gate:** boot Void, run `etc/rad-cut-postdiag.block` (root, read-only),
  paste the FULL output back. No Superposition / Geekbench / any stress until that
  tach receipt is read — cooling is proven by tach data, not by the block feeling snug.
  The 9079 Superposition result is only valid on top of a proven-fan baseline.

## Sources

- Nominal 240 rad envelope 275–278 mm overall incl. tanks, 105 mm hole spacing:
  Shott RAD240C spec (275 × 121 × 28 mm, holes 105 mm); Corsair XR7 240 V2 spec
  (278 × 120 mm) — retrieved 2026-09-01. The actual M82880-002 is measured with a
  tape on the bench, not from these.
- Header map, PSU no-rocker isolation, 90B behavior, PB adapter status, one-change
  rule: `docs/case-swap-sff-triage.md`, `docs/omen-reassembly-checklist.md`,
  `MASTER.md` durableFacts.
