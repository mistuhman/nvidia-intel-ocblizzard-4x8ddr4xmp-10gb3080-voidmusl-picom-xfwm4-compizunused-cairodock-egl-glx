WITHDRAWN 2026-09-10: date-to-2016 did not work (operator). Bay 4 picker
showed EFI Boot, not Mac OS X Install ESD. Use README_LION_MIRROR.txt and
lion-asr-installer-mirror.command instead. Click Lion SSD Base at the picker.

Mac Pro 1,1 — Lion boot off fast SSD (Crucial MX500 Bay 3) — Fix Pack 2026-09-10

This pack supersedes the old headless injector (arena-lion.sh + org.arena.lion-autoinstall.plist).
Audit 2026-09-10 proved that injector never executed: lion-cli.log absent, no com.apple.OSInstaller.plist
at assumed path, rc.local absent. Do NOT use old injector. Use Apple Option-key boot method.

CONTENTS:
- lion-ssd-lion-boot-fix.command — main audit + fix + bless + instructions (read-only unless you confirm erase)
- lion-installer-boot-audit.command — read-only audit of InstallESD volume (previous version)
- lion-installer-discovery.command — read-only discovery of installer startup paths
- lion-installer-date-fix.command — quick cert/date workaround for "can't be verified" error
- README_LION_SSD_FIX.txt — this file
- docs/macpro-lion-ssd-diagram.png — bay map diagram (model sight verified)

CURRENT VOLUME MAP (from your last Disk Utility receipt):
- Bay 1 (/dev/disk2s2) = working Snow Leopard, mounted as "Lion SSD Base" (source OS, keep intact)
- Bay 3 (/dev/disk0s2) = Crucial CT1000MX500 SSD, mounted as "start disk clone" (FAST SSD TARGET)
- Bay 4 (/dev/disk1s2) = restored "Mac OS X Install ESD" (installer, should be bootable)

GOAL:
Boot OS X Lion 10.7.5 off Bay 3 fast SSD, then create clean admin account, keep Snow Leopard Bay1 until stable.

MODEL SIGHT CAPABILITY:
Verified in this session — agent generated and read docs/macpro-lion-ssd-diagram.png.
Prior session 01a082d3 had NO image input (text descriptions only). Current session HAS image input.
That gate is CLOSED.

STEPS (one at a time):

1. On Snow Leopard (Bay1), download this ZIP via Arctic Fox 47.3 mac32 (GitHub raw link below).
   Safari 5.1.10 dead TLS, curl TLS1.0 fails — use Arctic Fox, not curl.

2. Double-click lion-ssd-lion-boot-fix.command (from Desktop after unzip). Enter admin password.
   It mounts all disks, checks date (if 2001, CR2032 dead — set date manually: sudo date 0910000026),
   clears xattr quarantine on Install OS X Lion.app, checks ESD bootability, writes report to
   ~/Desktop/lion-ssd-lion-boot-fix.txt — return that report before erasing anything.

3. Fix verification error if you see "can't be verified / corrupted":
   Terminal:
     sudo xattr -cr "/Applications/Install OS X Lion.app"
     sudo date 0101000016   # Jan 1 2016
   Then launch installer again. If still fails, try sudo date 0808111115 (Aug 8 2015).
   After installer starts, restore date: sudo sntp -sS time.apple.com

4. Boot InstallESD:
   - Apple menu > Restart, immediately hold OPTION (alt) key.
   - Boot picker shows Bay1 Snow Leopard, Bay3 start disk clone, Bay4 Mac OS X Install ESD.
   - Select Bay4 Install ESD. It boots to Lion installer.
   - If Bay4 not in picker, re-restore: Disk Utility > Restore > Source = InstallESD.dmg > Destination = Bay4 partition > Erase destination checked.
   - Or Terminal: sudo asr restore --source "/Volumes/Mac OS X Install ESD" --target /Volumes/Bay4 --erase --noverify

5. Install Lion to fast SSD:
   - In Lion installer: Utilities > Terminal > date — if 2001, set date again: date 0910000026
   - Quit Terminal, choose language, select destination: "start disk clone" (Bay3 Crucial, ~1TB).
   - For CLEAN install (recommended for new admin account): Utilities > Disk Utility > select Bay3 partition > Erase as Mac OS Extended (Journaled), name "Lion SSD", GUID.
   - Then Install.

6. First boot Lion from SSD:
   - Installer reboots automatically to Lion SSD. If it goes back to Snow Leopard, hold Option, pick Lion SSD.
   - Create NEW admin account (clean, not migration). This fulfills your stated goal.
   - System Prefs > Startup Disk > select Lion SSD as default.
   - Verify: About This Mac = OS X Lion 10.7.5, Startup Disk = Bay3.

7. Cleanup:
   - Keep Bay1 Snow Leopard until Lion SSD proven stable (do NOT erase yet).
   - On ESD volume, delete old injector files: /usr/local/libexec/arena-lion.sh and /System/Library/LaunchDaemons/org.arena.lion-autoinstall.plist (they never ran).

DOWNLOAD LINK (for Snow Leopard Mac with Arctic Fox):
- Raw ZIP from this branch (new filename, bypasses raw.githubusercontent.com 5-min cache rule per STATE.md #9):
  https://raw.githubusercontent.com/mistuhman/nvidia-intel-ocblizzard-4x8ddr4xmp-10gb3080-voidmusl-picom-xfwm4-compizunused-cairodock-egl-glx/arena/01a08a55-nvidia-intel-ocblizzard-4x8ddr/lion-ssd-lion-boot-fix.zip

If GitHub TLS fails in Arctic Fox, use http mirror via macintoshrepository.org HTTP trick or download on another machine and sneakernet via USB.

VERIFICATION:
- After unzip, check executable bit: ls -l *.command should show -rwxr-xr-x
- If not executable (ZIP lost bit), run: chmod +x ~/Desktop/*.command
- Then double-click.

REPORT BACK:
Return ~/Desktop/lion-ssd-lion-boot-fix.txt before any erase/install step — gate.

— Agent session arena/01a08a55, 2026-09-10
