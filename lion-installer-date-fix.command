#!/bin/sh
# WITHDRAWN 2026-09-10 (operator receipt: "the installer date thing didnt work").
# Do not set the clock. Do not use 2016-01-01 or 2015-08-08.
# Replacement: lion-asr-installer-mirror.command (asr restore inner InstallESD.dmg
# onto Bay 4, then bless --label so Startup Manager shows Mac OS X Install ESD
# instead of EFI Boot).

PATH=/bin:/sbin:/usr/bin:/usr/sbin
export PATH
umask 022
SELF="$0"
if [ -f "$SELF" ]; then
  chmod 755 "$SELF" 2>/dev/null || true
fi

osascript -e 'tell application "Finder" to display dialog "Date fix WITHDRAWN.

Setting the clock to 2016 did not work on this Mac.

1. At the Option-key picker, click Lion SSD Base (already selected).
2. Do not click EFI Boot. Do not click Mac OS X.
3. On the desktop, run lion-asr-installer-mirror.command to write a new InstallESD mirror onto Bay 4.

Lion SSD Base and start disk clone are not erased." buttons {"OK"} default button 1 with icon caution' 2>/dev/null || true

printf '%s\n' "WITHDRAWN: lion-installer-date-fix.command"
printf '%s\n' "Use lion-asr-installer-mirror.command after booting Lion SSD Base."
exit 1
