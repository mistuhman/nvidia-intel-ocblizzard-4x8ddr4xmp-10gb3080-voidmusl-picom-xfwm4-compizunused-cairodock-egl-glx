# Games campaign — agent receipts (2026-08-22)

Bounded agents deployed per README.md start protocol. Facts carry sources; unverified items are marked `UNVERIFIED`.

## Void package availability (void-packages GitHub API, 2026-08-22)
- PRESENT: steam 1.0.0.87, wine 11.15, wine-gecko, wine-mono, winetricks 20260125, lutris 0.5.22, protonplus 0.6.4, gamescope 3.16.20, gamemode, nvidia, vulkan-loader, icoutils, cabextract, unzip, aria2, 7zip
- ABSENT: dxvk, vkd3d, umu-launcher, protonup-qt, proton-cachyos
- Consequence: DXVK via winetricks/manual; proton-cachyos via ProtonPlus (in void-packages) or manual install into `~/.local/share/Steam/compatibilitytools.d`

## WaW (T4)
- Base game: runs well via Steam + Proton; mods need manual placement into the game's compatdata prefix (`compatdata/10090/pfx/drive_c/users/steamuser/Local Settings/Application Data/Activision/CoDWaW/mods`). Source: reddit.com/r/WorldatwarCOD (2024-11-19)
- Plutonium T4: Wine prefix + winetricks `dotnet48 d3dcompiler_47`; Plutonium needs Wine 8.0.1+; **does not work under Steam Proton** per community reports. Source: forum.plutonium.pw/topic/33563
- Plutonium T4 full deps (shared with BO2): `dotnet48 d3dcompiler_47 d3dcompiler_43 vcrun2005 vcrun2008 vcrun2012 vcrun2019 d3dx11_42 d3dx11_43 msasn1 physx xact xact_x64 xinput corefonts gfw` + DXVK + `winecfg -v win10` + winbind. Sources: forum.plutonium.pw/topic/16438, topic/9652, topic/8261, topic/37097 (2026-06-23)

## BO1 (T5)
- Base game: works via Steam + Proton. MP/zombies: Plutonium supports BO1 (T5); install guide covers Windows + Linux (Lutris path or manual). Source: steamcommunity.com/sharedfiles/filedetails/?id=3265733297
- Plutonium rename trick: copy `plutonium.exe` as `BlackOps.exe` / `BlackOpsMP.exe` in the game dir as an alternate launch path (same guide).

## BO2 (T6, Plutonium)
- Plutonium launcher `plutonium.exe` from plutonium.pw; set game path inside launcher (e.g. `Z:\SteamLibrary\steamapps\common\Call of Duty Black Ops II`).
- Lutris community installer "Black Ops II (Plutonium)" exists; runner = wine, DXVK enabled, Esync on. Sources: forum.plutonium.pw topic/9652, topic/37097
- Launch env: `WINEESYNC=1`, `winecfg -v win10`, winbind (samba) required.

## BO3 (T7)
- t7patch: linux zip extracted into BO3 install dir; Steam launch options `WINEDLLOVERRIDES="dsound=n,b" %command%`; Proton 9.0-2 works; edit `t7patch.conf` (player name, friends only). Source: github.com/shiversoftdev/t7patch README (2025-03-17)
- t7x: alterware.dev; `download_depot 311210 311211 9084453472036406216` in Steam console replaces the exe; place t7 exe; covers full game + unlock all. Source: reddit.com/r/blackops3 (2026-03-23)
- boiii: abandonware after C&D; t7x is the reliable continuation. Do not run t7patch + boiii together (both patch the same install). Sources: reddit r/blackops3, r/linux_gaming

## CoD4 Promod
- cod4x client: latest 20.5 (cod4x.ovh downloads); Windows client runs under Wine; `install.cmd` run via `wine cmd.exe /C install.cmd`; Steam-based install path documented in cod4x-docs (github.com/callofduty4x/cod4x-docs/blob/master/cod4x-client/installation.md)
- Promod LIVE 220: `promod.github.io/releases/promodlive220_eu.zip` (or `_ne.zip`) → extract `pml220` into `Mods/`; launch `iw3mp.exe +set fs_game mods/pml220` (client) or with `+set promod_mode match_pb` (server); `wine explorer /desktop=COD4,2560x1440 iw3mp.exe` virtual-desktop variant. Source: babaei.net/blog (2018), forum.r/CoD4Promod (cod4x 20.5 update)
- Newer cod4x (21.x) notes: joining a 21.1 server auto-updates the client. Source: linuxmint forums (2023-12-06)

