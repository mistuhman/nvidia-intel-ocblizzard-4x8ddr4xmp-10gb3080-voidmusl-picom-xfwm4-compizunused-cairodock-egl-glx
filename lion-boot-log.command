#!/bin/sh
# Mac Pro 1,1 / Snow Leopard 10.6.8 — safe post-fallback boot handoff log.
# Double-click after an Option-boot attempt returns to Snow Leopard.
#
# READS: NVRAM boot keys, dmesg, system.log, disk inventory, ESD metadata.
# WRITES ONLY: /lion-boot-log.txt and ~/Desktop/lion-boot-log.txt.
# DOES NOT: bless, erase, restore, mount, change the clock, or change NVRAM.
#
# Important limit: EFI/boot.efi screen text cannot be redirected to a file by a
# Snow Leopard shell after the fact. The report records the operator's observed
# screen result plus every post-fallback receipt that Snow Leopard can expose.

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
REPORT="$REPORT_DIR/lion-boot-log.txt"
ROOT_REPORT="${LION_ROOT_REPORT:-/lion-boot-log.txt}"

say() { printf '%s\n' "$*"; }

SCREEN_RESULT=`osascript -e 'tell application "Finder"
display dialog "What did the screen show after selecting Mac OS X Install ESD?" buttons {"Unknown", "Installer GUI", "HDMI timing error", "Prohibitory then fallback"} default button "Prohibitory then fallback" with icon note
set pressed to button returned of result
return pressed
end tell' 2>/dev/null` || SCREEN_RESULT="not recorded"

if ! sudo -v; then
  say "FAIL: administrator authorization was not accepted."
  exit 1
fi

(
say "BOOTLOG1 — Lion ESD post-fallback handoff collector"
say "Generated: $(date)"
say "MODE=post-fallback Snow Leopard capture"
say "OPERATOR_SCREEN_RESULT=$SCREEN_RESULT"
say "DESKTOP_REPORT=$REPORT"
say "ROOT_REPORT=$ROOT_REPORT"
say ""
say "This report is read-only against the installer, target, NVRAM, and logs."
say "EFI_SCREEN_TEXT=not redirectable by a post-boot shell; use the operator result above."
say "No disk was erased, restored, blessed, mounted, or changed by this collector."

say ""
say "===== HOST / BOOT TIME ====="
sw_vers 2>/dev/null || true
uname -a 2>/dev/null || true
date 2>/dev/null || true
uptime 2>/dev/null || true
sysctl kern.boottime 2>/dev/null || true
last reboot 2>/dev/null | head -n 8 || true

say ""
say "===== NVRAM BOOT KEYS (READ ONLY) ====="
nvram boot-args 2>&1 || true
nvram -p 2>/dev/null | grep -iE '^(boot|efi|auto-boot|graphics|kernel)' || true

say ""
say "===== CURRENT KERNEL BUFFER ====="
sudo dmesg 2>&1 | tail -n 400 || true

say ""
say "===== SYSTEM LOG TAIL ====="
if [ -f /var/log/system.log ]; then
  sudo tail -n 600 /var/log/system.log 2>&1 || true
else
  say "ABSENT: /var/log/system.log"
fi

say ""
say "===== DISK INVENTORY (READ ONLY) ====="
diskutil list 2>&1 || true
for VOLUME in "/" "/Volumes/Lion SSD Base" "/Volumes/start disk clone" "/Volumes/Mac OS X Install ESD"; do
  if [ -d "$VOLUME" ]; then
    say ""
    say "--- $VOLUME ---"
    diskutil info "$VOLUME" 2>&1 || true
  else
    say "ABSENT: $VOLUME"
  fi
done

ESD="/Volumes/Mac OS X Install ESD"
say ""
say "===== INSTALL ESD BOOT FILES (READ ONLY) ====="
if [ -d "$ESD" ]; then
  ls -la "$ESD/boot.efi" 2>&1 || true
  ls -la "$ESD/System/Library/CoreServices/boot.efi" 2>&1 || true
  bless --info "$ESD" 2>&1 || true
else
  say "ESD not mounted"
fi

say ""
say "===== VERDICT ====="
say "The ESD boot attempt was selected by the operator; this file records the post-fallback state."
say "Return this report through da.gd/lionrelay before any new boot or repair action."
) > "$REPORT" 2>&1
STATUS=$?

# The root-level copy is the requested canonical report. The Desktop copy is a
# Finder-friendly duplicate because Arctic Fox's file chooser opens there.
sudo cp "$REPORT" "$ROOT_REPORT" 2>/dev/null || STATUS=1
if [ -f "$ROOT_REPORT" ]; then
  sudo chmod 644 "$ROOT_REPORT" 2>/dev/null || true
fi

cat "$REPORT"
printf '\nSaved Desktop report: %s\n' "$REPORT"
printf 'Saved root report: %s\n' "$ROOT_REPORT"
open -a TextEdit "$REPORT" 2>/dev/null || true
exit "$STATUS"
