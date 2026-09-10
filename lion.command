#!/bin/sh
# lion.command - double-click or run on 10.6.
# Injects the headless Lion CLI auto-install into the scratch ESD volume.
# Compatible with OS X 10.6 Snow Leopard. Idempotent.

echo "=== arena-lion-autoinstall start ==="

# Prompt for sudo password up-front so subsequent writes do not pause
sudo -v || exit 1

# Detach any read-only dmg mount first
hdiutil detach /Volumes/Mac*ESD 2>/dev/null

# Mount all connected disk partitions
for d in /dev/disk[0-9]*; do
  sudo diskutil mount "$d" 2>/dev/null
done

# Target the restored ESD volume on the Samsung drive
TARGET="/Volumes/Mac OS X Install ESD"
if [ ! -d "$TARGET" ]; then
  TARGET=$(ls -d /Volumes/Mac* 2>/dev/null | head -1)
fi

if [ ! -d "$TARGET" ] || [ ! -d "$TARGET/Packages" ]; then
  echo "FAIL: Could not locate /Volumes/Mac OS X Install ESD"
  ls -la /Volumes
  exit 1
fi

echo "Injecting payload into: $TARGET"

# 1. Write the installer script
sudo mkdir -p "$TARGET/usr/local/libexec"
sudo tee "$TARGET/usr/local/libexec/arena-lion.sh" <<'EOS'
#!/bin/sh
[ -f /tmp/arena-running ] && exit 0
touch /tmp/arena-running

sleep 5

for d in /dev/disk[0-9]*; do
  /usr/sbin/diskutil mount "$d" 2>/dev/null
done

LOG="/Volumes/Lion SSD Base/lion-cli.log"
if [ ! -d "/Volumes/Lion SSD Base" ]; then
  mkdir -p "/Volumes/Lion SSD Base"
  mount -t hfs -o rw /dev/disk0s2 "/Volumes/Lion SSD Base" 2>/dev/null
fi

[ ! -d "/Volumes/Lion SSD Base" ] && LOG="/tmp/lion-cli.log"

/bin/echo "AUTOINSTALL-STARTED" > "$LOG"
/bin/date >> "$LOG"
/bin/date 0801120013 >> "$LOG" 2>&1

PKG="/Packages/OSInstall.mpkg"
if [ ! -f "$PKG" ]; then
  PKG="/System/Installation/Packages/OSInstall.mpkg"
fi

/bin/echo "Installing $PKG to /Volumes/start disk clone..." >> "$LOG"
/usr/sbin/installer -pkg "$PKG" -target "/Volumes/start disk clone" -verboseR >> "$LOG" 2>&1
STATUS=$?

/bin/echo "Installer finished with exit status: $STATUS" >> "$LOG"
/bin/date >> "$LOG"

cp "$LOG" "/Volumes/start disk clone/lion-cli.log" 2>/dev/null

sync
/sbin/reboot
EOS

sudo chmod 755 "$TARGET/usr/local/libexec/arena-lion.sh"
sudo chown root:wheel "$TARGET/usr/local/libexec/arena-lion.sh"

# 2. Hook 1: LaunchDaemon
sudo tee "$TARGET/System/Library/LaunchDaemons/org.arena.lion-autoinstall.plist" <<'EOS'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
<key>Label</key><string>org.arena.lion-autoinstall</string>
<key>ProgramArguments</key><array><string>/bin/sh</string><string>/usr/local/libexec/arena-lion.sh</string></array>
<key>RunAtLoad</key><true/>
</dict>
</plist>
EOS

sudo chown root:wheel "$TARGET/System/Library/LaunchDaemons/org.arena.lion-autoinstall.plist"
sudo chmod 644 "$TARGET/System/Library/LaunchDaemons/org.arena.lion-autoinstall.plist"

# 3. Hook 2: /etc/rc.local
sudo tee "$TARGET/etc/rc.local" <<'EOS'
#!/bin/sh
/bin/sh /usr/local/libexec/arena-lion.sh &
EOS
sudo chmod 755 "$TARGET/etc/rc.local"
sudo chown root:wheel "$TARGET/etc/rc.local"

# 4. Hook 3: /etc/rc.cdrom append if present
if [ -f "$TARGET/etc/rc.cdrom" ]; then
  if ! grep -q "arena-lion.sh" "$TARGET/etc/rc.cdrom"; then
    echo "/bin/sh /usr/local/libexec/arena-lion.sh &" | sudo tee -a "$TARGET/etc/rc.cdrom" >/dev/null
  fi
fi

echo ""
echo "=== ALL INJECTIONS SUCCESSFUL INTO $TARGET ==="
echo ""
echo "NEXT STEPS:"
echo "1. Reboot your Mac Pro."
echo "2. Hold down the OPTION key during boot."
echo "3. Click the 'Mac OS X Install ESD' (or 'Mac OS X') volume icon."
echo "4. The screen will show timing unsupported (black/out-of-range), but the installer is running in the background (~15-20 min)."
echo "5. When complete, the Mac Pro will automatically reboot back into 10.6."
echo "6. In Terminal, run: cat /lion-cli.log"
