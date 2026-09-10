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

## Operator goal

Boot the Mac from the SATA SSD with Lion, then create a clean installation administrator account and handle the remaining HDD bays from the working SSD system. Drive changes remain deferred until the OS boot path is proven.

## 2026-09-09c correction (session 01a0889a)

Operator correction: the previous chat did NOT record context completely and the L1 wave
re-ran already-exhausted troubleshooting (outer/inner/media attempts all done, "goes nowhere").
Photo ground truth supersedes the rename receipt above: Disk Utility shows the Crucial
CT1000MX500SSD volume still named **start disk clone**, and the name **Lion SSD Base** on a
**1 TB SAMSUNG HD103U** volume; third volume Untitled on a second HD103U; OPTIARC DVD RW
present; no USB device in the tree. Lion target = the MX500 volume (start disk clone).

Cause re-attribution: the blocking cert expired 2016-02-14 (Apple thread 250593361), so the
earlier 2016 date test sat on the wrong side of expiry and excluded nothing; an in-era date
(2013, accepted receipt 255062266 "Lion - August 2013 - Works") was NEVER tested. Wave L2 =
sudo date 0801120013 + outer installer onto the MX500 volume, CLI OSInstall.mpkg bypass as the
same-wave fallback. Operator 2026-09-09c: the clock has NEVER reset - date/time are current
and hold; the stale dead-CR2032 resets-to-2001 note (case-swap-macpro-daily-driver.md step 3)
does not apply to the present machine, so there is NO post-reboot date re-set step; after the
install the date is set forward again once, from the booted system.

Photo receipt (operator photo, read by vision): Install Mac OS X Lion window with target
`Lion SSD Base`, `About 3 minutes remaining`, Cancel button; modal dialog
`The software could not be verified. It may have been corrupted or tampered with during downloading.`;
Date & Time pref open, auto-set unchecked, manual 9/9/2026 6:02:51 PM; Finder `Searching "This Mac"` behind.

New path chosen (per Current gate: do not repeat outer/inner app attempts):
bootable InstallESD.dmg USB. Precedent: 2011 Apple thread 3193133 - user with MD5-VERIFIED
InstallESD (`b5d3753c62bfb69866e94dca9336a44a` cited as the good 2011 checksum) still hit the
same verification wall in-app on 10.6.8; the validated exit was a bootable Lion USB key.
InstallESD restore-to-USB procedure confirmed for the app-bundle path and MP 1,1-era hardware
(macrumors 2355618; gist Diegus83 asr variant).

Wave L1 (shipped in chat 2026-09-09b): dismiss dialog (OK, then Cancel the installer, no reboot
into it), read-only integrity lines (ls + md5 of InstallESD.dmg, recorded against the 2011
reference as informational), then Disk Utility restore of InstallESD.dmg to a sacrificial
>=8GB USB (GUID + Mac OS Extended Journaled, Erase Destination). Rollback if the clone is left
half-written: Option-boot the original SL source volume (untouched per gate).
Wave L2 (after L1 receipt): Option-boot the USB; if the media installer also reports
verification failure, in-installer Utilities-Terminal era date (2011/2012, NOT 2016) is the
inner knob - a new verifier context, not a relabel of the closed 2016 test.

## 2026-09-09e phase-2 failure + CLI wave (session 01a0889a)

Operator report: "same error halfway through installation" - the in-era 2013 date passed the
phase-1 outer-app verifier but the rebooted installer environment re-verified packages and
failed mid-phase-2. Date-alone class CLOSED. Operator clarification 2026-09-09e: the phase-2
popup is not a distinct error - it is the same installer notification that the file is
corrupted (the verifier notice); L3 unchanged. Wave L3 = CLI bypass (no GUI verifier):
mount InstallESD, sudo installer -pkg .../OSInstall.mpkg -target /Volumes/start* -verboseR
from the running 10.6.8, targeting the MX500 volume directly. Branch B if the CLI refuses
outside the installer environment: DU-restore InstallESD.dmg onto the Untitled volume
(only Untitled erased), Option-boot it, env Terminal: date 0801120013 + plain
installer -pkg OSInstall.mpkg -target /Volumes/start* -verboseR (SE 216730 receipt pattern).
PR #72 opened 2026-09-09 from arena/01a0889a for this session's receipts and waves.

