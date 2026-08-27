#!/bin/sh
# omen-fs-fix.sh - ROOT. Fixes the filesystem-layer causes of "loads like an HDD".
#
# EVIDENCE (postboot receipts 2026-08-27 11:53 UTC):
#   * zfs_arc_max = 4294967296 (4 GiB) on a 31 GiB box with 23 GiB FREE.
#     ZFS does not use the kernel page cache. ARC *is* the cache. A 4 GiB ARC
#     means every Electron/Chromium asset, every sqlite page, every icon, is
#     re-read from the SN530 on each access. That is literally why Discord
#     (vesktop) "loads like it's on an HDD" and why app start-up is choppy.
#   * findmnt / shows "xattr" (= xattr=on, directory-based xattrs).
#     Directory xattrs cost an extra hidden-directory lookup + I/O per file.
#     Electron cache dirs and Thunar/gvfs thumbnails hammer xattrs.
#     xattr=sa stores them inline in the dnode. Big win, zero risk.
#   * vm.swappiness reads 10, but /etc/sysctl.d/999-desktop-perf.conf sets 1
#     => /etc/sysctl.d IS NOT BEING APPLIED AT BOOT. Every perf sysctl we set
#     on 2026-08-25 has been silently dead since the next reboot.
#   * every SATA disk is on the "bfq" scheduler, including sdd which is the
#     vdev for the `tank` pool. BFQ in front of ZFS double-schedules and adds
#     latency; ZFS wants "none"/noop on its vdevs.
#   * no swap at all and no min_free_kbytes floor -> allocation stalls show up
#     as whole-desktop freezes.
#
# SAFE: no destructive disk operation. No wipefs, no labelclear, no zpool
# destroy, no partition change. Everything here is reversible (see ROLLBACK).
#
# ROLLBACK:
#   echo options zfs zfs_arc_max=4294967296 > /etc/modprobe.d/99-arc-cap.conf
#   echo 4294967296 > /sys/module/zfs/parameters/zfs_arc_max
#   zfs set xattr=on nvme
#   rm -f /etc/udev/rules.d/60-omen-ioscheduler.rules
#   rm -f /etc/sysctl.d/999-desktop-perf.conf /etc/runit/core-services/98-omen-sysctl.sh
set -eu

say() { printf '\n=== %s ===\n' "$*"; }
[ "$(id -u)" = 0 ] || { echo "must be root (sudo -i)"; exit 1; }

STAMP=$(date +%Y%m%d-%H%M%S)
BAK=/root/omen-fs-fix.$STAMP
mkdir -p "$BAK"

say "BEFORE"
head -1 /sys/module/zfs/parameters/zfs_arc_max
sysctl vm.swappiness
zfs get -H -o property,value xattr,atime,relatime,compression,recordsize,sync nvme
for d in /sys/block/sd? /sys/block/nvme?n?; do
	[ -e "$d/queue/scheduler" ] && printf '%s: %s\n' "${d##*/}" "$(cat "$d/queue/scheduler")" || true
done

# ---------------------------------------------------------------- 1. ARC
# 12 GiB. Leaves ~19 GiB for the session + VMs + games and still gives the
# desktop a real cache. ARC is evictable under pressure - it gives memory back.
say "1/6 ARC 4G -> 12G"
cp -a /etc/modprobe.d/99-arc-cap.conf "$BAK/" 2>/dev/null || true
printf 'options zfs zfs_arc_max=12884901888\noptions zfs zfs_arc_min=2147483648\n' \
	> /etc/modprobe.d/99-arc-cap.conf
echo 12884901888 > /sys/module/zfs/parameters/zfs_arc_max
echo 2147483648 > /sys/module/zfs/parameters/zfs_arc_min

# ---------------------------------------------------------------- 2. dataset props
say "2/6 dataset properties (xattr=sa, atime off, lz4)"
for pool in nvme tank; do
	zpool list -H -o name "$pool" >/dev/null 2>&1 || continue
	zfs set xattr=sa "$pool"
	zfs set atime=off "$pool"
	zfs set relatime=on "$pool"
	zfs set compression=lz4 "$pool"
	zfs set redundant_metadata=most "$pool"
