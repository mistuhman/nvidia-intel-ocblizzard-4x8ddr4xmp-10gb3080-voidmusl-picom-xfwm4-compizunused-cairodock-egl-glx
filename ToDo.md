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
- [ ] Run oc-p6-install (root) + oc-p5-safety-root (root), paste receipts
- [ ] Log out/in, then oc-p5-safety-user — report PSU label + 6+2 plug count
- [ ] oc-p7-baseline — STOCK official scores (the meter bar)
- [ ] GWE step1 +60/+250, re-bench (oc-p8-gwe-oc)
- [ ] CPU bench mode via oc-p10-cpu-run; BIOS OC per oc-cpu-bios-checklist.md (operator)

## Keep
bluetooth, privoxy, tor, libvirt, yeetmouse, omen-sqm, beauty stack, xfdesktop, browsers