## 2026-09-09f Branch A first attempt (session 01a0889a)

Photo receipt: hdiutil attach verified ALL InstallESD CRC32s (overall $D61C13C2) - image
intact, corruption class CLOSED; mounted /Volumes/Mac OS X Install ESD (disk3). sudo warned
timestamp too far in the future (2026 ticket vs live 2013 clock) - clock still 2013.
installer CLI rejected .../System/Installation/Packages/OSInstall.mpkg as invalid: on the RAW
mounted ESD the packages live at top-level /Packages (the macrumors 2355618 script copies them
into System/Installation only when BUILDING media); unmatched glob passed literally.
L4 = sudo installer -pkg /Volumes/Mac*ESD/Packages/OSInstall.mpkg -target /Volumes/start* -verboseR;
bless follow-up queued if the install succeeds but does not boot; Branch B pre-approved.

## 2026-09-09g Branch A closed, Branch B live (session 01a0889a)

Operator receipt: "command line installs of mac os x are not supported on systems older than
10.7" - the 10.6 host installer refuses OS mpkgs; the SE/macrumors CLI receipts were run from
INSIDE the 10.7 installer environment. Branch A CLOSED. Branch B (pre-approved): DU restore of
the mounted+verified ESD volume onto Untitled (only Untitled erased), Option-boot it, env
Terminal: date 0801120013 + bare installer -pkg /Volumes/Mac*ESD/Packages/OSInstall.mpkg
-target /Volumes/start* -verboseR; then Option-boot the MX500 result; date forward. If the env
CLI still raises the verifier notice, next class = archive.org prebuilt installed-Lion image
restored block-level (no installer at all).

Photo receipt: Terminal shows `sudo date 0801120013` + date output ending `DT 2013` +
`open /Applications/Install*Lion.app`; installer shows Mac OS X Lion "Preparing to install.
Your computer will restart automatically." with progress bar and NO verification dialog -
the in-era 2013 date PASSES the verifier that 2026 and 2016 failed. Installer destination
icon = Lion SSD Base (per DU photo: on a SAMSUNG HD103U; the MX500 volume is still named
start disk clone). Run allowed to complete on either disk. Post-boot plan: set date forward
(sudo date 0909160026), diskutil list + diskutil info / to attribute the booted Lion volume
to a physical disk; if it is not the CT1000MX500SSD, Disk Utility Restore the installed Lion
volume onto the MX500 volume (block copy - no Apple signature verification applies to a
restore of an installed system), then Startup Disk select + reboot.

## 2026-09-09h ESD boot out-of-range on the Dell 4K (session 01a0889a)

Photo receipt: Option picker WAS visible; after selecting the ESD volume ("Mac OS X") the Dell
OSD says input timing not supported (3840x2160@60 listed) - firmware/early-boot mode from the
ESD boot is out of the monitor's lock range while 10.6 boots fine. Ordered zero-cost wave:
(1) power-cycle the monitor with the Mac still booted into the env (re-lock receipts,
macrumors 1903777); (2) explicit monitor input select if OSD persists; (3) if display returns,
run the env Terminal lines; (4) else power off, boot 10.6, report - next = spare display
(DVI-VGA passive adapter works on the GTX 285) or archive.org block-level restore. Installed
Lion with full 10.7 NVIDIA kexts may re-pick an EDID-valid mode even where the env stayed on
the EFI framebuffer, so out-of-range may be env-only.

## 2026-09-09i headless auto-install wave (session 01a0889a)

