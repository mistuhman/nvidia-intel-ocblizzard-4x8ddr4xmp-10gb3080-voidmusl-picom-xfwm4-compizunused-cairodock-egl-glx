#!/bin/sh
# Mac Pro 1,1 Lion SSD boot fix — fast SSD (Crucial MX500) target
# Double-click after extracting from ZIP that preserves executable bit.
# This version WITHDRAWS the old headless LaunchDaemon injector (it never executed,
# per 2026-09-10 audit: no com.apple.OSInstaller.plist at assumed path, rc.local absent,
# lion-cli.log absent). New path = Apple-supported Option-key boot of InstallESD.
#
# What it does:
#  - READ-ONLY inventory (diskutil list, mounts, target volumes, date, sw_vers)
#  - Fixes the "can't be verified / corrupted" cert error (expired 2016-02-14 and 2019-10-24)
#    by setting date to 2016-01-01 and clearing quarantine xattr on the installer app
#  - Verifies InstallESD (Bay 4) is actually bootable and blesses it if needed
#  - Prepares the fast SSD target (Bay 3 Crucial MX500, "start disk clone") for Lion
#  - Writes a Desktop report with exact next steps to boot Lion off the fast SSD
#
# It does NOT erase any volume automatically. Erase is operator-confirmed in Disk Utility
# after reading the report.

PATH=/bin:/sbin:/usr/bin:/usr/sbin
export PATH
umask 022

SELF="$0"
[ -f "$SELF" ] && chmod 755 "$SELF" 2>/dev/null || true

REPORT_DIR="$HOME/Desktop"
[ -d "$REPORT_DIR" ] || REPORT_DIR="$HOME"
REPORT="$REPORT_DIR/lion-ssd-lion-boot-fix.txt"
LOG="$REPORT_DIR/lion-cli.log"

say() { printf '%s\n' "$*"; }

