#!/bin/sh
# omen-latency-fix.sh - ROOT. Fixes "everything lags behind the mouse / choppy".
#
# EVIDENCE (postboot receipts 2026-08-27):
#
#  (1) /etc/X11/xorg.conf.d/20-nvidia.conf carries BOTH
#         Option "ForceCompositionPipeline"     "true"
#         Option "ForceFullCompositionPipeline" "true"
#      ForceFullCompositionPipeline routes the ENTIRE screen through the GPU's
#      composition pipeline and adds a guaranteed full extra frame of display
#      latency. compiz is ALREADY compositing on top of that. Two composition
#      stages stacked = the classic NVIDIA "the window lags behind the cursor"
#      symptom, and it gets worse the higher the resolution (you are on a
#      3223Q + S2725QS, both 4K). This is the single biggest contributor to
#      "everything is very choppy and odd".
#
#  (2) EPP = balance_performance, governor = powersave.
#      On a 12700KF with E-cores, balance_performance keeps the P-cores parked
#      at low ratios and lets the scheduler dump interactive work on E-cores.
#      Every burst of UI work eats a frequency-ramp penalty. `performance` EPP
#      under the powersave governor is the correct low-latency desktop config
#      for intel_pstate=active (it does NOT mean "always max clocks").
#
#  (3) The IRQ pins from 2026-08-25 (GPU->CPU4, NIC->CPU18) are GONE.
#      /proc/irq/*/smp_affinity_list is not persistent. GPU and NIC interrupts
#      have drifted back onto an E-core, so every frame and every network
#      packet is serviced by a 3.8 GHz Gracemont core.
#
#  (4) All the perf sysctls were dead (see omen-fs-fix.sh).
#
# This installs a runit service `omen-perf` so (2)+(3) survive every reboot -
# that is the "stuff feels weird after booting" problem, permanently closed.
#
# ROLLBACK:
#   rm -f /var/service/omen-perf ; rm -rf /etc/sv/omen-perf
#   cp /root/omen-latency-fix.<stamp>/20-nvidia.conf /etc/X11/xorg.conf.d/
set -eu
say() { printf '\n=== %s ===\n' "$*"; }
[ "$(id -u)" = 0 ] || { echo "must be root (sudo -i)"; exit 1; }

STAMP=$(date +%Y%m%d-%H%M%S)
BAK=/root/omen-latency-fix.$STAMP
mkdir -p "$BAK"

say "BEFORE"
cat /etc/X11/xorg.conf.d/20-nvidia.conf 2>/dev/null || echo "(no 20-nvidia.conf)"
cat /sys/devices/system/cpu/cpu0/cpufreq/energy_performance_preference
grep -iE 'nvidia|xhci|eth|enp|r8169' /proc/interrupts | awk '{print $1, $NF}'

# ---------------------------------------------------------------- 1. Xorg
say "1/3 drop ForceFullCompositionPipeline (keep tear-free, lose the extra frame)"
cp -a /etc/X11/xorg.conf.d/20-nvidia.conf "$BAK/" 2>/dev/null || true
cat > /etc/X11/xorg.conf.d/20-nvidia.conf <<'XORG'
Section "Device"
    Identifier "Nvidia Card"
    Driver     "nvidia"
    VendorName "NVIDIA Corporation"
    # ForceCompositionPipeline alone removes tearing.
    # ForceFullCompositionPipeline is deliberately NOT set: it adds a full
    # frame of latency on top of compiz's own compositing and is the cause of
    # the "windows lag behind the mouse" symptom on this box.
    Option     "ForceCompositionPipeline" "true"
    Option     "TripleBuffer"             "false"
    Option     "AllowIndirectGLXProtocol" "off"
    Option     "UseNvKmsCompositionPipeline" "false"
    # Coolbits 28 = fan + clock + voltage control, required for the GWE step.
    Option     "Coolbits" "28"
EndSection

Section "Extensions"
    # Compositing managers do their own damage tracking; the X Composite
    # extension staying enabled is required, but DRI2 vblank throttling is not.
    Option "COMPOSITE" "Enable"
EndSection
XORG
cat /etc/X11/xorg.conf.d/20-nvidia.conf

