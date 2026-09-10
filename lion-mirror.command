#!/bin/sh
# Mac Pro 1,1 / Snow Leopard 10.6.8 — Lion SSD install helper (one script).
# Double-click on Lion SSD Base. Enter admin password. Confirm Repair.
#
# Does: remove the Graphics Mode Boot.plist that made Install ESD show
#       the prohibitory sign, clear nvram Graphics Mode, re-bless ESD.
# Does NOT: restore/erase any disk, set the clock, fetch over HTTP.
# Does NOT: touch Lion SSD Base or start disk clone / MX500 as a target.
# WITHDRAWN: 2016 clock, Bay 4 remirror, headless injector,
#            Graphics Mode in Apple Boot.plist (causes no-sign on 1,1 EFI).
#
# After success: Restart, hold Option, click Mac OS X Install ESD.

PATH=/bin:/sbin:/usr/bin:/usr/sbin
if [ -n "$LION_PATH" ]; then
  PATH="$LION_PATH:$PATH"
fi
export PATH
umask 022

LION_VOLS="${LION_VOLS:-/Volumes}"
LION_SLEEP="${LION_SLEEP:-2}"

SELF="$0"
if [ -f "$SELF" ]; then
  chmod 755 "$SELF" 2>/dev/null || true
fi

REPORT_DIR="$HOME/Desktop"
if [ ! -d "$REPORT_DIR" ]; then
  REPORT_DIR="$HOME"
fi
REPORT="$REPORT_DIR/lion-mirror.txt"

say() { printf '%s\n' "$*"; }

fail() {
  say "FAIL: $*"
  say "No disk was erased."
  exit 1
}

field() {
  diskutil info "$1" 2>/dev/null | awk -v k="$2" '
    index($0, k ":") {
      sub(/^[^:]+:[ \t]*/, "")
      sub(/[ \t]+$/, "")
      print
      exit
    }
  '
}

is_disk_image() {
  echo "$1" | grep -qi "Disk Image"
}

is_mx500() {
  echo "$1" | grep -qi "MX500"
  if [ $? -eq 0 ]; then return 0; fi
  echo "$1" | grep -qi "CT1000"
  if [ $? -eq 0 ]; then return 0; fi
  echo "$1" | grep -qi "start disk clone"
}

(
say "lion-mirror.command — Lion SSD install helper"
say "Generated: $(date)"
say "Host:"
sw_vers 2>/dev/null || true
uname -a
say ""
say "WITHDRAWN: 2016 clock workaround."
say "WITHDRAWN: remirror / Bay 4 erase."
say "WITHDRAWN: Graphics Mode in Apple Boot.plist (no-sign on Mac Pro 1,1)."
say "This run: delete that plist, clear nvram, re-bless Install ESD."
say ""

if ! sudo -v; then
  fail "admin password not accepted"
fi
say "sudo OK"

say ""
say "===== 1. BOOT VOLUME ====="
diskutil info / 2>/dev/null | sed -n '1,40p' || true
BOOT_NAME=`field / "Volume Name"`
BOOT_DEV=`field / "Device Node"`
BOOT_PROTO=`field / "Protocol"`
say "BOOT_NAME=$BOOT_NAME"
say "BOOT_DEV=$BOOT_DEV"
say "BOOT_PROTO=$BOOT_PROTO"
case "$BOOT_NAME" in
  *"Install ESD"*|*"InstallESD"*)
    fail "booted from the installer volume — click Lion SSD Base first"
    ;;
esac

say ""
say "===== 2. DISK INVENTORY ====="
diskutil list 2>/dev/null || true
say ""
say "===== $LION_VOLS ====="
ls -la "$LION_VOLS" 2>/dev/null || true

