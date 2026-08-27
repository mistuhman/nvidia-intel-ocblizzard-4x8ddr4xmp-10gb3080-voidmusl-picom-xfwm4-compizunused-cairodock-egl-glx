#!/bin/sh
# omen-omni.sh - ROOT. The single block. Fixes what is broken, then dumps the
# COMPLETE machine state so nothing has to be re-derived or guessed next time.
#
# Everything it prints is also written to /root/omen-state-latest.txt so it can
# be pasted back in one go. That file is the source of truth for STATE.md.
#
# WHAT IT FIXES
#  1. vesktop launching with HOME=/root. `su USER -c` (no dash) does NOT reset
#     HOME. Every asuser helper I shipped had this. The evidence was in your
#     own log:
#        Unable to open /root/.local/share/flatpak/.../dconf/profile/user
#        MESA-LOADER: failed to open dri: ... Permission denied
#     vesktop ran as sd but read /root, so it came up with a blank config and
#     no DRI. The real config in ~/.var/app/dev.vencord.Vesktop was never
#     touched. Fixed by exporting HOME/USER/LOGNAME/XAUTHORITY.
#  2. The flatpak NVIDIA GL extension skew is already resolved
#     (595-84 -> 595-91-07); this verifies the renderer is genuinely NVIDIA
#     and not llvmpipe, from inside the sandbox, with a correct HOME.
#  3. plocate index came back empty. Rebuilds and proves the count.
#
# It is NON-DESTRUCTIVE. No wipefs, no zpool destroy, no reboot.
set -u
OUT=/root/omen-state-latest.txt

say() { printf '\n\n################ %s ################\n' "$*"; }
sub() { printf '\n---- %s\n' "$*"; }
cap() { printf '\n$ %s\n' "$*"; sh -c "$*" 2>&1 || echo "  (command failed: $?)"; }
[ "$(id -u)" = 0 ] || { echo "must be root (sudo -i)"; exit 1; }

U=${SUDO_USER:-sd}
UH=$(getent passwd "$U" | cut -d: -f6)
UID_=$(id -u "$U")
APP=dev.vencord.Vesktop

BPID=$(pgrep -u "$U" -x xfsettingsd || pgrep -u "$U" -x xfce4-panel || pgrep -u "$U" -x xfdesktop || true)
BUS=""; DISP=":0"
if [ -n "$BPID" ]; then
	BUS=$(tr '\0' '\n' < "/proc/$BPID/environ" | sed -n 's/^DBUS_SESSION_BUS_ADDRESS=//p' | head -1)
	D=$(tr '\0' '\n' < "/proc/$BPID/environ" | sed -n 's/^DISPLAY=//p' | head -1)
	[ -n "$D" ] && DISP=$D
fi
# THE FIX: HOME/USER/LOGNAME/XAUTHORITY. Without HOME, su leaves it at /root.
asuser() {
	su "$U" -s /bin/sh -c \
	"HOME='$UH' USER='$U' LOGNAME='$U' XAUTHORITY='$UH/.Xauthority' DISPLAY=$DISP XDG_RUNTIME_DIR=/run/user/$UID_ ${BUS:+DBUS_SESSION_BUS_ADDRESS='$BUS'} $*"
}

