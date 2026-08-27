#!/bin/sh
# omen-repair.sh - ROOT. Undo two regressions I caused, with diagnosis first.
#
# REGRESSION 1 - the pre-existing macOS icon theme was dropped.
#   finder-setup.sh read the current theme with xfconf-query, but that call
#   failed ("Failed to init libxfconf: Could not connect") because I had
#   guessed the session bus path. CUR_ICONS came back EMPTY, and CUR_ICONS is
#   what feeds the Inherits= chain. Result:
#       Inherits=la-capitaine,Adwaita,gnome,hicolor
#   The operator's existing macOS icon set is not in that list, so every icon
#   it provided fell through to la-capitaine/Adwaita. I built a fallback chain
#   out of a value I had already watched fail to read.
#   The original name IS recoverable: finder-setup.sh copied xsettings.xml to
#   its backup dir BEFORE editing it.
#
# REGRESSION 2 - vesktop will not launch.
#   My awk inserted the Chromium flags after the FIRST TOKEN of the Exec line.
#   That is only correct when Exec starts with the binary itself. If it is
#   `Exec=env VAR=x /opt/vesktop/vesktop %U`, or a wrapper, or `flatpak run`,
#   the flags get handed to `env`/the wrapper instead and it dies.
#   This restores the stock launcher first, PROVES it starts, and only then
#   re-applies flags through a wrapper that cannot suffer the same bug.
#
# Diagnosis is printed before anything is changed.
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
	su "$U" -s /bin/sh -c \
	"DISPLAY=$DISP XDG_RUNTIME_DIR=/run/user/$UID_ ${BUS:+DBUS_SESSION_BUS_ADDRESS='$BUS'} $*"
}
echo "session bus: ${BUS:-NOT FOUND}   display: $DISP"

# =========================================================== DIAGNOSIS
say "DIAGNOSIS (nothing changed yet)"

sub "icon themes installed on this system"
ls -1d /usr/share/icons/*/ "$UH/.icons/"*/ "$UH/.local/share/icons/"*/ 2>/dev/null \
	| sed 's@/$@@' | sed 's@.*/@  @' | sort -u

sub "what xfconf says right now"
asuser "xfconf-query -c xsettings -p /Net/IconThemeName" 2>&1 || true

sub "original IconThemeName from the pre-edit backups"
ORIG=""
for b in $(ls -1dt /root/finder-install.* 2>/dev/null); do
	[ -f "$b/xsettings.xml" ] || continue
	V=$(sed -n 's@.*name="IconThemeName"[^>]*value="\([^"]*\)".*@\1@p' "$b/xsettings.xml" | head -1)
	echo "  $b/xsettings.xml -> ${V:-<none>}"
	[ -n "$V" ] && [ "$V" != "OSX-Gunmetal" ] && [ -z "$ORIG" ] && ORIG=$V
done
[ -n "$ORIG" ] || echo "  (no usable original found in backups)"

sub "current OSX-Gunmetal inheritance (the bug)"
cat /usr/share/icons/OSX-Gunmetal/index.theme 2>/dev/null || echo "  (absent)"

sub "vesktop launchers"
for f in /usr/share/applications/*vesktop*.desktop \
         /usr/local/share/applications/*vesktop*.desktop \
         "$UH/.local/share/applications/"*vesktop*.desktop; do
	[ -f "$f" ] || continue
	echo "--- $f"
	grep -E '^(Name|Exec|TryExec|Path)=' "$f" || true
done
sub "vesktop on PATH"
command -v vesktop || echo "  not on PATH"
ls -l /opt/*esktop* 2>/dev/null || true

# =========================================================== FIX 1: ICONS
say "FIX 1 - restore the icon theme"
if [ -n "$ORIG" ]; then
	echo "restoring: $ORIG"
	# Rebuild the derived theme so it is harmless if it is ever selected again,
	# with the operator's own theme FIRST this time.
	if [ -d /usr/share/icons/OSX-Gunmetal ]; then
		cat > /usr/share/icons/OSX-Gunmetal/index.theme <<EOF
[Icon Theme]
Name=OSX-Gunmetal
Comment=Operator's own macOS set first, la-capitaine only as a gap filler
Inherits=$ORIG,la-capitaine,Adwaita,gnome,hicolor
Directories=
Hidden=false
EOF
		gtk-update-icon-cache -f /usr/share/icons/OSX-Gunmetal 2>/dev/null || true
	fi
	# But default to the operator's ACTUAL theme, not my derived one.
	asuser "xfconf-query -c xsettings -p /Net/IconThemeName -s '$ORIG'" 2>&1 || true
	asuser "gsettings set org.gnome.desktop.interface icon-theme '$ORIG'" 2>/dev/null || true
else
	echo "!! could not determine the original theme name from backups."
	echo "!! Pick it from the list above and run, as $U in a terminal:"
	echo "     xfconf-query -c xsettings -p /Net/IconThemeName -s THENAME"
fi

sub "undo the gtk-3.0 settings.ini line I appended"
GI="$UH/.config/gtk-3.0/settings.ini"
if [ -f "$GI" ]; then
	cp -a "$GI" "$GI.bak.$(date +%s)"
	sed -i '/^gtk-icon-theme-name=OSX-Gunmetal$/d' "$GI"
	if [ -n "$ORIG" ]; then
		grep -q '^gtk-icon-theme-name=' "$GI" || printf 'gtk-icon-theme-name=%s\n' "$ORIG" >> "$GI"
	fi
	chown "$U": "$GI"
	cat "$GI"
fi
sub "icon theme now"
asuser "xfconf-query -c xsettings -p /Net/IconThemeName" 2>&1 || true

# =========================================================== FIX 2: VESKTOP
say "FIX 2 - get vesktop launching again"

sub "step A: remove my override entirely and prove the stock launcher works"
for f in "$UH/.local/share/applications/"*vesktop*.desktop; do
	[ -f "$f" ] || continue
	mv "$f" "$f.broken.$(date +%s)"
	echo "moved aside: $f"
done
asuser "update-desktop-database $UH/.local/share/applications" 2>/dev/null || true

# Resolve the REAL binary out of the system launcher, tolerating env/wrapper
# prefixes - which is precisely what my awk failed to do.
SYS=$(ls -1 /usr/share/applications/*vesktop*.desktop \
             /usr/local/share/applications/*vesktop*.desktop 2>/dev/null | head -1)
BIN=""
if [ -n "$SYS" ]; then
	EXEC=$(grep -m1 '^Exec=' "$SYS" | sed 's/^Exec=//')
	echo "system Exec: $EXEC"
	# walk the tokens, take the first one that is an executable file path
	for tok in $EXEC; do
		case "$tok" in
			%*|--*|*=*) continue ;;
		esac
		if [ -x "$tok" ]; then BIN=$tok; break; fi
		if command -v "$tok" >/dev/null 2>&1; then
			C=$(command -v "$tok")
			case "$C" in */env|*/sh|*/bash|*/flatpak) continue ;; esac
			BIN=$C; break
		fi
	done
