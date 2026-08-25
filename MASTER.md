{
    "schema": "arena-master-context.v1",
    "updated": "2026-08-25",
    "purpose": "Single compact context file for future agents. README.md bootstraps; this file is machine-readable project state, constraints, and active objective.",
    "repo": {
        "branchFixed": "arena/01a03599-nvidia-intel-ocblizzard-4x8ddr",
        "baseCommit": "7a8b9fd7cb26f58098686da46a267a0f90487bce",
        "priorSession": "arena/01a0277c branch merged to main as PR #33 (commit 7a8b9fd); session 01a03599 continues the same objective",
        "prLineTarget": 405,
        "docs": [
            "README.md",
            "MASTER.md",
            "ToDo.md"
        ],
        "files": {
            "README.md": "human bootstrap",
            "MASTER.md": "JSON context and constraints",
            "ToDo.md": "operator-directed work-infrastructure checklist",
            "scripts/": "target-facing installed desktop and migration utilities",
            "tools/": "agent-facing TypeScript utilities run by node"
        },
        "prException": {
            "allowedHere": true,
            "reason": "operator explicitly authorized this context/tooling conversion to exceed the normal PR line target in this chat only",
            "stillRequired": "future feature PRs return to prLineTarget unless operator explicitly overrides again"
        }
    },
    "interactionModel": {
        "truthOrder": [
            "operator report",
            "target command output",
            "repo files",
            "git history",
            "external web"
        ],
        "permission": {
            "agentOwned": [
                "repo reads",
                "sandbox authoring",
                "syntax checks",
                "commits to fixed branch"
            ],
            "operatorGated": [
                "target execution",
                "session changes",
                "visual judgement",
                "reboot gates"
            ],
            "operatorDirected": [
                "scope changes",
                "merges",
                "irreversible disk operations",
                "constraint overrides"
            ]
        },
        "agentUse": "Split into independent bounded agents. For hard problems, fan out one hypothesis or source set per agent, then merge only receipts.",
        "toolStyle": "TypeScript-first, zero dependency unless justified, deterministic stdout, small explicit functions, fail fast, no hidden policy in comments.",
        "deliverableShape": [
            "what changed",
            "receipts",
            "unverified limits",
            "gate",
            "next action"
        ],
        "operatorWorkflow": {
            "partnership": "admin-to-admin: operator direction is read literally, quoted when state changes, and checked against target receipts instead of assistant memory",
            "commandDelivery": "Agent prepares large filtered command blocks only after consulting MASTER.md, README.md, tools, repo state, and relevant prior target outputs.",
            "orchestration": [
                "fan out agents for context, source scraping, hypothesis checks, and paste verification",
                "collapse results into one pasteable block when independent work can be safely verified together",
                "keep risky or password-gated entry steps separate",
                "operator pastes target output back to the main model for attribution and next-step planning"
            ],
            "safety": [
                "every target-changing block names the pass/fail gate",
                "every reversible target change includes rollback before forward execution",
                "irreversible disk steps require explicit operator direction and current disk receipts",
                "commands are verified with paste-proof or a stricter purpose-built tool before delivery"
            ]
        }
    },
    "qualityGate": {
        "beforeDelivery": [
            "re-read activeObjective",
            "trace every claim to command/path/hash/operator quote/source",
            "check mentioned paths exist",
            "name exact source SHA for installs or patches",
            "re-issue config with tunable installs",
            "include rollback before forward target change",
            "name pass/fail gate"
        ],
        "afterOperator": [
            "quote actual verdict",
            "attribute cause before fix",
            "edit this JSON to true current state, not append contradictions"
        ]
    },
    "hardConstraints": {
        "delivery": [
            "deliver files by heredoc or git checkout, not curl",
            "gate target file creation with ls -l",
            "no unanchored pgrep -f",
            "run df -h / before diagnosing unexplained rc=1",
            "do not paste JavaScript into shell"
        ],
        "targetSafety": [
            "no VT switching advice",
            "picom stays masked",
            "no config rewrite by tools that do not fully model the file",
            "never patch installed copy whose SHA differs from repo HEAD",
            "do not destabilize WM for wallpaper",
            "never delete or glob-move ~/.bitcoin; touch only with client stopped"
        ],
        "consolePaste": [
            "root shell entry is separate from root command block",
            "target web console may escape < > & and stop after partial paste",
            "root blocks start with id -u",
            "one command per line",
            "avoid chaining, redirects, ampersands, and quotes when possible",
            "xbps-install uses -y"
        ],
        "process": [
            "one objective per PR unless operator overrides",
            "use node tools/pr-budget.ts main 405 before delivery",
            "never switch or push another branch"
        ]
    },
    "machines": {
        "sandbox": {
            "has": [
                "node v22.22.3 running .ts directly",
                "npm",
                "python3",
                "git",
                "gh",
                "jq"
            ],
            "lacks": [
                "GPU",
                "X server",
                "ffmpeg",
                "chromium",
                "xvfb-run"
            ],
            "network": "repology.org and Void mirrors filtered; use GitHub API for void-packages facts"
        },
        "target": {
            "user": "sd",
            "os": "Void Linux glibc (ZFS root nvme/ROOT/void via ZBM since 2026-08-21; repo name still musl)",
            "kernel": "6.18.35-tkg-bore",
            "hardware": [
                "Intel CPU",
                "NVIDIA RTX 3080 10GB",
                "32GB DDR4 XMP",
                "dual monitor 4480x1440"
            ],
            "paths": {
                "workspace": "/home/sd/.local/share/xmb-wave/",
                "bakeOutput": "/mnt/games"
            },
            "disks": {
                "nvme0n1": "953.9G whole-disk setup: p1 ESP 512M vfat (ZBM Boot0002/0008, UUID 5010-EA01) + rest one zfs pool nvme with root dataset nvme/ROOT/void (lean, 824G free)",
                "sda": "1.8T Sabrent USB3 HDD (5000M uas, rear 10G port): sda1 NTFS label 50 (1.1T archive backup incl nvme-games.tar 555G) + sda2 zpool tank (766G) with tank/games mounted at /mnt/games (460G post-lz4)"
            }
        }
    },
    "packageFacts": {
        "compiz-reloaded": "0.8.18",
        "cairo-dock": "3.6.2",
        "xwinwrap": "0.9",
        "mpv": "0.41.0",
        "ffmpeg6": "6.1.6 preferred",
        "chromium": "151.x musl headless viable",
        "nvidia": "595.84 nonfree",
        "zfs": "2.4.3 DKMS, zfs-zed service only",
        "zfsbootmenu": "3.1.0 generate-zbm",
        "opendoas": "6.8.2; package doas absent",
        "nftables": "1.1.5",
        "suricata": "8.0.6 orphaned, no suricata-update",
        "audit": "4.2.1",
        "absent": [
            "plain compiz",
            "fusion-icon",
            "ffmpeg7",
            "snort",
            "doas package"
        ]
    },
    "desktopState": {
        "mission": "Move daily-driver XFCE from xfwm4+picom to compiz-reloaded+cairo-dock with headless-baked PS3-XMB wallpaper while staying reversible.",
        "compiz": "login WM accepted; use ccsm-safe; Detect Outputs and Detect Refresh Rate off; golden profile af457926; post-recovery b94b49e0; __GL_YIELD=USLEEP mattered for smoothness.",
        "theme": "gunmetal Emerald and GTK3 accepted and frozen; depth is function, flatness failed.",
        "bake": "three deterministic 60s 4480x1440 HEVC loops accepted: sleep, main-red, work-monochrome.",
        "wallpaper": "accepted bare layer: one sticky input-transparent xwinwrap plus one mpv, gpu-next, nvdec-copy, 10-11% decode.",
        "viewportSwitcher": "in-repo deterministic latest-wins controller is sandbox-proven but target trial waits until desktop performance baseline is fixed.",
        "performance": "parked separate objective; measure frame time, GPU/CPU, VRAM, clocks, and power before tuning. Gate is numeric consistency plus operator smoothness verdict."
    },
    "wallpaperConstraints": [
        "xfdesktop Desktop windows obscure bare layer; do not simply restart xfdesktop",
        "mpv --wid requires equals form and mpv-xwinwrap-shim",
        "use nvdec-copy; never --hwdec=auto",
        "shell/xprop crossfade path retired; controller exits 2; autostart hidden",
        "same-role viewport hops pulse blur only, not dissolve",
        "NVENC H.264 cannot encode 4480 width; HEVC can"
    ],
    "bootRecovery": [
        "black before display manager is boot-level",
        "blacklist all NVIDIA modules: module_blacklist=nvidia,nvidia_drm,nvidia_modeset,nvidia_uvm",
        "init=/bin/sh recovery exits with sync then echo b to sysrq-trigger",
        "read real cmdline from dmesg",
        "strip grub, modprobe, dracut add_drivers, hostonly inclusion, and nvidia-drm modeset layers",
        "gate lsinitrd nvidia ko count equals zero",
        "touch /etc/sv/lightdm/down for tty beachhead",
        "backup every target write to dated /root/*.bak"
    ],
    "activeObjective": {
        "id": "games-cod-plutonium-launchers",
        "summary": "OPERATOR SHIFT 2026-08-25: weekday focus is WORK ONLY; the games campaign is PARKED until the operator resumes it (likely weekend) because the wave-3 target run ended in an operator reboot with unknown partial state. Active weekday objective per ToDo.md: post-reboot stability probe + receipt-based cleanup of wave-3 leftovers, desktop performance baseline, parked infrastructure backlog. PARKED GAMES OBJECTIVE (resume via probe receipt, never a blind re-paste): get WaW, BO1, BO2 (Plutonium), BO3 (boiii or t7x) running; get CoD4 Promod launchers working as the reward; fix Lunar Client (Minecraft) java invoke error; declutter ProtonQT and land the best Proton-CachyOS tuned for the 6.18.35-tkg-bore kernel (fastsync/ntsync feature match), or compile a tuned Proton from source.",
        "operatorQuotes": [
            "deploy agents to follow and read README.md and MASTER.md in order to add the ToDo.md task of getting waw, bo1, bo2(plutonium), bo3 (boiii or t7x)",
            "aswell as getting launchers for cod4 promod and whatnot working, as a treat for finishing the tasks",
            "also need to fix lunar launcher and proton cachyos as tkg bore is already built with it its just that protonqt has a lot of versions",
            "operator answer 2026-08-22: lunar launcher = Lunar Client (Minecraft); failure = java invoke error",
            "operator answer 2026-08-22: protonqt fix = declutter version list and get the best tuned proton for the bore kernel matching features and every specific thing, or compile a new proton from source",
            "operator directive 2026-08-25: kinda messed up, had to reboot on those commands. just clean up, wipe the ToDo.md and add tasks to focus on work only as its the week"
        ],
        "currentState": [
            "MIGRATION COMPLETE 2026-08-21 (carried, durable): findmnt / = nvme/ROOT/void zfs; BootCurrent 0002 NVMe ZBM hands-off; BootOrder 0002,0008; tank/games 460G self-mounted at /mnt/games at boot; pools nvme+tank ONLINE no errors; nvme root 99G used 824G free; sda1 NTFS 50 holds nvme-games.tar 555G backup",
            "operator opened topic 2026-08-22: ToDo.md rewritten with the games/launcher checklist; MASTER activeObjective switched from phase7-zfs-doas-hardening to games-cod-plutonium-launchers; phase7 leftovers parked",
            "agent research 2026-08-22 (bounded web agents; full receipts docs/games-receipts.md): WaW/BO1/BO2 run via Steam+Proton and/or Plutonium (T4/T5/T6) under plain Wine with winetricks deps (dotnet48, d3dcompiler_47/43, vcrun2005/2008/2012/2019, d3dx11_42/43, msasn1, physx, xact/xact_x64, xinput, corefonts, gfw) + DXVK; community consensus: Plutonium does NOT run under Steam Proton - use a plain Wine prefix (Void wine 11.15)",
            "BO3 path: t7patch (github.com/shiversoftdev/t7patch) - extract linux zip into BO3 dir, Steam launch options WINEDLLOVERRIDES=dsound=n,b, Proton 9.0-2; or t7x from alterware.dev (steam depot 311210/311211 9084453472036406216 replaces exe); boiii is abandonware after C&D, t7x is the maintained continuation",
            "CoD4 Promod path: cod4x client latest 20.5 (cod4x.ovh) under wine + Promod LIVE 220 (promod.github.io/releases/promodlive220_eu.zip) into Mods/pml220; launch iw3mp.exe with +set fs_game mods/pml220; wine explorer virtual-desktop variant documented",
            "Void package availability 2026-08-22 (void-packages GitHub API): PRESENT steam 1.0.0.87, wine 11.15, wine-gecko, wine-mono, winetricks 20260125, lutris 0.5.22, protonplus 0.6.4, gamescope 3.16.20, gamemode, nvidia, vulkan-loader, icoutils, cabextract, unzip, aria2, 7zip; ABSENT dxvk, vkd3d, umu-launcher, protonup-qt, proton-cachyos - DXVK via winetricks/manual; proton-cachyos via ProtonPlus or manual install into ~/.local/share/Steam/compatibilitytools.d",
            "kernel/game-stack fact: tkg kernels (6.18.35-tkg-bore) carry the ntsync patch - kernel >= 6.14 exposes /dev/ntsync; proton-cachyos gates fastsync/ntsync behind env vars (PROTON_USE_NTSYNC etc); /dev/ntsync presence on target must be confirmed by probe before choosing the tuned Proton build",
            "Lunar Client (Minecraft) java invoke error: candidate causes from research - stale ~/.lunarclient/offline/multiver cache, missing/custom JRE (GraalVM recommended), AppImage support removal reports 2025+, third-party launcher block (LunarAntiAntiAgent.jar for lunar-client-qt); AUR lunar-client notes NVIDIA __GL_THREADED_OPTIMIZATIONS=0 fix; target receipts needed to pick the fix",
            "ProtonQT declutter plan: probe inventories all Proton versions (Steam compatibilitytools.d, steamapps/common, ProtonPlus-managed); prune to one tuned build matching bore kernel features (ntsync/fastsync, DLSS/upscalers, wayland/wow64) or compile proton/wine-tkg from source with bore-tuned config",
            "probe-1 RECEIVED 2026-08-22 (operator paste): kernel 6.18.35-tkg-bore; /dev/ntsync present world-rw (10,262) so the ntsync path is CONFIRMED; installed steam 1.0.0.85, wine 11.14, winetricks 20260125, gamescope 3.16.20, gamemode 1.8.2, MangoHud 0.8.2, nvidia 595.84 full stack incl 32bit libs; NOT installed lutris, protonplus, dxvk, vkd3d, umu-launcher, vulkaninfo; RTX 3080 driver 595.84 CUDA 13.2; / 824G free; tank/games 281G free zfs rw,noatime at /mnt/games",
            "probe-1 game inventory: CoD4 7940 and BO1 42700 fully installed in /mnt/games/SteamLibrary; BO3 311210 has common-dir files but NO final appmanifest (only dozens of appmanifest .acf.NNN.tmp leftovers for 311210/3354750/4000/730/284160 = interrupted Steam manifest writes; clean only with Steam stopped, wave-3); WaW 10090 and BO2 202970 NOT installed; non-Steam MW2 2009 copy at /mnt/games/Call of Duty - Modern Warfare 2; Steam built-in Proton 9.0 Beta + Proton Hotfix present",
            "probe-1 Proton inventory: compatibilitytools.d holds 4 proton-cachyos builds (20260602 x86_64, 20260702 x86_64, 20260702 x86_64_v3, 20260703 x86_64_v3); gh check 2026-08-22: latest CachyOS/proton-cachyos release = cachyos-11.0-20260703-slr published 2026-07-22, so the installed 20260703 x86_64_v3 is ALREADY the newest build - declutter = prune to that one (rm 3 older dirs, user-level, wave-3 after lscpu confirms avx2 for v3)",
            "probe-1 Lunar inventory: Lunar Client is the FLATPAK com.lunarclient.LunarClient (running process /app/lunarclient/lunarclient; data at /home/sd/.var/app/com.lunarclient.LunarClient; ~/.lunarclient absent) - the java invoke error is flatpak-side; probe2 (flatpak info + log find) picks the fix",
            "wave-2 dispatched 2026-08-22: etc/games-probe2.block (user, read-only: lscpu CPU microarch, flatpak inventory, lunar logs, BO3/CoD4 dirs, /mnt/games prefix candidates) + etc/games-prereq-root.block (root: wine 11.15 + wine-mono/gecko, vulkan-loader + lib32-vulkan-loader, cabextract/unzip/p7zip; rollback line included; samba withheld as named ntlm_auth fallback); void-packages template facts via gh: wine 11.15 rev1 is one multilib package replacing wine-32bit, samba-winbind and vulkan-tools templates ABSENT",
            "session 01a03599 opened 2026-08-24: prior branch arena/01a0277c merged to main as PR #33 (7a8b9fd); wave-2 blocks re-verified (paste-proof PASS x2, test-all PASS, pr-budget PASS at 0 changed lines) and re-presented to operator; BOTH WAVE-2 RECEIPTS RECEIVED later the same day (operator paste) - gate cleared, wave-3 authorized",
            "wave-2 user receipt 2026-08-24: lscpu = i7-12700KF 20 CPUs with avx2 avx_vnni vaes gfni, NO avx512 = x86-64-v3 confirmed (v3 proton-cachyos build is the declutter survivor, v4 ruled out); flatpaks: ProtonUp-Qt net.davidotek.pupgui2 2.15.1 IS installed (this is the operator's protonqt), Prism Launcher 11.0.3 present as Lunar fallback; Lunar flatpak = USER install 3.7.15 commit 3a683cb dated 2026-08-12 wrapping lunar-client.appimage on runtime 25.08; lunar data tree has TWO hashed jre dirs under .lunarclient/jre, .java/fonts 17.0.3+17.0.18, and FOUR JVM fatal-error logs hs_err_pid758/1629/2508/3054.log under .lunarclient/offline/multiver - concrete crash artifacts for the java invoke error",
            "wave-2 user receipt dirs: BO3 311210 appmanifest STILL absent and the common dir holds ONLY BlackOps3.exe crash dumps (BEYQBBUILD132 CL#13892626, dump-name epochs 2026-07-23 to 2026-08-01) plus LPC and players dirs - the actual BO3 game files are GONE, a full reinstall is required before any t7x/t7patch work; CoD4 dir = iw3sp.exe iw3mp.exe __iw3sp __iw3mp Mods PB DirectX Docs d3dx9_34.dll mss32.dll mss32.dll.bck cod4x-uninstall.exe Play CoD4 v1.7.lnk = stock 1.7 with cod4x previously removed (installer re-applies); /mnt/games/Bottles exists holding GE-Proton10-34 runner (Bottles stash, not in the Steam compatibilitytools list - left alone); /mnt/games/local_share = old relocated copy of a .local/share (no Steam subdir, archive not live); steam-compat and steam-combat listed nothing (empty dirs or stderr lost in paste); df /mnt/games = 741G size 281G avail unchanged",
            "wave-2 root receipt 2026-08-24: wine upgrade to 11.15 FAILED with: failed to download wine-common-11.15_1 signature - Not Found = stale local repodata (fix: xbps-install -S then retry, dispatched as w3-reposync-root.block; wine-mono and wine-gecko also did NOT install since that transaction aborted; wine stays 11.14_1 which already exceeds the Plutonium Wine 8.0.1 minimum); vulkan-loader 1.4.350.1 AND vulkan-loader-32bit 1.4.350.1 were ALREADY installed (Void names 32-bit packages with -32bit suffix, lib32-vulkan-loader does not exist in the pool - the wave-2 guess was wrong and harmless); cabextract 1.11 and unzip already present; p7zip replaced by 7zip 26.02; df / = 922G 821G avail",
            "wave-3 dispatched 2026-08-24 after the gate cleared: six blocks in etc/ - w3-reposync-root.block (root: xbps -S retry wine 11.15+mono+gecko), w3-proton-declutter.block (rm the three older proton-cachyos dirs by date-anchored glob, keep 20260703 x86_64_v3, ProtonUp-Qt reinstalls = rollback), w3-lunar-logs.block (read-only head/tail of the 4 hs_err logs + launcher main.log + 1.8 profile ichor-boot/latest logs + jre listing; attribute cause before fix), w3-steam-tmp-clean.block (Steam fully quit first; find -delete the appmanifest tmp swarm; list real manifests incl 10090/202970 presence), w3-plutonium-prefix.block (WINEPREFIX=/mnt/games/plutonium/pfx, win10 corefonts vcrun2019 d3dcompiler_47 dotnet48, WINEDLLOVERRIDES=mscoree,mshtml= to suppress mono/gecko popups, plutonium.exe from cdn.plutonium.pw/updater/plutonium.exe placed at drive_c per the r/CoDWaW Linux guide; DXVK deliberately deferred to wave-4), w3-cod4x-promod.block (dedicated prefix /mnt/games/prefixes/cod4x, cod4x_client.zip from cod4x.me/downloads, install.cmd via wine cmd.exe, promodlive220_eu.zip into Mods); all six PASS block-lint --target-console and paste-proof --target-console; URL verification 2026-08-24: plutonium launcher URL confirmed live on forum.plutonium.pw/topic/582, cod4x zip URL + cod4x18_v1 client folder + install.cmd flow confirmed in callofduty4x/cod4x-docs installation.md, proton-cachyos release assets named proton-cachyos-11.0-DATE-slr-ARCH.tar.xz per gh api",
            "operator report 2026-08-25 (truth order: operator report first): the wave-3 run on the target messed up partway and the operator HAD TO REBOOT; NO block outputs came back, so which of the six blocks ran and how far is UNKNOWN - every line that follows treats wave-3 target state as unverified; nothing is cleaned up or resumed blind; a read-only probe (etc/w3-postreboot-probe.block) records the true state when the operator has 2 minutes",
            "operator directive 2026-08-25: ToDo.md WIPED and rewritten work-only for the week (stability recovery, desktop performance baseline, infrastructure backlog: doas hardening, durable logging, Tier-2 USB; optional polish items listed but not prioritized); games campaign PARKED until operator resumes (weekend); wave-4 blocks frozen; the six w3-*.block files stay in etc/ for resume reference but must NOT be re-pasted blindly - resume goes through the probe receipt first"
        ],
        "nextGateAskFirst": "Gate 2026-08-25 (work week): optional read-only paste of etc/w3-postreboot-probe.block (user shell, ~2 min) records post-reboot pool/boot health plus exactly what wave-3 left behind; the cleanup block is authored ONLY from that receipt - no blind deletes. Games wave-4 stays frozen until the operator explicitly resumes (weekend); the six w3-*.block files must not be re-pasted blindly. Weekday work proceeds per ToDo.md: stability probe, receipt-based cleanup, desktop performance baseline, infrastructure backlog (doas hardening, durable logging, Tier-2 USB).",
        "handoffFixUnconfirmed": [
            "Plutonium under Steam Proton reportedly does not work; the plain-Wine-prefix route is dispatched (w3-plutonium-prefix.block) - unconfirmed on this target until winetricks list-installed + first launcher run receipts",
            "Lunar Client java invoke error now has concrete artifacts (4 hs_err JVM crash logs under .lunarclient/offline/multiver) - root cause attribution pending the w3-lunar-logs receipt; fix follows in wave-4",
            "BO3 common dir holds only crash dumps + LPC + players: game files absent - full Steam reinstall required before t7x/t7patch; tmp manifest swarm cleanup dispatched (w3-steam-tmp-clean.block, receipt pending)",
            "wine 11.15 upgrade failed once on stale repodata (sig Not Found); retry dispatched (w3-reposync-root.block); wine 11.14 fallback is acceptable and blocks nothing",
            "operator acceptance of t7x over boiii still to confirm at BO3 staging (boiii C&D'd; t7x maintained continuation)"
        ],
        "bootGate": "MIGRATION COMPLETE 2026-08-21 (carried, durable): bootGate2 + persistence PASS - operator verdicts: i booted, pressed escape for zbm boot menu upon turning on. and saw the nvme dir, it worked; just rebooted and let it do its thing; findmnt / = nvme/ROOT/void; BootCurrent 0002 direct NVMe ZBM; BootOrder 0002,0008; tank/games 460G self-mounted at boot; pools nvme+tank ONLINE no errors. games-probe.block RECEIVED 2026-08-22; wave-2 receipts RECEIVED 2026-08-24; wave-3 target run INTERRUPTED - operator rebooted mid-run 2026-08-25 (cause unattributed, no receipts); post-reboot pool/boot health check pending via etc/w3-postreboot-probe.block before any further target action.",
        "afterBootGate": [
            "probe target user-level with etc/games-probe.block and paste full output",
            "inventory CoD game files on /mnt/games before any download (SteamLibrary restored 2026-08-21 may already hold WaW/BO1/BO2/BO3)",
            "install stack per game: WaW, BO1, BO2-Plutonium (Wine prefix + winetricks + DXVK), BO3-t7x (or boiii) via Proton, CoD4 Promod (cod4x 20.5 + Promod LIVE 220)",
            "fix Lunar Client java invoke error per probe findings",
            "declutter ProtonQT; land tuned proton-cachyos for the bore kernel (or compile from source)"
        ],
        "lessons": [
            "console paste hygiene: target web console escapes < > & and drops trailing output - use echo tail-trick, avoid chaining/quotes, one command per line",
            "USB port moves on this rig rename sd nodes under live mounts - power off before moving disks",
            "ntfs-3g FUSE wedges on sustained reads after hot replug - use kernel ntfs3 for big NTFS reads",
            "firmware self-prunes dead-ESP NVRAM entries and self-enumerates EFI/BOOT fallback; efibootmgr -o order is advisory on this firmware",
            "hard rule from operator 2026-08-21: never send a second wave of target commands until the first wave output has arrived",
            "ZFS lz4 saved about 17pct on the 555G games archive restore",
            "escaped globs in pasted blocks: backslash-star works for find patterns (find -iname \\*lunar\\*) but defeats ls glob expansion (ls ...appmanifest_\\* returned cannot-access while the plain dir listing held the data) - for ls use a bare unquoted glob like Call\\* or list the parent dir",
            "xbps transaction error: failed to download package signature - Not Found from the mirror = stale local repodata; run xbps-install -S to re-sync before retrying the install (wave-2 root receipt 2026-08-24)",
            "Void names 32-bit packages with a -32bit suffix (vulkan-loader-32bit 1.4.350.1), not a lib32- prefix; lib32-vulkan-loader does not exist in the pool (wave-2 root receipt 2026-08-24)"
        ],
        "knownRisks": [
            "Plutonium + DXVK replaces DLLs; Plutonium anti-cheat flags DLL replacement - community reports no bans for stock DXVK, risk remains",
            "32-bit CoD titles on glibc Void need multilib; vulkan-loader + vulkan-loader-32bit 1.4.350.1 CONFIRMED installed (wave-2 root receipt 2026-08-24), so the 32-bit DXVK loader side is covered",
            "ntsync device CONFIRMED present (/dev/ntsync world-rw on 6.18.35-tkg-bore); proton-cachyos ntsync may still be env-gated per build - verify launch env at wave-3 before relying on it",
            "boiii is C&D'd/abandonware - prefer t7x; do not run t7patch + boiii together (both patch the same BO3 install)",
            "Steam library on ZFS tank/games: CoW with heavy writes; keep steamapps and wine prefixes on tank/games, not the nvme root pool",
            "Steam appmanifest .acf.NNN.tmp swarms (311210/3354750/4000/730/284160) are interrupted manifest writes - delete only with Steam fully stopped, wave-3",
            "wave-3 target run 2026-08-24/25 ended in an operator reboot with NO receipts; which blocks ran is unknown - possible causes include winetricks dotnet48 spawning GUI installer windows over a long unattended paste, but this is UNATTRIBUTED; future wine-heavy steps go in smaller per-step blocks and are re-gated on the postreboot probe receipt before anything resumes"
        ]
    },
    "parked": [
        "phase7 leftovers (operator direction only): doas hardening / sudo removal decision (base-system + testdisk reverse-depend sudo), durable machine logging, network control/interception",
        "menu opacity via obs plugin; operator go-ahead only",
        "M18 icon stitching and UI sound after switcher direction",
        "Tier-2 USB work",
        "xfce4-screensaver XMB Sleep Wave installed and selected",
        "Scale with title filter is correct mission-control answer; one-big-cube rejected"
    ]
}
