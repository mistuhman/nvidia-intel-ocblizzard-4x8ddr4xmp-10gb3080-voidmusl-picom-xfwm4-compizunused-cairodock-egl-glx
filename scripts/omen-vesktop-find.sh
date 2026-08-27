#!/bin/sh
# omen-vesktop-find.sh - ROOT. Find vesktop wherever it actually lives, undo
# the damage I did to its launcher, and get it starting again.
#
# WHY THE LAST REPAIR MISSED IT
#   omen-repair.sh globbed for *vesktop*.desktop. Shell globs are CASE
#   SENSITIVE, so `Vesktop.desktop` / `dev.vencord.Vesktop.desktop` never
#   matched. omen-final.sh had found the file via `find -iname` (case
#   INsensitive) and patched it IN PLACE - meaning:
#     * the launcher is still there, still carrying my broken Exec line
#     * or omen-repair moved a different file aside as *.broken.<epoch>
#   Nothing is lost either way: I know exactly which flags were injected, so
#   they can be stripped back out token by token.
#
#   Also: vesktop is not a system package on this box. `command -v vesktop`
#   is empty and /usr/share/applications has no entry. The Zen browser runs
#   from a `tarball-installations` directory, so vesktop is almost certainly
#   the same shape - a tarball with a `vesktop` launcher and a `vesktop.bin`
#   Electron binary, which is what ps showed.
#
# This script changes nothing until after the discovery section.
set -eu
say() { printf '\n========== %s ==========\n' "$*"; }
sub() { printf '\n-- %s\n' "$*"; }
[ "$(id -u)" = 0 ] || { echo "must be root (sudo -i)"; exit 1; }

U=${SUDO_USER:-sd}
UH=$(getent passwd "$U" | cut -d: -f6)
UID_=$(id -u "$U")
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

# =========================================================== DISCOVERY
say "DISCOVERY - case-insensitive, everywhere (nothing changed yet)"

sub "every desktop entry mentioning vesktop/vencord, including my .broken.* files"
DESKS=$(find /usr/share/applications /usr/local/share/applications \
	"$UH/.local/share/applications" "$UH/.config/autostart" /etc/xdg/autostart \
	/var/lib/flatpak/exports/share/applications \
	"$UH/.local/share/flatpak/exports/share/applications" \
	-maxdepth 1 -type f 2>/dev/null \
	| grep -iE 'vesktop|vencord' || true)
if [ -n "$DESKS" ]; then
	for f in $DESKS; do
		echo "--- $f"
		grep -E '^(Name|Exec|TryExec|Path|Icon)=' "$f" 2>/dev/null || true
	done
else
	echo "  none by filename - searching by CONTENT instead"
	DESKS=$(grep -rliE 'vesktop|vencord' \
		/usr/share/applications /usr/local/share/applications \
		"$UH/.local/share/applications" "$UH/.config/autostart" 2>/dev/null || true)
	for f in $DESKS; do
		echo "--- $f"
		grep -E '^(Name|Exec|TryExec)=' "$f" 2>/dev/null || true
	done
fi

