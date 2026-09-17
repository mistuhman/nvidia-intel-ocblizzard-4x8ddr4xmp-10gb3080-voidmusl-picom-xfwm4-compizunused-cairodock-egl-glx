#!/bin/sh
# KISS one-thing-one-job mirror — fetch etc/lion-command.txt, drop to Desktop, no sudo/no erase
set -eu
OUT="$HOME/Desktop/lion-command-mirror.txt"
REPO="mistuhman/nvidia-intel-ocblizzard-4x8ddr4xmp-10gb3080-voidmusl-picom-xfwm4-compizunused-cairodock-egl-glx"
for SRC in "https://raw.githubusercontent.com/$REPO/main/etc/lion-command.txt" "https://raw.githubusercontent.com/$REPO/arena/01a0aade-nvidia-intel-ocblizzard-4x8ddr/etc/lion-command.txt"; do
  if command -v curl >/dev/null 2>&1 && curl -fsSL "$SRC" -o "$OUT" 2>/dev/null && head -n1 "$OUT" | grep -q "LION-ONE"; then break; fi
  if command -v wget >/dev/null 2>&1 && wget -qO "$OUT" "$SRC" 2>/dev/null && head -n1 "$OUT" | grep -q "LION-ONE"; then break; fi
done
# fallback embedded (Bay-2 CCC 3cb9d11)
if ! head -n1 "$OUT" 2>/dev/null | grep -q "LION-ONE"; then
  cat > "$OUT" <<'EMB'
LION-ONE | 2026-09-16h | current one link da.gd/sQ7bEo

LION BAY-2 CCC | 2026-09-17j (session 01a0af07) — Kingston GUID 239.7 GB, Raid X degraded, start disk clone intact, preflight 12:37 PASS, CCC Path A next.

COMPILE_GATE=HOLD
Old lion-wipe-harden.txt directions are SUSPENDED; no erase is armed.

— arena/01a0af07 3cb9d11
EMB
fi
echo "LION_COMMAND_MIRROR_DONE No disk was erased." >> "$OUT"
cp "$OUT" "/lion-command-mirror.txt" 2>/dev/null || true
open "$OUT" 2>/dev/null || true
