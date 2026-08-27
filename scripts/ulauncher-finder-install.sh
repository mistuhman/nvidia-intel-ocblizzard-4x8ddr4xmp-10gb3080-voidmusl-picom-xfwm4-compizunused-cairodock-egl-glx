#!/bin/sh
# ulauncher-finder-install.sh - ROOT. Install the "Finder Search" Ulauncher
# extension: type a file name in Ulauncher, hit Enter, the file opens in
# Finder (Nemo) with it selected.
#
#   f  <name>   search files     Enter = reveal in Finder   Alt+Enter = open file
#   fd <name>   search folders   Enter = open in Finder
#
# THE ZFS GOTCHA THIS HANDLES
#   plocate/locate is the only backend fast enough to feel instant, but
#   /etc/updatedb.conf ships PRUNEFS containing `zfs` on essentially every
#   distro. This machine's ROOT IS ZFS, so with the stock config the index
#   would be completely empty and every search would silently return nothing.
#   The installer strips zfs from PRUNEFS, keeps the snapshot directories
#   pruned (otherwise every file appears once per snapshot), and builds the
#   first index.
#
# ROLLBACK:
#   rm -rf ~/.local/share/ulauncher/extensions/finder-search
#   cp /root/ulauncher-finder.<stamp>/updatedb.conf /etc/updatedb.conf
set -eu
say() { printf '\n========== %s ==========\n' "$*"; }
sub() { printf '\n-- %s\n' "$*"; }
[ "$(id -u)" = 0 ] || { echo "must be root (sudo -i)"; exit 1; }

U=${SUDO_USER:-sd}
UH=$(getent passwd "$U" | cut -d: -f6)
UID_=$(id -u "$U")
STAMP=$(date +%Y%m%d-%H%M%S)
BAK=/root/ulauncher-finder.$STAMP
mkdir -p "$BAK"
RAW="https://raw.githubusercontent.com/mistuhman/nvidia-intel-ocblizzard-4x8ddr4xmp-10gb3080-voidmusl-picom-xfwm4-compizunused-cairodock-egl-glx/arena/01a04303-nvidia-intel-ocblizzard-4x8ddr/ulauncher/finder-search"
DEST="$UH/.local/share/ulauncher/extensions/finder-search"

say "1/6 prerequisites"
sub "ulauncher"
command -v ulauncher || { echo "ulauncher not installed - aborting"; exit 1; }
ulauncher --version 2>/dev/null || true
sub "search backends"
for p in plocate fd; do
	command -v "$p" >/dev/null || xbps-install -y "$p" 2>&1 | tail -2 || true
done
for c in plocate locate fd fdfind find; do
	printf '  %-8s %s\n' "$c" "$(command -v "$c" || echo -)"
done

say "2/6 make the locate index cover ZFS"
if [ -f /etc/updatedb.conf ]; then
	cp -a /etc/updatedb.conf "$BAK/"
	sub "before"
	grep -E '^PRUNEFS|^PRUNEPATHS|^PRUNENAMES' /etc/updatedb.conf || true
	# Drop zfs from PRUNEFS - root IS zfs, so leaving it makes the index empty.
	sed -i -E 's@^(PRUNEFS[[:space:]]*=[[:space:]]*")(.*)"@\1\2"@' /etc/updatedb.conf
	sed -i -E '/^PRUNEFS/ s@\bzfs\b@@g; /^PRUNEFS/ s@  +@ @g' /etc/updatedb.conf
	# Keep snapshots pruned or every file shows up once per snapshot.
	grep -q '^PRUNENAMES' /etc/updatedb.conf \
		|| echo 'PRUNENAMES = ".git .svn .hg __pycache__ node_modules"' >> /etc/updatedb.conf
	if grep -q '^PRUNEPATHS' /etc/updatedb.conf; then
		grep -q '/\.zfs' /etc/updatedb.conf || \
			sed -i -E '/^PRUNEPATHS/ s@"$@ /.zfs /var/lib/flatpak /var/cache"@' /etc/updatedb.conf
	fi
	sub "after"
	grep -E '^PRUNEFS|^PRUNEPATHS|^PRUNENAMES' /etc/updatedb.conf || true
else
	sub "no /etc/updatedb.conf - writing one"
	cat > /etc/updatedb.conf <<'UDB'
PRUNE_BIND_MOUNTS = "yes"
PRUNEFS = "NFS nfs nfs4 afs binfmt_misc proc smbfs autofs iso9660 ncpfs coda devpts ftpfs devfs mfs shfs sysfs cifs lustre tmpfs usbfs udf fuse.glusterfs fuse.sshfs curlftpfs ecryptfs fusesmb devtmpfs"
PRUNENAMES = ".git .hg .svn __pycache__ node_modules"
PRUNEPATHS = "/tmp /var/spool /media /var/lib/os-prober /var/lib/ceph /home/.ecryptfs /var/lib/schroot /.zfs /var/lib/flatpak /var/cache /proc /sys"
UDB
	cat /etc/updatedb.conf
