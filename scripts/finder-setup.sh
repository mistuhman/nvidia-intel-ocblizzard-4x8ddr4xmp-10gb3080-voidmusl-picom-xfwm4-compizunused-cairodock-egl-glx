#!/bin/sh
# finder-install.sh - ROOT. Replaces Thunar with a ZFS-aware file manager
# branded as "Finder", using genuine OS X (La Capitaine) icons, keeping the current
# gunmetal GTK3 theme untouched.
#
# WHY NEMO (and not something else):
#   * GTK3, so it inherits your existing gunmetal GTK3 theme with zero work.
#     Anything Qt (Krusader, Dolphin, DoubleCmd) would break the Beauty stack.
#   * It is the only mainstream GTK file manager with a first-class, declarative
#     ACTIONS system (.nemo_action files). That is the hook we use to bolt a
#     complete zpool/dataset/snapshot management menu onto right-click -
#     Thunar's custom actions cannot pass dataset context or show output.
#   * Native "open in terminal", dual pane (F3), tree sidebar, tabs, bulk
#     rename, root-mode elevation - all the things Thunar makes you bolt on.
#   * It reads /etc/nemo and /usr/share/nemo, so the Finder branding is a
#     drop-in overlay rather than a fork.
#
# WHAT IT DOES
#   1. installs nemo + gvfs + yad (repairing the broken libx265 shlib first)
#   2. installs a real OS X icon theme - La Capitaine (El Capitan, i.e. the
#      last release actually called "OS X"), NOT WhiteSur/Big Sur - wrapped in
#      a derived theme "OSX-Gunmetal" that inherits your current icon theme so
#      nothing you already themed gets lost.
#      Override with:  ICONSET=catalina sh finder-install.sh
#      Choices: lacapitaine (default) | catalina | none
#   3. brands nemo as "Finder" (desktop entry, window title, app id, icon)
#   4. installs 13 ZFS right-click actions backed by scripts/finder-zfs
#   5. makes Finder the default handler for folders everywhere (xdg-mime,
#      exo/xfce helper, xfdesktop, cairo-dock) and hides Thunar
#
# ROLLBACK: run this script with the argument `undo`.
set -eu
say() { printf '\n=== %s ===\n' "$*"; }
[ "$(id -u)" = 0 ] || { echo "must be root (sudo -i)"; exit 1; }

TARGET_USER=${SUDO_USER:-sd}
TARGET_HOME=$(getent passwd "$TARGET_USER" | cut -d: -f6)
[ -n "$TARGET_HOME" ] || TARGET_HOME=/home/$TARGET_USER
TARGET_UID=$(id -u "$TARGET_USER")
# xfconf-query and gsettings need the live session bus + DISPLAY, otherwise
# they fail silently (that is why the last run printed "current icon theme:
# unknown" even though the session is running).
asuser() {
	su "$TARGET_USER" -s /bin/sh -c \
		"DISPLAY=:0 XDG_RUNTIME_DIR=/run/user/$TARGET_UID DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$TARGET_UID/bus $*"
}

# --------------------------------------------------------------------- undo
if [ "${1:-}" = "undo" ]; then
	say "UNDO"
	rm -f /usr/local/share/applications/finder.desktop
	rm -f /usr/share/applications/nemo.desktop.omen-bak
	rm -f /etc/xdg/autostart/finder-noop.desktop
	rm -rf /usr/share/nemo/actions/zfs-*.nemo_action
	rm -f /usr/local/bin/finder /usr/local/bin/finder-zfs /usr/local/bin/thunar
	rm -rf /usr/share/icons/OSX-Gunmetal
	rm -f /usr/share/glib-2.0/schemas/99_finder.gschema.override
	glib-compile-schemas /usr/share/glib-2.0/schemas 2>/dev/null || true
	for f in /usr/share/applications/thunar.desktop /usr/share/applications/Thunar.desktop; do
		[ -f "$f" ] && sed -i '/^NoDisplay=true$/d;/^Hidden=true$/d' "$f"
	done
	asuser "xdg-mime default thunar.desktop inode/directory" || true
	echo "undone. Thunar is the default again."
	exit 0
