#!/bin/sh
# finder-verify.sh - ROOT. Closes three loose ends visible in the finder-setup receipt.
#
# LOOSE END 1 - the icon theme may be a PARTIAL COPY.
#   The interrupted run (^C) cloned la-capitaine to /tmp and was part-way
#   through `cp -a` into /usr/share/icons when you killed it. The next run then
#   said "la-capitaine already present" because index.theme happened to exist -
#   but `ls | head -5` showed only COPYING/Credits.md/LICENSE/README.md/Thanks.md,
#   which is what a half-finished copy looks like. This counts the actual icon
#   payload and re-clones if it is thin.
#
# LOOSE END 2 - finder-zfs was never confirmed installed.
#   Step 6 ran `command -v finder finder-zfs nemo` and printed only
#   /usr/local/bin/finder. That is partly a red herring: POSIX `command -v`
#   takes ONE name and dash ignores the rest, so nemo's absence there means
#   nothing. But finder-zfs genuinely needs verifying - every ZFS right-click
#   action calls it by bare name and will silently do nothing if it is missing.
#
# LOOSE END 3 - `Failed to init libxfconf: Could not connect`.
#   The session bus address I guessed (/run/user/1000/bus) is not where your
#   dbus-daemon actually listens. The XML fallback DID land
#   (value="OSX-Gunmetal"), but xfsettingsd holds that file in memory and will
#   OVERWRITE it on logout - so the icon theme would silently revert. The XML
#   edit alone is not safe. This script finds the real bus address from the
#   running xfsettingsd process instead of guessing.
#
# Also reports which kernel ZFSBootMenu will actually boot, because dracut
# built an initramfs for a stock 6.18.41_1 while you are running 6.18.35-tkg-bore.
#
# ROLLBACK: sh finder-setup.sh undo
set -eu
say() { printf '\n=== %s ===\n' "$*"; }
[ "$(id -u)" = 0 ] || { echo "must be root (sudo -i)"; exit 1; }

TARGET_USER=${SUDO_USER:-sd}
TARGET_HOME=$(getent passwd "$TARGET_USER" | cut -d: -f6)
TARGET_UID=$(id -u "$TARGET_USER")

# ------------------------------------------------------- 1. icon theme integrity
say "1/4 icon theme integrity"
D=/usr/share/icons/la-capitaine
if [ -d "$D" ]; then
	N=$(find "$D" -name '*.svg' -o -name '*.png' 2>/dev/null | wc -l)
	echo "svg/png files present: $N"
	echo "index.theme: $( [ -f "$D/index.theme" ] && echo yes || echo NO )"
	echo "top level:"
	ls -1 "$D" | head -20
else
	N=0
	echo "$D does not exist"
fi
# A complete la-capitaine is several thousand files. Anything under 1000 is a
# torn copy from the interrupted run.
if [ "$N" -lt 1000 ]; then
	echo
	echo "!! payload is thin ($N) - re-cloning straight into place"
	rm -rf "$D"
	git clone --depth=1 --quiet \
		https://github.com/keeferrourke/la-capitaine-icon-theme.git "$D"
	rm -rf "$D/.git"
	sync
	N=$(find "$D" -name '*.svg' -o -name '*.png' 2>/dev/null | wc -l)
	echo "after re-clone: $N files, index.theme: $( [ -f "$D/index.theme" ] && echo yes || echo NO )"
else
	echo "looks complete"
fi
gtk-update-icon-cache -f "$D" 2>/dev/null || true
gtk-update-icon-cache -f /usr/share/icons/OSX-Gunmetal 2>/dev/null || true

# ------------------------------------------------------- 2. finder-zfs
say "2/4 finder-zfs helper"
if [ ! -x /usr/local/bin/finder-zfs ]; then
	echo "missing - installing"
	if [ -f /root/omen-fix/finder-zfs ]; then
		install -Dm0755 /root/omen-fix/finder-zfs /usr/local/bin/finder-zfs
	else
		curl -fsSL "https://raw.githubusercontent.com/mistuhman/nvidia-intel-ocblizzard-4x8ddr4xmp-10gb3080-voidmusl-picom-xfwm4-compizunused-cairodock-egl-glx/arena/01a04303-nvidia-intel-ocblizzard-4x8ddr/scripts/finder-zfs" \
			-o /usr/local/bin/finder-zfs
		chmod 0755 /usr/local/bin/finder-zfs
	fi
