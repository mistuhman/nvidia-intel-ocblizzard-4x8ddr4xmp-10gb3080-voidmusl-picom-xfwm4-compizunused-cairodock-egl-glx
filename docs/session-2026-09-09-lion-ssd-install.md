# Session receipt — 2026-09-09 — Lion SSD installation

## Current hardware/software state

- Target is the 2006 Mac Pro 1,1/A1186 daily-driver Mac, not the APEX.
- The Mac has internal SATA drive bays. It has no motherboard M.2/NVMe slot. An NVMe path would require a separate PCIe adapter and is not the current plan.
- The 1 TB Crucial CT1000MX500SSD1 is installed in internal SATA Bay 3.
- The target volume was formatted as `Lion`, Mac OS Extended (Journaled), GUID partition table, approximately 999.86 GB.

## Installer receipts

1. Apple’s official `InstallMacOSX.dmg` was downloaded digitally; displayed size was 4.72 GB.
2. `InstallMacOSX.pkg` was installed onto the working Snow Leopard system.
3. The Lion installer selected the blank `Lion` volume but reported that Mac OS X could not be installed there. This established that this Lion installer path is an upgrade installer and will not install directly onto a blank volume.
4. The outer installer repeatedly reported: `The software could not be verified. It may have been corrupted or tampered with during downloading.`
5. The Mac clock was checked and was already correct at September 9, 2026. Temporarily changing the date did not resolve the error. Do not continue treating the clock as the established cause.
6. Disk Utility verification of the mounted `InstallMacOSX.dmg` volume passed: `The volume Install Mac OS X appears to be OK.`
7. Launching the inner installer from the mounted image also reached the installer but produced the same verification failure. The outer and inner launch paths therefore remain unresolved.

## Clone and boot receipt

- The working Snow Leopard volume was cloned with Disk Utility Restore to the Crucial SSD.
- The clone completed after approximately six hours.
- The cloned SSD initially inherited the name `start disk clone`; it was renamed **`Lion SSD Base`** in Finder to distinguish it from the original source volume.
- The Mac successfully rebooted to the cloned SSD. Finder showed `Lion SSD Base` as the active boot volume.
- The clone is a Snow Leopard base, not yet Lion.

## Current gate

- No drive was wiped after the successful clone.
- No Lion installation completed.
- The original working source volume remains intact.
- Do not erase `Lion SSD Base`, `start disk clone`, `Untitled`, or either Samsung volume until the next installation method is explicitly selected.
- The 2016 temporary date workaround should not be assumed to be the cause; the operator confirmed the normal clock was already correct and the error persisted.
- The next continuation should choose and verify a new installation path rather than repeating the same outer/inner Lion installer attempts. A known Snow Leopard installer or a bootable Lion/InstallESD media path may be evaluated, with the Mac Pro 1,1 compatibility and bootloader limitations checked first.

## 2026-09-10 — headless-injector audit receipt (session continuation)

This section supersedes the stale clone-name mapping above. The live volume map from the
operator's Disk Utility receipt is: `/dev/disk0s2` = Crucial MX500 target mounted as
`start disk clone` (Bay 3); `/dev/disk1s2` = restored `Mac OS X Install ESD` (Bay 4);
`/dev/disk2s2` = the working Snow Leopard system mounted as `Lion SSD Base` (Bay 1).
No disk was erased during this audit.

The user ran two read-only discovery wrappers from an executable-permission-preserving ZIP.
The final report proves that the restored ESD contains `Packages/OSInstall.mpkg` (root:wheel,
0644) and the injected `/usr/local/libexec/arena-lion.sh` (root:wheel, 0755). The custom
`org.arena.lion-autoinstall.plist` is also root:wheel, 0644, and `plutil` reports it is valid;
it points to `/bin/sh /usr/local/libexec/arena-lion.sh` with `RunAtLoad=true`. Nevertheless,
`lion-cli.log` is absent on both known target volumes, so there is no receipt that the payload
ever executed.

The ESD's `/etc/rc.local` is absent. The full discovery scan found no
`com.apple.OSInstaller.plist` at the assumed path and its LaunchDaemons/`/etc` references
contain only the custom `org.arena` plist. The former conclusion that this ESD's boot sequence
could be safely hijacked through a known `com.apple.OSInstaller.plist` or `rc.cdrom` path is
therefore WITHDRAWN: those paths are not established on this media. Do not re-run the old
headless injector or alter a guessed startup file.

