#!/bin/sh
# Mac Pro 1,1 Lion installer boot audit
# Double-click after extracting from the accompanying ZIP, or run with:
#   /bin/sh ~/Desktop/lion-installer-boot-audit.command
#
# Read-only against the restored Lion InstallESD volume. It mounts volumes and
# writes only this report in the current Snow Leopard user's Desktop directory.
# It does NOT erase, install to, bless, or modify any disk.

PATH=/bin:/sbin:/usr/bin:/usr/sbin
export PATH
umask 022

SELF="$0"
if [ -f "$SELF" ]; then
  chmod 755 "$SELF" 2>/dev/null || true
fi

REPORT_DIR="$HOME/Desktop"
if [ ! -d "$REPORT_DIR" ]; then
  REPORT_DIR="$HOME"
fi
REPORT="$REPORT_DIR/lion-installer-boot-audit.txt"

say() {
  printf '%s\n' "$*"
}

show_file() {
  FILE="$1"
  say ""
  say "===== $FILE ====="
  if [ ! -e "$FILE" ]; then
    say "ABSENT"
    return
  fi

  ls -ld "$FILE"
  stat -f 'owner=%Su group=%Sg mode=%Sp path=%N' "$FILE" 2>/dev/null || true
  md5 -q "$FILE" 2>/dev/null || true

  if [ -f "$FILE" ]; then
    if command -v plutil >/dev/null 2>&1; then
      plutil -lint "$FILE" 2>&1 || true
    fi
    say "--- first 160 lines ---"
    sed -n '1,160p' "$FILE" 2>&1 || true
    say "--- end ---"
  fi
}

(
  say "Lion installer boot audit"
  say "Generated: $(date)"
  say "This report is read-only against all installer and target volumes."
  say ""
  say "===== HOST ====="
  id
  sw_vers 2>/dev/null || true
  uname -a

  say ""
  say "===== SUDO / MOUNT ====="
  if ! sudo -v; then
    say "FAIL: administrator authorization was not accepted."
    exit 1
  fi

  for DISK in /dev/disk[0-9]*; do
    [ -e "$DISK" ] || continue
    sudo diskutil mount "$DISK" >/dev/null 2>&1 || true
  done

  say ""
  say "===== DISK INVENTORY ====="
  diskutil list 2>&1 || true
  say ""
  say "===== MOUNTED VOLUMES ====="
  ls -la /Volumes 2>&1 || true

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
  say "===== INSTALLER VOLUME ====="
  if [ -z "$ESD" ]; then
    say "FAIL: no mounted volume contains Packages/OSInstall.mpkg."
    say "Do not modify or re-run the prior injector from this result."
    exit 2
  fi

  say "ESD_VOLUME=$ESD"
  diskutil info "$ESD" 2>&1 || true
  if [ -f "$ESD/Packages/OSInstall.mpkg" ]; then
    say "OSINSTALL_MPKG=present"
    ls -ld "$ESD/Packages/OSInstall.mpkg"
    md5 -q "$ESD/Packages/OSInstall.mpkg" 2>/dev/null || true
  fi

  show_file "$ESD/usr/local/libexec/arena-lion.sh"
  show_file "$ESD/System/Library/LaunchDaemons/org.arena.lion-autoinstall.plist"
  show_file "$ESD/etc/rc.local"
  show_file "$ESD/etc/rc.cdrom"
  show_file "$ESD/System/Library/LaunchDaemons/com.apple.OSInstaller.plist"

  say ""
  say "===== INSTALLER-RELATED EXECUTABLES ====="
  find "$ESD/System" -type f \( -name '*OSInstaller*' -o -name '*Installer*' -o -name 'CDIS' \) -print 2>/dev/null | sort | sed -n '1,120p'

  say ""
  say "===== KNOWN INSTALL TARGETS (READ-ONLY) ====="
  for VOLUME in "/Volumes/start disk clone" "/Volumes/Lion SSD Base"; do
    say ""
    say "--- $VOLUME ---"
    if [ -d "$VOLUME" ]; then
      diskutil info "$VOLUME" 2>&1 || true
      ls -ld "$VOLUME"
      if [ -e "$VOLUME/lion-cli.log" ]; then
        say "lion-cli.log present:"
        ls -l "$VOLUME/lion-cli.log"
        sed -n '1,200p' "$VOLUME/lion-cli.log" 2>&1 || true
      else
        say "lion-cli.log absent"
      fi
    else
      say "not mounted"
    fi
  done

  say ""
  say "===== VERDICT ====="
  say "Return this complete report before any installer-startup file is changed."
  say "No disk was erased or modified by this audit."
) > "$REPORT" 2>&1
AUDIT_STATUS=$?

cat "$REPORT"
printf '\nSaved report: %s\n' "$REPORT"
open -a TextEdit "$REPORT" 2>/dev/null || true
exit "$AUDIT_STATUS"
