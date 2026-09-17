#!/bin/sh
# lion-harden.command - CONFIG-ONLY OS X hardening for Lion 10.7 (double-click).
# Applies etc/lion-harden.block configuration:
# Firewall ON + stealth, Guest OFF, Login hints OFF, Remote services OFF,
# Power womp 0, SoftwareUpdate check OFF.
# Writes ~/Desktop/lion-harden.txt and opens it for the Burn page.
# No disk operations, no deletions, keeps ArcticFox.
set -e
REPORT="$HOME/Desktop/lion-harden.txt"

echo "=== LION 10.7.5 OS X HARDENING ==="
echo "Enter your administrator password if prompted:"
sudo -v || { echo "Authentication failed"; exit 1; }

{
echo "LIONHARDEN1 config-only hardening report"
echo "date=$(date 2>/dev/null || echo UNKNOWN)"
echo "host=$(hostname 2>/dev/null || echo UNKNOWN)"

echo "== PRE =="
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate 2>/dev/null || true
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getstealthmode 2>/dev/null || true
defaults read /Library/Preferences/com.apple.loginwindow GuestEnabled 2>/dev/null || true
sudo systemsetup -getremotelogin 2>/dev/null || true
sudo systemsetup -getremoteappleevents 2>/dev/null || true

echo "== APPLYING HARDENING =="
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate on 2>/dev/null || true
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setstealthmode on 2>/dev/null || true
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setblockall off 2>/dev/null || true

sudo defaults write /Library/Preferences/com.apple.loginwindow GuestEnabled -bool false 2>/dev/null || true
sudo defaults write /Library/Preferences/com.apple.loginwindow RetriesUntilHint -int 0 2>/dev/null || true

sudo systemsetup -setremotelogin off 2>/dev/null || true
sudo systemsetup -setremoteappleevents off 2>/dev/null || true

sudo pmset -a womp 0 2>/dev/null || true
sudo pmset -a autorestart 0 2>/dev/null || true

sudo defaults write /Library/Preferences/com.apple.SoftwareUpdate AutomaticCheckEnabled -bool false 2>/dev/null || true

echo "== POST =="
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate 2>/dev/null || true
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getstealthmode 2>/dev/null || true
defaults read /Library/Preferences/com.apple.loginwindow GuestEnabled 2>/dev/null || true
sudo systemsetup -getremotelogin 2>/dev/null || true
sudo systemsetup -getremoteappleevents 2>/dev/null || true

echo "LIONHARDEN1_DONE Config hardened. No disks were modified."
} > "$REPORT" 2>&1

open "$REPORT" 2>/dev/null || true
echo "wrote $REPORT"
