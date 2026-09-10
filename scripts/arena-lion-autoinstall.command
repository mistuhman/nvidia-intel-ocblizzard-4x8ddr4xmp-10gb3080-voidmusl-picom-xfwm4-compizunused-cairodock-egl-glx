#!/bin/sh
# lion.command - double-click or run on 10.6.
# Injects the headless Lion CLI auto-install into the scratch ESD volume.
# Compatible with OS X 10.6 Snow Leopard. Idempotent.

echo "=== arena-lion-autoinstall start ==="

# Detach any read-only dmg mount first
hdiutil detach /Volumes/Mac*ESD 2>/dev/null

# Mount all connected disk partitions (10.6 compatible)
echo "Mounting all partitions..."
for d in /dev/disk[0-9]*; do
  sudo diskutil mount "$d" 2>/dev/null
done

# Find the writable ESD volume (restored on hard drive)
TARGET_ESD=""
for v in /Volumes/*; do
  # Ignore root / base system / target SSD
  if [ "$v" = "/Volumes/Lion SSD Base" ] || [ "$v" = "/Volumes/start disk clone" ]; then
    continue
  fi
  if [ -f "$v/Packages/OSInstall.mpkg" ] || [ -f "$v/System/Installation/Packages/OSInstall.mpkg" ]; then
    TARGET_ESD="$v"
    break
  fi
done

if [ -z "$TARGET_ESD" ]; then
  echo "FAIL: Could not locate the restored Lion ESD volume."
  echo "Currently mounted volumes:"
  ls -la /Volumes
  echo ""
  echo "Disk list:"
  diskutil list
  exit 1
fi

echo "Found Lion ESD volume at: $TARGET_ESD"

# Inject the headless installer script
sudo mkdir -p "$TARGET_ESD/usr/local/libexec"
sudo tee "$TARGET_ESD/usr/local/libexec/arena-lion.sh" <<'EOS'
#!/bin/sh
# Headless Lion Installer Script (runs at boot from the restored ESD volume)
for d in /dev/disk[0-9]*; do
  /usr/sbin/diskutil mount "$d" 2>/dev/null
done

/bin/echo "AUTOINSTALL-STARTED" > "/Volumes/Lion SSD Base/lion-cli.log"
/bin/date >> "/Volumes/Lion SSD Base/lion-cli.log"
/bin/date 0801120013

PKG="/Packages/OSInstall.mpkg"
if [ ! -f "$PKG" ]; then
  PKG="/System/Installation/Packages/OSInstall.mpkg"
fi

/bin/echo "Installing $PKG to /Volumes/start disk clone..." >> "/Volumes/Lion SSD Base/lion-cli.log"
/usr/sbin/installer -pkg "$PKG" -target "/Volumes/start disk clone" -verboseR >> "/Volumes/Lion SSD Base/lion-cli.log" 2>&1
STATUS=$?

/bin/echo "Installer finished with exit status: $STATUS" >> "/Volumes/Lion SSD Base/lion-cli.log"
/bin/date >> "/Volumes/Lion SSD Base/lion-cli.log"
/sbin/reboot
EOS

sudo chmod 755 "$TARGET_ESD/usr/local/libexec/arena-lion.sh"

# Inject the LaunchDaemon plist to run at boot
sudo tee "$TARGET_ESD/System/Library/LaunchDaemons/org.arena.lion-autoinstall.plist" <<'EOS'
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

sudo chown root:wheel "$TARGET_ESD/usr/local/libexec/arena-lion.sh" "$TARGET_ESD/System/Library/LaunchDaemons/org.arena.lion-autoinstall.plist"
sudo chmod 644 "$TARGET_ESD/System/Library/LaunchDaemons/org.arena.lion-autoinstall.plist"

echo ""
echo "=== SUCCESS: INJECTED INTO $TARGET_ESD ==="
echo ""
echo "NEXT STEPS:"
echo "1. Reboot your Mac Pro."
echo "2. Hold down the OPTION key during boot."
echo "3. Click the 'Mac OS X' volume icon."
echo "4. The screen will say timing unsupported (black/out-of-range), but the installer is running (~15-20 min)."
echo "5. When complete, the Mac Pro will automatically reboot back into 10.6."
echo "6. In Terminal, run: cat /lion-cli.log"
