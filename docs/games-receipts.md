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
