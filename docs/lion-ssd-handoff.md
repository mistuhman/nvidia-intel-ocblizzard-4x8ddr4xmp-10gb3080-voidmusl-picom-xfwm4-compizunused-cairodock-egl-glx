# Lion SSD handoff — Mac Pro 3,1 (corrected 2026-09-12; 1,1 below is history)

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

ACHIEVED 2026-09-12 via the installer-app path (operator brute force): Lion 10.7 installed and booting on Bay 1 `Lion SSD Base` (login with all 5 accounts + Andromeda desktop @1080p verified). Bay 1 is home unless the operator asks for a Bay 3 migration. Close-out owed: RESCUE1 (blind at 1440p), About/GPU reads, new-admin + Bay 4 spare decisions.

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
- RECEIVED 2026-09-11: **RESELECT1 partial** — the pane selects `Lion SSD Base` but its Restart fails (operator verbatim: "system preferences will let me select it, but wont let me restart it from there, itll just close the app and give me a notification saying it halted"). Whether the bless half stuck or only the reboot half failed is UNKNOWN; exact notification text unquoted.
- RELEASED 2026-09-11 (session 01a09141): **RESTART1** — Apple menu > Restart (manual, bypasses the pane), report prohibitory vs straight-through + end state + exact wording of any notification. No prohibitory = selection had stuck; prohibitory detour = selection did not stick. Either way ends at SL (fallthrough proven 3×).
- RECEIVED 2026-09-11: **RESTART1 failed** — operator verbatim: "cant restart whatsoever". Both software restart paths blocked (pane halted + Apple-menu Restart fails); exact Apple-menu symptom unquoted.
- RELEASED 2026-09-11 (session 01a09141): **COLDBOOT1** — save/close apps, hold power to force off, cord stays in (dead CR2032: AC preserves the clock), wait 10 s, power on, report prohibitory vs straight-through + end state. Hardware path, unblockable by software.
- RECEIVED 2026-09-11: restart blockage IDENTIFIED — operator verbatim: "skype hung up, restarted now". A hung Skype canceled logout (plausibly also the pane halted notice). Restart executed; method (Apple menu vs power button) unreported.
- HOLDING 2026-09-11 (session 01a09141): no new physical action — owed receipt is the boot observation (prohibitory vs straight-through, end state, restart path used). Routes bless-stuck (FORENSIC1 next) vs bless-failed (re-bless forensics next).
- RECEIVED 2026-09-11: **clean boot** — operator verbatim: "booted straight to lion ssd, no prohib". Bless-stuck CONFIRMED (the pane bless wrote `efi-boot-device`; only its reboot call failed). SDBOOT1 inverse COMPLETE via Skype-clear + restart. Restart method unreported, now moot.
- RELEASED 2026-09-11 (session 01a09141): **FORENSIC1** — new read-only collector `lion-forensic.command` in `lion-forensic.zip` (1721 bytes, sha256 `0d0ee722…`), Arctic Fox: `da.gd/lionforens` (da.gd truncates custom slugs to 10 chars; verified via `+` coshorten). Double-click on SL, attach `~/Desktop/lion-forensic.txt` via `da.gd/lionrelay` (generic picker, any .txt). Answers: `mach_kernel` present? intact? ESD OS version? No sudo, no writes except the report.
- PANEL NOTE 2026-09-11: the frozen relay page pulls `etc/lion-command.txt` from `arena/01a08f01` then main — never this branch. The Commands panel is STALE for this session; chat is authoritative.

