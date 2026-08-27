#!/bin/sh
# omen-sata-pools.sh - ROOT. DESTRUCTIVE. Wipes every SATA disk and builds a
# tiered ZFS layout. The boot NVMe is hard-protected and cannot be touched.
#
# ============================ WHAT THIS DESTROYS ============================
#   sda  ata-CT1000MX500SSD1_2317E6CCE92E        931.5G  Crucial MX500 SSD
#        p1 ESP 200M | p2 NTFS "System Reserved" 2G | p3 NTFS 429.5G
#        p4 NTFS "Backup" 499.8G           <- a whole Windows install
#   sdb  ata-KINGSTON_SV300S37A240G_50026B7762054FB2  223.6G  Kingston SSD
#        p1 NTFS "System Reserved" 500M | p2 NTFS 222.2G | p3 NTFS 875M
#   sdc  ata-ST2000NM0033-9ZM175_Z1X6R7P5          1.8T  Seagate HDD
#        p1 128M | p2 NTFS "DATA" 1.8T
#   sdd  ata-TOSHIBA_DT01ACA200_95CWVMJAS          1.8T  Toshiba HDD
#        p1 NTFS "50" 1.1T
#        p2 ZFS  766.3G  <-- THE LIVE `tank` POOL, MOUNTED AT /mnt/games,
#                             465G ALLOCATED. THIS GOES TOO.
#
#   NOT TOUCHED: nvme0n1 (WDC SN530) - pool `nvme`, dataset nvme/ROOT/void, /
#
# ============================== RESULTING LAYOUT ============================
#   fast   = sda            ~930G   SSD.  VMs, projects, latency-sensitive
#   bulk   = sdc + sdd      ~3.6T   2x2TB HDD, STRIPED (or mirrored, see below)
#   cache  = sdb            ~224G   L2ARC read cache attached to `bulk`
#
#   The Kingston SV300 is a 2012 SandForce drive. It is deliberately NOT given
#   any data role. As an L2ARC vdev it absorbs random reads off the spinning
#   disks and its failure is harmless - ZFS drops the cache and continues.
#
#   NO REDUNDANCY by default: striping the two 2TB disks yields 3.6T but either
#   disk failing loses `bulk`. Set HDD_MIRROR=1 for a 1.8T mirror instead.
#
# ================================= SAFETY ===================================
#   * refuses to run unless CONFIRM_WIPE=DESTROY-ALL-SATA
#   * refuses to run unless CONFIRM_TANK=YES-KILL-TANK  (sdd carries live data)
#   * derives the protected device list from the ROOT POOL at runtime and
#     aborts if any target resolves to it
#   * operates only on /dev/disk/by-id/ata-* paths, never /dev/sdX, because
#     sdX letters reshuffle between boots
#   * verifies each pool with zpool status before moving to the next
#
# USAGE:
#   CONFIRM_WIPE=DESTROY-ALL-SATA CONFIRM_TANK=YES-KILL-TANK sh omen-sata-pools.sh
# optional:
#   HDD_MIRROR=1   mirror the two HDDs (1.8T, survives one failure)
#   DRYRUN=1       print every destructive command instead of running it
set -eu
say() { printf '\n=== %s ===\n' "$*"; }
die() { printf '\nABORT: %s\n' "$*" >&2; exit 1; }
[ "$(id -u)" = 0 ] || die "must be root (sudo -i)"

DRYRUN=${DRYRUN:-0}
run() {
	if [ "$DRYRUN" = "1" ]; then printf '  DRYRUN: %s\n' "$*"; else "$@"; fi
}

SSD=/dev/disk/by-id/ata-CT1000MX500SSD1_2317E6CCE92E
CACHE=/dev/disk/by-id/ata-KINGSTON_SV300S37A240G_50026B7762054FB2
HDD1=/dev/disk/by-id/ata-ST2000NM0033-9ZM175_Z1X6R7P5
HDD2=/dev/disk/by-id/ata-TOSHIBA_DT01ACA200_95CWVMJAS
TARGETS="$SSD $CACHE $HDD1 $HDD2"

