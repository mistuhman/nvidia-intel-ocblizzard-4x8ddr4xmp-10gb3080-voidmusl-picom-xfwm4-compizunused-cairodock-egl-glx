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
