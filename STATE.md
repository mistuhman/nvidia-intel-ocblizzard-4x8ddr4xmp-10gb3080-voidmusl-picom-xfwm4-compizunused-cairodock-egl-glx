# STATE.md — canonical machine facts

**Read this first, every session, before proposing anything.** It exists because
I repeatedly re-derived facts that were already in a receipt and got them wrong.
Regenerate the live half with `scripts/omen-omni.sh`, which writes the whole
capture to `/root/omen-state-latest.txt` — one file, paste it back wholesale.

Last verified: **2026-08-27 17:11 UTC** (SATA wipe + fast/bulk create)
2026-09-05 bookkeeping only: `Chassis` / `Cooler` rows corrected from the case-swap docs and the
APEX spec sheet. **No new target receipt** — the board currently will not POST (gate 12,
`MASTER.md` → `docs/case-swap-3-2-beep.md`), so nothing below that was re-measured.

---

## Hardware (stable, do not re-ask)

| | |
|---|---|
| Machine | board is the HP OMEN 45L GT22-0139 / 575Q1AA (ARTICUNO) donor, serial 2MO22432DX |
| Chassis | **APEX PC-389-C** since the 2026-08-30 case swap — ATX mid tower, thin steel, 444 x 184 x 406 mm, **top-mounted PSU**, 3x5.25 + 2x3.5 external + 4-5x3.5 hidden bays, no 120 mm front fan mount, not tool-less |
| Board | M81915-601 BlizzardOC Z690, SSID 8917 |
| BIOS | **F.51** |
| CPU | i7-12700KF — CPU 0-15 = P-cores 0-7 HT, CPU 16-19 = E-cores 8-11 |
| GPU | RTX 3080 10 GB, driver **595.91.07**, open kernel module |
| RAM | 4×8 GB DDR4, M85222-001, XMP 3733 @ 1.35 V. **Never 4000. ≤1.50 V.** |
| PSU | M83827-001, 800 W ATX Gold (HP's own docs say ATX) |
| Cooler | M82880-002 plain LCS 240, no Cryo/TEC — **rad zip-tied to the front panel since 2026-09-05** (no rad holes, no long screws, no drill); fans bolted to the rad, ties clamp the sandwich only; hose tension into the block is a live POST suspect, `docs/case-swap-rad-mount.md` Appendix F |
| LED hub | M82868-001 — **deliberately unplugged**, no RGB |
| Monitors | DELL G3223Q + DELL S2725QS (both 4K) + a tertiary |
| Kernel | `6.18.35-tkg-bore` running; `/boot` also holds 6.18.36/38/40/41 stock and 6.18.39-tkg-bore |
| Audio IF | CEntrance MicPort Pro (USB 1c07:0001), USB Audio Class 1 — **12 Mbit full-speed is CORRECT, not a fault** |

### SATA emulation is **AHCI**, not RAID
`ahci 10000:e0:17.0: AHCI vers 0001.0301 ... SATA mode`, `ata5-8 link up 6.0 Gbps`,
zero resets. The RAID hypothesis is dead — ToDo Phase 3's blocking question is
answered. Do not re-raise it.

---

## Storage

Boot NVMe — **never a wipe target**:
`nvme-WDC_PC_SN530_SDBPNPZ-1T00-1006_214628806479` → `nvme0n1`
- p1 ESP 512 M, UUID `5010-EA01`, GPT PARTUUID `51a02255-f151-43d2-85d3-864699e66d5d`
- p2 → pool `nvme` → `nvme/ROOT/void` → `/`
- **DRAM-less / HMB** (`allocated 32 MiB host memory buffer`). See the autotrim trap.

SATA, all four (`/dev/disk/by-id/ata-*`, never `sdX` — letters reshuffle).
Wiped 2026-08-27 17:11 UTC (`CONFIRM_WIPE` + `CONFIRM_TANK`). Old Windows /
NTFS DATA / NTFS 50 / `tank` 465G **gone**. Vesktop flatpak namespaces were
what kept `tank` busy (`grep tank /proc/*/mounts`); host fuser was empty.

| by-id | pool role | mount |
|---|---|---|
| `ata-CT1000MX500SSD1_2317E6CCE92E` | `fast` (MX500) | `/fast` `/fast/vm` `/fast/work` `/fast/steam` |
| `ata-ST2000NM0033-9ZM175_Z1X6R7P5` | `bulk` stripe | `/bulk` `/bulk/media` `/bulk/archive` `/mnt/games` |
| `ata-TOSHIBA_DT01ACA200_95CWVMJAS` | `bulk` stripe | (same) |
| `ata-KINGSTON_SV300S37A240G_50026B7762054FB2` | L2ARC on `bulk` | no dataset |

Finder: `~/Storage/{Fast,Bulk,Games}` + gtk-3.0 Places. Do not `umount -l` a
pool you still need to export — lazy unmount leaves the spa busy.

### Traps that cost real time
* **`autotrim=on` on the SN530 destroys write speed.** DRAM-less FTL serialises
  per-TXG TRIM against writes. Reads stayed at 2180 MB/s while writes collapsed.
  `autotrim=off` + weekly `/etc/cron.weekly/zfs-trim`. Measured after:
  6.5 GB/s compressible, 479 MB/s incompressible, 2000 small files in 575 ms.
* **`updatedb`'s `PRUNEFS` contains `zfs` by default.** Root IS zfs, so the
  locate index would be empty. Strip `zfs` from PRUNEFS, keep `/.zfs` in
  PRUNEPATHS or every file appears once per snapshot.

---

## Software / desktop

* Void Linux **glibc** (repo name says musl; it is not).
* runit. Services: `omen-perf` (ours), NM, dbus, lightdm, polkitd, pipewire,
  chronyd, rtkit, bluetoothd, libvirtd, tor, privoxy, yeetmouse,
  **`omen-sqm` = CAKE 780 Mbit SQM, NOT an HP thermal daemon — keep**.
* Compositor **compiz**, `xfwm4` unused, **picom masked**, cairo-dock,
  xwinwrap+mpv wallpaper, Emerald. **Do not churn the Beauty stack.**
* GTK theme **`Quake-Gunmetal-3D`**. Icon theme **`Mac-OS-X-Lion`**.
  Nine macOS icon sets are installed — the operator had this handled.
  **I overwrote it with la-capitaine/OSX-Gunmetal. Do not touch icons again.**
* File manager: **Nemo 6.6.4 branded "Finder"** (`/usr/local/bin/finder`),
  13 `zfs-*.nemo_action` entries backed by `/usr/local/bin/finder-zfs`,
  Thunar hidden with a `/usr/local/bin/thunar` → finder shim.
* Ulauncher **5.15.7**, extension `finder-search` at
  `~/.local/share/ulauncher/extensions/finder-search`, keywords `f` / `fd`.
* **vesktop is a FLATPAK**: `dev.vencord.Vesktop` 1.6.7 stable **system**.
  Not a binary, not on PATH, no system `.desktop`. Zen browser IS a tarball
  install — do not generalise from it.
* Other flatpaks: Obsidian, Riot/Element, Brave, ProtonVPN, torbrowser-launcher,
  Thunderbird ESR.
* `~/.bitcoin` — **never delete or glob-move.**

---

## Live config applied so far

| Thing | Value | Where |
|---|---|---|
| ARC | 12 GiB max / 2 GiB min | `/etc/modprobe.d/99-arc-cap.conf` |
| sysctl | swappiness 1, dirty 5/2, cache_pressure 50, min_free 262144, autogroup 0, nmi_watchdog 0 | `/etc/sysctl.d/999-desktop-perf.conf` |
| sysctl loader | `sysctl --system` | `/etc/runit/core-services/98-omen-sysctl.sh` |
| I/O sched | nvme `none`, sd\* `mq-deadline` | `/etc/udev/rules.d/60-omen-ioscheduler.rules` |
| EPP / IRQ / THP | performance, GPU→cpu4, NIC→cpu18, madvise | `sv omen-perf` |
| Xorg | `ForceCompositionPipeline` only, **no** ForceFull, Coolbits 28 | `/etc/X11/xorg.conf.d/20-nvidia.conf` |
| nvidia KMS | `modeset=1 fbdev=1` | `/etc/modprobe.d/99-nvidia-drm.conf` + ZBM cmdline |
| ZBM cmdline | `org.zfsbootmenu:commandline` on `nvme/ROOT/void` | **this is where the cmdline lives, not grub** |
| ZBM kernel pin | `6.18.35-tkg-bore` — **was already set, I wrongly claimed otherwise** | `org.zfsbootmenu:kernel` |
| EFI | `BootOrder: 0000,0001`, Boot0000 = ZBM `\EFI\zbm\vmlinuz.EFI`, timeout 1 s | NVRAM |
| microcode | `intel-ucode 20260512` | installed, needs reboot to verify |

**`/etc/sysctl.d/99-ollama-ultimate.conf`** sets swappiness/dirty and sorts
AFTER ours alphabetically — its three conflicting keys are commented out. Any
new file named `99-*` after `99-d` will clobber us again; ours is `999-` now.

---

## Benchmarks — stock baseline, compare everything to these

Geekbench 6.7.1 CPU **SC 2715 / MC 14569** ·
OpenCL **194800** · Superposition 1080p Extreme **8717**
(min 19.76 / avg 65.20 / max 81.37 fps). Peak 145 W, 4476 MHz, 70 °C.

---

## Rules

1. Direct pasteable bash. No `?(name)` tokens, no registry ceremony.
2. One wave at a time. Wait for output.
3. `/dev/disk/by-id/` only for pool work.
4. No CPU/GPU stress until cooling is proven by tach data.
5. Memory OC ≤1.50 V; ZFS integrity gates memory OC.
6. **`su USER -c` does NOT reset `HOME`.** Always pass
   `HOME=<userhome> USER= LOGNAME= XAUTHORITY=`. Omitting it sent flatpak at
   `/root/.local/share/flatpak`, broke MESA's DRI load with "Permission
   denied", and made vesktop launch with a blank config.
7. **Never use `sed` with a delimiter that can appear in the payload.** Three
   collisions so far: `|` vs regex alternation, `@` vs `@@u` file-forwarding.
   Prefer `awk` `index`/`substr`.
8. **Shell globs are case-sensitive.** `*vesktop*` misses `Vesktop.desktop`.
   Use `find ... | grep -i`.
9. `raw.githubusercontent.com` caches ~5 min and ignores `?cb=` and
   `Cache-Control: no-cache`. Ship fixes under a **new filename**.
10. Flatpak Chromium flags go **after the app id, before `@@u`** — never
    before `run`, which flatpak parses as its own options and rejects.
11. Read the receipt before writing the warning. I claimed the ZBM kernel pin
    was unset and that the icon theme was a torn copy; both were disproved by
    output already on screen.

---

## Open

* Pools live 2026-08-27 17:11: `nvme` + `fast` + `bulk` (Kingston L2ARC). cmdline already has `nvidia_drm.modeset=1`.
* plocate index built empty (`index entries:` blank) — needs checking.
* `la-capitaine` + `OSX-Gunmetal` still in `/usr/share/icons`, unused.
* XMP 3733 BIOS verification (Gate 6) — gates GPU/CPU stress.
* 90B fan tach receipt never captured.
* GWE OC step 1 (+60/+250) — Coolbits 28 needs a logout to go live.
* CPU OC per `docs/oc-cpu-bios-checklist.md`.
