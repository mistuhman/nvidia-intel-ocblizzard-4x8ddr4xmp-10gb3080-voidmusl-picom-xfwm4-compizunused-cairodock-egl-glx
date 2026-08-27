#!/bin/sh
# omen-final.sh - ROOT. One pass: vesktop fix, SATA wipe + tiered pools,
# storage layout, full verification, reboot.
#
# This is the single block. It runs everything still outstanding, in an order
# that leaves nothing half-applied, then reboots so every staged change goes
# live at once (nvidia_drm.modeset=1, clean cmdline, intel-ucode, the Xorg
# latency fix, OS X icons, Finder as default file manager).
#
# STORAGE MODEL - "saved on the pools, launched from the NVMe"
#   The NVMe keeps everything that affects LAUNCH latency: the OS, binaries,
#   configs, dotfiles, Steam's own client, shader caches, Proton prefixes.
#   The pools carry the PAYLOAD: game installs, media, archives, VM images.
#   That is the same shape you already had with tank -> /mnt/games, just wider:
#
#     nvme  (SN530, 953G)   /                OS, apps, configs, prefixes
#     fast  (MX500, 930G)   /fast            SSD library, VM disks, work
#     bulk  (2x2TB, 3.6T)   /bulk /mnt/games HDD library, media, archive
#     cache (SV300, 224G)   L2ARC on bulk    read cache, no data of its own
#
# GATES: CONFIRM_WIPE=DESTROY-ALL-SATA CONFIRM_TANK=YES-KILL-TANK
# OPTIONS:
#   SKIP_DISKS=1   do everything EXCEPT the wipe (no gates needed)
#   HDD_MIRROR=1   mirror the 2x2TB (1.8T, survives one failure) instead of stripe
#   REBOOT=0       stop before rebooting
set -eu
say() { printf '\n\n========== %s ==========\n' "$*"; }
sub() { printf '\n-- %s\n' "$*"; }
[ "$(id -u)" = 0 ] || { echo "must be root (sudo -i)"; exit 1; }

RAW="https://raw.githubusercontent.com/mistuhman/nvidia-intel-ocblizzard-4x8ddr4xmp-10gb3080-voidmusl-picom-xfwm4-compizunused-cairodock-egl-glx/arena/01a04303-nvidia-intel-ocblizzard-4x8ddr/scripts"
DIR=/root/omen-fix
mkdir -p "$DIR"
U=${SUDO_USER:-sd}
UH=$(getent passwd "$U" | cut -d: -f6)
UID_=$(id -u "$U")

# real session bus, read from a live process rather than guessed
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
fetch() { [ -f "$DIR/$1" ] || curl -fsSL "$RAW/$1" -o "$DIR/$1"; chmod 0755 "$DIR/$1"; }

say "STEP 1 - vesktop / Electron GPU flags (never applied; this is the choppiness)"
# ps showed vesktop.bin at 98.2 %CPU. Chromium blocklists the NVIDIA
# proprietary driver for GPU rasterisation on X11, so Vesktop paints every
# frame in software and uploads it. One saturated core starves compiz (8.0%)
# and Xorg (6.5%), which is why OTHER apps go choppy too, not just Discord.
FLAGS="--ignore-gpu-blocklist --enable-gpu-rasterization --enable-zero-copy --disable-gpu-driver-bug-workarounds --enable-features=VaapiVideoDecodeLinuxGL,CanvasOopRasterization --disable-features=UseChromeOSDirectVideoDecoder --disable-smooth-scrolling"
SRC=""
for c in /usr/share/applications/vesktop.desktop \
         /usr/local/share/applications/vesktop.desktop \
         "$UH/.local/share/applications/vesktop.desktop"; do
	if [ -f "$c" ]; then SRC=$c; break; fi
done
[ -n "$SRC" ] || SRC=$(find /usr/share/applications "$UH/.local/share/applications" \
	-maxdepth 1 -iname '*vesktop*.desktop' 2>/dev/null | head -1)