fi

STAMP=$(date +%Y%m%d-%H%M%S)
BAK=/root/finder-install.$STAMP
mkdir -p "$BAK"

# ------------------------------------------------------------ 0. shlib repair
# Wave-1 receipts: `libavcodec6-6.1.6_2: broken, unresolvable shlib
# libx265.so.215` and the same for libheif. The installed x265 is older than
# what the currently-installed libavcodec6 links against, so xbps refuses ANY
# transaction until the graph is consistent. Nothing to do with nemo - it just
# blocks every install. Repair it before touching packages.
say "0/6 repair broken shlibs (libx265.so.215)"
xbps-install -Sy >/dev/null 2>&1 || true
if xbps-pkgdb -a 2>&1 | grep -q 'broken, unresolvable'; then
	echo "broken shlibs present, repairing"
fi
# Void names it x265, not libx265 (the last run errored on that).
xbps-install -uy x265 libavcodec6 libheif 2>&1 | tail -8 || true
if xbps-install -n nemo >/dev/null 2>&1; then
	echo "shlib graph is consistent"
else
	echo "targeted repair insufficient - running a full system update"
	echo "(this is the only way out of a split-repo state; it is a normal Void -Su)"
	xbps-install -Suy xbps 2>&1 | tail -5 || true
	xbps-install -Suy 2>&1 | tail -30 || true
fi

# ------------------------------------------------------------ 1. packages
say "1/6 packages"
if command -v nemo >/dev/null; then
	echo "nemo already installed - skipping package stage"
fi
# Install one at a time: "already installed" is an ERROR exit in xbps and
# aborts the whole batch, which is what killed the first attempt.
need() {
	if xbps-query -l | grep -q "^ii $1-[0-9]"; then echo "  already: $1"; return 0; fi
	xbps-install -y "$1" 2>&1 | tail -3 || echo "  (failed: $1)"
}
for p in nemo gvfs gvfs-afc gvfs-mtp yad smartmontools xdg-utils \
         desktop-file-utils shared-mime-info git; do
	need "$p"
done
command -v nemo >/dev/null || {
	echo
	echo "FATAL: nemo still did not install."
	echo "Run this by hand and paste the output:  xbps-install -Sy nemo"
	exit 1
}
for p in nemo-fileroller nemo-image-converter python3-nemo; do
	xbps-install -y "$p" >/dev/null 2>&1 || true
done

# ------------------------------------------------------------ 2. OS X icons
say "2/6 OS X icon theme"
ICONSET=${ICONSET:-lacapitaine}
CUR_ICONS=$(asuser "xfconf-query -c xsettings -p /Net/IconThemeName" 2>/dev/null || echo "")
echo "current icon theme: ${CUR_ICONS:-unknown}"
echo "requested set:      $ICONSET"
echo "$CUR_ICONS" > "$BAK/icon-theme.before.txt"

command -v git >/dev/null || xbps-install -y git >/dev/null 2>&1 || true
BASE=""

case "$ICONSET" in
lacapitaine)
	# La Capitaine - drawn against the macOS Human Interface guidelines from
	# the OS X era (El Capitan was the LAST release named "OS X"; everything
	# from 10.12 on is macOS, and Big Sur / WhiteSur is the flat-squircle
	# redesign the operator explicitly rejected). Aqua-style glossy squares,
	# proper Finder/HD/folder faces. Pure SVG, no install.sh needed - the
	# repo IS the theme directory.
	if [ ! -f /usr/share/icons/la-capitaine/index.theme ]; then
		# Clone STRAIGHT into place. The previous version cloned to /tmp then
		# `cp -a` 6000 small files, i.e. it wrote the whole theme twice - and
		# that is precisely where the run stalled while writes were degraded.
		rm -rf /usr/share/icons/la-capitaine
		git clone --depth=1 --quiet \
			https://github.com/keeferrourke/la-capitaine-icon-theme.git \
			/usr/share/icons/la-capitaine
		rm -rf /usr/share/icons/la-capitaine/.git
		sync
		# ./configure only adds distro/DE-specific symlinks and is slow on ZFS.
		# The theme is fully functional without it. Opt in with RUN_CONFIGURE=1.
		if [ "${RUN_CONFIGURE:-0}" = "1" ] && [ -x /usr/share/icons/la-capitaine/configure ]; then
			( cd /usr/share/icons/la-capitaine && ./configure ) 2>&1 | tail -5 || true
		fi
	else
		echo "la-capitaine already present"
	fi
	ls /usr/share/icons/la-capitaine | head -5
	BASE=la-capitaine
	;;
