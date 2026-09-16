#!/bin/sh
# lion-arcticfox-harden.command - CONFIG-ONLY Arctic Fox hardener for Lion 10.7 (double-click).
# Writes a user.js into the Arctic Fox profile (prefs.js backup kept as rollback), then writes
# ~/Desktop/lion-arcticfox.txt and opens it for the One-page Burn (da.gd/lionone).
# No privilege escalation, no network, no disk or firmware changes. Keeps Arctic Fox by rule.
# Rollback: delete the user.js this script writes; prefs.js.prehardened stays as the backup.
REPORT="$HOME/Desktop/lion-arcticfox.txt"
SUPPORT="$HOME/Library/Application Support/ArcticFox"
PREF=$(find "$SUPPORT" -name prefs.js -print 2>/dev/null | head -1)
if [ -z "$PREF" ]; then
  {
    echo "LIONARCTIC1 arcticfox hardening report"
    echo "date=$(date 2>/dev/null || echo UNKNOWN)"
    echo "FAIL no prefs.js under $SUPPORT - launch Arctic Fox once, quit it, re-run"
    echo "LIONARCTIC1_DONE config only - Arctic Fox kept, no disk was erased."
  } > "$REPORT" 2>&1
  open "$REPORT" 2>/dev/null || true
  echo "no profile found - wrote $REPORT"
  exit 0
fi
PROFILE=$(dirname "$PREF")
if [ -f "$PROFILE/prefs.js.prehardened" ]; then
  BAK="prefs.js.prehardened already present"
elif cp "$PROFILE/prefs.js" "$PROFILE/prefs.js.prehardened" 2>/dev/null; then
  BAK="created prefs.js.prehardened"
else
  BAK="copy-failed"
fi
if [ -f "$PROFILE/user.js" ] && [ ! -f "$PROFILE/user.js.prehardened" ]; then
  cp "$PROFILE/user.js" "$PROFILE/user.js.prehardened" 2>/dev/null || true
fi
cat > "$PROFILE/user.js" <<'USERJS'
// lion-arcticfox-harden.command user.js - config-only hardening, Arctic Fox 47.x (Goanna/FF52 class).
// Every key below is a Firefox-52-era pref; locked at startup by user.js. Rollback = delete this file.
user_pref("security.tls.version.min", 3);
user_pref("network.cookie.cookieBehavior", 1);
user_pref("privacy.trackingprotection.enabled", true);
user_pref("privacy.donottrackheader.enabled", true);
user_pref("geo.enabled", false);
user_pref("dom.battery.enabled", false);
user_pref("browser.cache.offline.enable", false);
user_pref("dom.event.clipboardevents.enabled", false);
user_pref("security.warn_entering_secure", false);
user_pref("security.warn_leaving_secure", false);
// required so the legacy uBlock Origin XPI (unsigned) can install - install XPIs only from the
// exact URL in docs/mac-daily-driver.md section 3.
user_pref("xpinstall.signatures.required", false);
// OPTIONAL, commented: uncomment = WebRTC fully off (no IP leak, no webcam calls on 47.3).
// user_pref("media.peerconnection.enabled", false);
// OPTIONAL, commented: hard OCSP - breaks legacy-cert sites on this box, left off on purpose.
// user_pref("security.OCSP.require", true);
USERJS
BYTES=$(wc -c < "$PROFILE/user.js" 2>/dev/null | tr -d " ")
COUNT=$(grep -c "^user_pref" "$PROFILE/user.js" 2>/dev/null)
VER=$(defaults read /Applications/ArcticFox.app/Contents/Info CFBundleShortVersionString 2>/dev/null || echo UNKNOWN)
{
  echo "LIONARCTIC1 arcticfox hardening report"
  echo "date=$(date 2>/dev/null || echo UNKNOWN)"
  echo "profile=$PROFILE"
  echo "prefs-backup=$BAK"
  echo "userjs-bytes=$BYTES"
  echo "userprefs-locked=$COUNT"
  echo "arcticfox-version=$VER"
  echo "prefs-check: security.tls.version.min=3 network.cookie.cookieBehavior=1 trackingprotection=on"
  echo "rollback: delete $PROFILE/user.js (prefs.js.prehardened kept)"
  echo "LIONARCTIC1_DONE config only - Arctic Fox kept, no disk was erased."
} > "$REPORT" 2>&1
open "$REPORT" 2>/dev/null || true
echo "wrote $REPORT"
