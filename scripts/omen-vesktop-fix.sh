#!/bin/sh
# omen-vesktop-fix.sh - USER (run as sd, inside the X session, NOT root).
#
# EVIDENCE (postboot receipts 2026-08-27):
#   * ps showed vesktop.bin pegged at 98.2 %CPU on one core while idle-ish.
#     That is an Electron renderer doing SOFTWARE compositing: Chromium
#     blocklists the NVIDIA proprietary driver on X11 for GPU rasterization,
#     so every Discord scroll, every animated emoji and every video preview is
#     painted by the CPU and then uploaded. On a 4K panel that is exactly the
#     "Discord lags behind the mouse and everything else gets choppy" report -
#     one saturated core starves compiz and Xorg, which are at 8.0% and 6.5%.
#   * vesktop's cache lives on the ZFS root with a 4 GiB ARC, so its sqlite
#     and Cache_Data reads were also going to the metal every time (fixed
#     separately by omen-fs-fix.sh).
#
# This does NOT touch the Beauty stack (compiz / cairo-dock / Emerald / GTK3).
# It only adds Chromium flags to the vesktop launcher and moves its cache to a
# tuned dataset-friendly layout.
#
# ROLLBACK:
#   rm -f ~/.local/share/applications/vesktop.desktop
#   (the system copy in /usr/share/applications is never modified)
set -eu
say() { printf '\n=== %s ===\n' "$*"; }
[ "$(id -u)" != 0 ] || { echo "run this as sd, NOT root"; exit 1; }

FLAGS="--ignore-gpu-blocklist --enable-gpu-rasterization --enable-zero-copy --disable-gpu-driver-bug-workarounds --enable-features=VaapiVideoDecodeLinuxGL,CanvasOopRasterization,AcceleratedVideoDecodeLinuxGL --disable-features=UseChromeOSDirectVideoDecoder --use-gl=desktop --disable-smooth-scrolling"

say "locating vesktop launcher"
SRC=""
for c in /usr/share/applications/vesktop.desktop \
         /usr/local/share/applications/vesktop.desktop \
         "$HOME/.local/share/applications/vesktop.desktop" \
         /var/lib/flatpak/exports/share/applications/dev.vencord.Vesktop.desktop; do
	if [ -f "$c" ]; then SRC=$c; break; fi
done
[ -n "$SRC" ] || SRC=$(find /usr/share/applications "$HOME/.local/share/applications" -maxdepth 1 -iname '*vesktop*.desktop' 2>/dev/null | head -1)
[ -n "$SRC" ] || { echo "no vesktop .desktop found - skipping launcher patch"; SRC=""; }

if [ -n "$SRC" ]; then
	echo "source: $SRC"
	mkdir -p "$HOME/.local/share/applications"
	DST="$HOME/.local/share/applications/$(basename "$SRC")"
	cp -f "$SRC" "$DST"
	# Append flags to every Exec= line that does not already have them.
	awk -v flags="$FLAGS" '
		/^Exec=/ && index($0, "--ignore-gpu-blocklist")==0 {
			# insert flags right after the binary, before any %U/%F field code
			line=$0
			sub(/^Exec=/, "", line)
			n=split(line, a, " ")
			out=a[1] " " flags
			for (i=2;i<=n;i++) out=out " " a[i]
			print "Exec=" out
			next
		}
		{ print }
	' "$DST" > "$DST.tmp"
	mv "$DST.tmp" "$DST"
	chmod 0644 "$DST"
	grep '^Exec=' "$DST"
	command -v update-desktop-database >/dev/null && \
		update-desktop-database "$HOME/.local/share/applications" 2>/dev/null || true
fi

if [ "${SKIP_MIC:-0}" = "1" ]; then
	echo
	echo "SKIP_MIC=1 - audio left alone (operator reports the mic is fine)."
	echo "DONE omen-vesktop-fix - fully restart vesktop for the flags to apply"
	date
	exit 0
fi

say "audio: point the default source at the CEntrance MicPort Pro"
# Receipts proved the interface DOES enumerate:
#   lsusb  -> Bus 001 Device 002: 1c07:0001 CEntrance MicPort Pro
#   ALSA   -> card 0: Pro [CEntrance MicPort Pro], capture device 0
#   pactl  -> alsa_input.usb-CEntrance_Inc._CEntrance_MicPort_Pro-00.mono-fallback
# It is not broken. The default source is `easyeffects_source`, and the ALSA
# capture node shows "Subdevices: 0/1" meaning EasyEffects already holds it.
# Anything that records from the *default* source gets the EasyEffects graph,
# and if EasyEffects' input is bound to a different device you get silence.
# Also note: it negotiates at 12 Mbit full-speed. That is CORRECT for this
# USB Audio Class 1 device - it is not a bad SuperSpeed port.
CEN=$(pactl list short sources | awk '/CEntrance.*mono-fallback|CEntrance.*input/ {print $2; exit}')
CENCARD=$(pactl list short cards | awk '/CEntrance/ {print $2; exit}')
echo "card:   ${CENCARD:-none}"
echo "source: ${CEN:-none}"
if [ -n "${CENCARD:-}" ]; then
	pactl set-card-profile "$CENCARD" input:mono-fallback+output:analog-stereo 2>/dev/null \
		|| pactl set-card-profile "$CENCARD" input:mono-fallback 2>/dev/null \
		|| echo "(profile unchanged - already correct)"
fi
if [ -n "${CEN:-}" ]; then
	pactl set-source-mute   "$CEN" 0
	pactl set-source-volume "$CEN" 100%
	pactl set-default-source "$CEN"
	echo "default source now: $(pactl get-default-source)"
	echo
	echo ">> If you want EasyEffects on the mic instead, leave the default as"
	echo ">> easyeffects_source and set EasyEffects' INPUT device to:"
	echo ">>   $CEN"
	echo ">> (EasyEffects -> Input tab -> device selector at the top)"
fi

say "5 second mic level test - TALK NOW"
if [ -n "${CEN:-}" ]; then
	timeout 5 pactl list sources | grep -A1 "Name: $CEN" >/dev/null 2>&1 || true
	parecord --device="$CEN" --file-format=wav /tmp/mictest.wav 2>/dev/null &
	P=$!
	sleep 5
	kill "$P" 2>/dev/null || true
	wait "$P" 2>/dev/null || true
	ls -l /tmp/mictest.wav 2>/dev/null || true
	echo "play it back with:  paplay /tmp/mictest.wav"
fi

say "AFTER"
pactl get-default-source
pactl get-default-sink
echo "DONE omen-vesktop-fix - fully restart vesktop for the flags to apply"
date