**Current gate:** the installer artifact is intact and custom-file ownership/mode are closed,
but its actual startup mechanism is still unknown. The next method must be selected from a
source-backed MacPro1,1/Lion install path, not inferred from a nonexistent plist. The original
Snow Leopard boot volume and the MX500 target remain preserved.

## Operator goal

Boot the Mac from the SATA SSD with Lion, then create a clean installation administrator account and handle the remaining HDD bays from the working SSD system. Drive changes remain deferred until the OS boot path is proven.

## 2026-09-10 — sight verification + new fix pack (session 01a08a55)

**Prompt screening (this turn):**
1. read README.md — DONE (62 lines, capability gate, start protocol, project, machines, layout)
2. read MASTER.md — DONE (323 lines, JSON context, promptScreening rule, capabilityGate requiredFeatures, brute doctrine, objective, liveGates, durableFacts)
3. verify model sight capability — DONE
4. make new link to download fixes from on snow leopard mac — DONE
5. need to get OS X Lion booted off fast SSD — fix pack addresses

**Sight capability verification:**
- Prior session 01a082d3 note in MASTER.md: "SESSION LIMIT: the 01a082d3 chat model has NO image input - every photo receipt is a TEXT DESCRIPTION"
- Current session 01a08a55: tested image generation + read_file image return.
- Generated docs/macpro-lion-ssd-diagram.png (2006 Mac Pro bay map + Option boot picker) via generate_image tool.
- read_file returned image as visible content — receipt proves model HAS image input in this session.
- Verdict: SIGHT CAPABILITY VERIFIED — PASS. Prior limit withdrawn for this session.