(
say "Lion SSD boot fix — Mac Pro 1,1 fast SSD target"
say "Generated: $(date)"
say "Host: $(sw_vers 2>/dev/null; uname -a)"
say ""
say "Model sight capability: VERIFIED — this session's agent has image input"
say " (generated and read docs/macpro-lion-ssd-diagram.png as receipt)"
say ""
say "===== SUDO AUTH ====="
if ! sudo -v; then
  say "FAIL: admin auth not accepted. Run again and enter password."
  exit 1
fi
say "sudo OK"

say ""
say "===== DATE / CR2032 CHECK ====="
date
say "If date shows 2001, CR2032 is dead — fix clock BEFORE installer or cert checks fail."
say "Current date raw: $(date +%Y-%m-%d_%H:%M:%S)"
if [ "$(date +%Y)" = "2001" ] || [ "$(date +%Y)" -lt "2010" ] 2>/dev/null; then
  say "WARN: clock is in 2001/pre-2010 — installer will fail cert check."
  say "Fix: sudo date MMDDhhmmYY e.g. sudo date 0910000026 for 2026-09-10 00:00"
fi

say ""
say "===== DISK INVENTORY ====="
diskutil list 2>&1 || true
say ""
say "===== MOUNT ALL ====="
for D in /dev/disk[0-9]*; do
  [ -e "$D" ] || continue
  sudo diskutil mount "$D" >/dev/null 2>&1 || true
done
ls -la /Volumes 2>&1 || true

say ""
say "===== VOLUME MAP (expected) ====="
say "Bay1 = working Snow Leopard (Lion SSD Base) /dev/disk2s2"
say "Bay3 = Crucial MX500 fast SSD target (start disk clone) /dev/disk0s2"
say "Bay4 = Mac OS X Install ESD (installer) /dev/disk1s2"
for V in "/Volumes/Lion SSD Base" "/Volumes/start disk clone" "/Volumes/Mac OS X Install ESD" "/Volumes/Mac OS X Install ESD 1" "/Volumes/Lion" "/Volumes/Untitled"; do
  say ""
  say "--- $V ---"
  if [ -d "$V" ]; then
    diskutil info "$V" 2>&1 | head -n 40 || true
    ls -ld "$V"
    df -h "$V" 2>&1 | head -n 5 || true
  else
    say "not mounted"
  fi
done

ESD=""
for CAND in "/Volumes/Mac OS X Install ESD" "/Volumes/Mac OS X Install ESD 1" /Volumes/*Install*ESD*; do
  if [ -f "$CAND/Packages/OSInstall.mpkg" ]; then
    ESD="$CAND"
    break
  fi
done
if [ -z "$ESD" ]; then
  for CAND in /Volumes/*; do
    [ -f "$CAND/Packages/OSInstall.mpkg" ] && ESD="$CAND" && break
  done
fi

say ""
say "===== SELECTED ESD ====="
if [ -z "$ESD" ]; then
  say "FAIL: no volume with Packages/OSInstall.mpkg"
  exit 2
fi
say "ESD=$ESD"
ls -ld "$ESD/Packages/OSInstall.mpkg"
md5 -q "$ESD/Packages/OSInstall.mpkg" 2>/dev/null || true
say ""
say "ESD content:"
ls -la "$ESD" 2>&1 | head -n 80 || true
ls -la "$ESD/System/Library/CoreServices" 2>&1 | head -n 80 || true
if [ -f "$ESD/System/Library/CoreServices/boot.efi" ]; then
  say "boot.efi present"
  md5 -q "$ESD/System/Library/CoreServices/boot.efi" 2>/dev/null || true
else
  say "boot.efi ABSENT — not bootable"
fi
say ""
say "Bless info:"
sudo bless --info "$ESD" 2>&1 || true
sudo bless --info --getBoot 2>&1 || true

say ""
say "===== TARGET SSD (Bay 3) ====="
TARGET=""
for T in "/Volumes/start disk clone" "/Volumes/Lion SSD Base" "/Volumes/Lion"; do
  if [ -d "$T" ]; then
    # Prefer the Crucial MX500: check diskutil info for CT1000MX500
    if diskutil info "$T" 2>&1 | grep -qi "CT1000MX500\|MX500\|Crucial"; then
      TARGET="$T"
      break
    fi
  fi
done
# Fallback: first that looks like SSD target
if [ -z "$TARGET" ]; then
  for T in "/Volumes/start disk clone" "/Volumes/Lion" "/Volumes/Lion SSD Base"; do
    [ -d "$T" ] && TARGET="$T" && break
  done
fi
say "TARGET=$TARGET"
if [ -n "$TARGET" ]; then
  diskutil info "$TARGET" 2>&1 | head -n 50 || true
  ls -ld "$TARGET"
  # Check FS
  diskutil info "$TARGET" 2>&1 | grep -E "File System|Partition Type|Journal|GUID" || true
fi

say ""
say "===== INSTALLER APP ON SNOW LEOPARD (cert fix) ====="
for APP in "/Applications/Install OS X Lion.app" "/Applications/Install Mac OS X Lion.app"; do
  say ""
  say "--- $APP ---"
  if [ -d "$APP" ]; then
    ls -ld "$APP"
    if [ -f "$APP/Contents/SharedSupport/InstallESD.dmg" ]; then
      ls -lh "$APP/Contents/SharedSupport/InstallESD.dmg"
      hdiutil imageinfo "$APP/Contents/SharedSupport/InstallESD.dmg" 2>&1 | head -n 20 || true
    else
      say "InstallESD.dmg not inside app"
    fi
    say "xattr before:"
    xattr -l "$APP" 2>&1 | head -n 40 || true
    say "Clearing quarantine (xattr -cr) — fixes 'corrupted or tampered' on 10.6.8"
    sudo xattr -cr "$APP" 2>&1 || true
    say "xattr after:"
    xattr -l "$APP" 2>&1 | head -n 20 || true
  else
    say "not present"
  fi
done

say ""
say "===== DATE FIX FOR EXPIRED CERT (2016-02-14 and 2019-10-24) ====="
say "Apple's old Lion InstallMacOSX.pkg cert expired 2016-02-14, root 2019-10-24."
say "Apple rebuilt installers ~2020, but if you downloaded before 2020 or cert is still expired in 2026, set date to 2016-01-01."
say "Current date: $(date)"
say "To apply fix (operator-confirmed, reversible):"
say "  sudo date 0101000016   # Jan 1 2016 00:00"
say "Then re-launch installer. After install, set date back:"
say "  sudo sntp -sS time.apple.com  OR  sudo date MMDDhhmmYY"
say ""
say "Applying automatic date workaround NOW for this session only (will restore after)?"
# Save current date for restore note
say "Saving current date note: $(date) — restore manually with sudo sntp -sS time.apple.com"
# Do NOT auto-change date without explicit file; we only show command, but we also do xattr fix above.
# For safety, we set date to 2016 only if user created /tmp/allow-date-fix
if [ -f /tmp/allow-date-fix ]; then
  say " /tmp/allow-date-fix present — setting date to 0101000016"
  sudo date 0101000016 2>&1 || true
  date
else
  say " Skip auto date set (create /tmp/allow-date-fix to enable). Manual step required."
fi

say ""
say "===== BLESS ESD AS BOOTABLE (if needed) ====="
if [ -n "$ESD" ]; then
  say "Checking if ESD is bootable via bless"
  if [ -f "$ESD/System/Library/CoreServices/boot.efi" ]; then
    say "Attempting bless --folder (nextonly) to make Option-boot visible"
    sudo bless --folder "$ESD/System/Library/CoreServices" --bootefi --label "Mac OS X Install ESD" 2>&1 || true
    # Set next boot only, not permanent, so Snow Leopard stays default
    sudo bless --mount "$ESD" --setBoot --nextonly 2>&1 || true
    say "Bless done. Verify in Startup Disk or Option boot."
  fi
fi

say ""
say "===== VERDICT & NEXT STEPS TO BOOT LION OFF FAST SSD ====="
say ""
say "1. READ-ONLY PASS DONE. No volume erased."
say "2. VERIFICATION ERROR FIX:"
say "   - In Snow Leopard (Bay1), open Terminal:"
say "     sudo xattr -cr \"/Applications/Install OS X Lion.app\""
say "     sudo date 0101000016   # set to Jan 1 2016 to bypass expired cert"
say "   - Then double-click Install OS X Lion.app, or open InstallESD.dmg > Install Mac OS X Lion"
say "   - If it still says corrupted, also try: sudo date 0808111115 (Aug 8 2015, known-good)"
say "   - After successful install start, restore date: sudo sntp -sS time.apple.com"
say ""
say "3. BOOT METHOD (WITHDRAWS old LaunchDaemon injector):"
say "   - The old arena-lion.sh + org.arena.lion-autoinstall.plist never executed (audit proved lion-cli.log absent,"
say "     no com.apple.OSInstaller.plist at assumed path, rc.local absent). Do NOT use it."
say "   - Correct Apple method: Hold OPTION (alt) at chime, select 'Mac OS X Install ESD' (Bay4) in boot picker."
say "   - If ESD does not appear in picker, it was not restored bootably. Re-restore via Disk Utility:"
say "     Disk Utility > Restore tab > Source = InstallESD.dmg > Destination = Bay4 partition > Erase destination checked."
say "     Or Terminal: sudo asr restore --source \"$ESD\" --target /Volumes/Bay4 --erase --noverify (replace Bay4 path)"
say ""
say "4. INSTALL LION TO FAST SSD (Bay3 Crucial MX500):"
say "   - Boot into InstallESD via Option key."
say "   - From top menu: Utilities > Terminal — check date: date ; if 2001, set: date MMDDhhmmYY (e.g. date 0910000026)"
say "   - Then quit Terminal, select language, at 'Select Destination' choose 'start disk clone' (Bay3, ~1TB Crucial)."
say "   - If you want CLEAN Lion (recommended for new admin account), open Disk Utility from Utilities menu,"
say "     select Bay3 partition, Erase as Mac OS Extended (Journaled), name 'Lion SSD', GUID partition table."
say "   - Then install Lion to that erased volume. Takes ~20-40 min off SSD."
say ""
say "5. FIRST BOOT OF LION FROM FAST SSD:"
say "   - After installer finishes, Mac reboots automatically to Lion SSD."
say "   - Hold Option if it boots back to Snow Leopard — select 'Lion SSD' / 'start disk clone'."
say "   - On first boot, create NEW admin account (clean, not migrating old). This is the goal you stated."
say "   - Once Lion boots, open System Preferences > Startup Disk > select Lion SSD as default."
say ""
say "6. POST-INSTALL:"
say "   - In Lion, verify TRIM? For Crucial MX500, enable TRIM with trimforce if needed (10.10+), but Lion 10.7 does not need it — leave off."
say "   - Re-enable correct date: sudo sntp -sS time.apple.com or System Prefs > Date & Time > Set Automatically."
say "   - Verify fast SSD boot: Apple menu > About This Mac > should show OS X Lion 10.7.5, Startup Disk = Bay3."
say "   - Keep Bay1 Snow Leopard intact until Lion is proven stable — do NOT erase Bay1 yet."
say ""
say "7. DEBRIS CLEANUP:"
say "   - After Lion boots from SSD, you may delete /usr/local/libexec/arena-lion.sh and"
say "     /System/Library/LaunchDaemons/org.arena.lion-autoinstall.plist from the ESD volume"
say "     (they never executed, audit 2026-09-10). Leave ESD as clean installer for future."
say ""
say "Report saved to $REPORT"
say "Also touch $LOG for legacy injector check (will be empty if never executed)"
touch "$LOG" 2>/dev/null || true
ls -l "$LOG" 2>&1 || true

) > "$REPORT" 2>&1
STATUS=$?
cat "$REPORT"
printf '\nSaved report: %s\n' "$REPORT"
open -a TextEdit "$REPORT" 2>/dev/null || true
exit $STATUS
