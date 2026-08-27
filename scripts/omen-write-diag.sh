#!/bin/sh
# omen-write-diag.sh - ROOT. Diagnose (and immediately mitigate) the slow writes,
# then finish the sysctl fix that keeps failing.
#
# NEW FILENAME ON PURPOSE: raw.githubusercontent.com kept serving a cached copy
# of omen-postfix.sh (your `grep -c 999-desktop-perf` printed 0, and the old
# broken sed ran again). A path that has never been fetched cannot be cached.
#
# ---------------------------------------------------------------------------
# PRIME SUSPECT FOR THE SLOW WRITES: `zpool set autotrim=on nvme`
#
# I set that in omen-fs-fix.sh. It was a mistake on THIS drive.
# Your NVMe is a **WDC PC SN530 SDBPNPZ-1T00** - an OEM, DRAM-less, HMB
# device (the boot log even shows `allocated 32 MiB host memory buffer`).
# DRAM-less controllers have a tiny mapping cache. With autotrim=on, ZFS
# issues TRIM ranges on EVERY transaction group commit; the SN530 serialises
# those against writes and its FTL thrashes. The classic symptom is exactly
# what you are seeing: reads stay fast (you measured 2180 MB/s buffered) while
# writes fall off a cliff.
#
# Periodic manual `zpool trim` is the correct pattern for this drive. Same
# benefit, none of the per-TXG stall. This script turns autotrim back OFF,
# cancels any trim in flight, and sets up a weekly manual trim instead.
#
# Secondary suspects it also checks: an in-flight scrub/trim/resilver, ZFS
# write-throttle backpressure, and pool fragmentation.
#
# ROLLBACK: zpool set autotrim=on nvme
set -eu
say() { printf '\n=== %s ===\n' "$*"; }
[ "$(id -u)" = 0 ] || { echo "must be root (sudo -i)"; exit 1; }

STAMP=$(date +%Y%m%d-%H%M%S)
BAK=/root/omen-write-diag.$STAMP
mkdir -p "$BAK"

# ------------------------------------------------------- 1. what is in flight
say "1/6 anything running on the pools?"
zpool status -t
echo "--- autotrim ---"
zpool get -H autotrim nvme tank 2>/dev/null || true
echo "--- fragmentation / capacity ---"
zpool list -o name,size,alloc,free,frag,cap,health

# ------------------------------------------------------- 2. KILL the autotrim
say "2/6 disable autotrim (wrong setting for a DRAM-less SN530)"
for p in nvme tank; do
	zpool list -H -o name "$p" >/dev/null 2>&1 || continue
	CUR=$(zpool get -H -o value autotrim "$p")
	echo "$p autotrim was: $CUR"
	zpool set autotrim=off "$p"
	zpool trim -s "$p" 2>/dev/null && echo "  cancelled in-flight trim on $p" || true
done
zpool get -H autotrim nvme tank 2>/dev/null || true

# ------------------------------------------------------- 3. write measurement
say "3/6 measure writes (this is the actual receipt)"
sync
echo "--- 2 GiB sequential write to the NVMe pool, fdatasync'd ---"
dd if=/dev/zero of=/root/.wtest bs=1M count=2048 conv=fdatasync 2>&1 | tail -3
rm -f /root/.wtest
sync
echo
echo "--- 512 MiB with compression defeated (random data, real metal speed) ---"
dd if=/dev/urandom of=/root/.wtest2 bs=1M count=512 conv=fdatasync 2>&1 | tail -3
rm -f /root/.wtest2
sync
echo
echo "--- small-file write burst (what actually hurt during the icon install) ---"
rm -rf /root/.wtestdir
mkdir -p /root/.wtestdir
T0=$(date +%s%N)
i=0
while [ "$i" -lt 2000 ]; do
	printf 'x%.0s' 1 2 3 4 5 6 7 8 > "/root/.wtestdir/f$i"
	i=$((i+1))
done
sync
T1=$(date +%s%N)
echo "2000 small files in $(( (T1-T0)/1000000 )) ms"
rm -rf /root/.wtestdir
sync

