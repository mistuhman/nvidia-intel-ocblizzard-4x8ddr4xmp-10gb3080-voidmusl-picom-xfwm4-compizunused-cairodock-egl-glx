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
