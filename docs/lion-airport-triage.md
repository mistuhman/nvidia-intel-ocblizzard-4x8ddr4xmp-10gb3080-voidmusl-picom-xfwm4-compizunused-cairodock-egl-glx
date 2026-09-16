# AirPort triage — AP1 blink-green / AP2 amber / Express unresponsive (2026-09-16)

Operator verbatim 2026-09-16: "airport 1 is blinking green; airport 2 orange airport express
unresponsive". Queue position: `docs/lion-workflow.json` nextAction — AirPort pinhole resets
were already OPEN from the 2026-09-15 buildup list (ToDo item 1), LED fault reported 2026-09-16.
Machine: Mac Pro 3,1 running Lion 10.7, AirPort Utility 6.3.1 installed (operator 2026-09-15).
Known network facts: Time Capsule "Smart Happy Time Capsule" 10.0.1.1 fw 7.8.1 B8:C7:5D:0A:D0:98
was seen by AirPort Utility on 10.6.8 (MASTER latestReceipts 2026-09-09).

## 1. LED decode (receipt: Apple AirPort Utility guide, "If your base station's light is flashing", support.apple.com/guide/aputility/alap11006)

| Light | Apple's meaning | Applies to operator report |
|---|---|---|
| Off | unplugged | Express "unresponsive" candidate |
| Solid amber | starting up | normal for ~1 min after power/plug |
| Flashing amber | cannot establish a connection to the network/Internet, or a problem; a red/amber badge in AirPort Utility explains which | **AP2 orange** = this class: not configured / no WAN / double-NAT / DNS / cable |
| Solid or flashing green | on and working properly | **AP1 blinking green = HEALTHY** (activity blink). Do NOT reset AP1 |
| Flashing amber and green | startup problem; base station restarts and retries | boot-loop class |

Community corroboration for flashing amber cause set (Apple discussions thread 3860676):
firmware update pending, not fully configured, open network without password, invalid IP,
no DNS servers, double NAT, ethernet cable unplugged. AirPort Utility shows an amber badge
with the exact reason on the summary page — read it before resetting anything.

Verdict on the report as written:
- AP1 blinking green: working. No action. (Resetting a healthy base station would destroy its config.)
- AP2 solid/flashing amber: configuration/WAN fault class. Read the AirPort Utility badge first;
  factory reset only if the badge says unconfigured or the password is unknown.
- Express unresponsive: establish dead-vs-bootloop first (light state), then hard/factory reset.
  Solid amber forever = cannot leave startup = hardware/PSU class (Apple discussions 251085589).

## 2. Reset ladder (one base station per message, operator pacing rule)

Receipts: Apple support "How to reset your AirPort base station"; MacObserver AirPort Express
reset guide; Apple discussions 254395474 (factory reset works even when the unit does not show
up in AirPort Utility).

| Reset | How | Effect |
|---|---|---|
| Soft (1 s) | hold reset 1 s while powered | 5-minute password-change window, config kept |
| Hard (~5-8 s) | hold reset ~5-8 s while powered until amber flashes rapidly | restart, saved profile KEPT |
| Factory default | unplug power, hold reset, plug power back in WHILE holding, keep holding 6-10 s until amber flashes rapidly (green flashes on some older models), release | ALL saved profiles erased; unit returns to out-of-box |

Notes:
- Reset button location: small pinhole next to the power port (Extreme/Time Capsule: right of
  power; Express: rear pinhole). Paperclip/pin.
- Factory default works even if the base station never appears in AirPort Utility (receipt above).
- After factory reset expect: rapid amber blink while held -> solid amber 15-20 s -> slow amber
  blink ~1/s = waiting for configuration (Apple discussions 251085589). Solid amber that NEVER
  moves = startup-hang/hardware class, not a config fault.
- Time Capsule disk: factory reset does NOT erase the internal disk; do not run any disk step
  here (Lion disk rules in `docs/lion-workflow.json` doNot outrank this doc).

## 3. Configuration after reset (Lion 10.7)

- AirPort Utility 6.3.1 (installed per operator 2026-09-15) configures 802.11n/ac-era base
  stations. Legacy 802.11g/base firmware units need AirPort Utility 5.6.1 (launcher coexists
  with 6.x; docs/case-swap-macpro-daily-driver.md records the 5.6.1+ launcher rule).
- If 6.3.1 does not SEE a freshly reset unit: install/launch 5.6.1 before concluding hardware death.
- One router only: keep exactly one base station in router (DHCP+NAT) mode; every other unit =
  bridge mode, else double-NAT flashes amber on the downstream unit (cause set above).
- Firmware: let AirPort Utility offer firmware updates AFTER the unit configures cleanly;
  a pending firmware update is itself an amber-blink cause.

## 4. Receipts the agent needs back (one wave)

1. Per unit: model + light behaviour BEFORE touching it (solid vs flashing, colour, cadence).
2. AirPort Utility 6.3.1 summary-page badge text for AP2 (and Express if visible).
3. After each reset: light sequence observed (held-blink -> solid -> slow blink, or solid forever).
4. Final: `lion-one.command` report burned through da.gd/lionone (it captures
   `airport -I` + `networksetup -listallhardwareports`), plus which SSID the Mac joins.

## 5. Prohibitions carried from the workflow

- No disk erase anywhere in this wave (Lion SSD Base / RAID members never).
- No clock changes, no bless, no nvram (house Mac rules).
- One physical action per message (operator pacing rule, ToDo buildup list).
