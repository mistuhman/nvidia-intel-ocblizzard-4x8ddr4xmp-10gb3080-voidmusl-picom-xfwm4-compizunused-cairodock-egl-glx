#!/bin/sh
# omen-vesktop-flatpak.sh - ROOT. vesktop is a FLATPAK. Fix it as one.
#
# WHAT THE DISCOVERY PROVED
#   flatpak list -> Vesktop  dev.vencord.Vesktop  1.6.7  stable  system
#   Exec=/usr/bin/flatpak run --branch=stable --arch=x86_64 \
#        --command=startvesktop --file-forwarding dev.vencord.Vesktop @@u %U @@
#
#   My earlier edit put the Chromium flags between `flatpak` and `run`:
#       /usr/bin/flatpak --ignore-gpu-blocklist ... run ...
#   flatpak parses its OWN options first, hits an unknown one, and exits before
#   `run` is ever reached. That is why vesktop stopped launching. Already
#   stripped and reverted by omen-vesktop-find.sh.
#
# THE REAL PERFORMANCE SUSPECT - GL EXTENSION SKEW
#   A Flatpak cannot see the host NVIDIA driver. It needs a matching
#   org.freedesktop.Platform.GL.nvidia-<driver> extension. The host was moved
#   595.84 -> 595.91.07 during the OpenCL work on 2026-08-25. If the flatpak
#   nvidia extension did not follow, vesktop falls back to **llvmpipe software
#   rendering** - which explains a 98.2 %CPU Electron renderer far better than
#   Chromium's GPU blocklist does. This checks that skew explicitly.
#
# FLAG PLACEMENT, done correctly this time: Chromium flags belong AFTER the
# application id and BEFORE the @@u file-forwarding block, never before `run`.
set -eu
say() { printf '\n========== %s ==========\n' "$*"; }
sub() { printf '\n-- %s\n' "$*"; }
[ "$(id -u)" = 0 ] || { echo "must be root (sudo -i)"; exit 1; }

U=${SUDO_USER:-sd}
UH=$(getent passwd "$U" | cut -d: -f6)
UID_=$(id -u "$U")
APP=dev.vencord.Vesktop
BPID=$(pgrep -u "$U" -x xfsettingsd || pgrep -u "$U" -x xfce4-panel || pgrep -u "$U" -x xfdesktop || true)
BUS=""; DISP=":0"
if [ -n "$BPID" ]; then
	BUS=$(tr '\0' '\n' < "/proc/$BPID/environ" | sed -n 's/^DBUS_SESSION_BUS_ADDRESS=//p' | head -1)
	D=$(tr '\0' '\n' < "/proc/$BPID/environ" | sed -n 's/^DISPLAY=//p' | head -1)
	[ -n "$D" ] && DISP=$D
fi
asuser() {
	# HOME= is NOT optional: `su USER -c` (no dash) leaves HOME=/root, which
	# sent flatpak at /root/.local/share/flatpak, broke MESA's DRI load with
	# "Permission denied", and made vesktop start with a blank config.
	su "$U" -s /bin/sh -c \
	"HOME='$UH' USER='$U' LOGNAME='$U' XAUTHORITY='$UH/.Xauthority' DISPLAY=$DISP XDG_RUNTIME_DIR=/run/user/$UID_ ${BUS:+DBUS_SESSION_BUS_ADDRESS='$BUS'} $*"
}

say "1/5 driver vs flatpak GL extension"
HOSTDRV=$(nvidia-smi --query-gpu=driver_version --format=csv,noheader 2>/dev/null | head -1)
echo "host driver:        $HOSTDRV"
WANT="nvidia-$(printf '%s' "$HOSTDRV" | tr '.' '-')"
echo "extension needed:   org.freedesktop.Platform.GL.$WANT"
echo "extensions present:"
flatpak list --all 2>/dev/null | grep -i 'GL.nvidia' || echo "  NONE - this is the problem"
if flatpak list --all 2>/dev/null | grep -q "GL\.$WANT"; then
	echo "MATCH: the correct GL extension is installed"
else
	sub "installing the matching GL extension"
	flatpak install -y --noninteractive flathub "org.freedesktop.Platform.GL.$WANT" 2>&1 | tail -10 \
		|| echo "  (not on flathub under that exact name - the update below should pull it)"