fi
[ -n "$BIN" ] || BIN=$(command -v vesktop 2>/dev/null || true)
echo "resolved binary: ${BIN:-NONE}"

sub "step B: launch it plain, with output captured"
pkill -u "$U" -f vesktop 2>/dev/null || true
sleep 1
if [ -n "$BIN" ]; then
	asuser "nohup $BIN >/tmp/vesktop-plain.log 2>&1 &" || true
	sleep 8
	if pgrep -u "$U" -f vesktop >/dev/null; then
		echo "PLAIN LAUNCH: OK"
		PLAIN=ok
	else
		echo "PLAIN LAUNCH: FAILED - log follows"
		PLAIN=fail
	fi
	tail -25 /tmp/vesktop-plain.log 2>/dev/null || true
else
	PLAIN=fail
	echo "no binary resolved; cannot test"
fi

sub "step C: only if plain works, test a MINIMAL flag set"
# The risky flags were the --enable-features= / --disable-features= pair; an
# unrecognised feature name can abort Electron outright. Minimal set only.
MINFLAGS="--ignore-gpu-blocklist --enable-gpu-rasterization --enable-zero-copy"
if [ "$PLAIN" = "ok" ]; then
	pkill -u "$U" -f vesktop 2>/dev/null || true
	sleep 2
	asuser "nohup $BIN $MINFLAGS >/tmp/vesktop-flags.log 2>&1 &" || true
	sleep 10
	if pgrep -u "$U" -f vesktop >/dev/null; then
		echo "FLAGGED LAUNCH: OK - installing the wrapper"
		install -Dm0755 /dev/stdin /usr/local/bin/vesktop-gpu <<WRAP
#!/bin/sh
# Forces GPU rasterisation for vesktop. Wrapper, not a .desktop Exec rewrite,
# so an env/wrapper prefix in the original launcher cannot break it.
exec "$BIN" $MINFLAGS "\$@"
WRAP
		# Now the override is safe: Exec points at our own wrapper.
		mkdir -p "$UH/.local/share/applications"
		if [ -n "$SYS" ]; then
			sed -e "s@^Exec=.*@Exec=/usr/local/bin/vesktop-gpu %U@" \
			    -e "s@^TryExec=.*@TryExec=/usr/local/bin/vesktop-gpu@" \
			    "$SYS" > "$UH/.local/share/applications/$(basename "$SYS")"
			chown -R "$U": "$UH/.local/share/applications"
			grep -E '^(Exec|TryExec)=' "$UH/.local/share/applications/$(basename "$SYS")"
		fi
		asuser "update-desktop-database $UH/.local/share/applications" 2>/dev/null || true
	else
		echo "FLAGGED LAUNCH: FAILED - flags are the problem, leaving vesktop STOCK"
		echo "the choppiness fix is abandoned rather than trading it for a broken app"
		tail -25 /tmp/vesktop-flags.log 2>/dev/null || true
		pkill -u "$U" -f vesktop 2>/dev/null || true
		sleep 1
		asuser "nohup $BIN >/dev/null 2>&1 &" || true
	fi
else
	echo "skipped - plain launch did not work, so flags are not the cause"
fi

say "RESULT"
sub "icon theme"
asuser "xfconf-query -c xsettings -p /Net/IconThemeName" 2>&1 || true
sub "vesktop"
pgrep -u "$U" -af vesktop || echo "  not running"
ls -l /usr/local/bin/vesktop-gpu 2>/dev/null || echo "  no wrapper installed (stock launcher in use)"
sub "logs kept at"
echo "  /tmp/vesktop-plain.log"
echo "  /tmp/vesktop-flags.log"
echo
echo "If the icons still look wrong, run this as $U and the panel will repaint:"
echo "  xfce4-panel -r"
echo "DONE omen-repair"
date
