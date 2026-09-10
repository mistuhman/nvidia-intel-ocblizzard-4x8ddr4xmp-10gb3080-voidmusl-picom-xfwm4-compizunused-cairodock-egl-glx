#!/bin/sh
# lion-phone-download.sh — phone/browser compatible downloader for Snow Leopard Mac
# Works on any machine with curl or wget + internet. Uses da.gd short links (tinyurl fails on Arctic)
PATH=/bin:/sbin:/usr/bin:/usr/sbin
export PATH
set -e
URL_SHORT="https://da.gd/mOycI"
URL_RAW="https://raw.githubusercontent.com/mistuhman/nvidia-intel-ocblizzard-4x8ddr4xmp-10gb3080-voidmusl-picom-xfwm4-compizunused-cairodock-egl-glx/arena/01a08a55-nvidia-intel-ocblizzard-4x8ddr/lion-ssd-lion-boot-fix.zip"
URL_JSD="https://cdn.jsdelivr.net/gh/mistuhman/nvidia-intel-ocblizzard-4x8ddr4xmp-10gb3080-voidmusl-picom-xfwm4-compizunused-cairodock-egl-glx@arena/01a08a55-nvidia-intel-ocblizzard-4x8ddr/lion-ssd-lion-boot-fix.zip"
OUT="$HOME/Downloads/lion-ssd-lion-boot-fix.zip"
mkdir -p "$HOME/Downloads"
echo "Lion SSD Fix — downloading via da.gd short link (Arctic Fox friendly)..."
if command -v curl >/dev/null 2>&1; then
  echo "Trying https://da.gd/mOycI..."
  curl -L -o "$OUT" "https://da.gd/mOycI" && echo "Saved $OUT via curl da.gd" && exit 0
  echo "da.gd failed, trying raw..."
  curl -L -o "$OUT" "$URL_RAW" && echo "Saved $OUT via curl raw" && exit 0
  curl -L -o "$OUT" "$URL_JSD" && echo "Saved $OUT via curl jsDelivr" && exit 0
fi
if command -v wget >/dev/null 2>&1; then
  wget -O "$OUT" "https://da.gd/mOycI" && echo "Saved $OUT via wget da.gd" && exit 0
  wget -O "$OUT" "$URL_RAW" && echo "Saved $OUT via wget raw" && exit 0
fi
echo "FAIL: no curl/wget. Open in Arctic Fox browser:"
echo "https://da.gd/mOycI"
echo "https://da.gd/XeHlN"
echo "$URL_RAW"
exit 1
