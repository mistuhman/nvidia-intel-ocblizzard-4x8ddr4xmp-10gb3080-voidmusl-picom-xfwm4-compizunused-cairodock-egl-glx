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
- [x] Geekbench 6.5.0 install + symlink verified (6.5.0 Build 603552, 06:20 UTC)
- [x] Superposition 1.1 installed to /home/sd/Downloads/Unigine_Superposition-1.1
- [ ] Stock Geekbench CPU: in flight 06:20 UTC — paste URL + SC/MC
- [ ] Stock Geekbench Compute: paste URL + which API (Vulkan vs OpenCL)
- [ ] Stock Superposition 1080p Extreme: NOT in the operator's stock script, still owed
- [ ] File-backed meters in /home/sd/oc-meters/ (turbostat --Summary --out, nvidia-smi dmon) — no cat-then-rm
- [ ] Decide CPU knob persistence (runit service vs re-apply per boot) — proven non-persistent
- [ ] GWE step1 +60/+250, re-bench (needs Coolbits live: log out/in)
- [ ] CPU bench mode; BIOS OC per oc-cpu-bios-checklist.md (operator)

## Keep
bluetooth, privoxy, tor, libvirt, yeetmouse, omen-sqm, beauty stack, xfdesktop, browsers
