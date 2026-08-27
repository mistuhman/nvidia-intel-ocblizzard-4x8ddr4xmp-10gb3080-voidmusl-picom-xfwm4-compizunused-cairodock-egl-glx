# Open search classes — pass 3 (2026-08-27, session 01a0416e)

New-chat work per `interactionModel.crisisDiscipline.onHalt` ("a new chat reads README,
MASTER, stall-check, hardware-retrospective, then searches a NEW class"). Operator
directive for this pass: *"deploy web scraper tools and agents to not just explore hp
articles but rather every possible mention."*

**Zero OMEN contact in this pass. No power-on, no jumper, no cable, no USB permutation.**
Cord out, cap on the left pair. `node tools/stall-check.ts` = `HALT_NEW_CHAT`; the halt
line was printed before any work.

Sandbox transport note (unchanged from pass 2): direct `fetch()` from the agent sandbox to
`h30434.www3.hp.com`, `support.hp.com`, `cpumedics.com`, `pcmag.com` fails
(`TypeError: fetch failed`, filtered TLS), so `tools/web-scrape.ts` could not hash these
bodies. Sources below were read with the agent web-fetch/search tooling and are cited by
URL + quoted text. Absence of a hash is a transport limit, not a weaker claim about the
quote.

---

## What this pass was hunting

Every previously named class was closed **as a class**: 3-pin blue-cap jumper (CMOS *and*
FDO/PSWD/BBR), USB recovery media + Win+V/Win+B/plain power, front-panel `PB` isolation,
zero-DIMM / minimal bench / CR2032, pump/0-RPM, UPS-vs-wall. Pass 2 additionally
literature-closed `HpBiosUpdate.efi` (it is a normal EFI app; it needs POST) and found no
board-specific recovery path in vendor literature.

So the only useful question left is **not** "which firmware ritual next" but
**"is the instant cycle even a firmware event at all, and which physical branch trips it?"**
The searched-for object was a *new discriminator class that is free, needs no instrument,
and whose two outcomes split live hypotheses.* That class was found. It is
**PSU-side load isolation**, and it was unlocked by finally resolving the pinout conflict
that pass 2 had to leave open.

---

## Class 3 (45L PSU / EPS pinout) — now CLOSED, resolved in favour of standard ATX

Pass 2 recorded an unresolved conflict: an HP Community expert said the 45L is a standard
ATX PSU, a Super User answer on BlizzardOC warned the CPU 4-pin *may not* be ATX-standard
("HP is notorious for non-standard power-supplies… I wouldn't plug in anything").
Three independent receipts now settle it:

1. **HP employee accepted solution, OMEN 45L GT22-0000i** —
   `h30434.www3.hp.com/t5/Gaming-Desktops/OMEN-45L-GT22-0959nz-PSU-upgrade/td-p/9323368`
   (thread 9323368, accepted answer 9330242, HP agent zoey7886, 2025-03-03):
   *"The HP motherboard uses two 4-pin EPS connectors for the CPU. Since your new PSU
   provides 8-pin CPU power cables that can be split into 4-pins, you should be able to use
   two of those split 4-pin connectors to match the existing setup."*
   The thread author (same board family as ours) then reports:
   *"I took 2 8-pin EPS, split both of them and used 1 4-pin connector from each 8-pin
   cable. System is up and running 😀"* — a **retail MSI MPG A1000G ran this board**.
2. **The factory PSU is a catalogued standard-ATX Cooler Master OEM unit.**
   `M19770-003` / `M19770-013`, 800 W 80+ Gold, 155 × 87 × 150 mm, listed connectors:
   *(1) 24-pin ATX, (2) +12V 4-pin, (3) SATA, (2) 6+2 PCIe*, rails
   `+5V 18A / +3.3V 12A / +12V1 60A / +5.08Vsb 4A`
   (cpumedics M19770-013 page; eBay listing 335497780463 lists the same unit as
   "ATX / 24 Pin / 4+4 CPU / 6+2 PCIe").
3. **HP's own OMEN PSU guidance** (`hp.com/us-en/shop/tech-takes/omen-desktop-power-supply-upgrade-guide`,
   `…/how-to-choose-best-psu-omen-gaming-pc`): 35L/45L "featuring standard ATX mounting
   points"; motherboard power = "24-pin ATX connector, plus 4-pin or 8-pin CPU power".

