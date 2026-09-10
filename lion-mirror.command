#!/bin/sh
# Mac Pro 1,1 / Snow Leopard 10.6.8 — ONE script, the whole Lion installer mirror.
# Double-click on Lion SSD Base. Enter admin password. Confirm Erase Bay 4.
#
# Does: inventory, find inner InstallESD.dmg FILE, lock physical Bay 4,
#       asr restore -erase, verify OSInstall.mpkg + boot.efi, bless --label.
# Does NOT: set the clock, fetch over HTTP, touch Lion SSD Base, touch start disk clone / MX500.
# WITHDRAWN: 2016 clock workaround, headless injector, bless-without-asr (picker = EFI Boot).
#
# Apple 10.7 path (10.9 USB helper does not exist on Lion): asr the inner dmg, then bless.
# After success: Restart, hold Option, click Mac OS X Install ESD.
# Installer destination = start disk clone (1 TB). Do not erase it (upgrade installer).

PATH=/bin:/sbin:/usr/bin:/usr/sbin
if [ -n "$LION_PATH" ]; then
  PATH="$LION_PATH:$PATH"
fi
export PATH
umask 022

# Test seams only. Unset on a real Mac = production paths.
LION_APPS="${LION_APPS:-/Applications}"
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
say "lion-mirror.command — Mac Pro 1,1 Snow Leopard 10.6.8"
say "Generated: $(date)"
say "Host:"
sw_vers 2>/dev/null || true
uname -a
say ""
say "WITHDRAWN: 2016 clock workaround (operator: did not work)."
say "WITHDRAWN: Option-boot of the old Bay 4 copy (picker showed EFI Boot)."
say "This run: asr restore inner InstallESD.dmg FILE onto physical Bay 4, then bless."
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
say "===== 3. SOURCE FILE (inner InstallESD.dmg, not a mounted volume) ====="
SOURCE=""
for APP in \
  "$LION_APPS/Install OS X Lion.app" \
  "$LION_APPS/Install Mac OS X Lion.app" \
  "$LION_APPS/Install Mac OS X.app"
do
  CAND="$APP/Contents/SharedSupport/InstallESD.dmg"
  say "check $CAND"
  if [ -f "$CAND" ]; then
    SOURCE="$CAND"
    break
  fi
done
if [ -z "$SOURCE" ]; then
  for CAND in \
    "$HOME/Downloads/InstallESD.dmg" \
    "$HOME/Desktop/InstallESD.dmg"
  do
    if [ -f "$CAND" ]; then
      SOURCE="$CAND"
      say "SOURCE fallback $SOURCE"
      break
    fi
  done
fi
if [ -z "$SOURCE" ] || [ ! -f "$SOURCE" ]; then
  fail "InstallESD.dmg not found. Install InstallMacOSX.pkg on this Snow Leopard first. Do not erase Bay 4."
fi
say "SOURCE=$SOURCE"
ls -lh "$SOURCE" 2>/dev/null || true

say ""
say "===== 4. DESTINATION (physical Bay 4 only) ====="
DEST_VOL=""
DEST_DEV=""
DEST_NAME=""
DEST_PROTO=""
DEST_MEDIA=""
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
  DEST_VOL="$V"
  DEST_DEV="$VDEV"
  DEST_NAME="$VNAME"
  DEST_PROTO="$VPROTO"
  DEST_MEDIA="$VMEDIA"
  say "  CANDIDATE dest"
done

if [ -z "$DEST_DEV" ]; then
  fail "no physical volume named Mac OS X Install ESD. Mount Bay 4 and re-run. Will not guess a disk."
fi

say ""
say "LOCKED SOURCE=$SOURCE"
say "LOCKED DEST_VOL=$DEST_VOL"
say "LOCKED DEST_DEV=$DEST_DEV"
say "LOCKED DEST_NAME=$DEST_NAME"
say "LOCKED DEST_PROTO=$DEST_PROTO"
say "LOCKED DEST_MEDIA=$DEST_MEDIA"
diskutil info "$DEST_DEV" 2>/dev/null | sed -n '1,50p' || true