if [ -n "$SRC" ]; then
	sub "patching launcher: $SRC"
	mkdir -p "$UH/.local/share/applications"
	DST="$UH/.local/share/applications/$(basename "$SRC")"
	cp -f "$SRC" "$DST"
	awk -v f="$FLAGS" '
		/^Exec=/ && index($0,"--ignore-gpu-blocklist")==0 {
			l=$0; sub(/^Exec=/,"",l); n=split(l,a," ")
			o=a[1] " " f; for(i=2;i<=n;i++) o=o " " a[i]
			print "Exec=" o; next } {print}' "$DST" > "$DST.tmp"
	mv "$DST.tmp" "$DST"
	chown -R "$U": "$UH/.local/share/applications"
	grep '^Exec=' "$DST"
	asuser "update-desktop-database $UH/.local/share/applications" 2>/dev/null || true
else
	sub "no vesktop .desktop found"
fi
# Vesktop's own setting can override the flags - force hardware accel on.
VC="$UH/.config/vesktop/settings.json"
if [ -f "$VC" ]; then
	cp -a "$VC" "$VC.bak.$(date +%s)"
	sed -i 's/"hardwareAcceleration"[[:space:]]*:[[:space:]]*false/"hardwareAcceleration": true/' "$VC"
	sub "vesktop settings.json hardwareAcceleration:"; grep -o '"hardwareAcceleration"[^,}]*' "$VC" || echo "  (key absent - flags govern)"
fi
sub "stopping the runaway vesktop processes (they restart clean after reboot)"
pkill -u "$U" -f vesktop 2>/dev/null || true
sleep 1
pgrep -u "$U" -af vesktop || echo "  none running"

say "STEP 2 - SATA wipe + tiered pools"
if [ "${SKIP_DISKS:-0}" = "1" ]; then
	echo "SKIP_DISKS=1 - leaving the disks alone"
else
	[ "${CONFIRM_WIPE:-}" = "DESTROY-ALL-SATA" ] || { echo "ABORT: need CONFIRM_WIPE=DESTROY-ALL-SATA"; exit 1; }
	[ "${CONFIRM_TANK:-}" = "YES-KILL-TANK" ] || { echo "ABORT: need CONFIRM_TANK=YES-KILL-TANK"; exit 1; }
	rm -f "$DIR/omen-sata-pools.sh"
	fetch omen-sata-pools.sh
	CONFIRM_WIPE="$CONFIRM_WIPE" CONFIRM_TANK="$CONFIRM_TANK" \
		HDD_MIRROR="${HDD_MIRROR:-0}" sh "$DIR/omen-sata-pools.sh"
fi

say "STEP 3 - storage layout: payload on the pools, launch path on the NVMe"
if zpool list -H -o name fast >/dev/null 2>&1; then
	sub "fast (MX500 SSD) - things that need speed but are too big for /"
	zfs list -H -o name fast/steam >/dev/null 2>&1 || zfs create -o mountpoint=/fast/steam fast/steam
	zfs list -H -o name fast/vm    >/dev/null 2>&1 || zfs create -o mountpoint=/fast/vm fast/vm
	zfs list -H -o name fast/work  >/dev/null 2>&1 || zfs create -o mountpoint=/fast/work fast/work
	# VM images: no compression benefit, and 64K matches qcow2 clusters
	zfs set recordsize=64K fast/vm
	zfs set compression=off fast/vm
	# Steam library skeleton so Steam's "Add Library Folder" finds it instantly
	mkdir -p /fast/steam/steamapps/common
fi
if zpool list -H -o name bulk >/dev/null 2>&1; then
	sub "bulk (2x2TB HDD) - the payload"
	zfs list -H -o name bulk/games   >/dev/null 2>&1 || zfs create -o mountpoint=/mnt/games bulk/games
	zfs list -H -o name bulk/media   >/dev/null 2>&1 || zfs create -o mountpoint=/bulk/media bulk/media
	zfs list -H -o name bulk/archive >/dev/null 2>&1 || zfs create -o mountpoint=/bulk/archive bulk/archive
	mkdir -p /mnt/games/steamapps/common