sub "tarball-installations style layouts"
find "$UH" /opt /usr/local -maxdepth 4 -iname '*vesktop*' 2>/dev/null | head -40 || true
ls -1d "$UH"/tarball-installations/* 2>/dev/null || echo "  (no tarball-installations dir)"

sub "any executable named like vesktop"
find "$UH" /opt /usr/local/bin /usr/bin -maxdepth 5 -type f \
	\( -iname 'vesktop' -o -iname 'vesktop.bin' -o -iname 'Vesktop*.AppImage' \) \
	2>/dev/null | head -20 || true

sub "flatpak"
flatpak list 2>/dev/null | grep -i -E 'vesktop|vencord' || echo "  (no flatpak vesktop)"

sub "what the shell can see"
command -v vesktop || echo "  vesktop not on PATH"
ls -l "$UH/.local/bin" 2>/dev/null | grep -i esktop || true

# =========================================================== UNDO MY EDITS
say "UNDO - strip the flags I injected, restore anything moved aside"

# Restore *.broken.<epoch> back to their real names first.
sub "restoring files omen-repair.sh moved aside"
find "$UH/.local/share/applications" -maxdepth 1 -name '*.broken.*' 2>/dev/null | while read -r b; do
	orig=$(printf '%s' "$b" | sed 's/\.broken\.[0-9]*$//')
	mv -f "$b" "$orig"
	echo "  restored: $orig"
done
[ -n "$(find "$UH/.local/share/applications" -maxdepth 1 -name '*.broken.*' 2>/dev/null)" ] || echo "  (none pending)"

# Strip exactly the tokens omen-final.sh / omen-vesktop-fix.sh added.
sub "stripping injected Chromium flags from every Exec line"
STRIP='--ignore-gpu-blocklist --enable-gpu-rasterization --enable-zero-copy --disable-gpu-driver-bug-workarounds --disable-smooth-scrolling'
TARGETS=$(find /usr/share/applications /usr/local/share/applications \
	"$UH/.local/share/applications" "$UH/.config/autostart" -maxdepth 1 -type f -name '*.desktop' 2>/dev/null \
	| xargs grep -lE '^Exec=.*--ignore-gpu-blocklist' 2>/dev/null || true)
if [ -n "$TARGETS" ]; then
	for f in $TARGETS; do
		cp -a "$f" "$f.preflags.$(date +%s)"
		for t in $STRIP; do
			sed -i "s@ $t@@g" "$f"
		done
		sed -i 's@ --enable-features=[^ ]*@@g; s@ --disable-features=[^ ]*@@g; s@ --use-gl=[^ ]*@@g' "$f"
		echo "  cleaned: $f"
		grep -E '^(Exec|TryExec)=' "$f"
	done
else
	echo "  no Exec line still carries my flags"
fi

# =========================================================== RESOLVE + TEST
say "RESOLVE the real binary and test"
BIN=""
# 1) from any surviving desktop entry
for f in $(find /usr/share/applications /usr/local/share/applications \
	"$UH/.local/share/applications" -maxdepth 1 -type f -name '*.desktop' 2>/dev/null \
	| xargs grep -liE 'vesktop|vencord' 2>/dev/null || true); do
	E=$(grep -m1 '^Exec=' "$f" | sed 's/^Exec=//')
	for tok in $E; do
		case "$tok" in %*|--*|*=*) continue ;; esac
		if [ -x "$tok" ]; then BIN=$tok; break; fi
		if command -v "$tok" >/dev/null 2>&1; then
			C=$(command -v "$tok")
			case "$C" in */env|*/sh|*/bash|*/flatpak) continue ;; esac
			BIN=$C; break
		fi
	done
	[ -n "$BIN" ] && { echo "from $f"; break; }
