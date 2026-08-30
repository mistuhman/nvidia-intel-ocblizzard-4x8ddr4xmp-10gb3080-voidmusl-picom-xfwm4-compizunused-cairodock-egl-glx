# Feature-pack: what can move to the BlizzardOC, what can't, and what "debug RGB" can really do

Operator ask (2026-08-30): the testbench board's little POST display, the Gigabyte testbench
accessories (LED, mobo power button), and what else can be brought over from the OMEN and the
testbench to feature-pack the main rig. Theme color picked same day: **`#031CC0`** (deep blue).

Everything below traces to a repo receipt, an operator quote, or a linked external source.
Unknowns are marked UNKNOWN, not guessed.

---

## 1. The "little display" — POST-code readout

What the testbench Gigabyte has is an **onboard 2-digit POST-code display** (we used it during
recovery: the bench read `02` and `AA` — `AA` = end of POST). That display is a *board feature*:
soldered to the PCB and wired to the chipset's LPC debug port. It is **permanent — it cannot be
removed and attached elsewhere.**

Can one be *added* to the BlizzardOC 8917? **No, not as a slot-in card:**

- Firmware POST codes are written to **I/O port 80h**.
- On modern chipsets, port-80h traffic is routed to the **internal LPC bus** — there is no
  external connector for it on this board.
- **PCIe "POST tester" cards mostly do not work on modern UEFI**: a PCIe endpoint only receives
  an I/O write if firmware configured it to decode that address range, and OEM firmware does not
  do this (the PCIe topology must be configured before transactions route anywhere). Sources:
  Hackaday, *"Can You Use A POST Card With A Modern BIOS?"* (2023-05-08)
  <https://hackaday.com/2023/05/08/can-you-use-a-post-card-with-a-modern-bios/>;
  r/sysadmin, *"Is POST via PCI-E not a thing?"* (2020) — "unclaimed I/O cycles go to the
  subtractively decoded bus… which is internal to the motherboard".
- Legacy PCI/ISA POST cards worked because PCI does *subtractive decode* — the 8917 has no PCI
  slots. **Do not buy a PCIe POST card for this machine; expect a dead display.**

What the BlizzardOC **does** give you for hardware-level debug (both already proven on this rig):

| Channel | Receipt | Notes |
|---|---|---|
| **Beep codes** | HP **3.3** beeps heard 2026-08-27 ("board speaker", `docs/bios-flash-decision.md`; pattern decode in `docs/open-classes-pass3.md` §489) | HP major.minor beep table, sequences run ~5 iterations. This is the board's POST display, in audio form. |
| **Power-LED blink codes** | HP major/minor blink scheme (same family as beep table) | Power LED colour/blinks encode the same major.minor codes. |
| **F10 thermal page** | 90B fan-table receipt 2026-08-27 (`docs/omen-free-recovery-runbook.md`) | Per-header fan RPM + `N/A` = empty header. |

**OPEN / verify:** whether the beeper is an onboard piezo or a chassis speaker left in the 45L.
The 3.3 beeps were heard *before* the case swap; if the sound came from a 45L chassis speaker on
a SPEAKER header, a $2 PC speaker on that header restores it in the new case. Check the board
edge for a 4-pin SPEAKER header (UNKNOWN — HP boards often fit an onboard buzzer instead, in
which case nothing needs doing). If beeps still sound in the new case, it is onboard — done.

If a *visible* code readout is ever wanted for bench work, the testbench Gigabyte **is** that
instrument — that is exactly how we used it in A0/A1b.

---

## 2. Debug RGB — the software half (`rgb-omen health`)

The TracerLED hub is USB (`103c:84fd`) with no save-to-device, so **pre-POST lighting cannot
show debug state** — the factory rainbow owns the window before the OS enumerates USB. But from
boot onward the RGB can be a real status light. New in `scripts/rgb-omen` (2026-08-30):

```sh
sh rgb-omen health 031CC0 4      # fans keep the #031CC0 wave; zone 4 (CPU LED) = status
sh rgb-omen health 031CC0 all    # zones 1,2,4 (Logo/Bar/CPU) all show status
sh rgb-omen persist-health 031CC0 4 15   # runit poll loop, every 15 s (survives reboot)
```

| Status zone colour | Meaning | Trigger |
|---|---|---|
| green `#00ff00` | OK | everything below clean |
| magenta `#ff00ff` | housekeeping | a zpool `scrub in progress` |
| amber `#ffb400` | warn | CPU ≥ 90 °C, GPU ≥ 80 °C (stop rule 83), any pool `DEGRADED` |
| red `#ff2000` | crit | pool `FAULTED`/`UNAVAIL`/`OFFLINE`, `Machine check`/`EDAC`/`Hardware Error`/NVIDIA `Xid` in dmesg, CPU ≥ 100 °C, GPU ≥ 85 °C |