- RECEIVED 2026-09-12: **FORENSIC1 burn** (text uuid `6e8ebd6a` 6661B/120 lines + query `a8f76d53`; no second Repair exists). `mach_kernel` PRESENT (fat, md5 `d2b48eb7…`); ESD genuine 10.7.5 11G63; both `boot.efi` byte-identical (md5 `d209022c…`); Boot.plist/boot-args absent; `efi-boot-device`=disk0s2; bless FLIPPED 2078→2082 (SDBOOT1 Startup Disk `bless --setBoot`). CORRECTION: SDBOOT1 was confounded (path AND bless) — picker-vs-direct retired as MOOT; both bless states metered failures → re-bless CLOSED forever.
- RELEASED 2026-09-12: **SAFEBOOT1** (picker ESD + Shift + photo; Apple HT201262 license). RECEIVED: prohibitory flash → SL safe-boot desktop (progress bar proved Shift registered). ESD fails pre-safe-mode-divergence → cache/kext downgraded, handoff leads.
- RECEIVED/RELEASED 2026-09-12: **VERIFY1** "appears to be ok" (directory class CLOSED; cache near-dead) → **FIRMWARE1** (Boot ROM + SMC read).
- RECEIVED 2026-09-12: **FIRMWARE1 photo** — **MacPro3,1** Early 2008 (CORRECTION: 1,1 inherited, never verified; EFI32 notes STRUCK), Boot ROM **MP31.006C.B05** = EFI Firmware Update 1.3 FINAL (MacDailyNews 2008 + Apple DL95) → firmware CLOSED. Hash hunt FAILED (no 11G63 reference md5); Ignore-ownership lead filed as M1g.
- RECEIVED 2026-09-12: **OWNERS1 moot** — ESD already unchecked; M1g VOID (wrong-volume inference from a cropped DU pane — owned). RELEASED: **PLAIN1** (last untested boot cell).
- RECEIVED 2026-09-12: **PLAIN1** "normal lion ssd boot" — matrix EXHAUSTED. Same turn: operator brute-forced the **Install Mac OS X Lion app** ("Ready to install" → `Lion SSD Base`, reboot to Apple; HOLD1/OBSERVE1-4 watch, Caps Lock alive @ <15min).
- RECEIVED 2026-09-12: staged boot → Dell timing error (**D1**, 2nd ×; GUI-once reclassified as D1) → completion self-reboot @ ~25min (installer FINISHED clean) → **Lion login, all 5 accounts (WORKED)** → desktop @1080p. D1 EXPLAINED: installer envs probe the converter EDID with fresh prefs; upgraded system INHERITED SL safe prefs (immune). M1 moot; M2/M3 COMPLETE on Bay 1.
- RELEASED/RECEIVED 2026-09-12: **LOGIN1** verify + **RES1** (2560×1440 trial): "1440 doesnt work, doesnt auto revert" (agent safety premise owned wrong). Converter lists over-promise; 1080p = permanent chain ceiling.
- RELEASED 2026-09-12: **RESCUE1** — force off, Shift safe-boot (framebuffer bypasses stored pref), Displays 1080p + uncheck Overscan (overwrites bad pref), Restart normal, report desktop + About + GPU. Operator port-switch = backup only; SL per-display inheritance CONFIRMED. Outcome PENDING.
- PR ordered 2026-09-12 (operator verbatim: "we need to create a pr anyways") — record commit + PR authorized over the 405 budget BY EXPLICIT ORDER.

- RECEIVED 2026-09-12: **RESCUE1-6 metered, display still blind** \u2014 safe mode, GPU port switch, and single-user rm all fail to clear the 1440p poison (fsck OK on disk1s2 = node-shift confirmed; rm result unreported). 1080p = proven VGA ceiling.
- DECIDED 2026-09-12: **AMD card + digital cable** in ONE chassis session with the HDD swap (converter = proven weak link; new EDID identity = safe defaults). Conditions: Mac-EFI card; keep old card till new POSTs; delete-retry only if still blind.
- BUILDUP to ToDo.md (operator order) + **PR #80 MERGED**; new chat opens with the chassis session.

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

Erase Lion SSD Base or start disk clone. Remirror Bay 4. Date to 2015/2016. `lion-installer-date-fix.command`. Power APEX. Headless injector / boot-audit double-click. Rewrite `ToDo.md`. jsDelivr HTML pages (served `text/plain`). e2b.app from the Mac. Re-bless Bay 4 (both states failed). 1440p+/unlisted modes on the VGA-HDMI chain (1080p ceiling). Third-party resolution tools.

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