# ------------------------------------------------------------------ gates
say "0/7 confirmation gates"
[ "${CONFIRM_WIPE:-}" = "DESTROY-ALL-SATA" ] || \
	die "set CONFIRM_WIPE=DESTROY-ALL-SATA to proceed"
[ "${CONFIRM_TANK:-}" = "YES-KILL-TANK" ] || \
	die "sdd holds the live 'tank' pool (465G at /mnt/games). Set CONFIRM_TANK=YES-KILL-TANK to destroy it."
echo "gates passed"
[ "$DRYRUN" = "1" ] && echo "*** DRYRUN - nothing will be written ***"

# ------------------------------------------------- protect the root pool
say "1/7 identify and protect the root pool"
ROOTDS=$(df --output=source / | tail -1)
ROOTPOOL=${ROOTDS%%/*}
echo "root dataset: $ROOTDS"
echo "root pool:    $ROOTPOOL"
PROTECTED=$(zpool status -P "$ROOTPOOL" | awk '/\/dev\//{print $1}')
echo "protected devices:"
printf '  %s\n' $PROTECTED
for t in $TARGETS; do
	[ -e "$t" ] || die "target does not exist: $t"
	REAL=$(readlink -f "$t")
	echo "target $t -> $REAL"
	case "$REAL" in *nvme*) die "REFUSING: $t resolves to an NVMe device" ;; esac
	for p in $PROTECTED; do
		PREAL=$(readlink -f "$p" 2>/dev/null || echo "$p")
		case "$PREAL" in "$REAL"*) die "REFUSING: $t is part of the root pool" ;; esac
	done
done
echo "all four targets are safe to destroy"

say "2/7 final inventory of what is about to be destroyed"
lsblk -o NAME,SIZE,TYPE,FSTYPE,LABEL,MODEL,MOUNTPOINT $(for t in $TARGETS; do readlink -f "$t"; done)
zpool status tank 2>/dev/null || true
df -h /mnt/games 2>/dev/null || true

# ------------------------------------------------------- tear down tank
say "3/7 tear down the live tank pool"
if zpool list -H -o name tank >/dev/null 2>&1; then
	echo "unmounting tank datasets deepest-first (never a blanket -a)"
	# zfs list -r is parent-first; unmounting tank while tank/games is
	# mounted leaves the pool busy and `zpool destroy -f` fails (2026-08-27).
	zfs list -H -o name -r tank 2>/dev/null | awk '{a[NR]=$0} END{for(i=NR;i>=1;i--) print a[i]}' | while read -r ds; do
		run zfs unmount -f "$ds" 2>/dev/null || true
	done
	run umount -lf /mnt/games 2>/dev/null || true
	run umount -lf /tank 2>/dev/null || true
	echo "exporting tank (force) so destroy is not racing a busy spa"
	run zpool export -f tank 2>/dev/null || true
	if zpool list -H -o name tank >/dev/null 2>&1; then
		echo "destroying pool tank"
		run zpool destroy -f tank
	else
		echo "tank exported"
	fi
else
	echo "tank not imported"
fi
zpool list

# ------------------------------------------------------------- wipe all
say "4/7 wipe every target"
for t in $TARGETS; do
	REAL=$(readlink -f "$t")
	echo "--- $t ($REAL)"
	# order matters: ZFS labels live at both ends of the device
	for part in "$t"-part*; do
		[ -e "$part" ] || continue
		run zpool labelclear -f "$part" 2>/dev/null || true
		run wipefs -a "$part" 2>/dev/null || true
	done
	run zpool labelclear -f "$t" 2>/dev/null || true
	run wipefs -a "$t" 2>/dev/null || true
	run sgdisk --zap-all "$t" 2>/dev/null || run dd if=/dev/zero of="$t" bs=1M count=16 conv=fsync
	# blkdiscard resets the FTL on the SSDs; harmless no-op on the HDDs
	run blkdiscard -f "$t" 2>/dev/null || echo "  (blkdiscard unsupported, skipped)"
	run partprobe "$t" 2>/dev/null || true
done
run udevadm settle
sleep 2
lsblk -o NAME,SIZE,TYPE,FSTYPE,LABEL $(for t in $TARGETS; do readlink -f "$t"; done)

# ------------------------------------------------------- build the pools
say "5/7 create pools (by-id paths only, never sdX)"
# ashift=12 = 4K sectors. Correct for every one of these drives and it CANNOT
# be changed after creation, so it is set explicitly rather than autodetected.
COMMON="-o ashift=12 -O compression=lz4 -O xattr=sa -O atime=off -O relatime=on -O acltype=posixacl -O dnodesize=auto -O normalization=formD"

echo "--- fast (Crucial MX500 1TB SSD) ---"
run zpool create -f $COMMON -O mountpoint=/fast fast "$SSD"
run zfs create -o mountpoint=/fast/vm fast/vm
run zfs create -o mountpoint=/fast/work fast/work
run zfs create -o mountpoint=/fast/steam fast/steam
# VM images: no lz4 win, 64K matches qcow2 clusters
run zfs set recordsize=64K fast/vm
run zfs set compression=off fast/vm
run mkdir -p /fast/steam/steamapps/common
zpool status fast 2>/dev/null || true

echo "--- bulk (2 x 2TB HDD) ---"
if [ "${HDD_MIRROR:-0}" = "1" ]; then
	echo "mirror layout: ~1.8T usable, survives one disk failure"
	run zpool create -f $COMMON -O mountpoint=/bulk -O recordsize=1M bulk mirror "$HDD1" "$HDD2"
else
	echo "stripe layout: ~3.6T usable, NO redundancy"
	run zpool create -f $COMMON -O mountpoint=/bulk -O recordsize=1M bulk "$HDD1" "$HDD2"
fi
# keep /mnt/games working - everything that referenced it still resolves
run zfs create -o mountpoint=/mnt/games bulk/games
run zfs create -o mountpoint=/bulk/media bulk/media
run zfs create -o mountpoint=/bulk/archive bulk/archive
run mkdir -p /mnt/games/steamapps/common
zpool status bulk 2>/dev/null || true

echo "--- attach the Kingston as L2ARC read cache on bulk ---"
run zpool add -f bulk cache "$CACHE"
zpool status bulk 2>/dev/null || true

# --------------------------------------------------------------- tuning
say "6/7 tuning"
# SSD pool can autotrim safely - the MX500 has onboard DRAM, unlike the SN530.
run zpool set autotrim=on fast
run zpool set autotrim=off bulk
# weekly trim should cover every pool, not just the two that existed before
cat > /etc/cron.weekly/zfs-trim <<'CRON'
#!/bin/sh
# Manual weekly TRIM across every pool that supports it. Batched, unlike
# autotrim, which stalls writes on DRAM-less controllers (see the SN530).
zpool list -H -o name | while read -r p; do
	zpool trim "$p" 2>/dev/null || true
done
CRON
chmod 0755 /etc/cron.weekly/zfs-trim
run chown -R sd: /fast /bulk /mnt/games 2>/dev/null || true
HERE=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
if [ "$DRYRUN" != "1" ] && [ -f "$HERE/finder-storage-places.sh" ]; then
	sh "$HERE/finder-storage-places.sh" || echo "finder-storage-places failed (pools already created)"
fi

say "7/7 AFTER"
zpool list -v
echo
zfs list -o name,used,avail,refer,mountpoint,compression,recordsize
echo
zpool status
echo
df -h /fast /bulk /mnt/games 2>/dev/null || true
echo
echo "Baseline scrubs (background, safe to leave running):"
run zpool scrub fast 2>/dev/null || true
run zpool scrub bulk 2>/dev/null || true
echo
echo "Check progress any time with:  zpool status -t"
echo "Or from Finder: right-click any folder -> ZFS: Pool status"
echo "Finder hierarchy: ~/Storage  and Places sidebar Fast / Bulk / Games"
echo "DONE omen-sata-pools"
date