catalina)
	# Os-Catalina-icons - closer to 10.15, still pre-Big-Sur.
	if [ ! -f /usr/share/icons/Os-Catalina-icons/index.theme ]; then
		rm -rf /usr/share/icons/Os-Catalina-icons
		git clone --depth=1 --quiet https://github.com/zayronxio/Os-Catalina-icons.git \
			/usr/share/icons/Os-Catalina-icons
		rm -rf /usr/share/icons/Os-Catalina-icons/.git
		sync
	fi
	BASE=Os-Catalina-icons
	;;
none)
	echo "icon theme left alone by request"
	;;
*)
	echo "unknown ICONSET '$ICONSET' - leaving icons alone"
	;;
esac

# If a WhiteSur set got installed by the earlier attempt, get rid of it -
# operator explicitly does not want Big Sur icons.
for d in /usr/share/icons/WhiteSur /usr/share/icons/WhiteSur-dark \
         /usr/share/icons/WhiteSur-light /usr/share/icons/WhiteSur-Gunmetal; do
	[ -d "$d" ] && { rm -rf "$d"; echo "removed $d"; }
done

[ -n "$BASE" ] && [ ! -d "/usr/share/icons/$BASE" ] && { echo "!! $BASE missing; keeping current icons"; BASE=""; }

if [ -n "$BASE" ]; then
	# Derived theme: OS X icons FIRST, your existing theme behind them as a
	# fallback so anything you already customised still resolves.
	mkdir -p /usr/share/icons/OSX-Gunmetal
	INHERIT="$BASE"
	if [ -n "$CUR_ICONS" ] && [ "$CUR_ICONS" != "$BASE" ] && [ "$CUR_ICONS" != "OSX-Gunmetal" ]; then
		INHERIT="$BASE,$CUR_ICONS"
	fi
	INHERIT="$INHERIT,Adwaita,gnome,hicolor"
	cat > /usr/share/icons/OSX-Gunmetal/index.theme <<EOF
[Icon Theme]
Name=OSX-Gunmetal
Comment=OS X (El Capitan era) icons layered over the existing gunmetal desktop theme
Inherits=$INHERIT
Directories=
Hidden=false
EOF
	gtk-update-icon-cache -f /usr/share/icons/OSX-Gunmetal 2>/dev/null || true
	gtk-update-icon-cache -f "/usr/share/icons/$BASE" 2>/dev/null || true
	cat /usr/share/icons/OSX-Gunmetal/index.theme
fi

# ------------------------------------------------------------ 3. Finder branding
say "3/6 brand nemo as Finder"
install -Dm0755 /dev/stdin /usr/local/bin/finder <<'FINDER'
#!/bin/sh
# Finder - thin wrapper so the process name, WM_CLASS and window title read
# "Finder" rather than "Nemo", without patching the nemo binary.
export GTK_THEME_VARIANT=dark
# nemo derives its window title from the folder name; the app name comes from
# the desktop entry, which we set to Finder.
exec nemo --name=Finder --class=Finder "$@"
FINDER

