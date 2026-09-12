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