done
# 2) tarball layout
if [ -z "$BIN" ]; then
	for c in "$UH"/tarball-installations/vesktop/vesktop \
	         "$UH"/tarball-installations/Vesktop/vesktop \
	         "$UH"/tarball-installations/*/vesktop \
	         /opt/Vesktop/vesktop /opt/vesktop/vesktop \
	         "$UH"/.local/bin/vesktop; do
		[ -x "$c" ] && { BIN=$c; break; }
	done
fi
# 3) last resort: anything executable called vesktop (prefer the launcher over .bin)
if [ -z "$BIN" ]; then
	BIN=$(find "$UH" /opt -maxdepth 5 -type f -executable -iname 'vesktop' 2>/dev/null | head -1)
fi
if [ -z "$BIN" ]; then
	BIN=$(find "$UH" /opt -maxdepth 5 -type f -executable -iname 'vesktop.bin' 2>/dev/null | head -1)
fi
echo "resolved binary: ${BIN:-NONE}"

if [ -z "$BIN" ]; then
	say "CANNOT PROCEED"
	echo "vesktop is not on this system in any location I can find."
	echo "The DISCOVERY section above is the full search. Paste it back and"
	echo "tell me how you installed vesktop, and I will target it exactly."
	exit 0
fi

sub "launching plain, output captured"
pkill -u "$U" -f -i vesktop 2>/dev/null || true
sleep 2
asuser "nohup '$BIN' >/tmp/vesktop-plain.log 2>&1 &" || true
sleep 10
if pgrep -u "$U" -f -i vesktop >/dev/null; then
	echo "PLAIN LAUNCH: OK"
	pgrep -u "$U" -af -i vesktop | head -5
else
	echo "PLAIN LAUNCH: FAILED"
	tail -30 /tmp/vesktop-plain.log 2>/dev/null || true
	say "STOPPING - vesktop is broken independently of the GPU flags"
	echo "Paste /tmp/vesktop-plain.log and I will work from the actual error."
	exit 0
fi

sub "testing the minimal GPU flag set"
MINFLAGS="--ignore-gpu-blocklist --enable-gpu-rasterization --enable-zero-copy"
pkill -u "$U" -f -i vesktop 2>/dev/null || true
sleep 2
asuser "nohup '$BIN' $MINFLAGS >/tmp/vesktop-flags.log 2>&1 &" || true
sleep 12
if pgrep -u "$U" -f -i vesktop >/dev/null; then
	echo "FLAGGED LAUNCH: OK - installing the wrapper"
	install -Dm0755 /dev/stdin /usr/local/bin/vesktop-gpu <<WRAP
#!/bin/sh
# Forces GPU rasterisation for vesktop. A wrapper, NOT a .desktop Exec
# rewrite - so no prefix/quoting/case bug can break the launcher again.
# Remove this file and the override in ~/.local/share/applications to revert.
exec "$BIN" $MINFLAGS "\$@"
WRAP
	ls -l /usr/local/bin/vesktop-gpu
	SYS=$(find /usr/share/applications /usr/local/share/applications \
		"$UH/.local/share/applications" -maxdepth 1 -type f -name '*.desktop' 2>/dev/null \
		| xargs grep -liE 'vesktop|vencord' 2>/dev/null | head -1 || true)
	if [ -n "$SYS" ]; then
		mkdir -p "$UH/.local/share/applications"
		OUT="$UH/.local/share/applications/$(basename "$SYS")"
		sed -e 's@^Exec=.*@Exec=/usr/local/bin/vesktop-gpu %U@' \
		    -e 's@^TryExec=.*@TryExec=/usr/local/bin/vesktop-gpu@' \
		    "$SYS" > "$OUT.tmp"
		mv "$OUT.tmp" "$OUT"
		chown -R "$U": "$UH/.local/share/applications"
		echo "--- $OUT"
		grep -E '^(Name|Exec|TryExec)=' "$OUT"
		asuser "update-desktop-database $UH/.local/share/applications" 2>/dev/null || true
	fi
else
	echo "FLAGGED LAUNCH: FAILED - the flags are the problem."
	echo "Leaving vesktop STOCK. A working Discord beats a faster broken one."
	tail -30 /tmp/vesktop-flags.log 2>/dev/null || true
	rm -f /usr/local/bin/vesktop-gpu
	pkill -u "$U" -f -i vesktop 2>/dev/null || true
	sleep 2
	asuser "nohup '$BIN' >/dev/null 2>&1 &" || true
fi

say "RESULT"
sub "icon theme"
asuser "xfconf-query -c xsettings -p /Net/IconThemeName" 2>&1 || true
sub "vesktop"
pgrep -u "$U" -af -i vesktop | head -5 || echo "  not running"
ls -l /usr/local/bin/vesktop-gpu 2>/dev/null || echo "  no wrapper (stock launcher)"
echo
echo "logs: /tmp/vesktop-plain.log  /tmp/vesktop-flags.log"
echo "DONE omen-vesktop-find"
date
