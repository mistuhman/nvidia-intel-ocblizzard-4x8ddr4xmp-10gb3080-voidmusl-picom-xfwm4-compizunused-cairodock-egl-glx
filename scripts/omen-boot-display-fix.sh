#!/bin/sh
# omen-boot-display-fix.sh - ROOT. Fixes the boot-time display problems.
#
# EVIDENCE (postboot receipts 2026-08-27):
#
#  (1) NO nvidia_drm.modeset=1 ON THE CMDLINE.
#      /proc/cmdline: intel_pstate=passive split_lock_detect=off
#                     root=zfs:nvme/ROOT/void ro quiet loglevel=7
#                     split_lock_detect=off intel_pstate=active
#                     spl.spl_hostid=0x67fe1a52
#      Without DRM KMS the NVIDIA driver does no kernel modeset. The main
#      panel therefore gets NO signal at all from POST until Xorg starts and
#      does a userspace modeset - which is exactly the reported symptom
#      ("main monitor does not light up immediately, tertiary does").
#      It also means every VT/X handoff is a full re-train of the link.
#
#  (2) CONTRADICTORY DUPLICATED PARAMETERS.
#      intel_pstate=passive AND intel_pstate=active on the same line.
#      split_lock_detect=off twice. loglevel=7 with quiet.
#      Last-wins so active applies, but this is a garbage cmdline and
#      loglevel=7 with quiet spams the console during handoff.
#
#  (3) EFI BOOT ENTRIES ARE GONE.
#      BootOrder: 0001
#      Boot0001* UEFI OS  HD(1,GPT,...)/\EFI\BOOT\BOOTX64.EFI
#      The ZFSBootMenu entries (Boot0002 / Boot0008) no longer exist - the
#      CMOS clear during the no-POST recovery wiped NVRAM. The machine is now
#      booting via the REMOVABLE-MEDIA FALLBACK path. To use that path the
#      firmware must enumerate and probe EVERY block device (4 SATA disks +
#      USB) looking for \EFI\BOOT\BOOTX64.EFI before it finds the NVMe ESP.
#      That enumeration is the boot delay AND the reason the display comes up
#      late: the GPU gets no handoff until the scan completes.
#
#  (4) "x86/CPU: Running old microcode" and
#      "Register File Data Sampling: Vulnerable: No microcode".
#      Alder Lake with stock 2021-era microcode. This is a real stutter and
#      stability source (P/E core scheduling + TSC errata), not just a CVE note.
#
# ROLLBACK:
#   zfs set org.zfsbootmenu:commandline="<value printed as BEFORE below>" nvme/ROOT/void
#   rm -f /etc/modprobe.d/99-nvidia-drm.conf
#   efibootmgr -o 0001
set -eu
say() { printf '\n=== %s ===\n' "$*"; }
[ "$(id -u)" = 0 ] || { echo "must be root (sudo -i)"; exit 1; }

STAMP=$(date +%Y%m%d-%H%M%S)
BAK=/root/omen-boot-fix.$STAMP
mkdir -p "$BAK"

say "BEFORE"
cat /proc/cmdline
efibootmgr -v > "$BAK/efibootmgr.before.txt" 2>&1 || true
cat "$BAK/efibootmgr.before.txt"
zfs get -H -o value org.zfsbootmenu:commandline nvme/ROOT/void 2>/dev/null | tee "$BAK/zbm-cmdline.before.txt"
ls -l /boot/efi/EFI 2>/dev/null || true
find /boot/efi -maxdepth 3 -iname '*.EFI' -o -maxdepth 3 -iname '*.efi' 2>/dev/null | tee "$BAK/esp-efi-files.txt"

# ---------------------------------------------------------------- 1. clean cmdline
# ZFSBootMenu takes the kernel cmdline from the boot dataset property, NOT
# from a grub file. That property is where the duplicated intel_pstate lives.
say "1/5 rewrite ZFSBootMenu kernel commandline"
NEWCMD="ro quiet loglevel=4 split_lock_detect=off intel_pstate=active nvidia_drm.modeset=1 nvidia_drm.fbdev=1 nvidia.NVreg_UsePageAttributeTable=1 nvidia.NVreg_InitializeSystemMemoryAllocations=0 nvidia.NVreg_EnableGpuFirmware=0 spl.spl_hostid=0x67fe1a52 mitigations=auto tsc=reliable"
zfs set org.zfsbootmenu:commandline="$NEWCMD" nvme/ROOT/void
zfs get -H -o value org.zfsbootmenu:commandline nvme/ROOT/void
# Belt and braces: if the ZBM property is ever ignored, the modprobe option
# still forces DRM KMS on.
cat > /etc/modprobe.d/99-nvidia-drm.conf <<'MOD'
# Kernel modesetting for the NVIDIA driver. Without this the main panel gets
# no signal until Xorg starts (receipts 2026-08-27: no nvidia_drm.modeset on cmdline).
options nvidia_drm modeset=1 fbdev=1
options nvidia NVreg_UsePageAttributeTable=1
options nvidia NVreg_InitializeSystemMemoryAllocations=0
MOD
cat /etc/modprobe.d/99-nvidia-drm.conf