**Consequence:** the 24-pin on this machine is a standard ATX 24-pin with a normal
`PS_ON#` (pin 16, green) and `COM` (pin 17, black). That makes the classic
**PSU jump/paperclip test** applicable to this rig — a free, instrument-free test that
pass 2 had to refuse for lack of a pinout receipt. The Super User warning is now
superseded by an HP-employee answer plus a working third-party-PSU install on the same
board family; it was a caution, not a measurement.

Safety gate kept: the operator must *see* a green wire in the expected position before
bridging anything. If the 24-pin has no green wire where the standard puts it, stop.

---

## The NEW class: PSU-side load isolation (never tested on this machine)

Everything closed so far isolated **board-side** devices (DIMMs, GPU, `PB` header, CMOS).
Nothing has ever isolated the **PSU-side branches**. That matters on this exact chassis:

- **PCMag, HP OMEN 45L ATX case review** (`pcmag.com/reviews/hp-omen-45l-atx-pc-case`):
  the case's lighting controller "is **powered by a SATA power cable**, its SATA-style data
  connector is completely undocumented", and HP's own documentation of the power-LED header
  polarity is wrong — *"HP tells us that this arrow marks the positive connector… We
  followed HP's instructions, found the RGB controller unresponsive, and reversed the
  connector to fix the problem."*
- **HP Community 9614053 (GT21/GT22 lighting control board)**: the board is fed from the
  factory PSU through a Cooler Master **"P8"** connector; owners fitting a retail PSU find
  no matching cable and simply **leave the controller unpowered** — *"I am running the PC
  ok without powering the controller for now."*
  So: this chassis has at least one undocumented, mis-documented, PSU-fed accessory board,
  and it is *known to be safely removable*.
- A shorted PSU-side branch produces exactly our symptom shape. Receipt:
  r/buildapc `13zikwd` — everything stripped to board + CPU, still "two clicks and turning
  off"; the same PSU booted a different machine fine; the culprit was a **SATA power
  cable/branch** — *"As a last resort I removed the SATA power from both drives and… it just
  booted. Wanted to see if it wasn't a fluke, so I connected the SATA power once more —
  again two clicks and turning off."*