## Lunar Client (Minecraft) — "java invoke error"
- Official Linux = AppImage (lunarclient.com); 2025+ reports "AppImage files are no longer supported" for some installs. Source: reddit.com/r/linux_gaming (2025)
- Open-source alt: Lunar Client Qt (github.com/Youded-byte/lunar-client-qt) — needs Qt6/Qt5 + CMake 3.21+; agents feature; third-party launcher block workaround = LunarAntiAntiAgent.jar (source: lutris.net/games/lunar-client)
- Known fixes: clear `~/.lunarclient/offline/multiver` (stale cache), use custom JRE (GraalVM recommended), `__GL_THREADED_OPTIMIZATIONS=0` for NVIDIA. Sources: github.com/Youded-byte/lunar-client-qt README, AUR lunar-client comments
- UNVERIFIED: which launcher variant the operator runs (AppImage vs lunar-client-qt vs AUR-style) and the exact java invoke error — probe + error text needed.

## Proton-CachyOS / ProtonQT declutter
- proton-cachyos: AUR package; fastsync (older) / ntsync (newer, 2025-01+) implementations; ntsync needs kernel >= 6.14 with CONFIG_NTSYNC + `/dev/ntsync`; env-gated (`PROTON_USE_NTSYNC=1` for some versions). Sources: reddit.com/r/cachyos (2024-07-18), discuss.cachyos.org/t/ntsync-in-latest-proton-cachyos-wine-cachyos
- tkg kernels (6.18.35-tkg-bore on target) carry the ntsync patch; `/dev/ntsync` presence must be verified on target.
- Managers: ProtonUp-Qt and ProtonPlus (void: 0.6.4). ProtonPlus can install proton-cachyos with microarch selection (x86_64_v3) — useful for pinning one tuned version while system repos update. Sources: reddit r/cachyos (2025-11-29), discuss.cachyos.org
- CachyOS wiki guidance: prefer repo proton-cachyos (auto-updated, optimized for microarch); use a manager only for pinned versions. Source: wiki.cachyos.org/configuration/gaming
- Compile-from-source option: proton/wine-tkg from source with bore-tuned config (wine-tkg-git exposes ntsync options) — UNVERIFIED build path on Void, needs xbps-src or manual build; decide after probe receipts.

## Probe-1 receipts (operator paste, 2026-08-22) + wave-2 verification
- kernel 6.18.35-tkg-bore; `/dev/ntsync` present (crw-rw-rw- root root 10,262) - ntsync CONFIRMED
- installed: steam 1.0.0.85, wine 11.14, winetricks 20260125, gamescope 3.16.20, gamemode 1.8.2 (+32bit), MangoHud 0.8.2 (+32bit), nvidia 595.84 (dkms/firmware/gtklibs/libs/libs-32bit), gwe, nvtop; absent: lutris, protonplus, dxvk, vkd3d, umu-launcher, vulkaninfo, wine-32bit
- GPU: RTX 3080 10GB, driver 595.84, CUDA 13.2; session Xorg + compiz + cairo-dock; lunarclient process running (51MiB)
- filesystems: `/` = nvme/ROOT/void, 824G free; /mnt/games = tank/games zfs rw,noatime,xattr,posixacl,casesensitive, 281G free
- Steam library /mnt/games/SteamLibrary: CoD4 7940 + BO1 42700 fully installed; BO3 311210 has common-dir files but NO final appmanifest (dozens of appmanifest_*.acf.NNN.tmp for 311210/3354750/4000/730/284160 = interrupted manifest writes); WaW 10090 and BO2 202970 NOT installed; non-Steam MW2 2009 copy at /mnt/games/Call of Duty - Modern Warfare 2; other titles incl CS2 730, CS:S 240, GMod 4000, Quake family, The Finals 2073850
- compatibilitytools.d (both ~/.local/share/Steam and ~/.steam/steam paths): proton-cachyos 20260602-x86_64, 20260702-x86_64, 20260702-x86_64_v3, 20260703-x86_64_v3; steamapps/common: Proton 9.0 (Beta), Proton Hotfix, SteamLinuxRuntime sniper/soldier
- upstream check (gh api, 2026-08-22): CachyOS/proton-cachyos latest release tag `cachyos-11.0-20260703-slr` published 2026-07-22 with x86_64 and x86_64_v3 assets - the installed 20260703 build is ALREADY the newest; declutter = keep x86_64_v3 (pending lscpu avx2 confirm), remove the 3 older dirs
- Lunar Client = FLATPAK com.lunarclient.LunarClient (process /app/lunarclient/lunarclient; ~/.lunarclient and ~/Applications absent; data at ~/.var/app/com.lunarclient.LunarClient) - java invoke error is flatpak-side; probe2 fetches flatpak info + logs
- void-packages template facts (gh api, 2026-08-22): wine 11.15 rev1 is a single multilib package (`replaces="wine-32bit>=0"`, lib32depends pulls the 32-bit stack); samba 4.20.1 carries winbind in the main package (no samba-winbind template); vulkan-loader 1.4.350.1; vulkan-tools template ABSENT - no vulkaninfo on Void, so DXVK runtime is the functional vulkan test; samba withheld from the wave-2 root block (ntlm_auth fallback only if a game demands it)