# The Finder desktop entry. Icon: La Capitaine ships the OS X Finder face as
# `system-file-manager`; it resolves inside OSX-Gunmetal.
install -Dm0644 /dev/stdin /usr/local/share/applications/finder.desktop <<'DESK'
[Desktop Entry]
Type=Application
Name=Finder
GenericName=File Manager
Comment=Browse the file system and manage ZFS pools
Exec=finder %U
Icon=system-file-manager
Terminal=false
StartupNotify=true
Categories=System;FileTools;Utility;Core;FileManager;GTK;
MimeType=inode/directory;application/x-gnome-saved-search;x-scheme-handler/file;x-scheme-handler/trash;x-scheme-handler/network;x-scheme-handler/computer;x-scheme-handler/sftp;x-scheme-handler/smb;
Keywords=folder;manager;explore;disk;filesystem;zfs;zpool;finder;
Actions=new-window;zfs-status;zfs-disks;

[Desktop Action new-window]
Name=New Finder Window
Exec=finder --new-window

[Desktop Action zfs-status]
Name=ZFS Pool Status
Exec=finder-zfs status

[Desktop Action zfs-disks]
Name=Disks and Pool Devices
Exec=finder-zfs disks
DESK

# Hide the stock Nemo entry so only "Finder" shows in menus/docks/ulauncher.
for f in /usr/share/applications/nemo.desktop /usr/share/applications/nemo-autostart.desktop; do
	[ -f "$f" ] || continue
	cp -a "$f" "$BAK/"
	grep -q '^NoDisplay=true' "$f" || printf 'NoDisplay=true\n' >> "$f"
done

# Nemo's own strings: point its "home" and default window at Finder branding.
mkdir -p /etc/nemo
cat > /etc/nemo/nemo.conf <<'NEMOCONF'
# Finder defaults (system-wide). Per-user gsettings still win.
NEMOCONF

# gsettings defaults that make Nemo behave like Finder: list view, sidebar on,
# no location bar spam, single-window.
mkdir -p /usr/share/glib-2.0/schemas
cat > /usr/share/glib-2.0/schemas/99_finder.gschema.override <<'OVR'
[org.nemo.preferences]
default-folder-viewer='list-view'
show-hidden-files=false
show-full-path-titles=false
close-device-view-on-device-eject=true
start-with-dual-pane=false
ignore-view-metadata=false
inherit-folder-viewer=true
date-format='iso'
show-compact-view-icon-toolbar=true
show-open-in-terminal-toolbar=true
[org.nemo.window-state]
start-with-sidebar=true
side-pane-view='places'
sidebar-width=200
geometry='1100x720+120+80'
[org.nemo.desktop]
show-desktop-icons=false
[org.nemo.preferences.menu-config]
selection-menu-open-in-new-tab=true
background-menu-open-as-root=true
OVR
glib-compile-schemas /usr/share/glib-2.0/schemas 2>&1 | tail -3 || true

# ------------------------------------------------------------ 4. ZFS actions
say "4/6 ZFS right-click actions"
install -Dm0755 "$(dirname "$0")/finder-zfs" /usr/local/bin/finder-zfs 2>/dev/null || {
	# fetched standalone: pull the helper from the repo
	curl -fsSL "https://raw.githubusercontent.com/mistuhman/nvidia-intel-ocblizzard-4x8ddr4xmp-10gb3080-voidmusl-picom-xfwm4-compizunused-cairodock-egl-glx/arena/01a04303-nvidia-intel-ocblizzard-4x8ddr/scripts/finder-zfs" \
		-o /usr/local/bin/finder-zfs
	chmod 0755 /usr/local/bin/finder-zfs
}