- Behaviour change with **CPU power removed** is an accepted discriminator, not folklore:
  Tom's Hardware 3504431 (*"pc does not do boot looping when I unplug cpu power cable"*),
  Tom's Hardware 3439523 (*"pc only starts when cpu power cable is unplugged"* → answered as
  board/CPU fault), AnandTech 2611287 (*"stuff will try to boot if you don't connect any cpu
  power 8 pins… plugging the 8pins back reverts to old behavior"*).

### Why this class is new, not a relabel

| Closed class | Why the ladder is not it |
|---|---|
| minimal bench / zero-DIMM | removed *board-attached* parts; the PSU still fed the lighting board, fans, pump, drives, and the board's own 12V rails |
| `PB` front-panel isolation | tested who *requests* power; not what *trips* it |
| jumper (CMOS / FDO-PSWD-BBR) | changes a firmware setting; L3 below tests whether firmware is even involved |
| USB media + hotkeys | needs a POSTing board; irrelevant pre-memory-init |

### The ladder (operator-gated, one step per report, free, no instrument, no purchase)

**L0 — no power at all.** Photograph the PSU label (expect `M19770-0xx`, 800 W) and
photograph the PSU cable fan-out: which cables leave the PSU and what each one feeds
(board 24-pin, two 4-pin EPS, GPU 6+2 ×2, SATA chain, lighting/P8 board, fan/pump feeds).
Pure receipt. Nothing is moved.

**L1 — PSU alone (jump test).** PSU disconnected from *everything* (board, GPU, drives,
lighting board, fans). Optional dummy load: one case fan on a SATA/Molex lead. Bridge
24-pin **pin 16 green → pin 17 black** with a bare paperclip, then plug the cord.
- *Stays running ≥30 s* → the PSU can hold its rails; the trip is **downstream**. Go L2.
- *No spin, or spins and cuts repeatedly* → the **PSU itself latches**. That is the answer;
  and per the receipts above this chassis accepts any standard ATX unit, so it is a
  known-good-part question, not a firmware question.

**L2 — board only, every accessory off the PSU.** Reconnect **only** the 24-pin and the two
4-pin EPS. Nothing else on the PSU: no GPU, no drives, no lighting/P8 board, no fan hub, no
pump, no front-panel USB/audio headers on the board. One power-on.
- *Cycle stops* (fans keep running; **no display is expected** — the 12700**KF** has no iGPU
  and the GPU is out) → the fault is in **one accessory branch**; re-add one branch per
  power-on until it returns.
- *Identical instant cycle* → the fault is in the board/CPU/PSU core path. Go L3.

**L3 — EPS off (the decisive one).** From the L2 state, unplug **both** 4-pin EPS. One
power-on.
- *Board now stays powered* (fans spin, obviously no POST) → the trip lives on the **CPU
  12 V / VRM path**. No jumper, BIOS image, recovery stick or EFI flasher can address that.
- *Still the same instant cycle with the CPU completely unpowered* → the trip is on the
  24-pin / 5VSB side or is PSU protection. This also **kills Mechanism A**: firmware cannot
  order a shutdown when the CPU has no power, so a corrupted SPI setup varstore was never
  the cause, and every jumper/USB/flash class was doomed for a reason unrelated to
  technique.

Either L3 outcome is the first thing in this whole campaign that would *close the cause*
rather than close another ritual. Neither outcome is promised to make it POST — say that
plainly. **Light-the-USB requires POST**; if L3 shows an electrical trip, the stick will
never blink no matter what media is written.

---

## Also searched this pass (no new class, recorded so it is not re-searched)

- **HP's own desktop BIOS-recovery ladder is exhausted.** `support.hp.com` doc
  `ish_3966820-3438449-16` ("HP Desktop PCs - Recovering the BIOS") lists exactly:
  EC reset (cord out 5 s, replug, power on), CMOS reset (model-specific, else generic:
  battery out, hold power ≥60 s, replug, **hold power 20 s**), automatic BIOS recovery, key
  press combination, 4-in-1 USB key, USB recovery drive. Every entry is an already-closed
  class on this machine. The doc also states PCs **with HP Sure Start do not support** the
  manual/USB recovery methods (Sure Start repairs from the HP Endpoint Security
  Controller); Sure Start is an EliteBook/ZBook/business feature (HP F10 setup white paper
  c04685655: *"Only supported on EliteBook and ZBook notebooks"*), so the OMEN is a
  *without-Sure-Start* consumer machine — which is consistent with USB recovery being the
  intended path and with there being **no hidden auto-recovery controller** to appeal to.
- **Auto-power-on-with-`PB`-unplugged is not exotic.** HP F10 setup exposes
  **After Power Loss** (default *Off*, but settable to power-on/last-state); tomshardware
  1962721 and Quora threads show HP desktops auto-starting on AC with that set. So the
  cord-in auto-cycle is consistent with a stored setting plus a board that fails
  immediately; it is not evidence of anything exotic. Mechanism unattributed, as before.
- **45L family reports** (added to pass 2's set, still data points only, no part-swap
  conclusion): HP 8328782 owners whose 45L "fans are spinning for a millisecond and the
  light of the GPU shows for a millisecond" and is only revived by cord-out + 20-30 s hold
  (already-closed ritual); one reports faint electrical noise near the CPU right before
  cycle-off; r/HPOmen `1asef8z` 45L reboot loop that turned out to be **one faulty DIMM**;
  r/Hewlett_Packard `n50a4p` 25L no-start finally fixed by a PSU replacement; r/GeekSquad
  `17t9e5m` (the BBR thread already on file) where the tech had *already replaced the PSU*
  and still looped. Heterogeneous outcomes: PSU, DIMM, board, CPU. None of these is a
  diagnosis of this board — they are why the ladder above is ordered as isolation, not as
  shopping.
- **Front-panel USB / header short** as a loop cause is well documented (Tom's 3847093
  USB overcurrent shutdown; LTT 1261577 board refuses to power with a mis-keyed front USB-C
  header; anandtech 2269622 board will not power on with a USB header plugged). It is
  **folded into L2**, not proposed as its own separate power-on.
- **Nothing found** for: a BlizzardOC service manual / boardview / schematic; an HP-published
  BlizzardOC jumper table; a third 3-pin cap state; an OMEN-45L-specific recall; any
  software-only path into a pre-POST HP board.

---

## State after this pass

| Class | Status |
|---|---|
| sp167160 / `HpBiosUpdate.efi` | literature-closed (pass 2); free `dir /s /b` receipt still open, Windows host only |
| BlizzardOC vendor literature | closed; nothing beyond the closed classes exists publicly |
| 45L PSU / EPS pinout | **CLOSED — standard ATX 24-pin + 2× 4-pin EPS, HP-employee + working retail-PSU receipts** |
| PSU-side load isolation (L0–L3) | **NEW, OPEN — the named next action, operator opt-in required** |
| Instruments | none owned; ladder above is deliberately instrument-free |

Hardware halt unchanged until the operator explicitly names **L0** (photos, zero power) and
then, separately, **L1**. One step, one report, no stacking.

---

# L0 — executing (operator named it 2026-08-27)

**Zero power. Zero disassembly. Cord stays out, caps stay where they are, nothing is
unplugged, nothing is unscrewed.** L0 is a look-and-photograph step whose only job is to
make L1 safe and to tell us what is even attached to this PSU. If any item below needs a
screwdriver or a tug, skip it and say so — a missing photo is fine, a moved part is not.

## L0-A — zero-touch identity (do this on the Windows PC, not the OMEN)

HP PartSurfer returns the factory bill of materials for a serial number.

1. Read the **system serial number** from the OMEN's case label (rear or top sticker,
   `S/N`, 10 characters). Do not open anything for this.