Operator: the VGA-to-HDMI converter cannot pass the env's mode on either DVI/VGA port; asks
"changing cards possible?" - answer yes (any PCIe x16; needs Mac EFI ROM for visible picker;
zero-spend = shelf card only) but parked in favor of a headless path: the restored ESD volume
on Untitled is writable from 10.6, so inject /usr/local/libexec/arena-lion.sh + a RunAtLoad
LaunchDaemon (org.arena.lion-autoinstall.plist) that sets date 0801120013, diskutil mountAll,
runs installer -pkg /Packages/OSInstall.mpkg -target "/Volumes/start disk clone" -verboseR,
copies the log to the Lion SSD Base volume root (lion-cli.log) and reboots. Operator boots the
ESD volume blind via Option, walks away; reads /lion-cli.log from 10.6 after the auto-reboot.
Scratch-volume-only modification, fully reversible. Card swap and archive.org block-level
restore remain fallbacks.

## 2026-09-09j phone-operated delivery (session 01a0889a)

Operator is at the Mac but reading chat on a phone - no manual entry. Payload shipped as
scripts/arena-lion-autoinstall.command (double-clickable on 10.6; also published as a public
gist for a short clickable URL): detaches the RO dmg, mountAll, injects arena-lion.sh +
RunAtLoad plist into the scratch ESD volume, echoes next steps. Then Option-boot "Mac OS X"
blind, auto-reboot, cat /lion-cli.log from 10.6.

## 2026-09-09k short-URL payload delivery (session 01a0889a)

Photo receipt of Arctic Fox showing 404 on typed raw GitHub URL: operator manually typed the 140-character URL from mobile and omitted the repo slug prefix (`m-xfwm4-...` instead of `mistuhman/nvidia-intel-ocblizzard-...`).
Fix delivered:
1. Root-level `lion.command` added with explicit `chmod 644` on injected launchd plist.
2. Short URL `da.gd/ytW5F` (11 characters) created pointing directly to `lion.command`.
3. Fallback click route: `github.com/mistuhman` -> repository -> `lion.command` -> Raw.
4. Execution flow unchanged: save to Desktop, double-click (or `bash ~/Desktop/lion.command`), reboot to "Mac OS X" blind via Option key, auto-reboot to 10.6, verify `/Volumes/Lion SSD Base/lion-cli.log`.

## 2026-09-09l mountAll & unmounted volume fix (session 01a0889a)

Photo receipt of Terminal running `lion.command`:
1. `diskutil: did not recognize verb "mountAll"` -> 10.6 `diskutil` binary does not support `mountAll`.
2. `/Volumes` only showed `Lion SSD Base`, `firefoxos`, `start disk clone` because the restored ESD partition on the second drive was unmounted.
3. Fix implemented in `lion.command`:
   - Iterative partition mount: `for d in /dev/disk[0-9]*; do diskutil mount "$d"; done`.
   - Dynamic ESD finder: scans `/Volumes/*` for `OSInstall.mpkg` rather than assuming `/Volumes/Mac*`.
   - Same resilient loop inside the injected headless `arena-lion.sh` payload.

## 2026-09-09m headless installer boot & shutdown flash observation (session 01a0889a)

Operator booted the restored ESD volume blind; screen showed unsupported timing for ~3 min; observed split-second red text when shutting off / rebooting.
Analysis: During shutdown/reset, the GPU video mode briefly drops back to standard VESA/VGA timing before power down, allowing the Dell monitor to momentarily sync and display the console buffer text.
Next verification: Boot back to 10.6 and inspect `/lion-cli.log` to determine whether the installer was actively extracting packages or if an error occurred.

## 2026-09-09n headless installation in flight (session 01a0889a)

Operator clarification: the installer is actively running uninterrupted in headless mode (8 minutes elapsed). The red text observation was from the prior reboot mode drop.
Plan: Await automatic reboot (~15-20 minutes total duration). Upon automatic reboot into 10.6, inspect `/lion-cli.log`. If installer returned exit status 0 ("The install was successful"), proceed to Option-boot the Crucial MX500 target SSD ("start disk clone").