fi
# Steam client, configs, shader cache and Proton prefixes STAY on the NVMe -
# that is what governs launch time. Only the library payload moves.
if [ -d "$UH/.local/share/Steam" ] || [ -d "$UH/.steam" ]; then
	sub "Steam stays on the NVMe; libraries point at the pools"
	echo "  client:   $UH/.local/share/Steam   (NVMe - launch path)"
	echo "  prefixes: $UH/.local/share/Steam/steamapps/compatdata (NVMe)"
	echo "  library:  /fast/steam/steamapps  and  /mnt/games/steamapps"
	echo "  >> In Steam: Settings -> Storage -> + -> add /fast/steam and /mnt/games"
fi
# convenience symlink so ~/Games resolves to the pool
[ -e "$UH/Games" ] || ln -sfn /mnt/games "$UH/Games"
# libvirt images onto the SSD pool, if libvirt is present
if [ -d /var/lib/libvirt/images ] && zpool list -H -o name fast >/dev/null 2>&1; then
	if [ ! -L /var/lib/libvirt/images ] && [ -z "$(ls -A /var/lib/libvirt/images 2>/dev/null)" ]; then
		rmdir /var/lib/libvirt/images
		ln -sfn /fast/vm /var/lib/libvirt/images
		sub "libvirt images -> /fast/vm"
	else
		sub "libvirt images dir not empty; left alone (move manually if you want)"
	fi
fi
for d in /fast /bulk /mnt/games; do [ -d "$d" ] && chown -R "$U": "$d" 2>/dev/null || true; done

say "STEP 4 - verify everything that has been applied so far"
sub "ZBM kernel cmdline (takes effect on reboot)"
zfs get -H -o value org.zfsbootmenu:commandline nvme/ROOT/void
sub "ZBM kernel pin"
zfs get -H -o value org.zfsbootmenu:kernel nvme/ROOT/void
sub "nvidia modeset modprobe"
cat /etc/modprobe.d/99-nvidia-drm.conf 2>/dev/null || echo "MISSING"
sub "EFI boot order"
efibootmgr | grep -E '^(BootOrder|BootCurrent|Boot0)'
sub "sysctl"
sysctl vm.swappiness vm.dirty_ratio kernel.sched_autogroup_enabled kernel.nmi_watchdog
sub "ARC + autotrim"
head -1 /sys/module/zfs/parameters/zfs_arc_max
zpool list -H -o name | while read -r p; do printf '  %s autotrim=%s\n' "$p" "$(zpool get -H -o value autotrim "$p")"; done
sub "omen-perf service"
sv status omen-perf || true
sub "Xorg (no ForceFullCompositionPipeline)"
grep -E 'Composition|Coolbits' /etc/X11/xorg.conf.d/20-nvidia.conf || true
sub "Finder"
for c in finder finder-zfs nemo yad; do printf '  %-11s %s\n' "$c" "$(command -v "$c" || echo MISSING)"; done
asuser "xdg-mime query default inode/directory" 2>/dev/null || true
asuser "xfconf-query -c xsettings -p /Net/IconThemeName" 2>/dev/null || true
sub "pools"
zpool list
zfs list -o name,used,avail,mountpoint

say "STEP 5 - reboot"
sync
echo "On the way back up, verify with:"
echo "  cat /proc/cmdline            # nvidia_drm.modeset=1, intel_pstate=active ONCE"
echo "  dmesg | grep -i microcode    # no 'old microcode'"
echo "  uname -r                     # 6.18.35-tkg-bore"
echo "  zpool status                 # nvme + fast + bulk, cache vdev on bulk"
echo "  sv status omen-perf          # run"
echo
if [ "${REBOOT:-1}" = "1" ]; then
	echo "rebooting in 10 seconds - Ctrl-C to stay up"
	sleep 10
	reboot
else
	echo "REBOOT=0 - reboot yourself when ready"
fi