# ---------------------------------------------------------------- 2. microcode
say "2/5 intel-ucode (kernel reported: Running old microcode)"
xbps-install -Sy intel-ucode 2>&1 | tail -8 || true
if [ -d /boot/efi ] && command -v xbps-reconfigure >/dev/null; then
	xbps-reconfigure -f intel-ucode 2>&1 | tail -5 || true
fi

# ---------------------------------------------------------------- 3. initramfs
say "3/5 regenerate initramfs (picks up microcode + nvidia modeset options)"
if command -v dracut >/dev/null; then
	dracut --force --regenerate-all 2>&1 | tail -10 || true
fi

# ---------------------------------------------------------------- 4. rebuild ZBM image
say "4/5 rebuild ZFSBootMenu EFI image if generate-zbm is present"
if command -v generate-zbm >/dev/null; then
	generate-zbm 2>&1 | tail -20 || true
else
	echo "generate-zbm not installed; using the existing ZBM image on the ESP unchanged"
fi

# ---------------------------------------------------------------- 5. EFI boot entry
say "5/5 recreate a DIRECT NVMe boot entry (stop the removable-media fallback scan)"
ESPDISK=/dev/nvme0n1
ESPPART=1
# Find a real ZBM/loader image on the ESP, preferring a dedicated zbm path.
TARGET=""
for c in /boot/efi/EFI/zbm/vmlinuz.EFI /boot/efi/EFI/zbm/vmlinuz-backup.EFI \
         /boot/efi/EFI/ZBM/VMLINUZ.EFI /boot/efi/EFI/void/vmlinuz.EFI \
         /boot/efi/EFI/BOOT/BOOTX64.EFI; do
	if [ -f "$c" ]; then TARGET=$c; break; fi
done
if [ -z "$TARGET" ]; then
	echo "!! no EFI image found under /boot/efi - NOT touching NVRAM"
else
	LOADER=$(printf '%s' "${TARGET#/boot/efi}" | tr '/' '\\')
	echo "using loader: $LOADER  (from $TARGET)"
	# Remove any stale duplicates of our own label only. Firmware/SATA entries
	# are left alone - they are reported below for you to eyeball.
	for n in $(efibootmgr | sed -n 's/^Boot\([0-9A-Fa-f]\{4\}\)\*\? ZFSBootMenu (NVMe).*/\1/p'); do
		efibootmgr -b "$n" -B >/dev/null 2>&1 || true
	done
	efibootmgr -c -d "$ESPDISK" -p "$ESPPART" -L "ZFSBootMenu (NVMe)" -l "$LOADER" >/dev/null
	NEW=$(efibootmgr | sed -n 's/^Boot\([0-9A-Fa-f]\{4\}\)\*\? ZFSBootMenu (NVMe).*/\1/p' | head -1)
	OLD=$(efibootmgr | sed -n 's/^BootOrder: //p')
	echo "new entry: $NEW   previous order: $OLD"
	# NVMe ZBM first, keep the old fallback behind it as a safety net.
	efibootmgr -o "$NEW,$(printf '%s' "$OLD" | tr -d ' ')" >/dev/null
	# Give the firmware a 1s menu window instead of 0 (0 = no F9 chance if this misfires).
	efibootmgr -t 1 >/dev/null 2>&1 || true
fi

say "AFTER"
efibootmgr -v
echo
echo "NOTE: /proc/cmdline will still show the OLD line until you reboot."
echo "After reboot verify:  cat /proc/cmdline   -> must contain nvidia_drm.modeset=1"
echo "                      and must contain intel_pstate=active ONLY ONCE"
echo "                      dmesg | grep -i microcode   -> no 'old microcode'"
echo "IF IT DOES NOT BOOT: at the HP splash press F9 and pick the NVMe device,"
echo "or F10 -> Boot -> put the NVMe/UEFI OS entry first. The old fallback"
echo "entry (Boot0001) is still present and still works."
say "backups in $BAK"
echo "DONE omen-boot-display-fix"
date
