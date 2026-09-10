#!/bin/sh
# lion-phone-download.sh — phone/browser compatible downloader for Snow Leopard Mac
# Works on any machine with curl or wget + internet. No GUI needed.
PATH=/bin:/sbin:/usr/bin:/usr/sbin
export PATH
set -e
URL_RAW="https://raw.githubusercontent.com/mistuhman/nvidia-intel-ocblizzard-4x8ddr4xmp-10gb3080-voidmusl-picom-xfwm4-compizunused-cairodock-egl-glx/arena/01a08a55-nvidia-intel-ocblizzard-4x8ddr/lion-ssd-lion-boot-fix.zip"
URL_JSD="https://cdn.jsdelivr.net/gh/mistuhman/nvidia-intel-ocblizzard-4x8ddr4xmp-10gb3080-voidmusl-picom-xfwm4-compizunused-cairodock-egl-glx@arena/01a08a55-nvidia-intel-ocblizzard-4x8ddr/lion-ssd-lion-boot-fix.zip"
OUT="$HOME/Downloads/lion-ssd-lion-boot-fix.zip"
mkdir -p "$HOME/Downloads"
echo "Lion SSD Fix — downloading..."
echo "Trying raw.githubusercontent.com..."
if command -v curl >/dev/null 2>&1; then
  curl -L -o "$OUT" "$URL_RAW" && echo "Saved $OUT via curl raw" && exit 0
  echo "curl raw failed, trying jsDelivr..."
  curl -L -o "$OUT" "$URL_JSD" && echo "Saved $OUT via curl jsDelivr" && exit 0
fi
if command -v wget >/dev/null 2>&1; then
  wget -O "$OUT" "$URL_RAW" && echo "Saved $OUT via wget raw" && exit 0
  wget -O "$OUT" "$URL_JSD" && echo "Saved $OUT via wget jsDelivr" && exit 0
fi
echo "FAIL: no curl/wget. Open in browser:"
echo "$URL_RAW"
echo "$URL_JSD"
echo "Or live mirror: $HOSTNAME:8000/zip"
exit 1

# .command variant — double-clickable on Snow Leopard
chmod +x "$0" 2>/dev/null || true
# Auto-unzip after download
if [ -f "$OUT" ]; then
  echo "Unzipping..."
  cd "$HOME/Desktop"
  unzip -o "$OUT"
  chmod +x "$HOME/Desktop/"*.command 2>/dev/null || true
  echo "Done. Double-click lion-ssd-lion-boot-fix.command"
  open -a TextEdit "$HOME/Desktop/README_LION_SSD_FIX.txt" 2>/dev/null || true
fi