Probes are read-only (`zpool status`, `dmesg`, coretemp hwmon, `nvidia-smi` query) — nothing
stresses the machine, and an unreadable probe degrades to a quieter verdict, never a false red.
`Xid` is included deliberately: the 2026-08-30 runtime crash class shows up as Xid lines in
dmesg, so a red CPU LED after a crash names the GPU driver without opening a terminal.

Debug color legend for the fans/art stays whatever `health` was called with (default `031CC0`).

---

## 3. The power button (the actual want: click feedback)

- BlizzardOC power control is the **bare 2-pin `PB` header** — a momentary short across the two
  pins (`docs/case-swap-sff-triage.md` trap 2). No polarity, no data: any momentary
  normally-open switch works.
- A **testbench tethered power button** (the kind on a bench kit / case accessory box, 2-pin
  DuPont lead) plugs straight on. The Gigabyte's **onboard** button is soldered to that board —
  permanent, not transferable.
- **Parallel is fine**: the case's silent button and an added bench/desk button can both sit
  across the same two pins; each press is just a momentary short. Nothing to rewire —
  the existing improvised PB adapter stays.
- Cleanest fix for "no audible click": a **desk-mounted clicky power button extension**
  (sold as "PC power button extension cable / desktop restart switch", ~$8) — big tactile
  click, runs to the `PB` header on a 2-pin lead. Or salvage the testbench's tethered button.
- **Reset:** no reset header is known on this board (UNKNOWN — check silkscreen; HP consumer
  boards usually omit reset entirely). Do not improvise reset from the PB pins.
- Same rule as always: **one accessory per power-on**, installed powered-off.

## 4. LEDs and ARGB — permanent vs portable, and the voltage traps

**Permanent (soldered, stays with its board):** the Gigabyte's onboard debug LEDs, I/O-cover or
chipset accent LEDs, onboard buttons, onboard POST display, onboard piezo speaker.

**Portable (header-connected, can move):** LED *strips* and anything on a lead — but check the
plug family first:

| Family | Connector | Voltage | Can it land on this rig? |
|---|---|---|---|
| 12V RGB (older "RGB Fusion" strips) | 4-pin, 12V/G/R/B | 12 V | **No.** Nothing on this board or hub takes 12V RGB. Do not adapt. |
| 5V ARGB (addressable) | 3-pin, 5V/D/G | 5 V | Maybe. The hub's `FFAN ARGB` / `TFAN ARGB` outs drive the HP ARGB fans; **pin order for third-party ARGB gear on HP hub outs is UNVERIFIED** — verify 5V/Data/GND positions before ever plugging in (we have no DMM). |
| HP `LOGO` header | HP lead | **5V only** | Yes for the 5V OMEN logo module. **Never 12V.** |

The hub itself is already in circuit and working (operator 2026-08-30: "rgb on, light bar in
new case"), so the ARGB expansion path, if wanted, is: verify pinout → test one strip → then
commit. The standing fallback remains a standard 5V ARGB controller on its own SATA feed.

**Front I/O from other cases (HD-AUDIO, USB blocks): keep off HP headers** — HP's own guidance
warns of proprietary pinouts, and a mis-keyed block pulling 5VSB to ground is the exact instant-
cycle class from August (`docs/case-swap-sff-triage.md` trap 3).

## 5. Salvage list

| Source | Part | Verdict |
|---|---|---|
| OMEN 45L remains | TracerLED hub + harness + light bar | **Already in** (working). |
| OMEN 45L remains | 5V logo module | Portable — `LOGO` header, 5V only. One power-on to qualify. |
| OMEN 45L remains | Front I/O board / ribbon | Skip — proprietary, and HP front-I/O is the trap class above. |
| OMEN 45L remains | SATA power Y-leads | Fine — useful for the hub feed without stealing a drive plug. |
| Testbench | Tethered bench power button | **Take it** — `PB` 2-pin, parallel-safe (§3). |
| Testbench | Onboard button/LEDs/POST display | Can't come — soldered (§1, §4). |
| Testbench | PC speaker | Take **if** the BlizzardOC has a SPEAKER header (UNKNOWN, §1); if its beeper is onboard, unneeded. |
| Testbench | 5V ARGB strips | Maybe — §4 pinout rule. 12V RGB strips: nowhere to land. |
| Testbench | Internal USB 9-pin devices (card reader, etc.) | Fine — board has `FRONT-USB2`/`MUSB` 9-pin headers; the hub already occupies one, so count headers first. |
| Any | PCIe POST-code card | **Do not buy** — dead on modern UEFI (§1). |

## 6. Install order (case-swap discipline still applies)

1. Machine healthy and booted (it is — Gate 11 closed 2026-08-30).
2. One accessory per power-on, everything powered off, one variable at a time; after each,
   boot and run `sh rgb-omen health` — green CPU LED plus a clean boot is the pass gate.
3. Log the **interface** for every addition (which header, which pins) — MASTER lesson.
4. Anything that reintroduces cycling gets removed and named, not worked around.
