#!/bin/sh
# lion.command - double-click or run on 10.6.
# Injects the headless Lion CLI auto-install into the scratch ESD volume
# (the one named "Mac OS X", restored onto Untitled). Idempotent.
echo "=== arena-lion-autoinstall start ==="
hdiutil detach /Volumes/Mac*ESD 2>/dev/null
sudo diskutil mountAll
V=$(ls -d /Volumes/Mac* 2>/dev/null | head -1)
if [ -z "$V" ]; then
  echo "FAIL: no /Volumes/Mac* volume mounted"
  ls /Volumes
  exit 1
fi
if [ ! -d "$V/Packages" ]; then
  echo "FAIL: $V has no Packages dir - wrong volume: $V"
  exit 1
fi
sudo mkdir -p "$V/usr/local/libexec"
sudo tee "$V/usr/local/libexec/arena-lion.sh" <<'EOS'
#!/bin/sh
/usr/sbin/diskutil mountAll
/bin/echo AUTOINSTALL-STARTED > "/Volumes/Lion SSD Base/lion-cli.log"
/bin/date 0801120013
/usr/sbin/installer -pkg /Packages/OSInstall.mpkg -target "/Volumes/start disk clone" -verboseR >> "/Volumes/Lion SSD Base/lion-cli.log" 2>&1
/bin/date >> "/Volumes/Lion SSD Base/lion-cli.log"
/sbin/reboot
EOS
sudo chmod 755 "$V/usr/local/libexec/arena-lion.sh"
sudo tee "$V/System/Library/LaunchDaemons/org.arena.lion-autoinstall.plist" <<'EOS'
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
sudo chown root:wheel "$V/usr/local/libexec/arena-lion.sh" "$V/System/Library/LaunchDaemons/org.arena.lion-autoinstall.plist"
sudo chmod 644 "$V/System/Library/LaunchDaemons/org.arena.lion-autoinstall.plist"
echo "=== SUCCESS: injected into $V ==="
echo "NEXT: Reboot your Mac, hold Option, click the 'Mac OS X' drive icon."
echo "The screen will say unsupported timing (black/out-of-range), but it is installing in the background (~15-20 min)."
echo "When done, it will automatically reboot back to 10.6."
echo "After reboot, check /lion-cli.log."
