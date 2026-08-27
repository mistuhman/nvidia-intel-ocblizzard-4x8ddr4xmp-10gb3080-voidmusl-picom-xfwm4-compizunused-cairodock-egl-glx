# Diagnosis 2026-08-27 — filesystem, boot display, choppiness, Finder

Source of truth: the two READ-ONLY probes (`etc/postboot-diag-root.block`,
`etc/postboot-diag-user.block`) pasted back at 11:53 UTC, 42 min uptime,
kernel 6.18.35-tkg-bore, BIOS **F.51**, OMEN 45L GT22-0xxx.

Everything below is derived from those receipts. No guesses are marked as facts.

---

## 1. Filesystem — why Discord "loads like it's on an HDD"

| Receipt | Reading |
|---|---|
| `zfs_arc_max = 4294967296` (4 GiB) | ZFS does **not** use the kernel page cache. ARC *is* the cache. 4 GiB on a 31 GiB box with **23 GiB free** means Electron caches, sqlite pages, icons and thumbnails are re-read from the SN530 on every access. This is the single cause of the "spinning-disk" feel. |
| `free -h` → 7.1 GiB used, 23 GiB free, `buff/cache 1.2 GiB` | Confirms it: the machine is starving a cache while sitting on 23 GiB of idle RAM. |
| `findmnt /` → `xattr` (not `xattr=sa`) | Directory-based xattrs. Every file access costs an extra hidden-directory lookup and I/O. Electron cache dirs and thumbnailers hammer xattrs. |
| `sysctl vm.swappiness` → **10**, but `/etc/sysctl.d/99-desktop-perf.conf` says **1** | **`/etc/sysctl.d` is not being applied at boot.** Every perf sysctl set on 2026-08-25 has been dead since the next reboot. |
| `lsblk … SCHED` → `bfq` on sda sdb sdc **sdd** | `sdd` is the vdev for pool `tank`. BFQ in front of ZFS double-schedules and adds latency. ZFS wants `none`/noop on vdevs. |
| `swapon --show` → empty, no `vm.min_free_kbytes` floor | Allocation stalls surface as whole-desktop freezes. |
| `hdparm: not found` | The NVMe speed gate has never actually run. Installed by the fix. |

**Fix:** `scripts/omen-fs-fix.sh` — ARC 4 GiB → 12 GiB (+2 GiB min), `xattr=sa`,
`atime=off`, `lz4`, `redundant_metadata=most`, `autotrim=on`, a real sysctl file
**plus** `/etc/runit/core-services/98-omen-sysctl.sh` so it is actually applied,
a udev rule replacing bfq with `mq-deadline` (SATA) / `none` (NVMe), THP
`always → madvise`, and `hdparm`+`smartmontools`.

---

## 2. Boot / display

| Receipt | Reading |
|---|---|
| `/proc/cmdline` has **no `nvidia_drm.modeset=1`** | No kernel modesetting. The NVIDIA driver does not touch the display until **Xorg** starts and modesets from userspace. That is exactly "the main monitor does not light up immediately, the tertiary one does". Also makes every VT/X handoff a full link re-train. |
| `intel_pstate=passive … intel_pstate=active`, `split_lock_detect=off` twice, `quiet` with `loglevel=7` | Contradictory, duplicated cmdline. Last-wins so `active` applies, but `loglevel=7` + `quiet` spams the console during handoff. Origin: the `org.zfsbootmenu:commandline` property on `nvme/ROOT/void`, which is where ZFSBootMenu reads the cmdline from. |
| `BootOrder: 0001`, `Boot0001* UEFI OS  HD(1,GPT,…)/\EFI\BOOT\BOOTX64.EFI` | The ZFSBootMenu entries (Boot0002 / Boot0008) **are gone** — the CMOS clear during the no-POST recovery wiped NVRAM. The box is now booting the **removable-media fallback path**, which forces the firmware to enumerate and probe *every* block device (4 SATA disks + USB) hunting for `\EFI\BOOT\BOOTX64.EFI` before it reaches the NVMe ESP. That enumeration is both the slow boot and the late display handoff. `Timeout: 0` also means no F9 window if anything misfires. |
| `x86/CPU: Running old microcode` + `Register File Data Sampling: Vulnerable: No microcode` | Alder Lake on stock 2021 microcode. Real P/E-core scheduling and TSC errata, not just a CVE note. |
| `ahci … SATA mode`, `ata1-4 DUMMY`, `ata5-8 link up 6.0 Gbps`, all four disks configured, zero resets | **BIOS is already in AHCI, not RAID.** The RAID hypothesis is dead — closes ToDo Phase 3's blocking question. No SATA link-reset storm exists. |
| `nvme … 16/0/0 queues`, no `blk_update`, no resets | NVMe link is clean. The slowness is cache, not the drive. |

