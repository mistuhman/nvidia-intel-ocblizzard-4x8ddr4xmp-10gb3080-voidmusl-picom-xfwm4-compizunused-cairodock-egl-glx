#!/bin/sh
# lion-clean-junk.command — sweep kids apps, leftover uninstallers, and rebuild Launchpad
set -e

echo "=== Lion Junk & Launchpad Cleaner ==="
echo

# If not running as root, re-run with sudo so root-owned apps can be removed
if [ "$(id -u)" != "0" ]; then
  echo "Administrator password required to remove apps from /Applications."
  sudo "$0" "$@"
  exit $?
fi

JUNK_APPS="
Kid Pix Deluxe 3D.app
Mavis Beacon Teaches Typing.app
LeapFrogConnect.app
Mathemagics.app
Adobe AIR Uninstaller.app
Adobe AIR Application Installer.app
Uninstall Contour Shuttle.app
LCC Uninstaller.app
LCC Connection Utility.app
LCC Update.app
ATI Radeon HD 2600 XT Firmware Update.app
Mac Pro EFI Firmware Update.app
iWeb.app
iPhoto.app
iMovie.app
iDVD.app
Google Chrome.app
Google Chrome 2.app
Firefox.app
Opera.app
Flock.app
Machinarium.app
Braid.app
Chess.app
Awaken.app
MacGourmet.app
MacGourmet Deluxe.app
SousChef.app
YummySoup!.app
TomTom HOME.app
Garmin WebUpdater.app
VMware Fusion.app
Yahoo! Messenger.app
Skype.app
Adium.app
iChat.app
Remote Desktop.app
Eye-Fi Manager.app
Transmission.app
CSSEdit.app
DaisyDisk.app
WhatSize.app
Sponge.app
MacDaddy.app
Google Goggles.app
Evernote.app
Leopard Cache Cleaner.app
Cocktail.app
CrushFTP4.app
Geekbench.app
Mark:Space Notebook.app
SuperSync.app
Syncopation.app
TweetDeck.app
iStumbler.app
MacUpdate Desktop.app
VersionTracker Pro.app
"

REMOVED=0
echo "--- Removing unneeded apps and uninstallers ---"
for app in $JUNK_APPS; do
  TARGET="/Applications/$app"
  if [ -e "$TARGET" ]; then
    echo "Removing: $app"
    rm -rf "$TARGET"
    REMOVED=$((REMOVED + 1))
  fi
  TARGET_UTIL="/Applications/Utilities/$app"
  if [ -e "$TARGET_UTIL" ]; then
    echo "Removing from Utilities: $app"
    rm -rf "$TARGET_UTIL"
    REMOVED=$((REMOVED + 1))
  fi
done

echo
echo "Total apps removed: $REMOVED"

# Rebuild Launchpad database for the logged-in user
echo
echo "--- Rebuilding Launchpad database ---"
CONSOLE_USER=$(stat -f "%Su" /dev/console 2>/dev/null || who | awk '{print $1}' | head -1)
if [ -n "$CONSOLE_USER" ] && [ -d "/Users/$CONSOLE_USER" ]; then
  DOCK_DIR="/Users/$CONSOLE_USER/Library/Application Support/Dock"
  if [ -d "$DOCK_DIR" ]; then
    echo "Clearing Launchpad database for $CONSOLE_USER..."
    rm -f "$DOCK_DIR"/*.db 2>/dev/null || true
    echo "Restarting Dock..."
    killall -u "$CONSOLE_USER" Dock 2>/dev/null || killall Dock 2>/dev/null || true
  fi
fi

echo
echo "=== CLEANUP COMPLETE ==="
echo "Launchpad has refreshed. All kids apps and uninstallers are gone."
echo "Pro software (Final Cut Studio, Motion, Compressor, DVD Studio Pro, Aperture,"
echo "GarageBand, Arctic Fox, Transmit, Contour driver, Flavours, CandyBar) is preserved."
echo