fi
sub "building the index (first run takes a moment)"
if command -v updatedb >/dev/null; then
	updatedb 2>&1 | tail -5 || true
	echo "index entries: $(plocate --statistics 2>/dev/null | grep -i 'file names' || locate -S 2>/dev/null | head -3 || echo unknown)"
else
	echo "  no updatedb; the extension will fall back to fd/find"
fi
sub "keep it fresh"
cat > /etc/cron.daily/updatedb <<'CRON'
#!/bin/sh
# Refresh the locate index used by the Ulauncher Finder Search extension.
[ -x /usr/bin/updatedb ] && /usr/bin/updatedb 2>/dev/null
CRON
chmod 0755 /etc/cron.daily/updatedb
ls -l /etc/cron.daily/updatedb

say "3/6 install the extension"
mkdir -p "$DEST/images"
for f in manifest.json versions.json main.py; do
	if [ -f "$(dirname "$0")/../ulauncher/finder-search/$f" ]; then
		cp -f "$(dirname "$0")/../ulauncher/finder-search/$f" "$DEST/$f"
	else
		curl -fsSL "$RAW/$f" -o "$DEST/$f"
	fi
	echo "  $f"
done
python3 -m json.tool "$DEST/manifest.json" >/dev/null && echo "  manifest.json valid"
python3 -m py_compile "$DEST/main.py" && echo "  main.py compiles"

say "4/6 icons from the active theme"
# Pull real icons out of whatever icon theme is actually selected, so the
# extension matches the desktop instead of shipping generic art.
THEME=$(su "$U" -s /bin/sh -c "HOME='$UH' DISPLAY=:0 XDG_RUNTIME_DIR=/run/user/$UID_ xfconf-query -c xsettings -p /Net/IconThemeName" 2>/dev/null || echo "")
echo "active icon theme: ${THEME:-unknown}"
pick() { # pick <icon-name> <dest>
	for base in "/usr/share/icons/$THEME" "$UH/.icons/$THEME" \
	            /usr/share/icons/hicolor /usr/share/icons/Adwaita; do
		[ -d "$base" ] || continue
		F=$(find "$base" -name "$1.png" 2>/dev/null | sort -t/ -k6 -rn | head -1)
		[ -n "$F" ] || F=$(find "$base" -name "$1.svg" 2>/dev/null | head -1)
		if [ -n "$F" ]; then cp -f "$F" "$2" && echo "  $1 <- $F" && return 0; fi
	done
	echo "  $1: no source found, keeping placeholder"
}
pick text-x-generic     "$DEST/images/icon.png"
pick folder             "$DEST/images/folder.png"
chown -R "$U": "$UH/.local/share/ulauncher"
ls -l "$DEST/images"

say "5/6 restart ulauncher so it picks the extension up"
sub "before"
pgrep -u "$U" -af ulauncher | head -3 || echo "  not running"
pkill -u "$U" -f ulauncher 2>/dev/null || true
sleep 2
BPID=$(pgrep -u "$U" -x xfsettingsd || pgrep -u "$U" -x xfce4-panel || true)
BUS=""
[ -n "$BPID" ] && BUS=$(tr '\0' '\n' < "/proc/$BPID/environ" | sed -n 's/^DBUS_SESSION_BUS_ADDRESS=//p' | head -1)
su "$U" -s /bin/sh -c \
	"HOME='$UH' USER='$U' LOGNAME='$U' DISPLAY=:0 XDG_RUNTIME_DIR=/run/user/$UID_ ${BUS:+DBUS_SESSION_BUS_ADDRESS='$BUS'} nohup ulauncher --hide-window >/tmp/ulauncher.log 2>&1 &" || true
sleep 5
sub "after"
pgrep -u "$U" -af ulauncher | head -3 || echo "  FAILED to restart - start it from your menu"

say "6/6 HOW TO USE"
cat <<'USAGE'
  Open Ulauncher, then:

    f  report          search files whose name contains "report"
    fd  games          search folders only

    Enter       reveal the file in Finder, with it selected
    Alt+Enter   open the file itself with its default application

  Search roots default to:  ~  /mnt/games  /bulk  /fast
  Change them in Ulauncher -> Preferences -> Extensions -> Finder Search,
  along with the keywords, result limit, and hidden-file handling.

  If results are ever empty across the board, the index is stale:
      sudo updatedb
  It also refreshes daily via /etc/cron.daily/updatedb.
USAGE
echo
echo "extension: $DEST"
echo "backups:   $BAK"
echo "DONE ulauncher-finder-install"
date