fi
ls -l /usr/local/bin/finder /usr/local/bin/finder-zfs /usr/local/bin/thunar
echo "--- checked one at a time, because dash's command -v only reads arg 1 ---"
for c in finder finder-zfs nemo yad; do printf '%-12s %s\n' "$c" "$(command -v "$c" || echo MISSING)"; done
echo "--- smoke test the helper (non-GUI path) ---"
/usr/local/bin/finder-zfs 2>&1 | head -3 || true

# ------------------------------------------------------- 3. real session bus
say "3/4 icon theme via the REAL session bus"
# Read the bus address out of a process that is already talking to it, rather
# than guessing the socket path.
BUSPID=$(pgrep -u "$TARGET_USER" -x xfsettingsd || pgrep -u "$TARGET_USER" -x xfce4-panel || pgrep -u "$TARGET_USER" -x xfdesktop || true)
BUS=""
if [ -n "$BUSPID" ]; then
	BUS=$(tr '\0' '\n' < "/proc/$BUSPID/environ" | sed -n 's/^DBUS_SESSION_BUS_ADDRESS=//p' | head -1)
	DISP=$(tr '\0' '\n' < "/proc/$BUSPID/environ" | sed -n 's/^DISPLAY=//p' | head -1)
fi
echo "bus pid:  ${BUSPID:-none}"
echo "bus addr: ${BUS:-none}"
if [ -n "$BUS" ]; then
	su "$TARGET_USER" -s /bin/sh -c \
		"DISPLAY=${DISP:-:0} XDG_RUNTIME_DIR=/run/user/$TARGET_UID DBUS_SESSION_BUS_ADDRESS='$BUS' xfconf-query -c xsettings -p /Net/IconThemeName -s OSX-Gunmetal" \
		&& echo "xfconf set OK"
	su "$TARGET_USER" -s /bin/sh -c \
		"DISPLAY=${DISP:-:0} XDG_RUNTIME_DIR=/run/user/$TARGET_UID DBUS_SESSION_BUS_ADDRESS='$BUS' xfconf-query -c xsettings -p /Net/IconThemeName" \
		|| true
else
	echo "!! could not find a session process to read the bus from."
	echo "!! Run this ONE line yourself as sd, in a terminal inside the session:"
	echo "     xfconf-query -c xsettings -p /Net/IconThemeName -s OSX-Gunmetal"
	echo "!! The XML edit alone is NOT enough - xfsettingsd rewrites it on logout."
fi

# ------------------------------------------------------- 4. which kernel boots
say "4/4 which kernel will ZFSBootMenu actually boot?"
echo "--- running now ---"
uname -r
echo "--- kernels present in /boot ---"
ls -1 /boot/vmlinuz-* 2>/dev/null || true
echo "--- initramfs present ---"
ls -1 /boot/initramfs-*.img 2>/dev/null || true
echo "--- ZBM kernel pin (empty = ZBM picks the highest version) ---"
zfs get -H -o value org.zfsbootmenu:kernel nvme/ROOT/void 2>/dev/null || echo "(unset)"
echo
echo "ZBM sorts by version and boots the HIGHEST. 6.18.41_1 sorts above"
echo "6.18.35-tkg-bore, so the next reboot lands on the STOCK kernel and you"
echo "lose the BORE scheduler and your tkg build."
echo
if [ "${PIN_TKG:-0}" = "1" ]; then
	K=$(ls -1 /boot/vmlinuz-*tkg* 2>/dev/null | head -1)
	if [ -n "$K" ]; then
		zfs set org.zfsbootmenu:kernel="${K##*/vmlinuz-}" nvme/ROOT/void
		echo "PINNED to: $(zfs get -H -o value org.zfsbootmenu:kernel nvme/ROOT/void)"
	else
		echo "!! no tkg kernel image found in /boot - cannot pin"
	fi
else
	echo "To pin back to tkg-bore, re-run this script as:  PIN_TKG=1 sh $0"
	echo "Or leave it and pick the kernel manually in the ZBM menu at boot."
fi

say "DONE finder-verify"
date
