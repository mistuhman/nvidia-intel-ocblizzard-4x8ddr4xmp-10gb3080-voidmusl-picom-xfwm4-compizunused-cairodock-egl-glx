#!/bin/sh
# Mac Pro 1,1 — NEW bootable Lion InstallESD mirror onto Bay 4
# WITHDRAWS: date-to-2016 (operator: did not work), headless injector,
#            bless-without-restore (Startup Manager showed "EFI Boot"
#            not "Mac OS X Install ESD").
#
# Apple path for 10.7: asr restore the INNER InstallESD.dmg onto a
# physical HFS partition, then bless --label. Source is the .dmg FILE
# inside Install OS X Lion.app, never a mounted volume of the same name.
#
# Does NOT touch Lion SSD Base (Bay 1) or start disk clone / MX500 (Bay 3).
# Erase is Bay 4 only, after an on-screen confirm.

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
REPORT="$REPORT_DIR/lion-asr-installer-mirror.txt"

say() { printf '%s\n' "$*"; }

fail() {
  say "FAIL: $*"
  say "No disk was erased."
  exit 1
}

field() {
  # diskutil info field extractor (10.6: leading spaces before "Volume Name:")
  diskutil info "$1" 2>/dev/null | awk -v k="$2" '
    index($0, k ":") {
      sub(/^[^:]+:[ \t]*/, "")
      sub(/[ \t]+$/, "")
      print
      exit
    }
  '
}

(
say "Lion ASR installer mirror — Mac Pro 1,1 Bay 4"
say "Generated: $(date)"
say "Host:"
sw_vers 2>/dev/null || true
uname -a
say ""
say "WITHDRAWN this run: sudo date 0101000016 (operator receipt: did not work)."
say "WITHDRAWN: Option-boot of the previous Bay 4 restore (picker = EFI Boot)."
say ""

if ! sudo -v; then
  fail "admin password not accepted"
fi
say "sudo OK"

say ""
say "===== BOOT VOLUME (must be Snow Leopard, not the installer disk) ====="
diskutil info / 2>/dev/null | sed -n '1,40p' || true
BOOT_NAME=`field / "Volume Name"`
BOOT_DEV=`field / "Device Node"`
BOOT_PROTO=`field / "Protocol"`
say "BOOT_NAME=$BOOT_NAME"
say "BOOT_DEV=$BOOT_DEV"
say "BOOT_PROTO=$BOOT_PROTO"
case "$BOOT_NAME" in
  *"Install ESD"*|*"InstallESD"*)
    fail "booted from the installer volume — restart into Lion SSD Base first"
    ;;
esac

say ""
say "===== DISK INVENTORY ====="
diskutil list 2>/dev/null || true
say ""
say "===== /Volumes ====="
ls -la /Volumes 2>/dev/null || true

say ""
say "===== SOURCE: inner InstallESD.dmg (FILE, not a mounted volume) ====="
SOURCE=""
for APP in \
  "/Applications/Install OS X Lion.app" \
  "/Applications/Install Mac OS X Lion.app" \
  "/Applications/Install Mac OS X.app"
do
  CAND="$APP/Contents/SharedSupport/InstallESD.dmg"
  say "check $CAND"
  if [ -f "$CAND" ]; then
    SOURCE="$CAND"
    say "SOURCE=$SOURCE"
    ls -lh "$SOURCE"
    break
  fi
done
if [ -z "$SOURCE" ]; then
  for CAND in \
    "$HOME/Downloads/InstallESD.dmg" \
    "$HOME/Desktop/InstallESD.dmg" \
    /Volumes/Install*/InstallESD.dmg
  do
    if [ -f "$CAND" ]; then
      SOURCE="$CAND"
      say "SOURCE=$SOURCE (fallback)"
      ls -lh "$SOURCE"
      break
    fi
  done
fi
if [ -z "$SOURCE" ] || [ ! -f "$SOURCE" ]; then
  fail "InstallESD.dmg not found. Install InstallMacOSX.pkg onto this Snow Leopard first. Do not erase Bay 4 — it may be the only remaining copy."
fi