mkdir -p /usr/share/nemo/actions
mkact() {  # mkact <file> <name> <icon> <selection> <verb> <extensions>
	cat > "/usr/share/nemo/actions/$1" <<EOF
[Nemo Action]
Name=$2
Comment=$2
Exec=finder-zfs $5 %F
Icon-Name=$3
Selection=$4
Extensions=$6
Quote=double
Dependencies=finder-zfs;
EOF
}
mkact zfs-00-status.nemo_action   "ZFS: Pool status"            drive-multidisk    None    status      any
mkact zfs-01-iostat.nemo_action   "ZFS: Pool I/O (live)"        utilities-system-monitor None iostat  any
mkact zfs-02-datasets.nemo_action "ZFS: All datasets"           drive-harddisk     None    datasets    any
mkact zfs-03-arc.nemo_action      "ZFS: ARC / cache health"     drive-harddisk     None    arc         any
mkact zfs-04-disks.nemo_action    "ZFS: Disks and by-id names"  drive-removable-media None disks       any
mkact zfs-10-props.nemo_action    "ZFS: Dataset properties"     document-properties S     props       dir
mkact zfs-11-usage.nemo_action    "ZFS: Space and compression"  drive-harddisk     S       usage       dir
mkact zfs-20-snapshot.nemo_action "ZFS: Snapshot this dataset"  camera-photo       S       snapshot    dir
mkact zfs-21-snaplist.nemo_action "ZFS: List snapshots"         document-open-recent S     snaplist    dir
mkact zfs-22-browse.nemo_action   "ZFS: Browse snapshots (.zfs)" folder-open       S       browsesnaps dir
mkact zfs-30-scrub.nemo_action    "ZFS: Start scrub"            view-refresh       S       scrub       dir
mkact zfs-31-scrubstop.nemo_action "ZFS: Stop scrub"            process-stop       None    scrubstop   any
mkact zfs-32-trim.nemo_action     "ZFS: TRIM pool (SSD/NVMe)"   edit-clear         None    trim        any
ls -1 /usr/share/nemo/actions/

# ------------------------------------------------------------ 5. dethrone Thunar
say "5/6 make Finder the default and retire Thunar"
for f in /usr/share/applications/thunar.desktop \
         /usr/share/applications/Thunar.desktop \
         /usr/share/applications/thunar-settings.desktop \
         /usr/share/applications/Thunar-folder-handler.desktop; do
	[ -f "$f" ] || continue
	cp -a "$f" "$BAK/"
	grep -q '^NoDisplay=true' "$f" || printf 'NoDisplay=true\n' >> "$f"
	echo "hidden: $f"
done

# system-wide mime default
mkdir -p /usr/share/applications
cat > /usr/share/applications/mimeapps.list <<'MIME'
[Default Applications]
inode/directory=finder.desktop
application/x-gnome-saved-search=finder.desktop
x-scheme-handler/file=finder.desktop
x-scheme-handler/trash=finder.desktop
x-scheme-handler/network=finder.desktop
x-scheme-handler/computer=finder.desktop

[Added Associations]
inode/directory=finder.desktop;nemo.desktop;
MIME
update-desktop-database /usr/share/applications 2>/dev/null || true
update-desktop-database /usr/local/share/applications 2>/dev/null || true

# XFCE's exo helper decides what xfdesktop / the panel / "Open File Manager" use.
mkdir -p "$TARGET_HOME/.local/share/xfce4/helpers" "$TARGET_HOME/.config/xfce4"
cat > "$TARGET_HOME/.local/share/xfce4/helpers/custom-FileManager.desktop" <<'HELPER'
[Desktop Entry]
NoDisplay=true
Version=1.0
Encoding=UTF-8
Type=X-XFCE-Helper
X-XFCE-Category=FileManager
X-XFCE-CommandsWithParameter=finder %s
Icon=system-file-manager
Name=Finder
X-XFCE-Commands=finder
HELPER
if [ -f "$TARGET_HOME/.config/xfce4/helpers.rc" ]; then
	cp -a "$TARGET_HOME/.config/xfce4/helpers.rc" "$BAK/"
	sed -i '/^FileManager=/d' "$TARGET_HOME/.config/xfce4/helpers.rc"
fi
printf 'FileManager=custom-FileManager\n' >> "$TARGET_HOME/.config/xfce4/helpers.rc"