**Fix:** `scripts/omen-boot-display-fix.sh` — rewrites
`org.zfsbootmenu:commandline` to a single clean line with
`nvidia_drm.modeset=1 nvidia_drm.fbdev=1`, adds `/etc/modprobe.d/99-nvidia-drm.conf`
as a second belt, installs `intel-ucode`, regenerates the initramfs and the ZBM
image, and recreates a **direct** `ZFSBootMenu (NVMe)` EFI entry pointed at
`/dev/nvme0n1` partition 1 — putting it first while leaving Boot0001 behind it
as a working safety net, and setting the firmware timeout to 1 s.

---

## 3. Choppiness / "everything lags behind the mouse"

| Receipt | Reading |
|---|---|
| `20-nvidia.conf` has **both** `ForceCompositionPipeline` and `ForceFullCompositionPipeline` = true, while **compiz** is the compositor | FFCP routes the whole screen through the GPU composition pipeline and adds a guaranteed extra frame of latency. compiz composites *on top of that*. Two stacked composition stages on two 4K panels = the classic NVIDIA cursor-lag. **Biggest single contributor.** |
| `vesktop.bin` at **98.2 %CPU**, three more vesktop procs behind it | Chromium blocklists the NVIDIA proprietary driver for GPU rasterization on X11, so Vesktop paints in software and uploads. One saturated core starves compiz (8.0 %) and Xorg (6.5 %) — that is why *other* apps go choppy too. |
| `energy_performance_preference = balance_performance`, governor `powersave` | On a 12700KF with E-cores this parks P-cores low and lets interactive work land on Gracemont. Every UI burst pays a ramp penalty. |
| IRQ pins from 2026-08-25 absent | `/proc/irq/*/smp_affinity_list` is not persistent. GPU and NIC interrupts drifted back to an E-core. |
| `nvidia-smi` → `P3`, 1110 MHz SM while "40 % util" | GPU clock-gating mid-scroll. |

**Fix:** `scripts/omen-latency-fix.sh` (root) — drops `ForceFullCompositionPipeline`
(keeps `ForceCompositionPipeline`, so still tear-free), keeps `Coolbits 28`, and
installs a **runit service `omen-perf`** that re-applies EPP=`performance`,
the sysctls, THP, IRQ pins (looked up by *name* each boot, since IRQ numbers
change), schedulers, ARC and `nvidia-smi -pm 1` on **every** boot. That is the
permanent answer to "stuff feels weird after booting".

`scripts/omen-vesktop-fix.sh` (user) — writes a user-level `vesktop.desktop`
override with `--ignore-gpu-blocklist --enable-gpu-rasterization --enable-zero-copy`
etc. The system copy is never touched.

---

## 4. CEntrance MicPort Pro — it is not broken

```
lsusb   : Bus 001 Device 002: ID 1c07:0001 CEntrance Inc. CEntrance MicPort Pro
ALSA    : card 0: Pro [CEntrance MicPort Pro], device 0: USB Audio  (capture present)
pactl   : alsa_input.usb-CEntrance_Inc._CEntrance_MicPort_Pro-00.mono-fallback  IDLE
wpctl   : 76. CEntrance MicPort Pro Mono  [vol: 1.00]
```

It enumerates, binds `snd-usb-audio`, and exposes a capture source. Two real
findings:

1. **`Default Source: easyeffects_source`**, and the ALSA capture node reports
   `Subdevices: 0/1` — EasyEffects already holds the device. Anything recording
   from the *default* source goes through the EasyEffects graph; if EasyEffects'
   input is bound elsewhere you get silence. That is the whole bug.
2. It negotiates at **12 Mbit full-speed on bus 001**. That is **correct** — it
   is a USB Audio Class 1 device. It is not a dead SuperSpeed port. The
   `cannot get freq at ep 0x1` lines are the usual UAC1 chatter, not a fault.

Handled by `scripts/omen-vesktop-fix.sh`, which sets the card profile, unmutes,
makes it the default source, and does a 5-second record test to `/tmp/mictest.wav`.

---

## 5. Finder — replacing Thunar

**Nemo**, branded as Finder. Why it wins:

* GTK3 → inherits the existing gunmetal GTK3 theme with zero work. Anything Qt
  (Krusader, Dolphin, Double Commander) would fracture the Beauty stack.
* The only mainstream GTK file manager with a declarative **actions** system
  (`.nemo_action`). Thunar's custom actions cannot pass dataset context or
  surface command output — Nemo's can, which is what makes a real zpool menu
  possible.
* Dual pane (F3), tree sidebar, tabs, bulk rename, open-as-root, open-in-terminal.
* Reads `/usr/share/nemo` and `/etc/nemo`, so branding is an overlay, not a fork.

`scripts/finder-install.sh` does:

1. `nemo`, `gvfs`, `yad`, `smartmontools` (+ optional `nemo-fileroller`).
2. **WhiteSur** (macOS Big Sur) icon theme into `/usr/share/icons`, then a
   derived theme `WhiteSur-Gunmetal` whose `Inherits=` is
   `WhiteSur-dark,<your current icon theme>,Adwaita,gnome,hicolor` — macOS icons
   win, but anything you already customised still resolves. **GTK theme is not
   touched.**
3. Branding: `/usr/local/bin/finder` wrapper (`--name=Finder --class=Finder`),
   `finder.desktop` with `Name=Finder` and desktop actions, stock `nemo.desktop`
   hidden, gsettings override for Finder-ish defaults (list view, sidebar on,
   ISO dates, open-as-root in the background menu).
4. **13 ZFS right-click actions** → `/usr/local/bin/finder-zfs`:
   pool status · live iostat · all datasets · ARC/cache health · disks + by-id
   names + SMART · dataset properties · space & compression · snapshot this
   dataset · list snapshots · browse `.zfs/snapshot` · start scrub · stop scrub ·
   TRIM pool. Output renders in a `yad`/`zenity` window; mutations escalate via
   `pkexec`/`doas`/`sudo`.
5. Dethrones Thunar: hides its desktop entries, disables its autostart daemon,
   sets `inode/directory` → `finder.desktop` system-wide and per-user, rewrites
   the XFCE `helpers.rc` `FileManager=` (that is what xfdesktop, the panel and
   `exo-open` obey), and drops a `/usr/local/bin/thunar` shim so hard-coded
   callers (cairo-dock launchers, old scripts) land in Finder instead of failing.
   `/usr/bin/thunar` is left intact.

Undo: `sh /root/omen-fix/finder-install.sh undo`.

---

## Order of operations

1. `etc/fix-wave1-root.block` — root. fs → latency → boot. *(no reboot yet)*
2. `etc/fix-wave1-user.block` — as `sd` in X. vesktop flags + mic.
3. `etc/finder-install.block` — root.
4. **Log out and back in.** This makes the Xorg change live *and* makes
   `Coolbits 28` live, which unblocks the GWE overclock step.
5. **Reboot.** Then verify:
   * `cat /proc/cmdline` contains `nvidia_drm.modeset=1` and `intel_pstate=active` **once**
   * `dmesg | grep -i microcode` no longer says "old microcode"
   * `sysctl vm.swappiness` → `1`
   * `cat /sys/module/zfs/parameters/zfs_arc_max` → `12884901888`
   * `sv status omen-perf` → run
   * `efibootmgr` → `ZFSBootMenu (NVMe)` first
   * `hdparm -tT /dev/nvme0n1` → buffered reads in GB/s