say ""
say "===== DESTINATION: physical Bay 4 (NOT boot, NOT MX500, NOT a disk image) ====="
DEST_VOL=""
DEST_DEV=""
for V in /Volumes/*; do
  [ -d "$V" ] || continue
  VNAME=`field "$V" "Volume Name"`
  VDEV=`field "$V" "Device Node"`
  VPROTO=`field "$V" "Protocol"`
  VMEDIA=`field "$V" "Media Name"`
  [ -z "$VMEDIA" ] && VMEDIA=`field "$V" "Device / Media Name"`
  say "vol='$VNAME' dev=$VDEV proto=$VPROTO media='$VMEDIA'"
  if [ "$VDEV" = "$BOOT_DEV" ]; then
    say "  skip: boot volume"
    continue
  fi
  echo "$VPROTO" | grep -qi "Disk Image" && say "  skip: disk image" && continue
  echo "$VMEDIA $VNAME $V" | grep -qi "MX500\|CT1000\|start disk clone" && say "  skip: MX500 / clone" && continue
  echo "$VNAME" | grep -qi "Lion SSD Base" && say "  skip: Lion SSD Base" && continue
  echo "$VNAME" | grep -qi "Install ESD\|InstallESD" || continue
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
echo "$DEST_PROTO" | grep -qi "Disk Image" && fail "dest is a disk image — refusing"
echo "$DEST_DEV" | grep -qx "$BOOT_DEV" && fail "dest is the boot disk — refusing"

say ""
say "===== CONFIRM ====="
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

Type-in confirm is the Erase button.\" buttons {\"Cancel\",\"Erase Bay 4\"} default button 1 with icon caution
set pressed to button returned of result
return pressed
end tell" 2>/dev/null` || true
say "dialog=$CONFIRM"
if [ "$CONFIRM" != "Erase Bay 4" ]; then
  fail "operator cancelled — no erase"
fi
say "operator confirmed Erase Bay 4"

say ""
say "===== ASR RESTORE (new mirror) ====="
say "unmount dest"
sudo diskutil unmount "$DEST_DEV" 2>&1 || sudo diskutil unmount force "$DEST_DEV" 2>&1 || true
say "asr restore -source FILE -target $DEST_DEV -erase -noprompt -noverify"
if ! sudo asr restore -source "$SOURCE" -target "$DEST_DEV" -erase -noprompt -noverify; then
  say "asr long-flag retry"
  if ! sudo asr restore --source "$SOURCE" --target "$DEST_DEV" --erase --noprompt --noverify; then
    fail "asr restore failed — dest may be unmounted; try Disk Utility Restore using the Image button on InstallESD.dmg (the FILE), destination = Bay 4 physical disk only"
  fi
fi

say ""
say "===== MOUNT + VERIFY MIRROR ====="
sudo diskutil mount "$DEST_DEV" 2>&1 || true
sleep 2
MIRROR=""
for CAND in "/Volumes/Mac OS X Install ESD" "/Volumes/Mac OS X Install ESD 1" /Volumes/*Install*ESD*; do
  if [ -f "$CAND/Packages/OSInstall.mpkg" ]; then
    # skip if this path is a disk image
    PROTO=`field "$CAND" "Protocol"`
    echo "$PROTO" | grep -qi "Disk Image" && continue
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
say "===== BLESS LABEL (so picker says Mac OS X Install ESD, not EFI Boot) ====="
sudo bless --folder "$MIRROR/System/Library/CoreServices" --label "Mac OS X Install ESD" 2>&1 || true
sudo bless --info "$MIRROR" 2>&1 || true

say ""
say "===== VERDICT ====="
say "Bay 4 is a new asr mirror of InstallESD.dmg. Date hack was not used."
say "Next: Apple menu > Restart, hold Option, click Mac OS X Install ESD."
say "If picker still shows EFI Boot, photograph it and stop."
say "In the installer: select start disk clone (the 1 TB SSD) as destination."
say "Do not erase start disk clone (upgrade installer). Do not touch Lion SSD Base."
say "Do not replace other drives until Lion has booted from the SSD."
) > "$REPORT" 2>&1
STATUS=$?
cat "$REPORT"
printf '\nSaved report: %s\n' "$REPORT"
open -a TextEdit "$REPORT" 2>/dev/null || true
exit $STATUS