say ""
say "===== 3. INSTALL ESD ====="
ESD=""
ESD_DEV=""
ESD_NAME=""
ESD_PROTO=""
ESD_MEDIA=""
for V in "$LION_VOLS"/*; do
  [ -d "$V" ] || continue
  VNAME=`field "$V" "Volume Name"`
  VDEV=`field "$V" "Device Node"`
  VPROTO=`field "$V" "Protocol"`
  VMEDIA=`field "$V" "Media Name"`
  if [ -z "$VMEDIA" ]; then
    VMEDIA=`field "$V" "Device / Media Name"`
  fi
  say "vol='$VNAME' dev=$VDEV proto=$VPROTO media='$VMEDIA'"
  if [ -n "$VDEV" ] && [ "$VDEV" = "$BOOT_DEV" ]; then
    say "  skip: boot volume"
    continue
  fi
  if is_disk_image "$VPROTO"; then
    say "  skip: disk image"
    continue
  fi
  if is_mx500 "$VMEDIA $VNAME $V"; then
    say "  skip: MX500 / clone"
    continue
  fi
  echo "$VNAME" | grep -qi "Lion SSD Base"
  if [ $? -eq 0 ]; then
    say "  skip: Lion SSD Base"
    continue
  fi
  echo "$VNAME" | grep -qi "Install ESD"
  if [ $? -ne 0 ]; then
    echo "$VNAME" | grep -qi "InstallESD"
    if [ $? -ne 0 ]; then
      continue
    fi
  fi
  ESD="$V"
  ESD_DEV="$VDEV"
  ESD_NAME="$VNAME"
  ESD_PROTO="$VPROTO"
  ESD_MEDIA="$VMEDIA"
  say "  CANDIDATE esd"
done

if [ -z "$ESD" ]; then
  fail "Mac OS X Install ESD is not mounted. Will not guess a disk."
fi
if [ "$ESD_DEV" = "$BOOT_DEV" ]; then
  fail "ESD is the boot disk — refusing"
fi
if is_mx500 "$ESD_MEDIA $ESD_NAME $ESD"; then
  fail "ESD path is the MX500 / start disk clone — refusing"
fi
echo "$ESD_NAME" | grep -qi "Lion SSD Base"
if [ $? -eq 0 ]; then
  fail "ESD path is Lion SSD Base — refusing"
fi
if [ ! -f "$ESD/System/Library/CoreServices/boot.efi" ]; then
  fail "boot.efi missing on ESD — not bootable"
fi
say "boot.efi present"

say ""
say "LOCKED ESD=$ESD"
say "LOCKED ESD_DEV=$ESD_DEV"
say "LOCKED ESD_NAME=$ESD_NAME"

say ""
say "===== 4. CONFIRM REPAIR ====="
CONFIRM=`osascript -e "tell application \"Finder\"
display dialog \"Repair Mac OS X Install ESD boot (remove Graphics Mode plist that caused the no-sign, re-bless).

ESD: $ESD_NAME
DEV: $ESD_DEV

Will NOT erase any disk.
Will NOT restore a disk.
Will NOT change the clock.
Will NOT touch Lion SSD Base or start disk clone.\" buttons {\"Cancel\",\"Repair\"} default button 2 with icon note
set pressed to button returned of result
return pressed
end tell" 2>/dev/null` || true
say "dialog=$CONFIRM"
if [ "$CONFIRM" != "Repair" ]; then
  fail "operator cancelled — no disk was erased"
fi
say "operator confirmed Repair"

say ""
say "===== 5. REMOVE GRAPHICS MODE ====="
BOOTPLIST="$ESD/Library/Preferences/SystemConfiguration/com.apple.Boot.plist"
if [ -f "$BOOTPLIST" ]; then
  sudo rm -f "$BOOTPLIST" || fail "could not remove Boot.plist"
  say "removed $BOOTPLIST"
else
  say "no Boot.plist (ok)"
fi
sudo nvram -d "Graphics Mode" 2>/dev/null || true
say "nvram Graphics Mode cleared"
nvram "Graphics Mode" 2>/dev/null || say "nvram Graphics Mode absent"

say ""
say "===== 6. BLESS ESD ====="
CS="$ESD/System/Library/CoreServices"
sudo bless --folder "$CS" --file "$CS/boot.efi" --label "Mac OS X Install ESD" 2>&1 || fail "bless failed"
say "bless OK"
sudo bless --info "$ESD" 2>&1 || true

say ""
say "===== 7. NEXT ====="
say "ESD boot repaired. No disk was erased."
say "Lion is NOT installed yet — Lion SSD Base is still Snow Leopard 10.6.8."
say "Apple menu > Restart, hold Option, click Mac OS X Install ESD."
say "If the no-sign returns: photograph it and stop."
say "If HDMI says timing error: photograph it and stop."
say "Installer destination = start disk clone. Do not erase it."
say "Do not touch Lion SSD Base."
) > "$REPORT" 2>&1
STATUS=$?
cat "$REPORT"
printf '\nSaved report: %s\n' "$REPORT"
open -a TextEdit "$REPORT" 2>/dev/null || true
exit $STATUS