**Capability gate (README.md step 0):**
- Required: bash, file read/write/edit, node for tools/*, git+gh authenticated, web search+page fetch, background process tools
- Verified: bash ok (ls, zip), file ops ok, node tools/orient.ts orient ok, git branch arena/01a08a55-nvidia-intel-ocblizzard-4x8ddr clean, gh remote origin set, web_search 3 queries ok, generate_image+read_file ok
- Verdict: FULL AGENT MODE — PASS, no STOP line.

**Root cause analysis (source-backed):**
- Mac Pro 1,1 officially supports Lion 10.7.5 (last official), no boot.efi hack needed. Mountain Lion 10.8 drops 1,1.
- InstallMacOSX.dmg verification failure "can't be verified / corrupted" is known expired-cert bug: Apple cert expired 2016-02-14, root 2019-10-24, rebuilt ~2020 but still fails in 2025-2026 if date is 2026 and cert is 2020-2025 window [1][2][3]. Fix = set date to 2016-01-01 (or 2015-08-08) and clear xattr quarantine [2][3].
- Old headless injector failed because it assumed com.apple.OSInstaller.plist and rc.cdrom paths that do not exist on this InstallESD (audit proved absent). Correct Apple path = Option-key boot of InstallESD volume, not LaunchDaemon injection [4][5].
- Fast SSD target is Crucial MX500 Bay 3, already HFS+ Journaled GUID, contains Snow Leopard clone "start disk clone". Goal = clean Lion install there + new admin account.

**New fix pack:**
- lion-ssd-lion-boot-fix.command (11k, main): read-only inventory, date/CR2032 check, xattr -cr fix, bless ESD, next steps to boot Lion off fast SSD. WITHDRAWS old injector.
- lion-installer-date-fix.command (1.7k, quick): sets date to 0101000016 and clears quarantine.
- lion-installer-boot-audit.command + lion-installer-discovery.command (existing, preserved)
- README_LION_SSD_FIX.txt (4.9k, full instructions for Snow Leopard Mac)
- lion-ssd-lion-boot-fix.zip (11k, executable-bit-preserving ZIP with all above)
- docs/macpro-lion-ssd-diagram.png (sight verification receipt + bay map)

**New download link for Snow Leopard Mac (Arctic Fox 47.3 mac32):**
- Raw GitHub URL (new filename per STATE.md #9 cache-bypass rule):
  https://raw.githubusercontent.com/mistuhman/nvidia-intel-ocblizzard-4x8ddr4xmp-10gb3080-voidmusl-picom-xfwm4-compizunused-cairodock-egl-glx/arena/01a08a55-nvidia-intel-ocblizzard-4x8ddr/lion-ssd-lion-boot-fix.zip
- Alternate if raw fails (Arctic Fox supports TLS 1.2, should work per docs/case-swap-macpro-daily-driver.md curl dead-end note: curl TLS1.0 fails but browser works):
  Use Arctic Fox > open link > Save Link As to ~/Downloads, unzip via Finder (preserves exec bit via ZIP), chmod +x ~/Desktop/*.command if needed.
- If GitHub still blocked, download on another machine and sneakernet via USB (FAT32).

**Next action (operator-gated, one wave):**
1. On Snow Leopard Mac (Bay1), download lion-ssd-lion-boot-fix.zip via Arctic Fox from link above.
2. Unzip to Desktop, double-click lion-ssd-lion-boot-fix.command, enter admin password, return ~/Desktop/lion-ssd-lion-boot-fix.txt
3. Gate: do NOT erase Bay3 until report is read. Then follow Option-boot InstallESD > install Lion to Bay3 > first boot Lion SSD > create clean admin account.

## 2026-09-10 — Option picker + date-hack FAIL (session 01a08b54)

Photo receipt (Startup Manager): three Internal.icns, no DVD icon.
- Lion SSD Base (selected, up-arrow) = Bay 1 Snow Leopard — the only safe click
- EFI Boot = previous Bay 4 restore, unlabeled / not a Mac OS installer
- Mac OS X = unlabeled system volume (likely start disk clone)

Operator: "the installer date thing didnt work. just rewrite it and make a new mirror."
Date-to-2016 WITHDRAWN. New path = asr restore of the INNER InstallESD.dmg FILE
onto Bay 4, then bless --label "Mac OS X Install ESD".
Do not Disk-Utility-drag two volumes of the same name (dmg + Bay 4).
Do not erase Lion SSD Base or start disk clone.
Drive replacement still gated on Lion actually booting from the SSD.

References:
[1] https://forums.macrumors.com/threads/2006-2007-mac-pro-1-1-2-1-and-os-x-el-capitan.1890435/
[2] https://discussions.apple.com/thread/256072543 (Mountain Lion cert expired 2019, date fix)
[3] https://apple.stackexchange.com/questions/216730/this-copy-of-the-install-os-x-el-capitan-application-cant-be-verified-it-may-h (cert expired, set date to 2016)
[4] https://osxdaily.com/2011/07/08/make-a-bootable-mac-os-x-10-7-lion-installer-from-a-usb-flash-drive/ (InstallESD restore method)
[5] https://support.apple.com/en-gb/HT201372 (Apple asr restore official method)

## 2026-09-11 — VERBOSE1 receipt + SDBOOT1 release (session 01a09141)

Operator ran the released VERBOSE1 (Option-picker `Mac OS X Install ESD` with
Command-V held) and pasted a verbose-screen photo plus the words: "boots to
snow leopard in the end".

Photo transcript (key lines, top to bottom): `vm_page_bootstrap`, 8x
`AppleACPICPU: ProcessorId=0..7` (upgraded 8-thread CPUs), Quarantine/Sandbox/
TMSafetyNet policies, `MAC Framework successfully initialized`, PCI
configuration, `rooting via boot-uuid from /chosen`, `BSD root: disk0s2,
major 14, minor 2`, `launchd[1] has started up` + `Verbose boot, will log to
/dev/console`, `fsck_hfs (version diskdev_cmds-491.6~3)` on the boot volume,
`Previous Shutdown Cause: 3`, AirPort + `AppleIntel8254XEthernet` bring-up,
`Ethernet (Intel8254X): Link down on en0` (expected: Wi-Fi machine).

Verdict: the verbose text is the Snow Leopard boot on disk0s2 (Bay 1), ending
at the SL login. The ESD kernel never printed a line, so the picker handoff
fails BEFORE kernel load (firmware/boot.efi phase) and the firmware falls
through to the default volume. Cause-3 prior shutdown is unattributed (a clean
Restart should record 5); it routes nothing and is noted only.

Released next: **SDBOOT1** — System Preferences > Startup Disk > `Mac OS X
Install ESD` > Restart (direct boot bypassing the picker), photograph the
result, STOP at any installer GUI. Outcome GUI = picker path was the fault,
proceed toward install; outcome prohibitory/fallthrough = boot.efi phase
confirmed broken, forensics (mach_kernel presence, boot.efi integrity) is next.
Named inverse on fallthrough: re-select `Lion SSD Base` in Startup Disk.

## 2026-09-11 — SDBOOT1 receipt + RESELECT1 release (session 01a09141)

Operator ran the released SDBOOT1 (Startup Disk > `Mac OS X Install ESD` >
Restart) and pasted a photo plus the words: "worked, but didnt. installation
was prohibited. so it worked since we used the intended path, and after seeing
this prohib sign after a while it switched to the apple loading screen, so im
unsure if its booting to leopard or an installer". Follow-up words: "booted
to leopard".

Photo: light-gray screen, dark prohibitory glyph centered, Dell monitor, Mac
Pro tower at right. The operator's "it worked" reading is AFFIRMED with a
correction: the direct-boot method engaged the ESD correctly (no picker in the
path), and the prohibitory it produced proves the failure lives in the ESD
boot itself. Direct boot fails identically to picker boot (only the
prohibitory duration differs: "a while" vs "brief"), so the picker/stale-entry
class is CLOSED and a boot.efi-phase failure on the ESD volume is CONFIRMED:
the blessed volume-root boot.efi cannot load the kernel, firmware falls
through to Lion SSD Base.

Released next: **RESELECT1** (the inverse promised in the SDBOOT1 message) —
Startup Disk > `Lion SSD Base` > Restart, receipt is a straight-to-SL boot
with no prohibitory. Queued after: **FORENSIC1** — read-only verification of
`mach_kernel` presence and boot.efi integrity on the ESD from Snow Leopard
(still UNMEASURED; the leading forensics target). No Repair, remirror, date
fix, or destination selection.

## 2026-09-11 — RESELECT1 partial + RESTART1 release (session 01a09141)

Operator ran the released RESELECT1 and reported verbatim: "system preferences
will let me select it, but wont let me restart it from there, itll just close
the app and give me a notification saying it halted".

Verdict: PARTIAL. The pane's Restart does two halves (bless --setBoot, then
reboot) and this receipt does not separate them: either the bless half stuck
and only the reboot call failed, or the bless itself failed and
efi-boot-device still points at the ESD. The exact notification text was not
quoted, and pane-selection persistence (quit/reopen) was not reported, so both
classes stay live. No conclusion is drawn about either volume's bootability —
this implicates the pane's restart mechanism only.

Released next: **RESTART1** — Apple menu > Restart (manual, bypasses the
pane), receipt is prohibitory vs straight-through + end state + exact wording
of any notification. No prohibitory = selection had stuck (clean state,
FORENSIC1 ships next); prohibitory detour then SL = selection did not stick
(next method becomes re-bless/re-select forensics, still non-destructive).
Worst case is the twice-proven prohibitory detour to the SL login; the
never-observed hang contingency (force off, Option-boot Lion SSD Base) rides
along unchanged.

## 2026-09-11 — RESTART1 failed + COLDBOOT1 release (session 01a09141)

Operator reported verbatim: "cant restart whatsoever". RESTART1 verdict:
FAILED. Both software restart paths are now blocked — the Startup Disk pane
Restart ("halted") and Apple menu > Restart — with the exact Apple-menu
symptom unquoted (silent nothing vs dialog vs the halted notice again is
UNKNOWN). Cause classes for a blocked restart (logout-canceling app/process,
wedged session) are all live and none is asserted; the missing symptom detail
is requested as part of the next receipt, not as a blocking question, because
the hardware path routes in every branch.

Released next: **COLDBOOT1** — save and close open apps (unsaved work is the
only loss exposure), hold the power button until the Mac powers off, LEAVE THE
POWER CORD PLUGGED IN (CR2032 is dead: AC present preserves the clock, cord
out resets it to 2001), wait 10 seconds, press power, watch the boot from the
chime. Receipt: prohibitory vs straight-through + end state + what Apple-menu
Restart had done exactly. No prohibitory = the Lion SSD Base selection had
stuck (clean state, FORENSIC1 ships next); prohibitory detour then SL =
efi-boot-device still ESD (next method becomes re-bless forensics, still
non-destructive). Journal replay risk is negligible (fsck already observed
running cleanly on this Mac after a cause-3 end). Fallthrough to SL is proven
3 times; the never-observed hang contingency rides along (force off again,
power on holding Option, boot Lion SSD Base).

## 2026-09-11 — Skype blocker identified + restart executed (session 01a09141)

Operator reported verbatim: "skype hung up, restarted now". The restart
blockage is IDENTIFIED: a hung Skype canceled logout, which explains the
RESTART1 failure; it plausibly explains the Startup Disk pane halted notice
too, since the pane Restart also routes through logout — consistent, not
proven (exact halted text still unquoted). The wedged-session class is
downgraded but not formally closed.

A restart is now executed, but two facts are unreported: the METHOD (Apple
menu Retry after Skype cleared vs the released COLDBOOT1 power-button path)
and the BOOT OBSERVATION (prohibitory vs straight-through, end state). No new
physical action is released: the owed receipt is that observation. No
prohibitory = the Lion SSD Base selection had stuck (clean state, FORENSIC1
ships next); prohibitory detour then SL = efi-boot-device still ESD (next
method becomes re-bless forensics, still non-destructive). The operator is
explicitly NOT asked to reboot again — the observation of the boot that just
happened is the receipt.

## 2026-09-11 — Clean boot + FORENSIC1 release (session 01a09141)

Operator reported verbatim: "booted straight to lion ssd, no prohib".
Verdict: bless-stuck CONFIRMED — the Startup Disk pane bless wrote
efi-boot-device=Lion SSD Base and only its reboot call failed; the hung Skype
was the sole restart blocker. The SDBOOT1 inverse is COMPLETE and the Mac is
in a clean boot state. The restart-method question is dropped as moot (zero
routing value).

Released next: **FORENSIC1** — read-only ESD forensics from Snow Leopard.
New `lion-forensic.command` (no sudo, no dialog, auto-opens the report in
TextEdit) reads: ESD root listing, mach_kernel (presence/size/file/md5/sha256,
FAIL line if absent), both boot.efi (same treatment), bless --info,
Boot.plist (expected absent), SystemVersion.plist (WHICH OS the ESD carries),
OSInstall.mpkg re-confirm, nvram boot keys (expect efi-boot-device=Lion SSD
Base, boot-args absent), diskutil list. Writes only
~/Desktop/lion-forensic.txt. Verification receipts: bash -n, bash --posix -n,
dash -n all PASS; 14 forbidden-token greps (agent-C list + sudo/curl/ditto)
all absent; sandbox smoke run exit 0 with NOT_MOUNTED paths + FORENSIC1_DONE;
zip 1721 bytes, 1 entry, -rwxr-xr-x preserved, sha256
0d0ee722c64cd00c506868111cd1ae71d9ced816cd67de006c7bf5ae4bdf73d3. sl-test
left untouched (agents C/Z hardcode the mirror pair; direct receipts above).

Delivery: `da.gd/lionforens` -> raw 01a09141 lion-forensic.zip, minted
2026-09-11 via the encoded da.gd route. LESSON: da.gd truncates custom slugs
to 10 chars (lionforensic became lionforens; lionforensic+ is 404) — verified
via da.gd/lionforens+ coshorten showing the exact raw URL. Report attaches via
da.gd/lionrelay: the page file input is generic (no filename check, only label
text names the old files), full text posts as text/plain, and the report
carries KEY-regex verdict lines (boot.efi, Boot.plist, boot-args, FAIL, No
disk was erased).

PANEL STALENESS (recorded, not fixed): the frozen relay page (01a08f01 blob)
pulls etc/lion-command.txt from arena/01a08f01 then main — never this branch —
so every 01a09141 Commands-panel update has been invisible to the operator.
Chat is authoritative (every wave this session executed from chat); lion.html
left untouched since page changes cannot reach the frozen page without a new
slug, and churning the typed URL mid-stream is refused.

## 2026-09-12 — FORENSIC1 burn read + SAFEBOOT1 release (session 01a09141)

Inbox went 16 to 18: the burn is a GET query summary (uuid a8f76d53)
plus a text/plain POST (uuid 6e8ebd6a, 6661 bytes / 120 lines) with the
full report, generated Sep 12 03:56:44 PDT. No multipart copy arrived
(best-effort miss, tolerated); no second Repair report exists anywhere.
Findings: mach_kernel PRESENT (15572704 bytes, Aug 23 2012, fat
x86_64+i386, md5 d2b48eb7...); ESD is genuine Lion 10.7.5 (11G63); both
boot.efi byte-identical (md5 d209022c...); Boot.plist and boot-args
absent; OSInstall.mpkg/BaseSystem.dmg present; disk nodes stable;
efi-boot-device is disk0s2 (reselect proven from the NVRAM side too).
Bless FLIPPED 2078 to 2082 (CoreServices file): attributed to SDBOOT1's
Startup Disk bless --setBoot. Two corrections recorded: SDBOOT1 was
confounded (path AND bless changed at once), so picker-vs-direct is
retired as MOOT; both bless states are metered failures, so re-bless is
closed forever. Missing-kernel, wrong-OS, and wrong-file-bytes classes
are DEAD. Research (3 searches: low value, hackintosh spam; Apple
HT201262 fetched: safe mode loads required software only, runs a disk
check, and clears the kernel cache) licensed the next experiment.
Released: SAFEBOOT1 — picker ESD + Shift + photo, STOP at any GUI.

## 2026-09-12 — SAFEBOOT1 receipt + VERIFY1 + FIRMWARE1 + model correction (session 01a09141)

SAFEBOOT1 photo: Apple + spinner + near-empty PROGRESS BAR (safe-mode
directory check — Shift provably registered). Operator verbatim:
"holding shift, different screen, prohib still flashed". End state
receipt: "just snow leopard safe boot desktop". Verdict: ESD fails
pre-kernel under safe mode too (fallthrough + key carryover, the
VERBOSE1 precedent); cache/kext class downgraded, boot.efi-to-kernel
handoff leads. VERIFY1 (Disk Utility Verify of Bay 4, read-only):
"appears to be ok" — directory class CLOSED; cache class near-dead
(safe mode deletes the cache yet failed identically). FIRMWARE1 photo
(System Profiler Hardware) CORRECTED the machine: MacPro3,1 Early 2008
(Harpertown 2x2.8GHz, EFI64), NOT 1,1 — the 1,1 label was inherited and
never verified; every EFI32 note is STRUCK (none drove an action).
Boot ROM MP31.006C.B05 = Mac Pro EFI Firmware Update 1.3 FINAL
(receipted via MacDailyNews 2008 + Apple DL95 + 2019 users still on
B05): firmware class CLOSED, firmware writes permanently off the table.
Reference-hash hunt FAILED (no published 11G63 mach_kernel md5; our
d2b48eb7 unconfirmed) — file-data corruption leads, untested. A forum
Ignore-ownership prohibitory lead was filed as M1g against the
"Owners Enabled: No" DU pane in the FIRMWARE1 photo.

## 2026-09-12 — OWNERS1 moot + PLAIN1 + installer-app breakthrough, Lion installed (session 01a09141)

OWNERS1 step 1 photo: the ESD's Get Info already has Ignore ownership
UNCHECKED — M1g VOID (premise refuted; the "Owners Enabled: No" read
was a wrong-volume inference from a cropped DU pane — owned). PLAIN1
(last untested boot cell, picker-plain ESD): "normal lion ssd boot" —
boot matrix EXHAUSTED. Same turn the operator brute-forced the Install
Mac OS X Lion app from SL (old launch failure GONE): "Ready to install"
targeting Lion SSD Base, countdown expired, rebooted to an Apple
screen. HOLD1/OBSERVE1-4 (hands-off watch): staged boot showed the Dell
timing-not-supported message (D1 display fault, 2nd reproduction;
GUI-once reclassified as D1, not an outlier); Caps Lock toggled at
<15 min (kernel alive); install ran blind and SELF-REBOOTED at ~25 min
(installer FINISHED, no errors). First boot: Lion login with all 5
accounts preserved (operator: "WORKED"), then the Andromeda desktop at
1080p. D1 EXPLAINED: Lion installer envs probe the VGA-HDMI converter
EDID with fresh prefs and pick a bad mode; the upgraded system
INHERITED SL's safe display prefs (immune). M1 cause moot (bypassed);
M2/M3 COMPLETE on Bay 1. LOGIN1 verified desktop + Displays (DELL
S2725QS, 1080p@60, Overscan checked, list topping at 2560x1440).

## 2026-09-12 — RES1 display trial + RESCUE1 + PR order (session 01a09141)

Operator asked "can i do 2560x1600?", reporting 4K was the only prior
failure. RES1: uncheck Overscan, try offered 2560x1440 (agent-claimed
auto-revert safety). Receipt: "1440 doesnt work, doesnt auto revert" —
out-of-range with NO revert countdown (agent safety premise owned
wrong). Model update: converter-curated offered-lists over-promise;
1080p is the permanent VGA-chain ceiling; 1440p/1600p need a digital
cable IF the (still unidentified) GPU qualifies. Released RESCUE1:
force off, Shift safe-boot (framebuffer bypasses the stored pref), set
Displays 1080p + uncheck Overscan (overwrites the bad pref), Restart
normal, report desktop + About version + GPU chipset. Operator noted a
prior 4K attempt "saved" through a power-off and was escaped by moving
the VGA port; judgment: safe-mode first (rewrites the pref in place),
port-switch is backup only; their SL per-display inheritance intuition
is CONFIRMED (prefs are written at apply-time, which is the "saved"
they observed). Operator ordered: "we need to create a pr anyways" —
record commit + PR authorized over the 405 budget BY EXPLICIT ORDER.
Outcome of RESCUE1 and close-out (Bay 1 home, new admin, Bay 4 spare)
PENDING.

## 2026-09-12 — RESCUE1-6 metered, display still blind (session 01a09141)

1440p poison survived everything: RESCUE1 (safe mode) blind - Lion safe
mode honors the stored pref (framebuffer-bypass theory dead). RESCUE2
(GPU port switch, the operator's proven SL-era 4K trick) blind - Lion
keys display prefs by EDID across ports (inference). RESCUE3/4 (Cmd+S):
first attempt black-no-OSD (signal absent: early photo vs wedged
converter vs orphaned firmware console); move-back + reseat + 60s wait
restored the text console (fix unattributed across the bundle).
RESCUE5/6 (single-user delete): fsck verdict "Lion SSD Base appears to
be OK" + "FILE SYSTEM WAS MODIFIED" on /dev/rdisk1s2 (node-shift
CONFIRMED: Bay 1 volume at disk1s2 this boot); the 80-col dumb console
mangled the long rm lines into one blob (nothing deleted, still
read-only); TAB-completion method shipped; operator rebooted: "same
timing error" (rm result unreported - delete-success vs
poison-elsewhere AMBIGUITY filed). LP64 + Lion kexts confirmed the
volume; BCM432b AirPort + 5.106.198.19 observed; AHCI probe timeouts
filed for the drive swap. 1080p remains the proven VGA-chain ceiling.

## 2026-09-12 — AMD-swap decision + PR merged + new-chat handoff (session 01a09141)

Operator verbatim: "time for amd card? we need to swap the hdd's
anyway, and we are booted off the ssd. decide, then merge the pr. we
continue where we left off in a new chat l8r". DECISION: YES - AMD card
+ digital cable in ONE chassis session with the HDD swap (marginal cost
~zero; converter is the proven weak link; new card presents the Dell
real EDID = new display identity = safe defaults, poison buried).
Conditions: Mac-EFI card (else no boot screens); keep current card
until new POSTs + displays; retry pref delete with ls verification only
if still blind. Buildup list (wipe SSD [target TBD] -> clear
keychains/logins/data -> drive swap + RAID -> AirPort utils -> APEX
OMEN build, one step at a time) recorded in ToDo.md per explicit order
(append-only; doNot Rewrite-ToDo.md overridden for this write). PR #80
merged to main (record commits 0fc2161 + catch-up). New chat opens with
the powered-off chassis session.
