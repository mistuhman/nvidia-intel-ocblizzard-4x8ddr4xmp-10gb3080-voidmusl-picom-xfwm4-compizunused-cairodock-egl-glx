#!/bin/sh
# Lion installer date/cert fix for Snow Leopard 10.6.8
# Fixes "This copy of the Install OS X Lion application can't be verified"
# Double-click from Desktop after extracting ZIP.

PATH=/bin:/sbin:/usr/bin:/usr/sbin
export PATH
umask 022
SELF="$0"
[ -f "$SELF" ] && chmod 755 "$SELF" 2>/dev/null || true

REPORT_DIR="$HOME/Desktop"
[ -d "$REPORT_DIR" ] || REPORT_DIR="$HOME"
REPORT="$REPORT_DIR/lion-installer-date-fix.txt"

(
echo "Lion installer date fix"
echo "Generated: $(date)"
echo "Host: $(sw_vers 2>&1; uname -a)"
echo ""
if ! sudo -v; then
  echo "FAIL: admin auth required"
  exit 1
fi

echo ""
echo "===== BEFORE ====="
date
ls -ld "/Applications/Install OS X Lion.app" "/Applications/Install Mac OS X Lion.app" 2>&1
xattr -l "/Applications/Install OS X Lion.app" 2>&1 | head -n 20

echo ""
echo "Clearing quarantine..."
sudo xattr -cr "/Applications/Install OS X Lion.app" 2>&1 || true
sudo xattr -cr "/Applications/Install Mac OS X Lion.app" 2>&1 || true

echo ""
echo "Setting date to 2016-01-01 00:00 to bypass expired cert (2016-02-14 and 2019-10-24)"
echo "Current date before change: $(date)"
sudo date 0101000016 2>&1
echo "New date: $(date)"
echo ""
echo "Now try launching installer:"
echo "  open \"/Applications/Install OS X Lion.app\""
echo ""
echo "If it launches, proceed to install to Bay3 SSD."
echo "After install starts, restore date with:"
echo "  sudo sntp -sS time.apple.com"
echo "or"
echo "  sudo date $(date -u +%m%d%H%M%y 2>/dev/null || echo 'MMDDhhmmYY')"
echo ""
echo "If it still fails, try alternate date: sudo date 0808111115 (Aug 8 2015)"
echo ""
echo "Report saved"
) > "$REPORT" 2>&1
cat "$REPORT"
open -a TextEdit "$REPORT" 2>/dev/null || true
