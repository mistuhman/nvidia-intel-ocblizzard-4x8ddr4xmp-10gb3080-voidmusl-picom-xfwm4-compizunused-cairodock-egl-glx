# ToDo — OC meter / recovery gate (2026-08-26)

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
- [x] FIX 1: Geekbench 6.5.0 -> 6.7.1 from https://cdn.geekbench.com/Geekbench-6.7.1-Linux.tar.gz, verified 6.7.1 Build 603632
- [x] FIX 2: OpenCL ICD — installed nvidia-opencl-595.91.07_1, nvidia.icd now present, clinfo shows NVIDIA CUDA RTX 3080
- [x] FIX 3: Vulkan ICD — Vulkan-Tools installed, vulkaninfo now shows GPU0 RTX 3080 api 1.4.329 driver 595.91.07
- [x] Driver skew fixed: nvidia 595.84 -> 595.91.07 to match opencl, DKMS rebuilt, reboot OK, nvidia-smi 595.91.07
- [x] Stock retry 6.7.1 CPU: https://browser.geekbench.com/v6/cpu/19061796 SC 2715 MC 14569, 811 samples turbostat PkgW peak 145.02W Bzy 4476 Tmp 70
- [x] Stock peaks: cpu 811 samples 145W/4476/70, gpu-cpu 1399 samples 201W 47C 9501/1935, gpu-compute 56 samples 201W 47C 9501/1920
- [x] Stock Geekbench Compute: https://browser.geekbench.com/v6/compute/6845489 OpenCL 194800 RTX 3080
- [x] Stock Superposition 1080p Extreme: Score 8717 FPS Min 19.76 Avg 65.20 Max 81.37 GPU Temp 39-81 Util 100% (screenshot + .score file /home/sd/Documents/Superposition_Benchmark_v1.1_8717_*.score)
- [ ] Decide CPU knob persistence (runit service vs re-apply per boot) — proven non-persistent
- [ ] GWE step1 +60/+250, re-bench (needs Coolbits live: log out/in)
- [ ] CPU bench mode; BIOS OC per oc-cpu-bios-checklist.md (operator)

## Live recovery focus (operator directive 2026-08-26)
- [x] Free runbook: docs/omen-free-recovery-runbook.md — no external escalation
- [x] Check 1 front-panel / `PB`: FAIL (cycle with PB unplugged; auto-cycle on cord-in)
- [x] CMOS jumper: FAIL, cap restored. FDO/PSWD/BBR not moved.
- [x] Pump/0-RPM closed (fans run in the cycle). No more unsolicited cables.
- [x] Validated clean 7.34 GB HP recovery stick: plain-power attempt FAIL, same immediate loop, no USB activity.
- [x] 80-agent recovery research tool: exact 80-agent/80-URL manifest, hashes and trap filtering.
- [x] Photograph FDO/PSWD/BBR; cap was left pair; one slide toward label FAIL (no LED, same pattern); cap restored left.
- [x] No special tools (no DMM, no 3.3V SPI).
- [x] One jumper-slide attempt FAIL. Jumper class CLOSED. Do not horseshoe to another cap.
- [x] MASTER crisisDiscipline + tools/stall-check.ts (halt + new chat; search remaining classes).
- [ ] New chat only: search openSearchClasses (SoftPaq inspect off-OMEN, 8917 literature that is not a 3-pin cap). No power-on from a spinning chat.
- [ ] Boot Void (Escape = ZBM) only after a real recovery pass; then run post-recovery probes before OC.

## Keep
bluetooth, privoxy, tor, libvirt, yeetmouse, omen-sqm, beauty stack, xfdesktop, browsers
