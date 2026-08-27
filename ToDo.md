# ToDo — OC meter / recovery gate (2026-08-27: **THE OMEN POSTS AGAIN**)

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
- [x] **PB header reconnected -> beeps returned (HP 3.3 = graphics init timeout, expected with GPU power off) -> GPU power restored -> HP POST SCREEN with CPU Fan (90B). THE MACHINE POSTS.**
- [x] **VOID BOOTS AGAIN — multiple clean boots, POST -> ZBM -> nvme/ROOT/void -> login**
- [x] **BIOS REACHED (F10 OMEN Setup Utility)**. Thermal: CPU 734, Rear 707, Front#2 602, Front#3 597, **Front#1 N/A**, **Pump 1565** -> cooling is real; Front Fan #1 is the only dead sensor and the cause of 90B
- [x] **90B CLEARED**: spare F FAN -> FFAN1, Front#1 now 598, pump 1573, cold boot cleared the prompt. **Boots clean to Void, no Enter press**
- [x] Reassembled: PSU back in place, 4 SATA drives added (2 HDD + 2 SSD), LED hub M82868-001 left unplugged by choice (no RGB, and it keeps the prime suspect out of circuit)
  - [ ] First boot: Escape -> ZBM -> nvme/ROOT/void explicitly, then run `etc/omen-postrecovery-probe.block` (root, read-only) and paste full output
  - [ ] If a SATA drive is missing from lsblk: BIOS SATA Emulation = RAID is the likely cause; AHCI switch is a separate gated change
  - [ ] ~~Reinstall the PSU into the chassis~~, re-verify SPWR + both CPU 4-pins + PB + both 6+2 before cord-in
  - [ ] ~~Plug spare F FAN into FFAN1~~ (bottom edge) — or disable System Fan Check if no fan is mounted there
  - [ ] Verify in Advanced: memory XMP 3733 or stock, no remnant of the 4000 profile
  - [ ] Receipt: After Power Loss = Off (so it did NOT cause the cord-in auto-cycle); SATA Emulation = **RAID** — settle AHCI vs RAID before adding the HDDs/SSD
  - [ ] Reassembly by phase: docs/omen-reassembly-checklist.md (cooling -> test -> front panel -> LED hub alone -> test -> BIOS defaults + XMP 3733)
  - [ ] Storage deferred: 2 new HDDs + spare 240GB SSD, one drive per power-on, only after several clean boots (SATA adds rename sd* on ZFS root)
  - [ ] Residual: POST `CPU Fan (90B)` needs Enter each boot -> run `etc/omen-90b-fan-probe.block` (root, read-only) and paste full output; then move the pump/CPU-fan lead to the header the EC watches
  - [ ] Reconnect AIO pump + CPU fan headers (90B is real - no cooling right now), then F10 = BIOS, load defaults, memory XMP 3733 (never 4000), then Escape = ZBM -> Void
  - [ ] Cause UNATTRIBUTED (multi-variable fix). Re-add one branch per power-on: (1) 3080 + both 6+2, (2) lighting board M82868-001, (3) SATA/Molex drives, (4) fan hub/pump/front panel — the one that brings the cycle back is the fault
  - [ ] LAST FREE STEP — L2 on the OMEN: 24-pin + both CPU 4-pins, nothing else on the PSU, one press
  - [ ] Read the bench board's 2-digit POST code (new instrument), then run L2 on the OMEN: 24-pin + both CPU 4-pins, nothing else on the PSU, one press
  - [ ] OPERATOR GATE, one step per report, no power-on until named: L0 photos (PSU label + cable fan-out, zero power) -> L1 PSU alone, paperclip pin16 green/pin17 black + fan load -> L2 board only, 24-pin + both 4-pin EPS, every accessory off the PSU -> L3 both EPS unplugged (decisive on firmware-vs-electrical)
  - [ ] Operator free receipt (no OMEN touch): on Windows host run `dir /s /b` on the created recovery stick (root already shows EFI/Hewlett-Packard/HP) and on C:\SWSetup\sp167160; report whether Hewlett-Packard\BIOSUpdate\HpBiosUpdate.efi + .s09/.s12/.s14/.sig exist. Inspect only — stick stays unmodified.
  - [ ] Boot Void (Escape = ZBM) only after a real recovery pass; then run post-recovery probes before OC.

## Boot order + drive validity (2026-08-27 — cables snug, rear panel sealed)

> Problem: main monitor does not light up immediately on boot the way the tertiary monitor does.
> Adding four SATA drives in one pass can cause firmware to inject new SATA boot entries ahead of
> the NVMe ZBM entry; firmware then probes each SATA device (hundreds of ms per drive in RAID mode)
> before handing off to ZBM, and the 3080 gets no display signal until after that SATA scan.
> The tertiary monitor sees POST video earlier because it gets the firmware framebuffer during init.

