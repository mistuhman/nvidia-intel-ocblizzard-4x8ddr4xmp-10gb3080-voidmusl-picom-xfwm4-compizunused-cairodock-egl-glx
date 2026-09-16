#!/bin/sh
# lion-one.command - safe read-only reporter for the one-link Burn loop (Lion 10.7, double-click).
# Writes ONLY ~/Desktop/lion-one.txt, then opens it for the txt picker on the One page.
# No sudo, no network, no disk or firmware changes. Every probe is best-effort.
REPORT="$HOME/Desktop/lion-one.txt"
AIRPORT_BIN="/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport"
{
echo "LIONONE1 one-link report"
echo "date=$(date 2>/dev/null || echo UNKNOWN)"
echo "host=$(hostname 2>/dev/null || echo UNKNOWN)"
echo "--- system ---"
sw_vers 2>/dev/null || echo "sw_vers UNKNOWN"
uname -a 2>/dev/null || echo "uname UNKNOWN"
sysctl hw.model hw.memsize hw.ncpu 2>/dev/null || echo "sysctl UNKNOWN"
echo "--- users ---"
ls /Users 2>/dev/null || echo "users UNKNOWN"
echo "--- disks ---"
diskutil list 2>/dev/null || echo "diskutil UNKNOWN"
echo "--- mounts ---"
mount 2>/dev/null || echo "mount UNKNOWN"
echo "--- airport ---"
if [ -x "$AIRPORT_BIN" ]; then
  "$AIRPORT_BIN" -I 2>/dev/null || echo "airport UNKNOWN"
elif command -v airport >/dev/null 2>&1; then
  airport -I 2>/dev/null || echo "airport UNKNOWN"
else
  echo "airport UNKNOWN"
fi
networksetup -listallhardwareports 2>/dev/null || echo "networksetup UNKNOWN"
echo "--- arcticfox ---"
defaults read /Applications/ArcticFox.app/Contents/Info CFBundleShortVersionString 2>/dev/null || echo "arcticfox-version UNKNOWN"
ls -d /Applications/ArcticFox.app 2>/dev/null || echo "arcticfox-app UNKNOWN"
echo "--- audio ---"
system_profiler SPAudioDataType 2>/dev/null | head -60 || echo "audio UNKNOWN"
echo "--- displays ---"
system_profiler SPDisplaysDataType 2>/dev/null | head -40 || echo "displays UNKNOWN"
echo "--- firewall ---"
/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate 2>/dev/null || echo "firewall UNKNOWN"
echo "LIONONE1_DONE No disk was erased."
} > "$REPORT" 2>&1
open "$REPORT" 2>/dev/null || true
echo "wrote $REPORT"
