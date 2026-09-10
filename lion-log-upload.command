#!/bin/sh
# lion-log-upload.command — easy log return from Snow Leopard Mac, phone-friendly
# Finds ~/Desktop/lion-*.txt and uploads to termbin.com + saves local copy
PATH=/bin:/sbin:/usr/bin:/usr/sbin
export PATH
SELF="$0"
[ -f "$SELF" ] && chmod 755 "$SELF" 2>/dev/null || true
REPORT_DIR="$HOME/Desktop"
OUT="$REPORT_DIR/upload-links.txt"
echo "Lion log uploader — $(date)" | tee "$OUT"
echo "" | tee -a "$OUT"
for F in "$REPORT_DIR"/lion-*.txt "$REPORT_DIR"/lion-*.log; do
  [ -f "$F" ] || continue
  echo "--- $F ---" | tee -a "$OUT"
  ls -lh "$F" | tee -a "$OUT"
  echo "Uploading to termbin.com (nc)..." | tee -a "$OUT"
  if command -v nc >/dev/null 2>&1; then
    URL=$(cat "$F" | nc termbin.com 9999 2>&1)
    echo "termbin URL: $URL" | tee -a "$OUT"
  else
    echo "nc not found, trying curl to file.io" | tee -a "$OUT"
    URL=$(curl -s -F "file=@$F" https://file.io 2>&1 | grep -o 'https://file.io/[^"]*' | head -n1)
    echo "file.io URL: $URL" | tee -a "$OUT"
  fi
  echo "" | tee -a "$OUT"
done
echo "" | tee -a "$OUT"
echo "Copy the termbin URL above to your phone browser or paste in Arena chat for debugging." | tee -a "$OUT"
cat "$OUT"
open -a TextEdit "$OUT" 2>/dev/null || true