echo "$DEST_DEV" | grep -q '^/dev/disk[0-9]' || fail "dest device node looks wrong: $DEST_DEV"
if is_disk_image "$DEST_PROTO"; then
  fail "dest is a disk image — refusing"
fi
if [ "$DEST_DEV" = "$BOOT_DEV" ]; then
  fail "dest is the boot disk — refusing"
fi
if is_mx500 "$DEST_MEDIA $DEST_NAME $DEST_VOL"; then
  fail "dest is the MX500 / start disk clone — refusing"
fi

say ""
say "===== 5. CONFIRM ERASE BAY 4 ====="
CONFIRM=`osascript -e "tell application \"Finder\"
display dialog \"ASR will ERASE this PHYSICAL disk and write a new Lion InstallESD mirror.

DEST: $DEST_NAME
DEV: $DEST_DEV
PROTO: $DEST_PROTO
MEDIA: $DEST_MEDIA

SOURCE (file):
$SOURCE

Will NOT touch:
- Lion SSD Base (Bay 1 boot)
- start disk clone / Crucial MX500 (Bay 3)

Date will NOT be changed.\" buttons {\"Cancel\",\"Erase Bay 4\"} default button 1 with icon caution
set pressed to button returned of result
return pressed
end tell" 2>/dev/null` || true
say "dialog=$CONFIRM"
if [ "$CONFIRM" != "Erase Bay 4" ]; then
  fail "operator cancelled — no erase"
fi
say "operator confirmed Erase Bay 4"

say ""
say "===== 6. ASR RESTORE ====="
sudo diskutil unmount "$DEST_DEV" 2>&1 || sudo diskutil unmount force "$DEST_DEV" 2>&1 || true
say "asr restore -source FILE -target $DEST_DEV -erase -noprompt -noverify"
if ! sudo asr restore -source "$SOURCE" -target "$DEST_DEV" -erase -noprompt -noverify; then
  say "asr long-flag retry"
  if ! sudo asr restore --source "$SOURCE" --target "$DEST_DEV" --erase --noprompt --noverify; then
    fail "asr restore failed"
  fi
fi

say ""
say "===== 7. VERIFY MIRROR ====="
sudo diskutil mount "$DEST_DEV" 2>&1 || true
if [ "$LION_SLEEP" != "0" ]; then
  sleep "$LION_SLEEP"
fi
MIRROR=""
for CAND in "$LION_VOLS/Mac OS X Install ESD" "$LION_VOLS/Mac OS X Install ESD 1"; do
  if [ -f "$CAND/Packages/OSInstall.mpkg" ]; then
    PROTO=`field "$CAND" "Protocol"`
    if is_disk_image "$PROTO"; then
      continue
    fi
    MIRROR="$CAND"
    break
  fi
done
if [ -z "$MIRROR" ]; then
  fail "asr finished but Packages/OSInstall.mpkg not on a physical volume"
fi
say "MIRROR=$MIRROR"
ls -ld "$MIRROR/Packages/OSInstall.mpkg"
if [ -f "$MIRROR/System/Library/CoreServices/boot.efi" ]; then
  say "boot.efi present"
  ls -ld "$MIRROR/System/Library/CoreServices/boot.efi"
else
  fail "boot.efi ABSENT after asr — mirror is not bootable"
fi

say ""
say "===== 8. BLESS LABEL ====="
sudo bless --folder "$MIRROR/System/Library/CoreServices" --label "Mac OS X Install ESD" 2>&1 || true
sudo bless --info "$MIRROR" 2>&1 || true

say ""
say "===== 9. NEXT ====="
say "Bay 4 is a new asr mirror. Date was not changed."
say "Apple menu > Restart, hold Option, click Mac OS X Install ESD."
say "If the picker still says EFI Boot: photograph it and stop."
say "Installer destination = start disk clone (1 TB). Do not erase it."
say "Do not touch Lion SSD Base. Do not replace other drives until Lion boots from the SSD."
) > "$REPORT" 2>&1
STATUS=$?
cat "$REPORT"
printf '\nSaved report: %s\n' "$REPORT"
open -a TextEdit "$REPORT" 2>/dev/null || true
exit $STATUS