## Wave-2 receipts (operator paste, 2026-08-24)

### games-probe2 (user shell, id -u = 1000)
- lscpu: i7-12700KF, 20 CPUs, flags incl avx2 avx_vnni vaes gfni, NO avx512 → **x86-64-v3 CONFIRMED**; 20260703 x86_64_v3 proton-cachyos build survives the declutter, v4 ruled out
- flatpak list: ProtonUp-Qt `net.davidotek.pupgui2` 2.15.1 installed (= the operator's "protonqt"); Prism Launcher 11.0.3 installed (Lunar fallback candidate); Lunar Client 3.7.15 = USER install, commit 3a683cb 2026-08-12, subject "Update lunar-client.appimage", runtime org.freedesktop.Platform 25.08
- Lunar data: `.lunarclient/jre` has TWO hashed jre dirs; `.java/fonts/17.0.3` + `17.0.18`; FOUR JVM fatal-error logs `hs_err_pid758/1629/2508/3054.log` under `.lunarclient/offline/multiver`; launcher logs at `.lunarclient/logs/launcher/`; game profile logs at `.lunarclient/profiles/1.8/logs/` (latest.log, ichor-boot.log)
- BO3 311210: `appmanifest_311210.acf` STILL absent; common dir contains ONLY 10 `BlackOps3.exe.BEYQBBUILD132.CL#13892626.<epoch>.dmp` crash dumps (epochs 1784829528–1785575727 ≈ 2026-07-23..2026-08-01) + `LPC` + `players` → **game files are GONE; full reinstall required before t7x/t7patch**
- CoD4 dir: iw3sp.exe, iw3mp.exe, __iw3sp, __iw3mp, Mods, PB, DirectX, Docs, d3dx9_34.dll, mss32.dll (+ .bck), cod4x-uninstall.exe, `Play CoD4 v1.7.lnk` → stock 1.7, cod4x previously uninstalled, installer re-applies
- `/mnt/games/Bottles` exists holding `GE-Proton10-34` (Bottles runner stash, not in Steam compatibilitytools list — untouched); `/mnt/games/local_share` = old relocated `.local/share` copy (no Steam subdir; archive, not live); `steam-compat`/`steam-combat` listed nothing (empty or stderr lost in paste)
- `df -h /mnt/games`: 741G size, 460G used, 281G avail (unchanged from probe-1)

### games-prereq-root (root shell)
- `wine` upgrade to 11.15 **FAILED**: `failed to download wine-common-11.15_1 signature from https://repo-default.voidlinux.org/current: Not Found` → stale local repodata; fix = `xbps-install -S` then retry (dispatched as w3-reposync-root.block). wine stays 11.14_1 (≥ Plutonium's Wine 8.0.1 minimum — acceptable). wine-mono + wine-gecko did NOT install (transaction aborted atomically)
- `vulkan-loader` already installed; `lib32-vulkan-loader` not found in pool — because Void names it **vulkan-loader-32bit** 1.4.350.1, ALREADY INSTALLED (32-bit DXVK loader side covered)
- cabextract 1.11 + unzip already installed; p7zip replaced by 7zip 26.02 (7z alternatives group created)
- `df -h /` = 922G size, 821G avail

## Wave-3 URL verification (2026-08-24)
- Plutonium launcher: `https://cdn.plutonium.pw/updater/plutonium.exe` — confirmed live in forum.plutonium.pw/topic/582 (official staff topic) and the r/CallofDutyWorldatWar Linux Wine guide (17rvfn2, 2023-11-10): prefix 32- or 64-bit, Wine 8.0.1+, `winetricks -q --force dotnet48` + `winetricks -q d3dcompiler_47`, place plutonium.exe in the prefix drive_c, run from there; "has not worked with any version of Proton"
- cod4x client: `https://cod4x.me/downloads/cod4x_client.zip` — confirmed in callofduty4x/cod4x-docs cod4x-client/installation.md (master): unpack `cod4x18_v17_9_client` folder next to iw3mp.exe, run `install.cmd` (wine cmd.exe /C on Linux), menu version changes 1.7 → 1.8; uninstall.cmd = rollback; "NEVER USE ROOT/SUPER USER FOR WINE COMMANDS"
- Promod LIVE 220: `https://promod.github.io/releases/promodlive220_eu.zip` (EU ruleset; `_ne.zip` variant exists) → `pml220` into `Mods/`; launch `iw3mp.exe +set fs_game mods/pml220`
- proton-cachyos release assets (gh api, 2026-08-24): named `proton-cachyos-11.0-<date>-slr-<arch>.tar.xz` (arm64/x86_64/x86_64_v3 per release; tags cachyos-11.0-20260602/20260601/20260702/20260703-slr); declutter rm uses date-anchored globs `proton-cachyos-*20260602*` / `proton-cachyos-*20260702*` which cannot match the 20260703 keeper and are silent no-ops if the dir names differ

