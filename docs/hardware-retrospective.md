# Hardware retrospective — OMEN 45L (operator receipts, 2026-08-26)

Keep the wall cord **out**. This PSU has **no rear switch**; isolation is cord-out plus
holding the case power button 20–30s. Do not treat “PSU switch off” as a step on this
machine.

Operator 2026-08-26: *“youre onto something about the psu, i think my knee bumped into
the desk while it was power cycling which caused something else to happen entirely. its
currently unplugged and there is no switch on my psu”*

That is a **new timeline event**, not a diagnosis. A bump during a live cycle can
unseat a proprietary HP power plug, a 6+2, 24-pin, EPS, or a front-panel / pump cable.
It does **not** prove the PSU is dead. Confirm connectors by eye **before** any power-on.

## Proven identity (dmidecode / lscpu / nvidia-smi / photos)

| Item | Value | Confidence |
|---|---|---|
| Chassis | HP OMEN **45L GT22-0xxx** | target receipt 2026-08-25 06:20 |
| Board | HP **BlizzardOC**, SSID **8917**, Z690, 4× DDR4 288-pin | HP spec + dmidecode |
| BIOS last known | AMI **F.51** | dmidecode; newest official is F.57 / sp167160, **not applied** |
| CPU | Intel **i7-12700KF** 12C/20T, LGA1700, **no iGPU** | lscpu; KF confirmed |
| GPU | NVIDIA **RTX 3080 10GB** (pci 10de:2216), both **6+2** reported in | photos + nvidia-smi when it last booted |
| GPU support bracket | **out on purpose** | last power-on briefing |
| RAM | **4×8GB** Kingston **HP37D4U1S8MR-8X**, DDR4, Rank1, XMP **3733 MT/s @ 1.4V** | dmidecode 07:53 UTC |
| Last attempted RAM | Custom 4000 22-24-55 Gear2 **1.50V** booted unvalidated; **1.55V** failed | F10 + later Void-side write dispute |
| PSU | OMEN 45L **850W-class custom HP**, **no user switch**, **6+2 plug count UNCONFIRMED**, CPU 4-pin/EPS pinout **not ATX-standard** (Super User BlizzardOC warning) | operator + research |
| Cooler | AIO/pump present; pump-failure story **closed** (fans spin then all power drops) | operator |
| Display | dual monitor **4480×1440** | daily driver when up |
| User | `sd` | — |

## Storage (do not wipe)

| Device | Role |
|---|---|
| **nvme0n1** 953.9G | p1 ESP 512M vfat UUID **5010-EA01** (ZBM Boot0002/0008); rest zpool **nvme**, root **nvme/ROOT/void** |
| **Sabrent USB3 1.8T** | keep **out** during recovery. sda1 NTFS label `50` (archive + nvme-games.tar 555G); sda2 zpool **tank**, `tank/games` → `/mnt/games` |
| Windows helper PC | Disk 2 = 931.50 GB Windows, Disk 1 = 1.863 TB DATA — **never touch**. Recovery stick was Disk 3 7.34 GB |

## Photo-mapped headers (do not re-identify)

| Label | Fact |
|---|---|
| **PB** | real 2-pin power button (red on one pin, near 24-pin/USB) |
| brown/black 2-pin by PWR_LED | **not** power path |
| PWR_LED | LED only |
| CMOS | 3-pin small blue cap, center bottom — **moved, FAIL**, restored |
| **FDO/PSWD/BBR** | 3-pin above SATA3; photo 2026-08-26: blue cap on the **left pair** (away from the printed `FDO/PSWD/BBR` text); **right pin open** (nearest the text, beside SATA1). Cap **not moved**. Silkscreen names three functions on one 3-pin — the other pair is the only other short; it is **not proven** to be BBR vs FDO. |
| USB3 19-pin, FRONT-USB, TFAN/FFAN, SPWR, RGB | not the power-on path |
| OMEN logo LED | case LED; lit on AC; **no diagnostic value** |

## Last known attached set (before unplug)

3080 + RAM + wired keyboard. Recovery `HP_TOOLS` stick with `08917.bin` + `.sig` was tested;
firmware never enumerated USB. HDD, wireless dongle, mouse, Ethernet: keep out.

## OS last known (when it booted)

Void **glibc** (repo name still musl), kernel **6.18.35-tkg-bore**, NVIDIA **595.91.07**,
ZFS 2.4.3, ZBM 3.1.0. Escape = ZBM, F10 = BIOS.

## Closed vs open

**Closed:** PB unplug, CMOS cap, pump, minimal bench, zero-DIMM, CR2032 (GPU out), both USB recovery layouts.

**Closed (operator 2026-08-26):** live unseat from the knee-bump — connectors seated; bump was ~two days ago.

**Closed (operator 2026-08-26):** one jumper-slide toward `FDO/PSWD/BBR` text — *“no led, same pattern.”* Stick dark. Wall-direct 125V cable. Rollback = cord out, cap back to **left pair**. No second slide.

**Closed (operator 2026-08-26):** no 3.3 V SPI programmer, clip, or DMM — *“i dont have any special tools.”*

**Open:** which of the two 3-pin pairs is BBR vs FDO (photo shows current = left pair; other = slide toward the label; both pair states already occupied — right pair FAILed 2026-08-26); `PS_ON#` vs PSU protection; `HpBiosUpdate.efi` inside sp167160 (literature-resolved 2026-08-27: HP AMI SoftPaqs hide it in the UCP container and it needs a POSTing board — see `docs/open-classes-pass2.md`; stick/`C:\SWSetup` dir receipt still pending).

## Rear I/O photo 2026-08-26 (inspect-before-BBR)

Operator opted in to one jumper attempt **after** inspection. Photo shows:

- I/O: 3 audio, 2× USB2 (empty), Ethernet **unplugged**, 2× USB3 SS — a bulky USB stick in the **upper SS** port, lower SS empty
- GPU bracket: HDMI empty, one DP with **16K UHD** cable seated, two DP empty
- PSU shroud FOXCONN, HP S/N `2MO22432DX`; **no PSU rocker** in view
- Keyboard **not visible** in this frame

Do not power on from this photo. Stick should be the verified `HP_TOOLS` `08917.bin` media. Prefer a **USB2** black port (the pair above Ethernet) for the one BBR attempt; boot-block often enumerates USB2 first. Cap still factory left-pair until the checklist is complete.