### Phase 1 — diagnose (READ-ONLY, paste output back)
- [ ] Run `etc/boot-order-drive-probe.block` as root; paste full output
  - Confirms: `efibootmgr -v` BootOrder and every Boot#### entry (expected Boot0002/Boot0008 = ZBM NVMe)
  - Confirms: `lsblk` shows all four SATA drives with correct fs/partition types and stable by-id names
  - Confirms: ZBM pool `nvme` ONLINE, `tank` ONLINE, both healthy
  - Confirms: `dmesg` SATA scan timing and any AHCI/RST errors

### Phase 2 — fix boot order (OPERATOR-GATED after Phase 1 receipt)
- [ ] Run `etc/boot-order-nvme-first.block` as root ONLY after Phase 1 output is pasted back
  - Reads current BootOrder, identifies any firmware-injected SATA boot entries
  - Operator confirms which Boot#### numbers are SATA (not Boot0002/Boot0008)
  - Sets `BootOrder=0002,0008` so NVMe ZBM is always first with no SATA scan detour
  - Rollback: F10 BIOS -> Boot tab, or F9 at HP splash to manually pick NVMe
  - **Expected result after reboot**: main monitor lights up at the same time as tertiary — ZBM is
    the first thing firmware hands off to, no SATA probe delay, 3080 mode-sets immediately

### Phase 3 — AHCI vs RAID decision (separate gated change, after Phase 2)
- [ ] BIOS is currently SATA Emulation = RAID (confirmed 2026-08-27 thermal page receipt)
  - Root is NVMe only; Void boots fine today regardless of SATA mode
  - RAID mode can hide SATA drives from Linux (they show as one Intel RST volume or not at all)
  - AHCI mode makes each SATA drive independently visible as sda/sdb/sdc/sdd
  - **Decision gate**: if Phase 1 `lsblk` shows all four SATA drives, RAID mode is passing them through
    as individual disks (common on Z690 with RST set to RAID but no array configured); if any drive
    is missing, switch BIOS to AHCI before ZFS pool creation
  - Switching AHCI on a running system with NVMe root is safe (NVMe is unaffected); do NOT add
    any `intel_iommu` or `ahci` kernel params — just the BIOS F10 change

## SATA drives → ZFS zpools (future, operator-gated, one drive per power-on after Phase 3)

> Staged drives: 2× new HDD + 1× spare 240GB SSD (all SATA). Existing sda = 1.8T Sabrent USB3 HDD
> (already in pool `tank` with tank/games at /mnt/games, 460G post-lz4). Plan: convert the bare
> SATA drives to additional ZFS pools or vdevs. Do NOT touch sda/tank or the NVMe pool during this.

### Pool design options (decide before running any zpool create)
- [ ] **Option A — single new pool per drive** (simplest): `zpool create data1 /dev/disk/by-id/...`
  one pool per HDD, one pool for the SSD. Independent pools, no redundancy, max usable space.
- [ ] **Option B — mirror vdev** (if both HDDs are identical size): `zpool create data mirror disk1 disk2`
  One pool, redundant, net capacity = one drive. Best for durability of data not backed elsewhere.
- [ ] **Option C — striped pool** (both HDDs in one pool, no mirror): full combined capacity, no redundancy.
  Only safe for data with another backup copy (e.g. sda/tank already holds the nvme-games.tar archive).
- [ ] **Option D — add SSD as L2ARC or SLOG to existing tank** (performance): `zpool add tank cache /dev/...`
  Extends tank with a read cache (L2ARC) or write-intent log (SLOG). Does not create a new pool.
  SLOG requires a small dedicated partition (1-4G); the rest can be L2ARC.

### Prerequisites before any `zpool create`
- [ ] AHCI decision settled (Phase 3 above) — drives must appear in lsblk by-id before pool creation
- [ ] Each drive wiped cleanly: `zpool labelclear -f /dev/disk/by-id/...` if it held a prior pool label;
  `wipefs -a /dev/disk/by-id/...` to clear any NTFS/ext4/other signatures. OPERATOR-GATED: confirm
  drive is blank or archival content is already preserved elsewhere before wipefs.
- [ ] Always use `/dev/disk/by-id/` paths in `zpool create` — never `/dev/sda` (renames on rescan)
- [ ] One drive per power-on rule still applies: add one drive, boot, verify lsblk, then add the next
- [ ] Run `zpool status` and `zfs list` after each create; paste output before proceeding
- [ ] `zpool set autotrim=on <poolname>` for the SSD pool to keep the SSD healthy
- [ ] Dataset layout example: `zfs create data1/archive`, `zfs set compression=lz4 data1/archive`
- [ ] After all pools created and healthy: `zpool scrub <poolname>` baseline pass, paste output
- [ ] Block file for each pool creation will be authored here once drive sizes/models are confirmed
  from the Phase 1 `etc/boot-order-drive-probe.block` receipt

## Keep
bluetooth, privoxy, tor, libvirt, yeetmouse, omen-sqm, beauty stack, xfdesktop, browsers