Still open and **operator-gated** (untouched here): wiping the SATA disks into a
unified pool, the XMP 3733 BIOS check, and the CPU/GPU overclock.


---

## Addendum — what actually happened when it ran (2026-08-27 12:09–12:23 UTC)

Five defects surfaced during execution. Recording them because three were mine.

### A. `autotrim=on` crushed write performance — my error
`omen-fs-fix.sh` set `zpool set autotrim=on nvme`. Wrong for this drive. The
**WDC PC SN530** is an OEM **DRAM-less/HMB** part — the boot log says
`allocated 32 MiB host memory buffer (8 segments)`. With autotrim, ZFS issues
TRIM ranges on every transaction-group commit and a DRAM-less FTL serialises
them against writes. Reads were unaffected (2180 MB/s buffered measured
*before* the regression), writes collapsed.

After `autotrim=off`:

| test | result |
|---|---|
| 2 GiB sequential, `conv=fdatasync` | **6.5 GB/s** (lz4 in play) |
| 512 MiB `/dev/urandom`, incompressible | **479 MB/s** |
| 2000 small files | **575 ms** |

Replaced with `/etc/cron.weekly/zfs-trim` — one batched pass, no per-TXG stall.
`omen-fs-fix.sh` now sets `autotrim=off` explicitly so a re-run cannot
reintroduce it.

### B. The sysctl override was `99-ollama-ultimate.conf`, not `/etc/sysctl.conf`
`sysctl --system` sorts every `*.conf` **by filename** across all directories,
last-write-wins. `/etc/sysctl.d/` contained:

```
99-cachyos-gaming.conf  99-jit-fix.conf  99-ollama-ultimate.conf
99-ollama.conf          99-desktop-perf.conf
```

`99-**o**llama-ultimate` sorts after `99-**d**esktop-perf` and reset
`swappiness=10 dirty_ratio=15 dirty_background_ratio=5` on every boot. ollama
is not even running. Fixed by commenting out **only** those three keys there
(its other settings untouched) and renaming ours to `999-desktop-perf.conf` so
it always sorts last. Verified: all seven keys now read the intended values.

### C. `sed` delimiter collision — my error
`sed -E "s|^(vm\.swappiness|vm\.dirty_ratio|…)=|"` — the alternation pipes
*are* the delimiter. `sed: unknown option to 's'`. Switched to `@`, which
cannot appear in a sysctl key, and tested against a fixture before shipping.

### D. `BootOrder: 0000,0000,0001` — my error
`efibootmgr -c` already prepends the new entry before returning, so
concatenating NEW + OLD duplicated it. Deduped; the create path now dedupes
inline. The `\EFI\zbm⏎mlinuz.EFI` in the log was cosmetic only — `echo`
interpreting `\v` as a vertical tab. NVRAM bytes always decoded correctly.

### E. Stale CDN copies
`raw.githubusercontent.com` served a cached `omen-postfix.sh` three times, even
with `Cache-Control: no-cache` and a `?cb=` query string. Fixed by publishing
to **new filenames** (`omen-write-diag.sh`, `finder-setup.sh`,
`finder-verify.sh`). A path never fetched cannot be cached.

### Also corrected
* **Icons**: WhiteSur is Big Sur, i.e. macOS, not OS X. Operator rejected it.
  Now **La Capitaine** (El Capitan-era HIG — the last release actually named
  "OS X"), wrapped as `OSX-Gunmetal` inheriting the existing theme. Any
  WhiteSur directories are deleted. `ICONSET=catalina` available.
* **`libx265` does not exist in Void** — the package is `x265`.
* **`xbps-install` treats "already installed" as fatal**, aborting a batch.
  Packages are now installed one at a time.
* **The libx265.so.215 shlib break resolved itself** via the targeted
  `x265 libavcodec6 libheif` update (18 packages). `nemo-6.6.4_1` then
  installed cleanly.
