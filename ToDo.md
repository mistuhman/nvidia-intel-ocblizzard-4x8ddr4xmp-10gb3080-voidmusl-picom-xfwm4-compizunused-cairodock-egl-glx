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

## Mac Pro buildup (operator-ordered 2026-09-12, one step at a time)

Operator verbatim: "priority is wiping ssd, clearing out all keychains/logins/data, taking out current and putting in/wiping/formatting new drives for raid. setting up airport utils. building apex omen pc." + "lets take it one step at a time, only progressing through that list once each buildup task is done".

- [x] **Boot Lion 10.7 on Mac Pro 3,1 with dual-monitor desktop output** (ACHIEVED 2026-09-15: 3870 Mac Edition in SLOT2 + dual monitors, 9800 GT removed to bypass Phase 2 installer kernel panic, Lion 10.7 desktop loaded on both displays with Andromeda Galaxy wallpaper, speakers connected).
- [x] **GPU: GTX 285 primary swap** (DONE 2026-09-15: operator "done. gtx in, rebooted. both displays showing output." Loud single-slot blowers (AMD, 9800 GT) pulled from the display path. Slot rule on the 3,1: SLOT1+SLOT2 are hardwired x16 Gen2, SLOT3+SLOT4 x4; primary GPU stays in SLOT1. Aux power rule: the board has TWO mini-6-pin booster leads and the 285 Mac Edition takes BOTH; a second powered card (e.g. the 9800 GT, 1x 6-pin) has no lead left without an external-tap, so any co-resident card must be slot-powered only.)
- [ ] 1. **AirPort Base Station / Time Capsule Factory Reset**: Perform pinhole hard factory reset on the Time Capsules and AirPort Express so AirPort Utility can configure them cleanly without password prompts. (6.3.1 installed on Lion per operator 2026-09-15; resets still open.)
- [x] 2. **Clear Keychains / User Data / Account** (DONE 2026-09-15, operator verbatim: "new admin account with no other accounts" - ddds deletion completed, fresh single admin stands up; the account-delete UI took the old keychains with it, residual config sweep ships in `?(lion-harden)`).
- [~] 3. **Drive Swap + RAID** (RAID SET 2026-09-15 - operator did erase+RAID by hand in Disk Utility GUI, so ?(lion-erase-inventory-probe)/?(lion-erase-spares-wd1tb) were bypassed by operator action and stay un-armed history; member layout receipt rides in on the wipe-block output below. REMAINING: SSD wipe (the superseded Bay 3 start-disk clone media) + config harden = SHIPPED 2026-09-15 as burn wave `lion-wipe-harden.txt`: ?(lion-ssd-wipe) eafa8be7 (discovery-gated - maps first, erases only on the CONFIRM=diskN re-run it prints; boot+RAID members can never be selected) -> ?(lion-harden) aa9fccd0 (config-only, Arctic Fox keep-checked before/after).
  - 2026-09-17d (session 01a0ae24) **OPERATOR APPROVED: temporary HDD→SSD swap + SELECTIVE COPY.**
    Verbatim: "i can temporarily replace the hdd's with the two ssd's. then we clean the boot drive,
    copy only the essential boot items and what i specifically asked for last chat, keep the other
    ssd installed. select which software to keep from there".
    - **REFRAME THAT DISSOLVES THE CAPACITY BLOCKER:** this is a **selective COPY, not a delete**.
      Nothing on the MX500 is destroyed by building the new boot disk — items simply aren't carried
      over, and the MX500 stays bootable as rollback until explicitly wiped. So revo's 775 GiB does
      **not** need deleting first; it just isn't copied.
    - **MANIFEST** (`node tools/lion-migrate-manifest.ts keep|drop|ask|plan|size`): all **150 apps**
      from the R1 burn classified — coverage-gated in selftest so nothing can be silently missed —
      plus CandyBar, which lives in `~/Downloads`, **not** `/Applications` (a naive `/Applications`
      copy would have missed an operator-named keep).
    - **KEEP 62 apps / 2.73 GB**: complete Final Cut Studio (FCP, Motion, Compressor, DVD Studio Pro,
      Cinema Tools, LiveType, Qmaster, Qadministrator); audio (GarageBand, Audio MIDI Setup, Podcast
      Capture/Publisher); operator-named (CandyBar, Flavours, ArcticFox, AirPort Utility); iTunes as
      the mp3→CD burn path; Aperture, FxFactory, LooksBuilder, ScreenFlow, Blackmagic ×3, HandBrake,
      VLC, QuickTime 7.
    - **DROP 82 apps / 6.56 GB**: Winamp (per the sweep), games (Chess, Braid, Machinarium, Kid Pix
      2.0 G, Mavis 717 M), dead browsers (Chrome ×2, Firefox, Opera, Flock), consumer iPhoto/iMovie/
      iDVD superseded by the kept pro equivalents, dead services, recipes/GPS/kids software.
    - **ASK 7** — operator decides: Mail, iCal, Address Book, Transmit, hueyPRO, Contour Shuttle,
      Mac Pro EFI Firmware Update.
    - **CRITICAL CATCH:** Carbon Copy Cloner — the tool that *performs* the migration — was classed
      `CANDIDATE=delete` by the old ABSOLUTION sweep. It is **KEEP** here.
    - **Projected new boot ≈ 16.2 GB** (2.89 apps + 1.3 el home + ~12 OS *estimate*) vs ~425 GB
      usable → fits with ~409 GB spare; would fit a **single** 240 too.
    - **BIG RISK OF THE SWAP:** Raid X is a 3-member **no-redundancy** stripe. Pulling members takes
      the 3 TB volume offline; it returns only when **all three** go back (Apple RAID reassembles by
      member UUID, so bay order doesn't matter). **Never click Erase/Create on a WD** during this.
  - 2026-09-17e (session 01a0ae24) **KINGSTON SKU RESOLVED FROM LABEL PHOTO — and it exposes a
    bay-arithmetic conflict in the stated end state.** (`node tools/lion-boot-migrate.ts endstate`)
    - Both drives read directly off the labels: **Kingston SSDNow V300 `SV300S37A/240G`**, Kingston
      P/N `9904447-745.F03G`, firmware `608ABBF0`, lot `1607` (2016 wk 07), Taiwan, DC +5.0 V 1 A,
      WWN `50026B7762054B94` / `50026B7762054FB2`, LSI SandForce SF-2281.
      **MATCHED PAIR** — same PN, same firmware, same lot, near-consecutive serials. A stripe runs at
      its slowest member's pace, so a mismatch would have mattered. There is none. Best case.
    - The notorious V300 sync→async NAND switch is **moot here**: the 3,1 bays are SATA II, capped
      ~300 MB/s raw / ~250-270 MB/s real — at or below the async drive's own ceiling.
    - **No TRIM**, and it costs nothing: Apple software RAID never passes TRIM to members, and Lion
      10.7 has no third-party TRIM anyway (`trimforce` arrived in 10.10.4). At ~16 GB on 447 GB the
      drives sit ~96 % empty — enormous effective over-provisioning for SandForce GC.
    - ⚠️ **Age ~9 years, power-on hours unknown. Check SMART on both before trusting either.**
    - ⚠️ **BAY CONFLICT — the stated end state cannot exist.** "keep the other ssd installed" + both
      Kingstons + all three WDs back = **6 drives in 4 bays**. Four end states, one decision:
      - **E1** 2 Kingston + MX500 + 3 WD — **IMPOSSIBLE** (6 bays needed).
      - **E2** 2 Kingston stripe + 2 WD — fits; **Raid X dead**, MX500 to the shelf.
      - **E3** 1 Kingston boot + 3 WD — fits; **only end state that keeps Raid X alive**. Boot ~16 GB
        in ~209 GB usable; Kingston B becomes a cold spare (arguably right for a 9-year-old drive).
      - **E4** 2 Kingston stripe + MX500 + 1 WD — fits; Raid X dead, two WDs out.
    - The temporary swap is unaffected — it's a migration vehicle, not a final layout. But the final
      layout must be chosen **before the MX500 is wiped**.
  - 2026-09-17c (session 01a0ae24) **OPERATOR PLAN: 2× 240 GB Kingston RAID 0 → migrate boot →
    then wipe the MX500.** Bay layout confirmed by operator: Bay 1 = MX500 boot, Bays 2-4 = the
    three Raid X members. Verdict from `node tools/lion-boot-migrate.ts check`: **the plan is sound
    and it is the right shape — but the ORDER has one blocking prerequisite, and there is a
    channel problem.**
    - **BLOCKER 1 — capacity (arithmetic).** A 2×240 GB stripe is **447 GiB raw / ~425 GiB usable**.
      The boot volume currently holds **899 GiB**. It does **not** fit — short by ~474 GiB. After the
      ABSOLUTION R5 `revo` reclaim (775 GiB) the system is **~124 GiB**, which fits with ~300 GiB to
      spare. **So the revo reclaim is not housekeeping — it is a structural prerequisite of the
      operator's own migration plan**, and it may by itself satisfy "clean the SSD".
    - **BLOCKER 2 — SATA channels.** 4 bays, 4 disks, **0 free**. Two Kingstons need two channels
      that do not exist in the bay backplane. Options (operator decision): **A** break Raid X (HIGH
      risk — it is a no-redundancy stripe, pulling a member destroys all 3 TB); **B** single Kingston
      240 as boot, no stripe, in the bay the MX500 vacates (**no purchase, LOW risk** — 124 GiB fits
      one 240 easily); **C** optical-bay hidden ODD SATA ports (needs SATA data + Molex→SATA power +
      2.5" bracket, which the operator does not own, and ODD-port bootability is DISPUTED);
      **D** redesign Raid X into a redundant set (fits the "new drives for raid" end-goal).
    - **Method constraints, sourced:** RAID 0 boot IS supported on a Mac Pro 3,1; you **cannot**
      create a RAID set on the running startup disk; **clone with Carbon Copy Cloner (already
      installed, R1 receipt) — do NOT use the Lion installer**, which refuses RAID targets over the
      Recovery HD; a RAID 0 boot set has no Recovery HD; and the Mac would then have **two** striped
      sets with zero parity anywhere.
    - Ordered plan (`node tools/lion-boot-migrate.ts plan`): reclaim revo → verify usage + Kingston
      SKUs → decide bays → build stripe → CCC clone → Startup Disk + prove clean boots → **only then**
      the MX500 is a non-boot disk and wiping it becomes a normal erase.
  - 2026-09-17 (session 01a0ae24, later) **IDENTITY RESOLVED BY OPERATOR PHOTO — THE COLLISION IS
    CLOSED AND THE ANSWER IS: THERE IS NO SPARE SSD.** Operator Disk Utility screenshot (chat-only
    bytes, perception receipt agent-memory seq 158) enumerates the ENTIRE sidebar: `1 TB WDC
    WD10EACS-0…`, `1 TB WDC WD10EAVS-0…`, `1 TB WDC WD10EACS-0…` (each carrying `RAID Slice for
    "Raid X"`), `1 TB CT1000MX500SSD…` → `start disk clone`, `3 TB Raid X` → `Raid X`, plus a
    SuperDrive holding a CD `Peaks And Troughs`. The Mac Pro 3,1 has FOUR bays and all four are
    full. **The one and only SSD is the CT1000MX500SSD and its volume is `start disk clone`, which
    the ABSOLUTION burn proves is the LIVE BOOT disk** (`/dev/disk3s2 on /`, 931Gi, 899Gi used,
    97%). So "wipe the SSD" has no executable target — the only SSD is the running system. That is
    arithmetic, not a policy refusal. Verified by `node tools/lion-disk-plan.ts guards`.
    Also learned: `3 TB Raid X` over three 1 TB members = a STRIPE with **NO redundancy** (a mirror
    would read 1 TB, RAID 5 would read 2 TB); any single WD failure loses all 3 TB.
    **Operator decision required before any erase** — (a) add/attach new media, then wipe the old
    SSD once boot no longer lives on it; (b) migrate boot OFF the MX500 first, then wipe it;
    (c) treat "wipe the SSD" as satisfied by the reversible `revo` 775 G reclaim (R5) + harden and
    strike the erase. `?(lion-ssd-wipe)` stays UN-ARMED — but **its safety gates were tested, not
    assumed**: replaying its discovery logic against a mock of the photographed disk set prints
    `skip disk3 (BOOT) CT1000MX500SSD1` then `ABORT: selection is 0 SSD candidate disks`, exit 1.
    So the block correctly refuses and cannot erase the boot disk. (An earlier draft of this entry
    claimed the opposite; the simulation disproved it and the claim was corrected rather than
    shipped. Receipt: `node tools/lion-disk-plan.ts sim`.)
  - 2026-09-17 (session 01a0ae24) **SSD WIPE IS BLOCKED — NAME COLLISION, NOT A REFUSAL.** Item 3
    names the wipe target "the superseded Bay 3 start-disk clone media", but the ABSOLUTION burn of
    2026-09-17 proves `start disk clone` is the LIVE BOOT VOLUME: `/dev/disk3s2 on / (hfs)`, 931Gi,
    899Gi used, 97%, `Finished file system verification on disk3s2 start disk clone`. Two different
    media share one name and the physical identity was never measured. `?(lion-ssd-wipe)` selects by
    media name matching `crucial|mx500|ssd`; no receipt in this repo has ever printed a Solid State
    flag for a Mac disk (0 hits under `receipts/`), and the only MX500 with a receipt
    (`ata-CT1000MX500SSD1_…`) is in the OMEN running Void — a DIFFERENT MACHINE. Every disk with a
    receipt here is never-erase (boot + 3 Apple_RAID members + Raid X), so the wave currently has NO
    proven target. `?(lion-ssd-wipe)` stays UN-ARMED. Gate = `etc/lion-disk-identity.block`
    (read-only, emitted by `node tools/lion-disk-plan.ts emit`; guards in `… guards`); the erase is
    authored only after that output names a real free disk.
- [ ] 4. **Build APEX OMEN PC** (deferred).

## 2026-09-16f operator tracks — ONE TASK AT A TIME, agentically (operator directive)

> Rule (operator verbatim 2026-09-16f): "take our tasks one at a time agentically each time
> before moving on with the next task." A task closes only with its receipts pasted/read.
> Current task: T1 (2026-09-16h: context burns verified; runtime/precompile HOLD; workflow activated but stale installed template, zero runs).

- [~] **T1 agentic ES5 passthrough workflow for the Mac** (phone-triggerable): tools/mac-es5-passthrough.ts + ci/workflows/mac-es5-passthrough.yml (workflow_dispatch from GitHub mobile; publishes a public release zip the Mac downloads) + docs/mac-modern-web.md ranking (Chromium Legacy LION builds 121.0.6167.x-stable.lion = PRIMARY native modern engine; Arctic Fox + passthrough = fallback; bridges parked). Repo side DONE 2026-09-16f; closes on first workflow run receipt + on-Mac loader result burn.
- [ ] **T2 native lossless audio interface on the Mac** (mic control + EasyEffects-like effects, NOT necessarily EasyEffects; native preferred to preserve lossless on the SM7B/MicPort chain): host matrix AU Lab / GarageBand '11 if installed / Logic 9 / Audacity 2.x ladder; CoreAudio 24-bit path, WAV/AIFF capture; opens after T1 closes.
- [ ] **T3 gaming matrix**: Mac-possible class = legacy Minecraft (<=1.12.2 on Java 8, which supports 10.7) + Quake/source ports (legacy Mac builds); Prism Launcher / Roblox / Unreal / Steam = verdicts researched WHEN THIS TASK OPENS (known: Steam Lion-dead 2019-01-01, docs/mac-daily-driver.md §8); Void-on-recovery = the full set on the 3080.
- [ ] **T4 mic chain wave** (etc/lion-command.txt item 4 / docs/mac-daily-driver.md §9) — queued behind Wave-1 receipts.
- [ ] **T5 Wave-1 receipts** (AirPort light reads + 6.3.1 badge + post-reset sequences; lion-arcticfox.txt burn) — OPEN, operator owes.
- [ ] **T6 wipe-harden transcripts** (lion-wipe-harden.txt BLOCK1+BLOCK2) — OPEN, operator owes.
- [ ] **T7 Chromium Legacy LION install wave** (sha-verified lion build, dedicated apps profile, Violentmonkey + Vencord userscript, modern uBlock; docs/mac-modern-web.md §1-2) — opens on operator go-ahead (independent of T1 CI).
- [ ] parked: modern-host decision for the hostless four (docs/mac-daily-driver.md §10); RPCS3+BD-drive plan survives verbatim for it.
- T1 validation receipt (2026-09-16, operator phone screenshot): Actions "Found 0 workflows" root-caused = ci/workflows source-only by repo design + workflow_dispatch lists default-branch only; agent .github push rejected (App lacks workflows permission, verbatim receipt in memory seq 117). Activation = operator-credential path, steps in docs/mac-modern-web.md "Trigger path". T1 stays [~] until activation + first CI run + on-Mac burn.
- T1 hardening (2026-09-16, operator: "tap to run real easy whenever you need to update apps"): workflow now standing + registry-driven - app input default all, app list only in tools/mac-es5-passthrough.ts APPS, checkout pinned to arena branch (runs pre/post merge), per-app subdirs + RECEIPT-INDEX.json in one release zip. Run = 2 taps once activated. New planned apps = agent commit only.

## App build list — compiler targets + install waves (operator 2026-09-16f: "get the apps we need to build on the ToDo.md")
Compiler passthrough registry (tools/mac-es5-passthrough.ts APPS; training corpus INSTRUCTIONS v1 = 2026-09-16f-v1, hashed into every RECEIPT-INDEX):
- discord-web [BUILDING] app-shell chunk discovery + ES5 + core-js; login stall = KNOWN_LIMITATION (WebCrypto on FF52-class) - real sessions via Chromium Legacy
- vencord-web [BUILDING] userscript transpile with header-preservation assert; pairs with discord-web bundle or Violentmonkey on Chromium Legacy
Compiler candidates (research-at-open; a fetch+transpile CI receipt is required BEFORE registry promotion):
- youtube-web [CANDIDATE] player ES2020 heavies; iPad-UA trick remains the Arctic Fox stopgap
- soundcloud-web [CANDIDATE] operator interest; unverified-on-Lion flag stands until first burn
Native install waves (NOT compiler jobs):
- Chromium Legacy LION builds [T7 install wave, awaits operator go-ahead] primary modern engine (tags 121.0.6167.x-stable.lion, x86_64)
- audio interface stack [T2, next after T1 closes]: AU Lab / GarageBand '11 if-present / Logic 9 / Audacity 2.x ladder (2.4.2 -> 2.1.3 -> 2.0.6) + CoreAudio aggregate device + mic control; native chain preserves lossless on the expensive mic (operator directive)
- gaming [T3, research-at-open]: legacy Minecraft <=1.12.2 on Java 8 + Quake source ports = Mac-possible class; Prism Launcher / Roblox / Unreal / Steam verdicts land when T3 opens (Steam already receipted impossible on Lion: 2019-01-01 client cutoff)
- parked: hostless-four modern-host decision (Void excluded by operator)
- winamp-for-mac [QUEUED 2026-09-16g, opens on next operator prompt] operator verbatim: "can we get winamp too with the themes? ill be burning mp3's to cd's anyways". Research receipts logged (agent-memory seq 125): Winamp for Mac 0.8.1.13 (2012-09-21) runs Mac OS X 10.6+ => Lion-compatible class (mywinamp.com/winamp-for-mac + mac.filehorse.com old-versions); skins CLAIMED (FileHorse PROS "Customizable skins and plugins") but native .wsz handling on 0.8.1 UNVERIFIED; NO CD-burn in the Mac feature list (playback/import/sync only) => iTunes audio-CD burn (docs/mac-daily-driver.md section 1) stays the burn path; 32/64-bit on Lion UNVERIFIED. Wave when opened = sha-verified dmg + install block + skin/theme pairing with CandyBar/Flavours, operator-gated.
Promotion rule: candidate -> registry only with a CI run receipt (fetch+transpile+node --check gate green); every promotion logged here + in receipts/agent-memory.

## 2026-09-16g compiler progression + merge rule (operator directive)

- [x] **Verdict: least-effort first compile = vencord-web** (single-URL userscript, no shell discovery; discord-web needs a live shell regex + many chunks; youtube-web/soundcloud-web not yet registered).
- [x] First local compile receipt: `receipts/mac-es5/2026-09-16g-vencord-local/` — source Vencord 1.15.6 sha256 325bb7568d1f… (first-party mirror github.com/Vencord/builds@8a2b56ed722781381cdf93e62f1096f6358817c1; canonical vencord.dev unreachable from sandbox egress, CI re-fetches canonical), Babel 7.29.7 (ci pinned @^7), FF52-floor acorn-ES2017 parse **PASS**; 209 BigInt literals + 184 post-FF52 regex literals shimmed (semantics = KNOWN_LIMITATION until on-Mac burn receipt). Same wave fixed tool bugs that would have hit the first CI run: require-in-ESM fake DEPS-MISSING (createRequire bound), core-js-bundle 3.50 layout path, Babel pin.
- [ ] Next steady step (one at a time, operator-paced): discord-web local compile on the same pipeline, OR vencord on-Mac burn once T1 workflow is activated (operator-credential path in docs/mac-modern-web.md "Trigger path").
- [x] **MERGE RULE CLARIFIED (operator directive 2026-09-16 / session 01a0ad38): merges are OPERATOR-DIRECTED.** When operator says "please pull/merge pr" or explicitly instructs merge, agent executes via `gh pr merge` ("by the agent doing it, not by the agent deciding it"). PR #57 MERGED (commit 289899b). Conflicting PRs awaiting granular feature application: #72, #60, #34, #24, #23.
- [x] **One downloadable compiler-context script with burnable receipt DELIVERED (2026-09-16g):** `lion-compiler-context.command` inside `lion-one.zip` (now three files) + direct page link; embeds INSTRUCTIONS v2 (sha 8583a1cbf2ca) + full context, drops Desktop companions, burns COMPILERCTX1. New one-link **da.gd/sQ7bEo** minted via GET da.gd/s?url= + coshorten-verified; ONE_LINK.txt + MASTER repinned; da.gd/lionone legacy (same inbox). gates: ONE_TEST=PASS.

## 2026-09-16h burn verification — T1 stays open
- [x] Three text burns read via webhook full POSTs: CONTEXT `8d9da9c2`, COMPILERCTX1 `33b7117b` (v2 `CORPUS_SHA=MATCH`, complete), LIONONE1 `1c474145` (10.7.5, AF47.3, GTX285, dual1080p). Receipt record: `receipts/mac-es5/2026-09-16h-burn-verification/`. No repeat burn needed.
- [~] **Correction to the earlier GREEN compile:** syntax-only, NOT runtime. Repro emits `BigInt("undefined")` because Babel uses `node.value`; core-js 3.50.0 does NOT supply absent BigInt. v3 fixes the AST field and blocks known BigInt/deferred-regex hazards at transpile/receipt. Next single task = verify semantic runtime implementation; no full app compile authorized by this receipt.
- [~] Actions ACTIVATED (gh API, zero runs); installed `.github/workflows` is the OLD template, not current `ci/workflows` source. Source repinned to this session with exact dependency versions + real compiler regressions. Operator update still required, but does not resolve runtime blockers by itself.
- **STORAGE HOLD:** current root = `start disk clone` (`disk3s2` at receipt time); old wipe wave SUSPENDED. Three Apple_RAID members + mounted 3 TB Raid X observed, but physical bays/RAID mode/health unverified. No erase, reset or account deletion. Firewall disabled; no MicPort or hardening completion inferred. T5/T6 remain open.

## 2026-09-16i session 01a0ad38: operator merge execution & doctrine restoration
- [x] **Merge rule clarification:** Operator administrative directive overrides prior misunderstanding: operator directs merges, agent executes. Agent never merges unbidden without operator instruction.
- [x] **PR #57 MERGED:** CPU OC session 2026-08-28 merged into main (commit 289899b).
- [x] **Granular feature porting for conflicting PRs (integrated cleanly into session branch):**
  - [x] PR #23: Phase 6 desktop perf toolchain (`scripts/xmb-perf`, `scripts/xmb-perf-frametime`, `scripts/xmb-perf-install`)
  - [x] PR #24: Compiz second-monitor Y unlock (`scripts/compiz-profile-repair`, `scripts/ccsm-safe`, `scripts/compiz-profile-verify`)
  - [x] PR #34: Tiger-Gunmetal theme pair (`scripts/tiger-gunmetal-*`, `scripts/gunmetal-blue-accent`, previews, docs, bundles, tools)
  - [x] PR #60: RGB debug status light (`scripts/rgb-omen health/preview/rehearse/apply`, `docs/feature-pack-accessories.md`, `etc/rgb-*.block`)
  - [x] PR #72: Lion SSD install receipts audited; headless CLI-bypass injector was previously withdrawn and superseded by working installer-app path in PR #80/PR #85.
- [x] **MASTER.md restored:** Echoes Doom 3 & KISS Linux coding philosophy of extreme efficiency, direct execution, zero bureaucratic red tape, and operator-directed merge execution.