2. On the Windows PC: `https://partsurfer.hp.com/` → enter that serial.
3. Photograph or copy the whole parts list. What we want out of it:
   - the **power-supply part number** (expect an `M19770-0xx` class Cooler Master 800 W),
   - the **system-board part number** (BlizzardOC),
   - any **lighting/LED control board** or cable-assembly part numbers.

That gives us the PSU identity even if its label is unreadable in the case, and it is the
only receipt in L0 that does not involve touching the machine at all.

## L0-B — photographs (case side panel already off; do not remove anything else)

Take these with the flash on, straight-on, one subject per photo. If a subject is hidden
behind a shroud or another cable, photograph what *is* visible and say "blocked".

| # | Subject | What it decides |
|---|---|---|
| 1 | The **PSU label** (wattage, model, rail table) — only if readable in place. **Do not unscrew or slide the PSU to reach it.** | confirms the `M19770`/800 W standard-ATX identity and the `+5Vsb` rating |
| 2 | Where the **cable bundle leaves the PSU/shroud** — a wide shot showing every cable that exits | tells us how many PSU branches exist to isolate in L2 |
| 3 | The **24-pin at the board end**, close and straight-on, wire colours legible, latch visible | **L1 safety gate**: we must see a single **green** wire and its position relative to the latch before anything is bridged. No green wire in the standard spot = L1 is cancelled |
| 4 | The **two 4-pin CPU (EPS) plugs** at the board end | confirms the two-4-pin layout and gives us the exact plugs L3 will unplug |
| 5 | The **lighting / RGB control board** and its power lead, plus where that lead terminates (Cooler Master `P8` or SATA) | this is the undocumented PSU-fed accessory; it is the prime L2 suspect |
| 6 | Every **SATA / Molex** lead and what each one feeds (drives, fan hub, pump, controller) | a shorted SATA branch reproduces this exact symptom (r/buildapc `13zikwd`) |
| 7 | **Fan and pump power leads** — which go to board headers vs straight to the PSU | separates board-side loads (already closed) from PSU-side loads (the new class) |
| 8 | Wide shot of the **bottom chamber / cable routing** | catches a pinched or chafed cable against a case edge |

## L0-C — free visual damage sweep (eyes only, no probing, no touching)

While the panel is off, look for and photograph anything that matches:

- **browning, melting or a shiny/glazed look** on any connector housing — especially the
  24-pin, the two 4-pin EPS, and the GPU 6+2 plugs;
- **bulged, domed or leaking capacitors** near the CPU socket (the VRM row between the
  socket and the rear I/O) and on the PSU-side of the board;
- any **dark scorch mark or soot** on the board, on a cable, or on an accessory board;
- a **burnt / fishy / ozone smell** near the CPU VRM or the PSU vent (report it in words,
  no photo needed);
- any **loose screw, washer, or metal debris** lying on the board or under it.