# ------------------------------------------------------- 4. pool-level detail
say "4/6 per-vdev I/O while idle"
zpool iostat -v 1 3

# ------------------------------------------------------- 5. sysctl, for real
say "5/6 sysctl override fix (the previous sed died on a delimiter collision)"
# The old script used  sed -E "s|^(vm\.swappiness|vm\.dirty_ratio|...)=|"  -
# the alternation pipes ARE the delimiter, hence "unknown option to `s'".
# Delimiter is now @, which cannot appear in a sysctl key name.
KEYS='vm\.swappiness|vm\.dirty_ratio|vm\.dirty_background_ratio|vm\.vfs_cache_pressure|vm\.min_free_kbytes|kernel\.sched_autogroup_enabled|kernel\.nmi_watchdog'
OURS=99-desktop-perf.conf
NEWNAME=999-desktop-perf.conf

# Real culprit, found by the last run: /etc/sysctl.d/99-ollama-ultimate.conf.
# `sysctl --system` sorts by FILENAME and last-write-wins, so 99-*o*llama
# lands after 99-*d*esktop-perf and clobbers it. ollama is not even running.
echo "--- (a) comment the 3 conflicting keys out of every other file ---"
for f in /etc/sysctl.conf /etc/sysctl.d/*.conf /run/sysctl.d/*.conf \
         /usr/local/lib/sysctl.d/*.conf /usr/lib/sysctl.d/*.conf /lib/sysctl.d/*.conf; do
	[ -f "$f" ] || continue
	case "${f##*/}" in "$OURS"|"$NEWNAME") continue ;; esac
	grep -qE "^[[:space:]]*($KEYS)" "$f" || continue
	cp -a "$f" "$BAK/"
	sed -i -E "s@^([[:space:]]*)($KEYS)([[:space:]]*=)@\1# superseded by $NEWNAME: \2\3@" "$f"
	echo "patched: $f"
	grep -nE "superseded by" "$f" || true
done

echo "--- (b) rename ours so it always sorts last ---"
if [ -f "/etc/sysctl.d/$OURS" ]; then
	cp -a "/etc/sysctl.d/$OURS" "$BAK/"
	mv "/etc/sysctl.d/$OURS" "/etc/sysctl.d/$NEWNAME"
	echo "moved -> /etc/sysctl.d/$NEWNAME"
fi
sed -i "s@/etc/sysctl.d/$OURS@/etc/sysctl.d/$NEWNAME@g" \
	/etc/runit/core-services/98-omen-sysctl.sh /etc/sv/omen-perf/run 2>/dev/null || true
ls -1 /etc/sysctl.d/
echo "--- applying, errors visible ---"
sysctl --system

# ------------------------------------------------------- 6. weekly manual trim
say "6/6 replace autotrim with a weekly manual trim"
install -Dm0755 /dev/stdin /etc/cron.weekly/zfs-trim <<'CRON'
#!/bin/sh
# Manual weekly TRIM. Correct pattern for a DRAM-less SN530: one batched pass
# instead of autotrim's per-transaction-group ranges, which stall writes.
for p in nvme tank; do
	zpool list -H -o name "$p" >/dev/null 2>&1 || continue
	# only trim pools whose vdevs actually support it
	zpool trim "$p" 2>/dev/null || true
done
CRON
ls -l /etc/cron.weekly/zfs-trim

say "AFTER"
sysctl vm.swappiness vm.dirty_ratio vm.dirty_background_ratio \
       vm.vfs_cache_pressure vm.min_free_kbytes \
       kernel.sched_autogroup_enabled kernel.nmi_watchdog
echo "expected: 1 / 5 / 2 / 50 / 262144 / 0 / 0"
echo
zpool get -H autotrim nvme tank 2>/dev/null || true
sv restart omen-perf 2>/dev/null || true
sleep 2
sv status omen-perf || true
say "backups in $BAK"
echo "DONE omen-write-diag"
date