* **Icons were cloned to `/tmp` then `cp -a`'d** — writing 6000 small files
  twice, straight into the degraded write path. Now cloned into place, and
  `./configure` is opt-in (`RUN_CONFIGURE=1`).
* **`Failed to init libxfconf`** — the guessed bus path
  `/run/user/1000/bus` is not where dbus listens. `finder-verify.sh` reads the
  real `DBUS_SESSION_BUS_ADDRESS` out of the running `xfsettingsd`'s
  `/proc/<pid>/environ` instead of guessing. The XML edit alone is unsafe:
  xfsettingsd holds it in memory and rewrites it on logout.

### Still open
* **Kernel selection.** dracut built `initramfs-6.18.41_1.img` and the new ZBM
  image was generated from `/boot/vmlinuz-6.18.41_1`, while the running kernel
  is `6.18.35-tkg-bore`. ZBM boots the highest version, so the next reboot
  lands on **stock**, losing BORE. Pin with `PIN_TKG=1 sh finder-verify.sh`.
* Wave 2 (vesktop GPU flags) not yet run — `vesktop.bin` was still at 98 %CPU.
* Disk wipe + unified pool, XMP 3733 check, and the OC steps remain
  operator-gated.

### Two of my own claims were wrong — corrected 12:26 UTC

**"The icon theme is a torn copy" — WRONG.** It was complete all along:
`10029` svg/png files, `index.theme` present, all of `actions animations apps
devices emblems emotes mimetypes panel places status`. The `ls | head -5` that
alarmed me showed `COPYING Credits.md LICENSE README.md Thanks.md` simply
because those sort alphabetically ahead of the directories. I read a normal
listing as damage. No re-clone was needed and none happened (the integrity
gate correctly declined to fire).

**"The next reboot lands on the stock kernel" — WRONG.** The pin was already
set before I ever raised the alarm:

```
--- ZBM kernel pin (empty = ZBM picks the highest version) ---
6.18.35-tkg-bore
```

`org.zfsbootmenu:kernel` was already `6.18.35-tkg-bore`, so ZBM was never
going to boot `6.18.41_1`. Running `PIN_TKG=1` re-wrote the identical value —
harmless, but it was not needed. The correct reading of that receipt is that
the boot dataset was already protected.

Worth noting for later: `/boot` carries six kernels and six initramfs images,
including a newer **`6.18.39-tkg-bore`**. The pin targets `6.18.35-tkg-bore`
(the running one) because the selector takes the first `*tkg*` match. Moving
to `6.18.39-tkg-bore` is a deliberate, separate step.

### Confirmed working after finder-verify
* `finder` `finder-zfs` `nemo` `yad` all resolve on PATH.
* Session bus found at `unix:path=/tmp/dbus-ayirgqdYRP` — nowhere near the
  `/run/user/1000/bus` I had guessed. `xfconf set OK`, `IconThemeName` now
  reads `OSX-Gunmetal` from xfconf itself, so xfsettingsd will not revert it.
* 13 `zfs-*.nemo_action` files installed alongside the stock Cinnamon actions.
* Thunar desktop entries hidden, `/usr/local/bin/thunar` shim in place.

The `finder-zfs` smoke test printing nothing is expected, not a fault: with no
args it defaults to `status`, which pipes through `yad`, and root had no
DISPLAY. Invoked from Nemo it inherits the user's session and renders.

---

## Final pass — `scripts/omen-final.sh`

One block, run as root, ending in a reboot. Order matters: vesktop first (so
the runaway processes are killed before anything else competes for I/O), disks
second, layout third, verification fourth, reboot last.

### Storage model — "saved on the pools, launched from the NVMe"

The NVMe keeps everything that governs **launch latency**: OS, binaries,
configs, dotfiles, the Steam client itself, shader caches and Proton
`compatdata` prefixes. The pools carry the **payload**. Same shape as the old
`tank -> /mnt/games`, just wider:

| Pool | Device | Mount | Holds |
|---|---|---|---|
| `nvme` | SN530 953 G | `/` | OS, apps, configs, Proton prefixes |
| `fast` | MX500 930 G | `/fast` | SSD game library, VM disks, work |
| `bulk` | 2×2 TB, 3.6 T | `/bulk`, `/mnt/games` | HDD library, media, archive |
| cache | SV300 224 G | L2ARC on `bulk` | read cache only, no data |

`fast/vm` gets `recordsize=64K` (matches qcow2 clusters) and `compression=off`
— VM images are already-compressed guest filesystems and lz4 just burns CPU on
them. `bulk` gets `recordsize=1M` for large media. `~/Games` symlinks to
`/mnt/games`. libvirt's image dir is relinked to `/fast/vm` only if it is
currently empty, otherwise it is left alone rather than risk moving live disks.

Steam libraries are **not** auto-registered — writing `libraryfolders.vdf` by
hand corrupts Steam's state often enough that it is not worth it. The
`steamapps/common` skeletons are created so Steam's *Settings → Storage → +*
picks them up immediately.

### vesktop

`ps` showed `vesktop.bin` at **98.2 %CPU**. Chromium blocklists the NVIDIA
proprietary driver for GPU rasterisation on X11, so Vesktop paints every frame
in software and uploads it. One saturated core starves compiz (8.0 %) and Xorg
(6.5 %) — which is why *other* applications went choppy too, not just Discord.

Fixed with a **user-level** `.desktop` override (the system copy is never
touched) carrying `--ignore-gpu-blocklist --enable-gpu-rasterization
--enable-zero-copy --disable-gpu-driver-bug-workarounds`. The awk injection was
tested for `%U` preservation and for idempotency on a second pass. Vesktop's
own `settings.json` `hardwareAcceleration` key is forced true, since it
overrides the command line.

Note this only became visible as *the* problem after the earlier fixes landed:
with a 4 GiB ARC and `ForceFullCompositionPipeline` stacked on compiz, the
choppiness had three independent causes and removing two of them left this one
exposed.

### Safety changes in this pass
* `zpool destroy` path no longer calls a blanket `zfs unmount -a` — it
  enumerates `tank`'s own datasets and unmounts only those. A blanket unmount
  on a live desktop was an unnecessary risk.

---

## The `HOME` bug — root cause of both vesktop failures

`su USER -c '...'` **without a dash does not reset `HOME`.** Every `asuser`
helper I shipped inherited root's environment. The operator's log said so
plainly and I did not read it as the cause:

```
Unable to open /root/.local/share/flatpak/exports/share/dconf/profile/user: Permission denied
MESA-LOADER: failed to open dri: /usr/lib/.../GL/lib/gbm/dri_gbm.so: Permission denied
```

vesktop ran **as `sd` but reading `/root`** — hence a blank config ("shows
defaults"), no dconf, and a failed DRI load that froze it. The real profile in
`~/.var/app/dev.vencord.Vesktop` was never touched. Fixed across all eight
scripts by exporting `HOME` / `USER` / `LOGNAME` / `XAUTHORITY`; verified no
`su` invocation is left without it.

## The GL extension skew was real

```
before: nvidia-595-84       org.freedesktop.Platform.GL.nvidia-595-84      1.4  system
host:   595.91.07
after:  nvidia-595-91-07    org.freedesktop.Platform.GL.nvidia-595-91-07   1.4  system
```

A Flatpak cannot see the host driver; it needs a version-matched GL extension.
The host moved 595.84 → 595.91.07 during the OpenCL work on 2026-08-25 and the
extension did not follow, so vesktop was on **llvmpipe software rendering**.
That, not Chromium's GPU blocklist, is why an Electron renderer sat at 98.2 %CPU.
GPU flags were deliberately **not** re-applied on top of the fix — one change
at a time, and the skew was the actual defect.

## Process substitution race

`exec > >(tee "$OUT")` returned before `tee` had flushed, so the capture file
did not exist when the next command read it. Replaced with `main() { … }` and a
single `main 2>&1 | tee "$OUT"`, which is deterministic and POSIX. Verified
against a fixture including failing and nonexistent commands.