A hit on any of these can short-circuit the whole ladder — it would name the fault outright.
A clean sweep is also a real result and makes L1 the right next step.

## L0 gate

Send: the PartSurfer parts list, photos 1–8 (or "blocked" for any you could not take
without moving something), and the damage-sweep answer in words. Nothing gets powered,
unplugged, or bridged until that comes back and L1 is separately named.

---

# L0 receipts — RECEIVED 2026-08-27

## L0-A PASS — factory BOM for this exact unit

Operator supplied `https://partsurfer.hp.com/?searchtext=2MO22432DX`. That serial resolves
to **OMEN 45L Gaming DT GT22-0139**, product **575Q1AA** (refurb SKU `575Q1AAR`), described
by HP as *"OMEN by HP 45L Gaming Desktop PC GT22-0000i (393C6AV)"*, 31 service records.
Chassis codename in HP's own part descriptions: **ARTICUNO**.

Parts that matter to this campaign:

| Part | HP description | Why it matters |
|---|---|---|
| **M83827-001** | **POWER SUPPLY UNIT 800W ATX Gold** | **HP's own service catalogue calls this unit ATX.** Third independent confirmation, now vendor-side and serial-specific. The pass-2 "maybe non-standard" caution is dead. |
| **M81915-601** | MOTHERBOARD, BlizzardOC, INTEL ADL+Z690, WINDOWS | board identity confirmed against the serial, not inferred |
| **M82868-001** | **PCA LIGHTING CONTROL, ARTI** | the undocumented PSU-fed accessory board **is fitted to this machine** — the L2 prime suspect is real, not hypothetical |
| M82877-001 | LIGHTING MODULE LOGO, ARTICUNO | the OMEN logo LED is its own module (matches the retracted "logo LED means standby power" finding) |
| M82873-001 / M82874-001 | Cable LIGHTING 2_2pin 400mm / 5_10pin 400mm | the lighting harness is two separate cables — both come off in L2 |
| M82875-001 | CABLE TOP IO | top USB/audio reaches the board by cable, so it unplugs at the board in L2 |
| **M82880-002** | **LCS 240 N-RGB G9 ARTICUNOI** | plain 240 mm liquid cooler. **No Intel Cryo / TEC controller in this SKU** — that hypothesis is closed before it cost a power-on |
| M82878-002 / M82879-001 | FAN FRONT ARGB / FAN SYSTEM | the fan loads to account for in L2 |
| M87648-003 | CPU INTEL i7-12700KF 12C 125W | matches |
| M29374-001 | NVIDIA GeForce D20X-30 10GB GDDR6x | RTX 3080 10GB, matches |
| **M85222-001** | **RAM DIMM 8G DDR4 1.35V 3733HS, Arti** | HP's factory DIMM is a **3733** part. The 3733 XMP was in spec; the 4000 custom profile was not |

Note the retail-catalogue guess from earlier in this pass (`M19770-003/-013`) is **not** this
unit's part; the serial-accurate PSU FRU is **M83827-001**. Both are 800 W standard-ATX
Cooler-Master-class units, but only `M83827-001` is receipted for this machine.

## L0-C PASS — visual damage sweep

Operator verdict: **"no damage."** No browning/melting on connector housings, no bulged or
leaking VRM caps, no scorch or soot, no burnt smell, no loose metal debris. So there is no
shortcut: the fault is not visible, and the ladder proceeds as designed.

## L0-B PARTIAL — photos not supplied

Photos 1–8 were not sent. Most of them are now redundant: L0-A answered PSU identity
(photo 1), board identity, and the accessory inventory (photos 5–7) from HP's own BOM.

**One photo is still mandatory and it is the L1 safety gate: photo 3, the 24-pin at the
motherboard end, close and straight-on, wire colours legible with the latch visible.**
L1 bridges two specific contacts; it is not run off a remembered pinout. Two outcomes:

- **A single green wire is present** → standard ATX `PS_ON#` on pin 16, jumper it to an
  adjacent black `COM`. L1 proceeds as written.
- **All wires are black** (common on Cooler Master OEM harnesses) → **do not count pins from
  memory and do not guess.** Send the photo; the pin index is derived from the latch
  orientation and the keying in the image, and only then is L1 authorised.

Until that photo exists, L1 is **not** authorised, regardless of how well-identified the PSU
now is.