main() {
echo "omen-omni  $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "user=$U home=$UH uid=$UID_ display=$DISP"
echo "bus=${BUS:-NONE}"
echo "output also saved to $OUT"

# =====================================================================
say "FIX 1 - vesktop with a CORRECT environment"
sub "proving the environment is right this time"
asuser 'echo "HOME=$HOME USER=$USER XDG_RUNTIME_DIR=$XDG_RUNTIME_DIR"'
sub "GL extension vs host driver"
cap "nvidia-smi --query-gpu=driver_version --format=csv,noheader"
cap "flatpak list --all | grep -i 'GL.nvidia' || echo NONE"
sub "renderer INSIDE the sandbox (the llvmpipe test)"
asuser "flatpak run --command=sh $APP -c 'ls /usr/lib/x86_64-linux-gnu/GL/ 2>/dev/null | head' " || true
asuser "flatpak run --command=sh $APP -c 'echo GL_DIRS: ; ls -d /usr/lib/x86_64-linux-gnu/GL/nvidia* 2>/dev/null || echo none'" || true
sub "restarting vesktop cleanly"
pkill -u "$U" -f -i vesktop 2>/dev/null; sleep 2
asuser "nohup flatpak run $APP >/tmp/vesktop-omni.log 2>&1 &" || true
sleep 14
if pgrep -u "$U" -f -i vesktop >/dev/null; then
	echo "VESKTOP: RUNNING"
	pgrep -u "$U" -af -i vesktop | head -4
else
	echo "VESKTOP: NOT RUNNING"
fi
sub "log (MESA-LOADER / dconf errors should be GONE)"
tail -35 /tmp/vesktop-omni.log 2>/dev/null
sub "does it still reference /root anywhere"
grep -c '/root/' /tmp/vesktop-omni.log 2>/dev/null || echo 0
echo ">> GPU flags deliberately NOT re-applied. The GL extension skew was the"
echo ">> real cause; flags on top of a freshly-fixed app is one change too many."
echo ">> If it is still choppy: Vesktop Settings -> Hardware Acceleration."

# =====================================================================
say "FIX 2 - plocate index (came back empty)"
cap "ls -l /var/lib/plocate/ 2>/dev/null || ls -l /var/lib/mlocate/ 2>/dev/null || echo 'no index dir'"
cap "cat /etc/updatedb.conf"
sub "rebuilding"
cap "updatedb -v 2>&1 | tail -5 || updatedb"
cap "ls -l /var/lib/plocate/plocate.db 2>/dev/null || echo 'no plocate.db'"
sub "does it actually return hits now"
cap "plocate -c bashrc 2>/dev/null || locate -c bashrc 2>/dev/null || echo 'count unavailable'"
cap "plocate -l 5 -i bashrc 2>/dev/null || locate -l 5 -i bashrc 2>/dev/null || echo none"
sub "ulauncher extension"
cap "ls -l $UH/.local/share/ulauncher/extensions/finder-search"
cap "pgrep -u $U -af ulauncher | head -4"

# =====================================================================
say "STATE - BOOT"
cap "uptime"
cap "cat /proc/cmdline"
cap "uname -a"
cap "cat /sys/class/dmi/id/bios_version"
cap "efibootmgr -v | head -20"
cap "zfs get -H -o value org.zfsbootmenu:commandline nvme/ROOT/void"
cap "zfs get -H -o value org.zfsbootmenu:kernel nvme/ROOT/void"
cap "ls -1 /boot/vmlinuz-*"
cap "dmesg | grep -i microcode"
cap "dmesg | grep -iE 'nvidia_drm|nvidia-drm|modeset' | head -10"

say "STATE - STORAGE"
cap "lsblk -o NAME,SIZE,TYPE,FSTYPE,LABEL,MODEL,ROTA,SCHED,MOUNTPOINT"
cap "ls -l /dev/disk/by-id/ | grep -vE 'part[0-9]+$'"
cap "zpool list -v"
cap "zpool status -t"
cap "zfs list -o name,used,avail,refer,mountpoint,compression,recordsize,xattr,atime"
cap "zpool get -H autotrim \$(zpool list -H -o name | tr '\n' ' ')"
cap "head -1 /sys/module/zfs/parameters/zfs_arc_max"
cap "awk '/^(size|c_max|hits|misses) /{print \$1, \$3}' /proc/spl/kstat/zfs/arcstats"
cap "df -h / /fast /bulk /mnt/games 2>/dev/null"
cap "cat /etc/cron.weekly/zfs-trim 2>/dev/null || echo missing"

say "STATE - PERFORMANCE"
cap "sysctl vm.swappiness vm.dirty_ratio vm.dirty_background_ratio vm.vfs_cache_pressure vm.min_free_kbytes kernel.sched_autogroup_enabled kernel.nmi_watchdog"
cap "ls -1 /etc/sysctl.d/"
cap "cat /sys/devices/system/cpu/intel_pstate/status"
cap "cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor"
cap "cat /sys/devices/system/cpu/cpu0/cpufreq/energy_performance_preference"
cap "cat /sys/kernel/mm/transparent_hugepage/enabled"
cap "sv status omen-perf"
cap "grep -iE 'nvidia|r8169|enp' /proc/interrupts | awk '{print \$1, \$NF}'"
for i in $(grep -i nvidia /proc/interrupts | sed 's/:.*//' | tr -d ' '); do
	printf 'irq %s -> cpu %s\n' "$i" "$(cat /proc/irq/$i/smp_affinity_list 2>/dev/null)"
done
cap "free -h"
cap "ps -eo pcpu,rss,pid,comm --sort=-pcpu | head -15"

say "STATE - GPU / THERMALS"
cap "nvidia-smi"
cap "sensors"
cap "cat /etc/X11/xorg.conf.d/20-nvidia.conf"

say "STATE - DESKTOP"
sub "icon + gtk theme"
asuser "xfconf-query -c xsettings -p /Net/IconThemeName" || true
asuser "xfconf-query -c xsettings -p /Net/ThemeName" || true
cap "grep -E 'icon-theme|theme-name' $UH/.config/gtk-3.0/settings.ini"
sub "file manager"
asuser "xdg-mime query default inode/directory" || true
for c in finder finder-zfs nemo yad plocate fd; do
	printf '  %-11s %s\n' "$c" "$(command -v "$c" || echo MISSING)"
done
cap "ls -1 /usr/share/nemo/actions/ | grep zfs"
cap "grep '^FileManager=' $UH/.config/xfce4/helpers.rc"
sub "compositor / beauty stack"
cap "pgrep -a compiz; pgrep -a picom; pgrep -a xwinwrap; pgrep -a cairo-dock; pgrep -a xfdesktop"
sub "flatpaks"
cap "flatpak list --app"
cap "grep '^Exec=' $UH/.local/share/applications/$APP.desktop 2>/dev/null"

say "STATE - SERVICES"
cap "ls -1 /var/service/"

say "STATE - AUDIO"
cap "cat /proc/asound/cards"
asuser "pactl get-default-source" || true
asuser "pactl get-default-sink" || true

say "DONE"
echo "Full capture written to: $OUT"
echo "Paste that file back in one go - it is the complete context."
date -u
}

main 2>&1 | tee "$OUT"
