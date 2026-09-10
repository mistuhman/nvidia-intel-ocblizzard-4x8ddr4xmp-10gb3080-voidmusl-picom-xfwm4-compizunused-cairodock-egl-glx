#!/bin/sh
# Mac Pro 1,1 Lion installer startup discovery
# Double-click after extracting from the accompanying ZIP.
# This is a read-only inspection: it mounts volumes and writes a Desktop report.
# It does not erase, install, bless, or change any installer/startup file.

PATH=/bin:/sbin:/usr/bin:/usr/sbin
export PATH
umask 022

[ -f "$0" ] && chmod 755 "$0" 2>/dev/null || true

REPORT_DIR="$HOME/Desktop"
[ -d "$REPORT_DIR" ] || REPORT_DIR="$HOME"
REPORT="$REPORT_DIR/lion-installer-discovery.txt"

say() {
  printf '%s\n' "$*"
}

show() {
  ITEM="$1"
  say ""
  say "===== $ITEM ====="
  if [ ! -e "$ITEM" ]; then
    say "ABSENT"
    return
  fi
  ls -ld "$ITEM"
  stat -f 'owner=%Su group=%Sg mode=%Sp path=%N' "$ITEM" 2>/dev/null || true
  if [ -f "$ITEM" ]; then
    md5 -q "$ITEM" 2>/dev/null || true
    file "$ITEM" 2>/dev/null || true
    say "--- first 200 lines ---"
    sed -n '1,200p' "$ITEM" 2>&1 || true
    say "--- end ---"
  fi
}

(
  say "Lion installer startup discovery"
  say "Generated: $(date)"
  say "Read-only inspection: no installer or target file is changed."

  if ! sudo -v; then
    say "FAIL: administrator authorization was not accepted."
    exit 1
  fi

  for DISK in /dev/disk[0-9]*; do
    [ -e "$DISK" ] || continue
    sudo diskutil mount "$DISK" >/dev/null 2>&1 || true
  done

  ESD="/Volumes/Mac OS X Install ESD"
  if [ ! -f "$ESD/Packages/OSInstall.mpkg" ]; then
    ESD=""
    for CANDIDATE in /Volumes/*; do
      if [ -f "$CANDIDATE/Packages/OSInstall.mpkg" ]; then
        ESD="$CANDIDATE"
        break
      fi
    done
  fi

  say ""
  say "===== SELECTED INSTALLER VOLUME ====="
  if [ -z "$ESD" ]; then
    say "FAIL: no mounted Lion InstallESD volume contains Packages/OSInstall.mpkg."
    ls -la /Volumes 2>&1 || true
    exit 2
  fi
  say "ESD_VOLUME=$ESD"
  diskutil info "$ESD" 2>&1 || true

  say ""
  say "===== LAUNCHDAEMONS DIRECTORY ====="
  ls -la "$ESD/System/Library/LaunchDaemons" 2>&1 || true

  say ""
  say "===== STARTUP CANDIDATE PATHS ====="
  find "$ESD" -type f \( -iname '*osinstaller*' -o -iname '*installer*' -o -iname 'rc.cdrom' -o -iname 'rc.local' -o -iname 'CDIS' \) -print 2>/dev/null | sort | sed -n '1,240p'

  show "$ESD/System/Library/LaunchDaemons/com.apple.OSInstaller.plist"
  show "$ESD/etc/rc.cdrom"
  show "$ESD/etc/rc.local"
  show "$ESD/usr/local/libexec/arena-lion.sh"
  show "$ESD/System/Library/LaunchDaemons/org.arena.lion-autoinstall.plist"

  say ""
  say "===== ALL INSTALLER PLIST REFERENCES ====="
  grep -Rin 'OSInstaller\|arena-lion\|rc.cdrom' "$ESD/System/Library/LaunchDaemons" "$ESD/etc" 2>/dev/null | sed -n '1,240p' || true

  say ""
  say "===== VERDICT ====="
  say "Return this complete report before any startup-hook file is changed."
  say "No installer or target volume was modified by this discovery."
) > "$REPORT" 2>&1
STATUS=$?

cat "$REPORT"
printf '\nSaved report: %s\n' "$REPORT"
open -a TextEdit "$REPORT" 2>/dev/null || true
exit "$STATUS"