# ---------------------------------------------------------------- 2. runit service
say "2/3 install persistent omen-perf runit service"
mkdir -p /etc/sv/omen-perf
cat > /etc/sv/omen-perf/run <<'RUN'
#!/bin/sh
# omen-perf - re-applies the desktop-latency knobs that the kernel does not
# persist across reboots. Oneshot-style: apply, then sleep forever so runit
# does not respawn-loop.
exec 2>&1

log() { printf '[omen-perf] %s\n' "$*"; }

# --- sysctl (Void does not reliably drain /etc/sysctl.d) -------------------
sysctl --system >/dev/null 2>&1 || \
	sysctl -p /etc/sysctl.d/99-desktop-perf.conf >/dev/null 2>&1
log "sysctl applied (swappiness=$(sysctl -n vm.swappiness))"

# --- EPP: performance on every CPU ----------------------------------------
for f in /sys/devices/system/cpu/cpu*/cpufreq/energy_performance_preference; do
	[ -w "$f" ] && echo performance > "$f" 2>/dev/null
done
log "EPP=$(cat /sys/devices/system/cpu/cpu0/cpufreq/energy_performance_preference 2>/dev/null)"

# --- transparent hugepages -------------------------------------------------
echo madvise > /sys/kernel/mm/transparent_hugepage/enabled 2>/dev/null
echo madvise > /sys/kernel/mm/transparent_hugepage/defrag  2>/dev/null

# --- IRQ affinity: GPU -> P-core 2 (cpu4), NIC -> E-core (cpu18) ----------
# IRQ numbers are reassigned every boot, so look them up by name.
pin() {
	_pat=$1; _cpu=$2
	grep -iE "$_pat" /proc/interrupts | sed 's/:.*//' | tr -d ' ' | while read -r irq; do
		[ -w "/proc/irq/$irq/smp_affinity_list" ] || continue
		echo "$_cpu" > "/proc/irq/$irq/smp_affinity_list" 2>/dev/null && \
			log "irq $irq ($_pat) -> cpu $_cpu"
	done
}
pin 'nvidia'        4
pin 'r8169|enp[0-9]' 18
pin 'xhci_hcd'      5

# --- I/O schedulers (udev rule covers hotplug; this covers early boot) ----
for d in /sys/block/nvme*n*/queue/scheduler; do [ -w "$d" ] && echo none > "$d" 2>/dev/null; done
for d in /sys/block/sd*/queue/scheduler;      do [ -w "$d" ] && echo mq-deadline > "$d" 2>/dev/null; done

# --- ZFS ARC (modprobe.d covers module load; this covers a live re-tune) --
[ -w /sys/module/zfs/parameters/zfs_arc_max ] && echo 12884901888 > /sys/module/zfs/parameters/zfs_arc_max

# --- NVIDIA: keep the GPU from dropping to P8 mid-scroll -------------------
command -v nvidia-smi >/dev/null && nvidia-smi -pm 1 >/dev/null 2>&1

log "all knobs applied; idling"
exec sleep infinity
RUN
chmod 0755 /etc/sv/omen-perf/run
mkdir -p /etc/sv/omen-perf/log
cat > /etc/sv/omen-perf/log/run <<'LOGRUN'
#!/bin/sh
exec vlogger -t omen-perf -p daemon.info
LOGRUN
chmod 0755 /etc/sv/omen-perf/log/run
ln -sfn /etc/sv/omen-perf /var/service/omen-perf
sleep 3
sv status omen-perf || true

# ---------------------------------------------------------------- 3. verify
say "3/3 AFTER"
cat /sys/devices/system/cpu/cpu0/cpufreq/energy_performance_preference
cat /sys/devices/system/cpu/cpu16/cpufreq/energy_performance_preference 2>/dev/null || true
sysctl vm.swappiness kernel.sched_autogroup_enabled
grep -iE 'nvidia|r8169|enp' /proc/interrupts | awk '{print $1, $NF}'
for i in $(grep -iE 'nvidia' /proc/interrupts | sed 's/:.*//' | tr -d ' '); do
	printf 'irq %s affinity: %s\n' "$i" "$(cat /proc/irq/$i/smp_affinity_list)"
done
echo
echo "The Xorg change needs a LOG OUT / LOG BACK IN to take effect."
echo "That same logout also makes Coolbits 28 live, which unblocks the GWE OC step."
say "backups in $BAK"
echo "DONE omen-latency-fix"
date