# per-user mime + icon theme
mkdir -p "$TARGET_HOME/.config"
asuser "xdg-mime default finder.desktop inode/directory" 2>/dev/null || true
asuser "xdg-mime default finder.desktop x-scheme-handler/file" 2>/dev/null || true
if [ -n "$BASE" ]; then
	asuser "xfconf-query -c xsettings -p /Net/IconThemeName -s OSX-Gunmetal" 2>/dev/null || true
	asuser "gsettings set org.gnome.desktop.interface icon-theme OSX-Gunmetal" 2>/dev/null || true
	# belt: patch the xfconf XML directly so it survives even if the bus call failed
	XS="$TARGET_HOME/.config/xfce4/xfconf/xfce-perchannel-xml/xsettings.xml"
	if [ -f "$XS" ]; then
		cp -a "$XS" "$BAK/" 2>/dev/null || true
		sed -i 's@\(name="IconThemeName" type="string" value="\)[^"]*"@\1OSX-Gunmetal"@' "$XS"
		grep -o 'IconThemeName[^/]*' "$XS" || true
		chown "$TARGET_USER": "$XS"
	fi
	# and GTK's own fallback, for apps that ignore xsettings
	mkdir -p "$TARGET_HOME/.config/gtk-3.0"
	if [ -f "$TARGET_HOME/.config/gtk-3.0/settings.ini" ]; then
		cp -a "$TARGET_HOME/.config/gtk-3.0/settings.ini" "$BAK/" 2>/dev/null || true
		sed -i '/^gtk-icon-theme-name=/d' "$TARGET_HOME/.config/gtk-3.0/settings.ini"
	else
		printf '[Settings]\n' > "$TARGET_HOME/.config/gtk-3.0/settings.ini"
	fi
	printf 'gtk-icon-theme-name=OSX-Gunmetal\n' >> "$TARGET_HOME/.config/gtk-3.0/settings.ini"
	chown -R "$TARGET_USER": "$TARGET_HOME/.config/gtk-3.0"
fi
chown -R "$TARGET_USER": "$TARGET_HOME/.local/share/xfce4" "$TARGET_HOME/.config/xfce4" 2>/dev/null || true

# stop the Thunar daemon from autostarting and squatting the D-Bus name
for f in /etc/xdg/autostart/thunar.desktop /etc/xdg/autostart/xfce4-Thunar.desktop \
         "$TARGET_HOME/.config/autostart/thunar.desktop"; do
	[ -f "$f" ] || continue
	cp -a "$f" "$BAK/" 2>/dev/null || true
	grep -q '^Hidden=true' "$f" || printf 'Hidden=true\n' >> "$f"
	echo "autostart disabled: $f"
done

# Anything that still hard-codes `thunar` (cairo-dock launchers, old scripts,
# xfdesktop menus) is redirected instead of failing.
if [ -x /usr/bin/thunar ] && [ ! -e /usr/local/bin/thunar ]; then
	install -Dm0755 /dev/stdin /usr/local/bin/thunar <<'SHIM'
#!/bin/sh
# Shim: Thunar has been replaced by Finder (nemo). /usr/bin/thunar is intact.
# Remove this file to get Thunar back for hard-coded callers.
exec finder "$@"
SHIM
	echo "shim installed: /usr/local/bin/thunar -> finder"
fi

# ------------------------------------------------------------ 6. verify
say "6/6 AFTER"
command -v finder finder-zfs nemo
asuser "xdg-mime query default inode/directory" || true
asuser "xfconf-query -c xsettings -p /Net/IconThemeName" || true
grep '^FileManager=' "$TARGET_HOME/.config/xfce4/helpers.rc" || true
echo
echo "Log out and back in (or run: xfce4-panel -r ; killall xfdesktop ; xfdesktop &)."
echo "Then: right-click any folder -> the ZFS submenu is at the bottom."
echo "Pool status without opening a window:  finder-zfs status"
say "backups in $BAK   (undo with: sh $0 undo)"
echo "DONE finder-install"
date
