#!/bin/sh
# Mac Pro 1,1 / Snow Leopard 10.6.8 — Lion ESD forensics collector (FORENSIC1).
# Double-click on Snow Leopard AFTER a clean boot. Answers the boot.efi-phase
# question: is mach_kernel present and intact on Mac OS X Install ESD?
#
# READS: ESD root listing, mach_kernel, both boot.efi files, bless info,
# Boot.plist, SystemVersion.plist, OSInstall.mpkg, NVRAM boot keys, disk list.
# WRITES ONLY: ~/Desktop/lion-forensic.txt (falls back to $HOME).
# DOES NOT: write bless data, erase, restore, mount, change the clock,
# change NVRAM, use the network, or ask for an admin password.

PATH=/bin:/sbin:/usr/bin:/usr/sbin
if [ -n "$LION_PATH" ]; then
  PATH="$LION_PATH:$PATH"
fi
export PATH
umask 022

REPORT_DIR="$HOME/Desktop"
if [ ! -d "$REPORT_DIR" ]; then
  REPORT_DIR="$HOME"
fi
REPORT="$REPORT_DIR/lion-forensic.txt"
ESD="/Volumes/Mac OS X Install ESD"

say() { printf '%s\n' "$*"; }

hash_file() {
  F="$1"
  if [ -f "$F" ]; then
    if command -v md5 >/dev/null 2>&1; then
      md5 "$F" 2>&1 || true
    else
      say "md5 tool missing"
    fi
    if command -v shasum >/dev/null 2>&1; then
      shasum -a 256 "$F" 2>&1 || true
    else
      say "shasum tool missing"
    fi
  else
    say "ABSENT: $F"
  fi
}

(
say "FORENSIC1 — Lion ESD boot-file forensics (read-only)"
say "Generated: $(date)"
say "MODE=esd forensics on Snow Leopard, no writes except this report"
say "REPORT=$REPORT"
say "ESD=$ESD"
say ""
say "This collector is read-only against disks, NVRAM, and the clock."
say "No disk was erased, restored, blessed, mounted, or changed by this collector."
say ""

say "===== HOST ====="
sw_vers 2>/dev/null || true
uname -a 2>/dev/null || true
date 2>/dev/null || true

say ""
say "===== ESD ROOT LISTING (READ ONLY) ====="
if [ -d "$ESD" ]; then
  ls -la "$ESD" 2>&1 || true
else
  say "ESD_NOT_MOUNTED"
fi

say ""
say "===== MACH_KERNEL (READ ONLY) ====="
KERN="$ESD/mach_kernel"
if [ -f "$KERN" ]; then
  say "MACH_KERNEL=present"
  ls -l "$KERN" 2>&1 || true
  if command -v file >/dev/null 2>&1; then
    file "$KERN" 2>&1 || true
  else
    say "file tool missing"
  fi
  hash_file "$KERN"
else
  say "MACH_KERNEL=ABSENT"
  say "FAIL: no kernel for boot.efi to load"
fi

say ""
say "===== BOOT.EFI FILES (READ ONLY) ====="
for E in "$ESD/boot.efi" "$ESD/System/Library/CoreServices/boot.efi"; do
  say "--- $E ---"
  if [ -f "$E" ]; then
    ls -l "$E" 2>&1 || true
    if command -v file >/dev/null 2>&1; then
      file "$E" 2>&1 || true
    fi
    hash_file "$E"
  else
    say "ABSENT: $E"
  fi
done

say ""
say "===== BLESS INFO (READ ONLY) ====="
if [ -d "$ESD" ]; then
  bless --info "$ESD" 2>&1 || true
else
  say "ESD_NOT_MOUNTED"
fi

say ""
say "===== BOOT PLIST (READ ONLY) ====="
PLIST="$ESD/Library/Preferences/SystemConfiguration/com.apple.Boot.plist"
if [ -f "$PLIST" ]; then
  say "Boot.plist PRESENT (unexpected)"
  cat "$PLIST" 2>&1 || true
else
  say "Boot.plist absent (expected: no Graphics Mode path)"
fi

say ""
say "===== ESD OS VERSION (READ ONLY) ====="
SV="$ESD/System/Library/CoreServices/SystemVersion.plist"
if [ -f "$SV" ]; then
  cat "$SV" 2>&1 || true
else
  say "ABSENT: $SV"
fi

say ""
say "===== INSTALLER PACKAGE (READ ONLY) ====="
PKG="$ESD/Packages/OSInstall.mpkg"
if [ -e "$PKG" ]; then
  ls -ld "$PKG" 2>&1 || true
else
  say "ABSENT: $PKG"
fi

say ""
say "===== NVRAM BOOT KEYS (READ ONLY) ====="
nvram boot-args 2>&1 || true
nvram -p 2>/dev/null | grep -iE '^(boot|efi|auto-boot|graphics|kernel)' || true

say ""
say "===== DISK LIST (READ ONLY) ====="
diskutil list 2>&1 || true

say ""
say "===== VERDICT ====="
say "FORENSIC1_DONE No disk was erased."
say "Attach this report through da.gd/lionrelay (any .txt attaches)."
) > "$REPORT" 2>&1
STATUS=$?

cat "$REPORT"
printf '\nSaved report: %s\n' "$REPORT"
open -a TextEdit "$REPORT" 2>/dev/null || true
exit "$STATUS"
