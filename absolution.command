#!/bin/sh
# absolution.command - READ-ONLY context probe for the Lion clear + harden wave (Lion 10.7, double-click).
# Rollout R1 | branch arena/01a0ad71-nvidia-intel-ocblizzard-4x8ddr | PR 91 | session 01a0ad71
# Writes ONLY ~/Desktop/absolution.txt then opens it for the page picker.
# No sudo, no network, no erase, no move, no delete. Every probe is best-effort.
REPORT="$HOME/Desktop/absolution.txt"
{
echo "ABSOLUTION1 rollout=R1 branch=arena/01a0ad71-nvidia-intel-ocblizzard-4x8ddr pr=91 session=01a0ad71 date=2026-09-17"
echo "date=$(date 2>/dev/null || echo UNKNOWN)"
echo "host=$(hostname 2>/dev/null || echo UNKNOWN)"
echo "user=$(whoami 2>/dev/null || echo UNKNOWN)"
echo "--- boot volume ---"
mount 2>/dev/null | grep ' on / ' || echo "mount UNKNOWN"
df -h / 2>/dev/null || echo "df UNKNOWN"
echo "--- apps: CLASS | size | bundle | name ---"
for a in /Applications/*.app /Applications/Utilities/*.app; do
  [ -e "$a" ] || continue
  B=$(defaults read "$a/Contents/Info" CFBundleIdentifier 2>/dev/null)
  [ -z "$B" ] && B="(none)"
  N=$(basename "$a" .app)
  SZ=$(du -hs "$a" 2>/dev/null | awk '{print $1}')
  C="CANDIDATE"
  case "$B" in com.apple.*) C="APPLE";; esac
  case "$N" in "AU Lab"*|"AirPort"*|"Arctic"*|"Audacity"*|"CandyBar"*|"Flavours"*|"GarageBand"*|"Logic"*|"Utilities"|"iTunes"*) C="KEEP";; esac
  echo "APP $C | $SZ | $B | $N"
done
echo "--- keep dirs ---"
for u in $(ls /Users 2>/dev/null | grep -v Shared); do
  echo "USER $u"
  du -hs "/Users/$u/Downloads" 2>/dev/null || echo "  no Downloads"
  du -hs "/Users/$u/Library/Application Support/CandyBar" 2>/dev/null || echo "  no CandyBar support"
  du -hs "/Users/$u/Library/Application Support/Flavours" 2>/dev/null || echo "  no Flavours support"
  ls "/Users/$u/Library/Preferences/com.panic.CandyBar3.plist" 2>/dev/null || echo "  no CandyBar plist"
done
echo "--- theme payloads (first 20) ---"
find /Users -maxdepth 4 -iname "*.icontainer" -o -maxdepth 4 -iname "*.iconset" -o -maxdepth 4 -iname "*.flavour" 2>/dev/null | head -20
echo "--- reclaimable ---"
du -hs /Library/Caches 2>/dev/null || echo "no /Library/Caches"
du -hs /private/var/log 2>/dev/null || echo "no /private/var/log"
for u in $(ls /Users 2>/dev/null | grep -v Shared); do
  du -hs "/Users/$u/Library/Caches" 2>/dev/null
  du -hs "/Users/$u/.Trash" 2>/dev/null
done
echo "--- harden state ---"
/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate 2>/dev/null || echo "firewall UNKNOWN"
/usr/libexec/ApplicationFirewall/socketfilterfw --getstealthmode 2>/dev/null || echo "stealth UNKNOWN"
defaults read /Library/Preferences/com.apple.loginwindow GuestEnabled 2>/dev/null || echo "guest UNSET"
echo "--- filesystem ---"
diskutil verifyVolume / 2>&1 | tail -6 || echo "verify UNKNOWN"
echo "ABSOLUTION1_DONE No disk was erased."
} > "$REPORT" 2>&1
open "$REPORT" 2>/dev/null || true
echo "wrote $REPORT"