fi

say "2/5 update the flatpak stack"
flatpak update -y --noninteractive 2>&1 | tail -25 || true
sub "GL extensions after update"
flatpak list --all 2>/dev/null | grep -i 'GL.nvidia' || echo "  still none"

say "3/5 is vesktop actually getting the GPU?"
sub "renderer as seen from INSIDE the sandbox"
asuser "flatpak run --command=sh $APP -c 'command -v glxinfo >/dev/null && glxinfo -B || echo glxinfo-not-in-sandbox'" 2>&1 | head -20 || true
sub "does the sandbox see the nvidia device nodes"
asuser "flatpak run --command=sh $APP -c 'ls -l /dev/nvidia* 2>/dev/null || echo NO-NVIDIA-NODES'" 2>&1 | head -10 || true

say "4/5 launch test - plain first"
pkill -u "$U" -f -i vesktop 2>/dev/null || true
sleep 2
asuser "nohup flatpak run $APP >/tmp/vesktop-plain.log 2>&1 &" || true
sleep 12
if pgrep -u "$U" -f -i vesktop >/dev/null; then
	echo "PLAIN LAUNCH: OK"
	PLAIN=ok
else
	echo "PLAIN LAUNCH: FAILED"
	PLAIN=fail
fi
tail -30 /tmp/vesktop-plain.log 2>/dev/null || true

say "5/5 GPU flags in the CORRECT position"
DESK="$UH/.local/share/applications/$APP.desktop"
if [ "$PLAIN" != "ok" ]; then
	echo "plain launch failed - not adding flags on top of a broken app."
	echo "Paste /tmp/vesktop-plain.log and I will work from the real error."
elif [ ! -f "$DESK" ]; then
	echo "no user desktop entry at $DESK - nothing to patch"
else
	MINFLAGS="--ignore-gpu-blocklist --enable-gpu-rasterization --enable-zero-copy"
	sub "testing the flags via flatpak run (app id first, then flags)"
	pkill -u "$U" -f -i vesktop 2>/dev/null || true
	sleep 2
	asuser "nohup flatpak run $APP $MINFLAGS >/tmp/vesktop-flags.log 2>&1 &" || true
	sleep 12
	if pgrep -u "$U" -f -i vesktop >/dev/null; then
		echo "FLAGGED LAUNCH: OK - writing them into the desktop entry"
		cp -a "$DESK" "$DESK.bak.$(date +%s)"
		# Insert AFTER the app id, BEFORE @@u. This is the only correct spot:
		# anything before `run` is parsed by flatpak, anything after @@u is
		# swallowed by file-forwarding.
		#
		# awk, NOT sed: the Exec line contains "@@u", and every sed delimiter
		# worth using (@ / # |) risks colliding with the payload. This is the
		# third delimiter collision in this project - so no delimiter at all.
		awk -v app="$APP" -v fl="$MINFLAGS" '
			/^Exec=/ && index($0, fl) == 0 {
				i = index($0, app)
				if (i > 0) {
					$0 = substr($0, 1, i + length(app) - 1) " " fl \
					     substr($0, i + length(app))
				}
			}
			{ print }
		' "$DESK" > "$DESK.tmp"
		mv -f "$DESK.tmp" "$DESK"
		chown "$U": "$DESK"
		echo "--- $DESK"
		grep -E '^(Name|Exec)=' "$DESK"
		asuser "update-desktop-database $UH/.local/share/applications" 2>/dev/null || true
	else
		echo "FLAGGED LAUNCH: FAILED - reverting to stock, a working Discord wins"
		tail -30 /tmp/vesktop-flags.log 2>/dev/null || true
		pkill -u "$U" -f -i vesktop 2>/dev/null || true
		sleep 2
		asuser "nohup flatpak run $APP >/dev/null 2>&1 &" || true
	fi
fi

say "RESULT"
grep -E '^Exec=' "$DESK" 2>/dev/null || true
pgrep -u "$U" -af -i vesktop | head -3 || echo "  not running"
echo
echo "Also worth doing IN the app: Vesktop Settings -> enable Hardware Acceleration."
echo "That toggle overrides the command line."
echo "logs: /tmp/vesktop-plain.log  /tmp/vesktop-flags.log"
echo "DONE omen-vesktop-flatpak"
date
