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
#
#   FIRST GUESS WAS WRONG. There is no /etc/sysctl.conf override. The run of
#   this script on 2026-08-27 12:2x found the real culprit:
#
#       /etc/sysctl.d/99-ollama-ultimate.conf
#           vm.swappiness = 10
#           vm.dirty_ratio = 15
#           vm.dirty_background_ratio = 5
#
#   `sysctl --system` processes every *.conf across all directories sorted by
#   FILENAME, and last-write-wins. "99-ollama-ultimate.conf" sorts AFTER
#   "99-desktop-perf.conf" ('o' > 'd'), so ollama's tuning silently clobbers
#   ours on every boot. Nothing was ever broken about the loader.
#
#   Two-part fix, because either alone is fragile:
#     a) comment the three conflicting keys out of the ollama file (its other
#        settings - shmmax, nr_hugepages, net tuning, whatever - are LEFT
#        ALONE; only the three keys that fight us are touched)
#     b) rename ours to 999-desktop-perf.conf so it sorts dead last no matter
#        what any future package drops into /etc/sysctl.d
#   Note ollama is NOT running (perf-p2 receipts confirmed that), so nothing
#   depends on swappiness=10 right now.
#
# ROLLBACK:
#   cp /root/omen-postfix.<stamp>/99-ollama-ultimate.conf /etc/sysctl.d/
#   mv /etc/sysctl.d/999-desktop-perf.conf /etc/sysctl.d/99-desktop-perf.conf
#   sysctl --system
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
say "2/3 find and defeat whatever is overriding the sysctls"

# NOTE: the previous version of this script used  sed -E "s|^(a|b)=|..."  -
# the alternation pipes inside the pattern collided with the "|" delimiter,
# hence "sed: unknown option to `s'". Delimiter is now @, which cannot appear
# in a sysctl key.
KEYS='vm\.swappiness|vm\.dirty_ratio|vm\.dirty_background_ratio|vm\.vfs_cache_pressure|vm\.min_free_kbytes|kernel\.sched_autogroup_enabled|kernel\.nmi_watchdog'
OURS=99-desktop-perf.conf
NEWNAME=999-desktop-perf.conf

echo "--- every file that sets one of our managed keys, in sysctl --system order ---"
for f in $( { ls -1 /run/sysctl.d/*.conf /etc/sysctl.d/*.conf /usr/local/lib/sysctl.d/*.conf \
              /usr/lib/sysctl.d/*.conf /lib/sysctl.d/*.conf; } 2>/dev/null \
            | awk -F/ '{print $NF"\t"$0}' | sort | cut -f2- ); do
	[ -f "$f" ] || continue
	if grep -qE "^[[:space:]]*($KEYS)" "$f"; then
		echo "--- $f"
		grep -nE "^[[:space:]]*($KEYS)" "$f"
	fi
done
if [ -f /etc/sysctl.conf ] && grep -qE "^[[:space:]]*($KEYS)" /etc/sysctl.conf; then
	echo "--- /etc/sysctl.conf (applied LAST of all)"
	grep -nE "^[[:space:]]*($KEYS)" /etc/sysctl.conf
fi

echo
echo "--- (a) neutralise the conflicting keys in every OTHER file ---"
for f in /etc/sysctl.conf /etc/sysctl.d/*.conf /run/sysctl.d/*.conf \
         /usr/local/lib/sysctl.d/*.conf /usr/lib/sysctl.d/*.conf /lib/sysctl.d/*.conf; do
	[ -f "$f" ] || continue
	case "${f##*/}" in "$OURS"|"$NEWNAME") continue ;; esac
	grep -qE "^[[:space:]]*($KEYS)" "$f" || continue
	cp -a "$f" "$BAK/"
	sed -i -E "s@^([[:space:]]*)($KEYS)([[:space:]]*=)@\1# superseded by $NEWNAME: \2\3@" "$f"
	echo "patched: $f"
	grep -nE "superseded by $NEWNAME" "$f" || true
done

echo
echo "--- (b) rename ours so it sorts last no matter what appears later ---"
if [ -f "/etc/sysctl.d/$OURS" ]; then
	cp -a "/etc/sysctl.d/$OURS" "$BAK/"
	mv "/etc/sysctl.d/$OURS" "/etc/sysctl.d/$NEWNAME"
	echo "moved /etc/sysctl.d/$OURS -> /etc/sysctl.d/$NEWNAME"
fi
# keep the runit core-service pointing at a file that exists
sed -i "s@/etc/sysctl.d/$OURS@/etc/sysctl.d/$NEWNAME@g" \
	/etc/runit/core-services/98-omen-sysctl.sh /etc/sv/omen-perf/run 2>/dev/null || true
ls -1 /etc/sysctl.d/

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
