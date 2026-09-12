# Lion SSD handoff — Mac Pro 1,1

**New chat pickup.** First message `README.md` still bootstraps the whole repo. Then run:

```
node tools/orient.ts orient
node tools/lion-status.ts
node tools/lion-mirror-sl-test.ts
```

Canonical machine-readable state (links, volumes, next action, withdrawn slugs):

`docs/lion-workflow.json`

`node tools/lion-status.ts` prints it. `node tools/lion-status.ts selftest` checks helper files, bless shape, and that `da.gd/lionfix` stays withdrawn. Update the JSON when a link, bless, volume node, or nextAction changes — do not leave live URLs only in chat.

Longer receipts: `docs/session-2026-09-09-lion-ssd-install.md` (clone + first installer failures). This file is the 2026-09-10 continuation.

## Goal

Lion 10.7 booting from Bay 3 MX500 (`start disk clone`). New admin after that. Do not replace Bay 1 until proven.

## Where we left off (2026-09-11 16:10 PDT)

- Working OS is still **Snow Leopard 10.6.8** on **Lion SSD Base** (Startup Disk, Bay 1).
- Bay 4 **Mac OS X Install ESD** is an asr mirror of inner `InstallESD.dmg` (4.4G). `OSInstall.mpkg` + both `boot.efi` present.
- Option-boot of ESD **did** reach the installer GUI once, then VGA→HDMI **timing error**.
- `Graphics Mode` in Apple `com.apple.Boot.plist` caused the **prohibitory sign**; firmware fell through to Lion SSD Base.
- Last successful helper log blessed **volume-root** `/Volumes/Mac OS X Install ESD/boot.efi` (Oct 3 2012, finderinfo 2078) — same as the GUI-reaching asr bless. CoreServices `boot.efi` is Jul 29 2012; do not bless that file.
- Current readable report (webhook uuid `2ad981cf`, 4902 bytes / 124 lines) confirms Repair, cleared Graphics Mode/nvram, volume-root bless of `/Volumes/Mac OS X Install ESD/boot.efi` (Oct 3 2012, finderinfo 2078), and **no disk erased**.
- Released Option-boot attempt: operator selected `Mac OS X Install ESD`; a prohibitory symbol appeared briefly, followed by the Apple logo/loading sign, then the Mac returned to the Snow Leopard login. Installer GUI was not reached.
- BOOTLOG1 is now readable (webhook uuid `9d0bfed6`, 61946 bytes / 675 lines). It records the root report `/lion-boot-log.txt`, absent `boot-args`, the three intact volume mappings, ESD root bless/finderinfo 2078, and **no disk changes**. Snow Leopard has no ESD-specific failure entry because the failure is pre-OS; the operator's chat receipt remains brief prohibitory → Apple logo/loading → Snow Leopard login.
- Hold with no reboot, second Repair, date-fix/injector/audit file, Bay 4 remirror, or target selection. The next action must be a separately released non-destructive boot method.
- RELEASED 2026-09-11 (session 01a09141): **VERBOSE1** — Option-picker `Mac OS X Install ESD` with Command-V held, then photograph the stop screen. Held keys only, zero mutation. Inbox rechecked: 16 requests, nothing newer than BOOTLOG1 (`9d0bfed6`). Next method ships only after the VERBOSE1 photo is read.
- RECEIVED 2026-09-11: **VERBOSE1 photo** — the verbose text is the Snow Leopard boot (`BSD root: disk0s2`, `Previous Shutdown Cause: 3`, 8 `AppleACPICPU` lines); operator end state is the SL login. The ESD kernel never printed: the picker handoff fails pre-kernel in the firmware/boot.efi phase and falls through to Bay 1.
- RELEASED 2026-09-11 (session 01a09141): **SDBOOT1** — System Preferences > Startup Disk > `Mac OS X Install ESD` > Restart (direct boot bypassing the picker), photograph the result, STOP at any installer GUI without clicking Install or selecting a destination. Named inverse (re-select `Lion SSD Base`) ships next message on fallthrough. Separates a picker-path failure from a boot.efi-phase failure.
- RECEIVED 2026-09-11: **SDBOOT1 photo + words** — gray screen with centered prohibitory, held "a while", then Apple loading screen, end state "booted to leopard" (operator verbatim). Direct boot fails identically to picker boot: the picker class is CLOSED, boot.efi-phase failure on the ESD volume is CONFIRMED. `efi-boot-device` still points at the ESD until the inverse runs.
- RELEASED 2026-09-11 (session 01a09141): **RESELECT1** (the promised SDBOOT1 inverse) — Startup Disk > `Lion SSD Base` > Restart, confirm a straight-to-SL boot with no prohibitory. Queued after its receipt: FORENSIC1 (read-only `mach_kernel` + boot.efi verification on the ESD from SL).

## Live links (Arctic Fox)

| Type | Type this | Job |
|---|---|---|
| Current relay page | `da.gd/lionrelay` | Current session page: Commands panel plus plain-text log relay. |
| Current bundle | `da.gd/lionzip` | Current session `lion-mirror2.zip` containing `lion-mirror.command` and `lion.html`. |
| Logs | choose `~/Desktop/lion-mirror.txt` on the relay page | The page sends text/plain and the query summary; the agent reads `links.logRead`. |
| Legacy helper | `da.gd/lzr` | Old SHA-pinned one-script helper only; do not use for the current relay wave. |
| Legacy branch/page | `da.gd/lmz`, `da.gd/lpg` | Write-once stale destinations; do not use for the current session. |

**Never:** `da.gd/lionfix` (old date-fix pack), `da.gd/lup` (dead e2b), or TinyURL.

da.gd slugs are write-once. The current `lionrelay` and `lionzip` destinations are recorded and checked in `docs/lion-workflow.json` by `node tools/lion-status.ts selftest`.

## Helper

The current zip has three files: `lion-mirror.command` (`#!/bin/sh`, Snow Leopard), `lion-boot-log.command` (safe post-fallback collector), and `lion.html`. Double-click `lion.html` or use `da.gd/lionrelay`; the page exposes the bundle and log relay. Double-click `lion-mirror.command` on Lion SSD Base only when a new Repair is explicitly released; it writes `~/Desktop/lion-mirror.txt`. The boot-log command writes `/lion-boot-log.txt` plus `~/Desktop/lion-boot-log.txt`. Attach through `da.gd/lionrelay`.

Does **not** asr, erase, or set the clock.

Tests: `node tools/lion-mirror-sl-test.ts` (agents A syntax / B mocked 10.6 / Z one-file exec zip).

## Do not

Erase Lion SSD Base or start disk clone. Remirror Bay 4. Date to 2015/2016. `lion-installer-date-fix.command`. Power APEX. Headless injector / boot-audit double-click. Rewrite `ToDo.md`. jsDelivr HTML pages (served `text/plain`). e2b.app from the Mac.

## Tools map

| Tool | Repro command |
|---|---|
| Lion workflow | `node tools/lion-status.ts` |
| Lion workflow gate | `node tools/lion-status.ts selftest` |
| Helper SL tests | `node tools/lion-mirror-sl-test.ts` |
| Full gate | `node tools/test-all.ts` |
| Stale phone pack generator | `tools/lion-phone-agent.ts` — **do not run to refresh links** |

## Operator rules that still bind

One physical action per Mac message. Arctic Fox + `.command`, not Terminal, for this Lion path. Keep-as-Mac (transplant closed).
