# ToDo — OC meter phase (2026-08-25)

> official compare: Geekbench 6 + Unigine Superposition; meter every step; GWE for 3080; BIOS for 12700KF; ParkControl notes = Linux-only equivalent

## Done
- [x] Probe + head
- [x] p2-user autostart diet
- [x] p2-root ARC/sysctl/IRQ numbers
- [x] p3-nowall + p3-xorg (quoted Coolbits, ARC 4G)
- [x] p4-measure: 12G used / 18G avail (was 15/16). IRQ 4+18. GPU 25%
- [x] p4-sv: dangling persistenced/zfs-zed/rc.local gone. omen-sqm = CAKE 780Mbit SQM, KEEP
- [x] OC blocks + docs authored (oc-p6/p5-root/p5-user/p7/p8/p10, docs/oc-*.md)

## Next PR / operator gate
- [x] Geekbench 6.5.0 install + symlink verified (6.5.0 Build 603552, 06:20 UTC) — FAILED upload code 35 (LibreSSL bug, fixed in 6.7.1)
- [x] Superposition 1.1 installed to /home/sd/Downloads/Unigine_Superposition-1.1 — launcher name still unknown, need ls -l
- [x] Stock attempt 06:20 UTC FAILED analysis: CPU 261s no scores code 35; GPU OpenCL missing (only rusticl.icd, no nvidia.icd, driver null)
- [ ] FIX 1: Geekbench 6.5.0 -> 6.7.1 from https://cdn.geekbench.com/Geekbench-6.7.1-Linux.tar.gz, verify version
- [ ] FIX 2: OpenCL ICD — xbps-query nvidia, ls libnvidia-opencl*, install missing nvidia-opencl so clinfo shows NVIDIA CUDA and nvidia.icd exists
- [ ] FIX 3: Vulkan ICD — ls /usr/share/vulkan/icd.d/, vulkaninfo, fix driver null
- [ ] Stock retry with file-backed meters: turbostat --Summary --out BEFORE bench, nvidia-smi dmon -f (no >), fixed awk $11/$12 for mclk/pclk
- [ ] Stock Geekbench CPU retry 6.7.1: paste URL + SC/MC
- [ ] Stock Geekbench Compute retry: paste URL + API (Vulkan vs OpenCL) + GPU score
- [ ] Stock Superposition 1080p Extreme: still owed
- [ ] Decide CPU knob persistence (runit service vs re-apply per boot) — proven non-persistent
- [ ] GWE step1 +60/+250, re-bench (needs Coolbits live: log out/in)
- [ ] CPU bench mode; BIOS OC per oc-cpu-bios-checklist.md (operator)

## Keep
bluetooth, privoxy, tor, libvirt, yeetmouse, omen-sqm, beauty stack, xfdesktop, browsers
