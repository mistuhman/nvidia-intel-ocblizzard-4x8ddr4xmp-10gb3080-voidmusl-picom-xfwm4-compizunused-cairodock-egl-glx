#!/bin/sh
# Mac Pro 1,1 / Snow Leopard 10.6.8 — Lion SSD install helper (one script).
# Double-click on Lion SSD Base. Enter admin password. Confirm Apply.
#
# Does: copy this Mac's working display prefs onto Mac OS X Install ESD
#       and lock Graphics Mode to 1024x768x32@60 (VGA-HDMI safe).
# Does NOT: restore/erase any disk, set the clock, fetch over HTTP.
# Does NOT: touch Lion SSD Base or start disk clone / MX500 as a target.
# WITHDRAWN: 2016 clock, Bay 4 remirror, headless injector.
#
# After success: Restart, hold Option, click Mac OS X Install ESD.

PATH=/bin:/sbin:/usr/bin:/usr/sbin
if [ -n "$LION_PATH" ]; then
  PATH="$LION_PATH:$PATH"
fi
export PATH
umask 022

LION_VOLS="${LION_VOLS:-/Volumes}"
LION_PREFS="${LION_PREFS:-/Library/Preferences}"
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
say "This run: copy display prefs + lock 1024x768x32@60 on Install ESD (VGA-HDMI)."
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
say "===== 3. INSTALL ESD (already mirrored, do not erase) ====="
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

say ""
say "LOCKED ESD=$ESD"
say "LOCKED ESD_DEV=$ESD_DEV"
say "LOCKED ESD_NAME=$ESD_NAME"
say "LOCKED ESD_PROTO=$ESD_PROTO"
say "LOCKED ESD_MEDIA=$ESD_MEDIA"

BYHOST=""
if [ -d "$LION_PREFS/ByHost" ]; then
  BYHOST="$LION_PREFS/ByHost"
  say "BYHOST=$BYHOST"
fi
if [ -z "$BYHOST" ] && [ -d "$HOME/Library/Preferences/ByHost" ]; then
  BYHOST="$HOME/Library/Preferences/ByHost"
  say "BYHOST=$BYHOST"
fi
if [ -z "$BYHOST" ]; then
  say "BYHOST=none (Graphics Mode lock only)"
fi

say ""
say "===== 4. CONFIRM DISPLAY LOCK ====="
CONFIRM=`osascript -e "tell application \"Finder\"
display dialog \"Copy this Mac's working display settings onto Mac OS X Install ESD and lock 1024x768x32@60 so VGA-HDMI can show the installer.

ESD: $ESD_NAME
DEV: $ESD_DEV

Will NOT erase any disk.
Will NOT restore a disk.
Will NOT change the clock.
Will NOT touch Lion SSD Base or start disk clone.\" buttons {\"Cancel\",\"Apply\"} default button 2 with icon note
set pressed to button returned of result
return pressed
end tell" 2>/dev/null` || true
say "dialog=$CONFIRM"
if [ "$CONFIRM" != "Apply" ]; then
  fail "operator cancelled — no disk was erased"
fi
say "operator confirmed Apply"

say ""
say "===== 5. COPY DISPLAY PREFS ====="
PREF_DIR="$ESD/Library/Preferences"
if [ ! -d "$PREF_DIR" ]; then
  sudo mkdir -p "$PREF_DIR" || fail "mkdir Preferences failed"
fi
if [ -n "$BYHOST" ]; then
  sudo ditto "$BYHOST" "$PREF_DIR/ByHost" || fail "ditto ByHost failed"
  say "ditto ByHost OK"
  ls -la "$PREF_DIR/ByHost" 2>/dev/null || true
else
  say "skip ditto ByHost — not present on 10.6"
fi
if [ -f "$LION_PREFS/com.apple.windowserver.plist" ]; then
  sudo ditto "$LION_PREFS/com.apple.windowserver.plist" "$PREF_DIR/com.apple.windowserver.plist" || true
  say "ditto windowserver.plist OK"
fi
if [ -f "$HOME/Library/Preferences/com.apple.windowserver.plist" ]; then
  sudo ditto "$HOME/Library/Preferences/com.apple.windowserver.plist" "$PREF_DIR/com.apple.windowserver.plist" || true
  say "ditto user windowserver.plist OK"
fi

say ""
say "===== 6. GRAPHICS MODE 1024x768x32@60 ====="
SC="$PREF_DIR/SystemConfiguration"
if [ ! -d "$SC" ]; then
  sudo mkdir -p "$SC" || fail "mkdir SystemConfiguration failed"
fi
sudo defaults write "$SC/com.apple.Boot" "Graphics Mode" -string "1024x768x32@60" || fail "defaults write Graphics Mode failed"
say "Boot.plist Graphics Mode=1024x768x32@60"
sudo nvram "Graphics Mode"="1024x768x32@60" || fail "nvram Graphics Mode failed"
say "nvram Graphics Mode=1024x768x32@60"
nvram "Graphics Mode" 2>/dev/null || true

say ""
say "===== 7. NEXT ====="
say "Display lock applied. No disk was erased."
say "Apple menu > Restart, hold Option, click Mac OS X Install ESD."
say "If the HDMI box still says timing error: photograph it and stop."
say "Installer destination = start disk clone. Do not erase it."
say "Do not touch Lion SSD Base."
) > "$REPORT" 2>&1
STATUS=$?
cat "$REPORT"
printf '\nSaved report: %s\n' "$REPORT"
open -a TextEdit "$REPORT" 2>/dev/null || true
exit $STATUS