done
# Electron/Chromium/sqlite are small-random. 128K records amplify every 4K write.
zfs list -H -o name nvme/ROOT/void >/dev/null 2>&1 && zfs set recordsize=128K nvme/ROOT/void || true
# autotrim is deliberately NOT enabled. The SN530 is DRAM-less/HMB and stalls
# writes when ZFS issues TRIM ranges every transaction group. A weekly manual
# `zpool trim` (installed by omen-write-diag.sh) gives the same benefit without
# the per-TXG penalty. See docs/fs-display-finder-fix.md.
zpool set autotrim=off nvme 2>/dev/null || true

# ---------------------------------------------------------------- 3. sysctl (and make it STICK)
say "3/6 sysctl file + boot-time application (this was silently dead)"
cp -a /etc/sysctl.d/999-desktop-perf.conf "$BAK/" 2>/dev/null || true
cat > /etc/sysctl.d/999-desktop-perf.conf <<'SYSCTL'
# OMEN 45L desktop-latency profile. Applied by /etc/runit/core-services/98-omen-sysctl.sh
vm.swappiness=1
vm.dirty_ratio=5
vm.dirty_background_ratio=2
vm.vfs_cache_pressure=50
vm.min_free_kbytes=262144
vm.max_map_count=2147483642
kernel.sched_autogroup_enabled=0
kernel.nmi_watchdog=0
kernel.split_lock_mitigate=0
fs.inotify.max_user_watches=1048576
fs.file-max=2097152
SYSCTL

# Void's runit does not reliably drain /etc/sysctl.d. Force it.
cat > /etc/runit/core-services/98-omen-sysctl.sh <<'CORESVC'
# Applies /etc/sysctl.d/*.conf at boot. Void core-services only guarantees
# /etc/sysctl.conf on some versions; receipts proved 999-desktop-perf.conf
# was never applied (swappiness read 10, file said 1).
msg "Applying sysctl settings (omen)..."
sysctl --system >/dev/null 2>&1 || sysctl -p /etc/sysctl.d/999-desktop-perf.conf >/dev/null 2>&1
CORESVC
chmod 0644 /etc/runit/core-services/98-omen-sysctl.sh
sysctl --system >/dev/null 2>&1 || sysctl -p /etc/sysctl.d/999-desktop-perf.conf

# ---------------------------------------------------------------- 4. I/O schedulers
say "4/6 I/O schedulers: drop bfq"
cat > /etc/udev/rules.d/60-omen-ioscheduler.rules <<'UDEV'
# NVMe: no scheduler, the drive reorders better than we can.
ACTION=="add|change", KERNEL=="nvme[0-9]n[0-9]", ATTR{queue/scheduler}="none"
# SATA: mq-deadline. BFQ double-schedules in front of ZFS and adds latency;
# receipts showed every sd* on bfq, including the `tank` vdev sdd.
ACTION=="add|change", KERNEL=="sd[a-z]", ATTR{queue/scheduler}="mq-deadline"
# Deeper queue + no read-ahead throttling for the rotational archive disks.
ACTION=="add|change", KERNEL=="sd[a-z]", ATTR{queue/rotational}=="1", ATTR{queue/read_ahead_kb}="2048"
ACTION=="add|change", KERNEL=="sd[a-z]", ATTR{queue/rotational}=="0", ATTR{queue/read_ahead_kb}="512"
UDEV
udevadm control --reload
udevadm trigger --subsystem-match=block --action=change || true

# ---------------------------------------------------------------- 5. THP
say "5/6 transparent hugepages always -> madvise"
echo madvise > /sys/kernel/mm/transparent_hugepage/enabled 2>/dev/null || true
echo madvise > /sys/kernel/mm/transparent_hugepage/defrag 2>/dev/null || true

# ---------------------------------------------------------------- 6. missing tools
say "6/6 missing tooling (hdparm was not installed, so the speed gate never ran)"
xbps-install -Sy hdparm smartmontools 2>&1 | tail -5 || true

say "AFTER"
head -1 /sys/module/zfs/parameters/zfs_arc_max
sysctl vm.swappiness vm.dirty_ratio kernel.sched_autogroup_enabled
zfs get -H -o property,value xattr,atime,compression,recordsize nvme
for d in /sys/block/sd? /sys/block/nvme?n?; do
	[ -e "$d/queue/scheduler" ] && printf '%s: %s\n' "${d##*/}" "$(cat "$d/queue/scheduler")" || true
done
say "NVMe read speed (should be GB/s cached, >1500 MB/s buffered)"
command -v hdparm >/dev/null && hdparm -tT /dev/nvme0n1 || echo "hdparm still missing"
say "backups in $BAK"
echo "DONE omen-fs-fix"
date
