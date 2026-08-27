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
- [x] New chat (2026-08-27, session 01a04157): openSearchClasses worked in docs/open-classes-pass2.md — HpBiosUpdate.efi proven a shipped HP artifact hidden in AMI UCP (@UAF) inside SoftPaqs; it is a normal EFI app needing POST+USB+F9 and Secure Boot off, so it CANNOT run on the no-POST board; BlizzardOC public vendor docs hold no recovery path beyond closed classes; 45L PSU/EC family reports recorded (standard-ATX vs non-standard-EPS conflict; auto-on mechanism unattributed).
- [x] New chat (2026-08-27, session 01a0416e): PASS 3 scrape — docs/open-classes-pass3.md. PSU/EPS pinout conflict CLOSED (standard ATX 24-pin + two 4-pin EPS: HP employee accepted solution 9323368/9330242 + owner running a retail MSI MPG A1000G + Cooler Master OEM M19770-003/-013 spec). HP's published desktop BIOS-recovery ladder fully consumed by closed classes; Sure Start is EliteBook/ZBook only. NEW CLASS FOUND: PSU-side load isolation (this chassis has an undocumented PSU-fed lighting board — PCMag 45L review, HP 9614053).
- [x] L0 NAMED by operator 2026-08-27 — zero-power checklist authored (docs/open-classes-pass3.md "L0 — executing"): PartSurfer parts list by serial, photos 1-8 incl. the 24-pin green-wire L1 safety gate, visual damage sweep. Awaiting receipts.
- [x] L0-A PASS: PartSurfer 2MO22432DX = OMEN 45L GT22-0139 / 575Q1AA (ARTICUNO). PSU FRU **M83827-001 POWER SUPPLY UNIT 800W ATX Gold** (HP itself says ATX), board M81915-601 BlizzardOC, **PCA LIGHTING CONTROL M82868-001 fitted**, cooler M82880-002 plain LCS 240 (no Cryo/TEC), RAM M85222-001 DDR4 3733 1.35V
- [x] L0-C PASS: operator visual sweep = "no damage" (no burnt housings, bulged caps, scorch, smell, or debris)
- [ ] L0-B OUTSTANDING (blocks L1): ONE photo — 24-pin at the board end, wire colours legible, latch visible. Green wire = PS_ON# pin 16; all-black harness = derive pin index from the photo, never from memory
- [x] L3 = C: both CPU 4-pins out -> OMEN does NOTHING (no cord-in cycle, no button cycle). Ambiguous alone
- [x] A1 = OMEN PSU M83827-001 powers the BENCH board and HOLDS: "fan spins and stays spinning, no post" -> PSU starts on request and does not latch; weight moves to OMEN board/CPU
- [x] A0 PASS: bench POSTs on its own Thermaltake (boot menu, Kingston SSD, code 02) -> known-good reference + POST-code instrument
- [x] A1 VOID as run (GPU absent in that pass, present in A0 — two variables changed)
- [x] A1b PASS: same A0 config, only the PSU swapped to the OMEN M83827-001 -> POST code **AA** (end of POST). PSU EXONERATED; fault is OMEN board M81915-601 or CPU M87648-003; firmware was never the cause
- [x] ~~L2 RUN: DOES NOT CYCLE~~ **RETRACTED**: follow-up = "absolutely zero activity, no cpu power to my knowledge" -> same shape as L3=C, not an accessory pass. Verify PB header reconnected (unplugged since 2026-08-26!) and both CPU 4-pins seated before any further reading
- [ ] ~~L2 RUN~~ with 24-pin + both CPU 4-pins and nothing else on the PSU -> an accessory branch is implicated (confirm: stays powered vs nothing at all)
- [ ] Re-add one branch per power-on: (1) 3080 + both 6+2, (2) lighting board M82868-001, (3) SATA/Molex drives, (4) fan hub/pump/front panel — the one that brings the cycle back is the fault
- [ ] LAST FREE STEP — L2 on the OMEN: 24-pin + both CPU 4-pins, nothing else on the PSU, one press
- [ ] Read the bench board's 2-digit POST code (new instrument), then run L2 on the OMEN: 24-pin + both CPU 4-pins, nothing else on the PSU, one press
- [ ] OPERATOR GATE, one step per report, no power-on until named: L0 photos (PSU label + cable fan-out, zero power) -> L1 PSU alone, paperclip pin16 green/pin17 black + fan load -> L2 board only, 24-pin + both 4-pin EPS, every accessory off the PSU -> L3 both EPS unplugged (decisive on firmware-vs-electrical)
- [ ] Operator free receipt (no OMEN touch): on Windows host run `dir /s /b` on the created recovery stick (root already shows EFI/Hewlett-Packard/HP) and on C:\SWSetup\sp167160; report whether Hewlett-Packard\BIOSUpdate\HpBiosUpdate.efi + .s09/.s12/.s14/.sig exist. Inspect only — stick stays unmodified.
- [ ] Boot Void (Escape = ZBM) only after a real recovery pass; then run post-recovery probes before OC.

## Keep
bluetooth, privoxy, tor, libvirt, yeetmouse, omen-sqm, beauty stack, xfdesktop, browsers
