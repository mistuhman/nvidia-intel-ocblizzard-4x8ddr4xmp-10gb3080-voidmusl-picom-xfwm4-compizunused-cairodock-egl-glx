#!/bin/sh
# omen-postfix.sh - ROOT. Repairs two defects visible in the wave-1 receipts.
#
# DEFECT 1 - BootOrder has a duplicate entry.
#   AFTER showed:  BootOrder: 0000,0000,0001
#   Cause: `efibootmgr -c` already prepends the new entry to BootOrder before
#   returning, so my script's "put NEW in front of OLD" appended 0000 to an
#   order that already began with 0000. Harmless in practice (firmware skips
#   the repeat) but it is wrong and some HP firmware revisions choke on a
#   malformed order. Deduped here.
#   The entry ITSELF is correct - the device-path bytes decode to
#   5c 45 46 49 5c 7a 62 6d 5c 76 6d 6c 69 6e 75 7a 2e 45 46 49 = \EFI\zbm\vmlinuz.EFI
#   The mangled "\EFI\zbm(newline)mlinuz.EFI" in the log was only `echo`
#   interpreting the \v as a vertical tab. Cosmetic. Nothing to redo.
#
# DEFECT 2 - the sysctls STILL did not apply.
#   AFTER showed:  vm.swappiness = 10   vm.dirty_ratio = 15
#   even though /etc/sysctl.d/99-desktop-perf.conf says 1 and 5.
#   Cause: `sysctl --system` reads directories in this order -
#       /run/sysctl.d, /etc/sysctl.d, /usr/local/lib/sysctl.d,
#       /usr/lib/sysctl.d, /lib/sysctl.d, and **/etc/sysctl.conf LAST**.
#   /etc/sysctl.conf is applied after everything else, so whatever it sets
#   overrides /etc/sysctl.d. swappiness=10 and dirty_ratio=15 are exactly the
#   values from the 2026-08-25 session that were written into sysctl.conf.
#   This script finds and neutralises the overriding keys.
#
# ROLLBACK:
#   cp /root/omen-postfix.<stamp>/sysctl.conf /etc/sysctl.conf
#   efibootmgr -o 0000,0001
set -eu
say() { printf '\n=== %s ===\n' "$*"; }
[ "$(id -u)" = 0 ] || { echo "must be root (sudo -i)"; exit 1; }

STAMP=$(date +%Y%m%d-%H%M%S)
BAK=/root/omen-postfix.$STAMP
mkdir -p "$BAK"

# --------------------------------------------------------- 1. BootOrder dedupe
say "1/3 dedupe BootOrder"
CUR=$(efibootmgr | sed -n 's/^BootOrder: //p' | tr -d ' ')
echo "current: $CUR"
DEDUP=$(printf '%s' "$CUR" | tr ',' '\n' | awk '!seen[$0]++' | paste -sd, -)
echo "deduped: $DEDUP"
if [ "$CUR" != "$DEDUP" ]; then
	efibootmgr -o "$DEDUP" >/dev/null
	echo "BootOrder rewritten"
else
	echo "already clean"
fi
efibootmgr | head -5

# --------------------------------------------------------- 2. sysctl override hunt
say "2/3 find what is overriding the sysctls"
echo "--- files that set our managed keys ---"
KEYS='vm.swappiness|vm.dirty_ratio|vm.dirty_background_ratio|vm.vfs_cache_pressure|vm.min_free_kbytes|kernel.sched_autogroup_enabled|kernel.nmi_watchdog'
for f in /etc/sysctl.conf /etc/sysctl.d/*.conf /run/sysctl.d/*.conf \
         /usr/lib/sysctl.d/*.conf /lib/sysctl.d/*.conf; do
	[ -f "$f" ] || continue
	if grep -qE "^[[:space:]]*($KEYS)" "$f"; then
		echo "--- $f"
		grep -nE "^[[:space:]]*($KEYS)" "$f"
	fi
done

echo
echo "--- neutralising overrides in /etc/sysctl.conf (it is applied LAST and wins) ---"
if [ -f /etc/sysctl.conf ]; then
	cp -a /etc/sysctl.conf "$BAK/sysctl.conf"
	sed -i -E "s|^[[:space:]]*($KEYS)[[:space:]]*=|# superseded by /etc/sysctl.d/99-desktop-perf.conf: \1 =|" \
		/etc/sysctl.conf
	echo "--- /etc/sysctl.conf now ---"
	cat /etc/sysctl.conf
else
	echo "(no /etc/sysctl.conf)"
fi

echo
echo "--- re-applying, with errors visible this time ---"
sysctl --system

# --------------------------------------------------------- 3. verify
say "3/3 AFTER"
sysctl vm.swappiness vm.dirty_ratio vm.dirty_background_ratio \
       vm.vfs_cache_pressure vm.min_free_kbytes \
       kernel.sched_autogroup_enabled kernel.nmi_watchdog
echo
echo "expected: swappiness=1 dirty_ratio=5 dirty_background_ratio=2"
echo "          vfs_cache_pressure=50 min_free_kbytes=262144"
echo "          sched_autogroup_enabled=0 nmi_watchdog=0"
echo
sv restart omen-perf 2>/dev/null || true
sleep 2
sv status omen-perf || true
efibootmgr | sed -n 's/^BootOrder.*/&/p'
say "backups in $BAK"
echo "DONE omen-postfix"
date
