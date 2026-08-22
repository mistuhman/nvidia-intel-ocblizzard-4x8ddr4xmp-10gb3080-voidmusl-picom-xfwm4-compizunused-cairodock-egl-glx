{
    "schema": "arena-master-context.v1",
    "updated": "2026-08-22",
    "purpose": "Single compact context file for future agents. README.md bootstraps; this file is machine-readable project state, constraints, and active objective.",
    "repo": {
        "branchFixed": "arena/01a02884-nvidia-intel-ocblizzard-4x8ddr",
        "baseCommit": "5e96c88153636ef6824b63d957c44e214b3c4689",
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
        "compiz": "ACCEPTED live 2026-08-22 operator quote compiz working after wave-10. Cause: __GL_YIELD=USLEEP on NVIDIA 595.84 made compiz --replace exit rc0. Launcher rewritten to exec /usr/bin/compiz --replace ccp; backup ~/.local/bin/compiz-session.bak.noneyield; persist still Client0=compiz-session. Emerald 6454 up. Do not close the start TTY. Next reboot is the login gate.",
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
        "id": "compiz-wound-2026-08-22",
        "summary": "Restore Compiz as the daily XFCE WM after a reboot-persistent failure. Attribute cause from target receipts before any live --replace. Do not guess a killer. Games campaign is parked until Compiz is back.",
        "operatorQuotes": [
            "read README.md and MASTER.md and get compiz working, it messed up from some unknown error that persisted across reboot, think thoroughly and actually communicate with me. some previous chats have had errors in thinking and its not working out well for me",
            "operator answer 2026-08-22: both screens work under xfwm4",
            "COMPIZ WORKING",
            "something broke, had to reboot. after booting, compiz loaded weirdly and worked for a second? also now its not working again but i can open another terminal and run the working command but fixed",
            "didnt work, apply the prompt i said to you that influenced the other command working",
            "deploy agents to follow and read README.md and MASTER.md in order to add the ToDo.md task of getting waw, bo1, bo2(plutonium), bo3 (boiii or t7x)",
            "aswell as getting launchers for cod4 promod and whatnot working, as a treat for finishing the tasks",
            "also need to fix lunar launcher and proton cachyos as tkg bore is already built with it its just that protonqt has a lot of versions",
            "operator answer 2026-08-22: lunar launcher = Lunar Client (Minecraft); failure = java invoke error",
            "operator answer 2026-08-22: protonqt fix = declutter version list and get the best tuned proton for the bore kernel matching features and every specific thing, or compile a new proton from source"
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
            "compiz-wound wave-3 RECEIVED 2026-08-22: persist ARMED (live xfconf + xml Client0=compiz-session); verify VERDICT SAFE; SaveOnExit=false SessionName=Default; launcher execs env __GL_YIELD=USLEEP /usr/bin/compiz --replace ccp after repair --floor; xfce-wm-recover would set Client0=xfwm4 then nohup xfwm4 --replace (current xfwm4 is --sm-client-disable --replace so recover did NOT start it and did NOT disarm persist); xfce4-session 1527 ppid 1522 since 06:43:28; xfwm4 4183 ppid 1 since 07:31:30; clean-room.rc=0 at 07:31; profile [core] floor+7 keys OK, s0_outputs 2560x1440+0+0;1920x1080+2560+0; golden still af457926; no recover/revert autostart",
            "OPERATOR OVERRIDE 2026-08-22: Compiz recovery takes the gate. Games wave-2 receipts (games-probe2 + games-prereq-root) are still unpaid and stay parked.",
            "compiz-wound wave-2 RECEIVED 2026-08-22: xfwm4 pid 4183 --sm-client-disable --replace is WM; no compiz/emerald/picom; wmctrl Name Xfwm4; / 823G free; NVIDIA 595.84 GLX direct yes; compiz --version 0.8.18 rc0; strace absent so live --replace never ran; repair log already 7/7 + floor OK; gamma 1:1:1 DPMS disabled; operator later: both screens work under xfwm4",
            "compiz-wound source check 2026-08-22 (compiz-reloaded v0.8.18 main.c): startup failures return 1; eventLoop then return 0; SIGTERM/SIGINT set shutDown; SIGSEGV execs xfwm4 --replace after printing Launching fallback window manager. Current xfwm4 flags include --sm-client-disable so this is NOT that fallback.",
            "probe-1 RECEIVED 2026-08-22 (operator paste): kernel 6.18.35-tkg-bore; /dev/ntsync present world-rw (10,262) so the ntsync path is CONFIRMED; installed steam 1.0.0.85, wine 11.14, winetricks 20260125, gamescope 3.16.20, gamemode 1.8.2, MangoHud 0.8.2, nvidia 595.84 full stack incl 32bit libs; NOT installed lutris, protonplus, dxvk, vkd3d, umu-launcher, vulkaninfo; RTX 3080 driver 595.84 CUDA 13.2; / 824G free; tank/games 281G free zfs rw,noatime at /mnt/games",
            "probe-1 game inventory: CoD4 7940 and BO1 42700 fully installed in /mnt/games/SteamLibrary; BO3 311210 has common-dir files but NO final appmanifest (only dozens of appmanifest .acf.NNN.tmp leftovers for 311210/3354750/4000/730/284160 = interrupted Steam manifest writes; clean only with Steam stopped, wave-3); WaW 10090 and BO2 202970 NOT installed; non-Steam MW2 2009 copy at /mnt/games/Call of Duty - Modern Warfare 2; Steam built-in Proton 9.0 Beta + Proton Hotfix present",
            "probe-1 Proton inventory: compatibilitytools.d holds 4 proton-cachyos builds (20260602 x86_64, 20260702 x86_64, 20260702 x86_64_v3, 20260703 x86_64_v3); gh check 2026-08-22: latest CachyOS/proton-cachyos release = cachyos-11.0-20260703-slr published 2026-07-22, so the installed 20260703 x86_64_v3 is ALREADY the newest build - declutter = prune to that one (rm 3 older dirs, user-level, wave-3 after lscpu confirms avx2 for v3)",
            "probe-1 Lunar inventory: Lunar Client is the FLATPAK com.lunarclient.LunarClient (running process /app/lunarclient/lunarclient; data at /home/sd/.var/app/com.lunarclient.LunarClient; ~/.lunarclient absent) - the java invoke error is flatpak-side; probe2 (flatpak info + log find) picks the fix",
            "wave-2 dispatched 2026-08-22: etc/games-probe2.block (user, read-only: lscpu CPU microarch, flatpak inventory, lunar logs, BO3/CoD4 dirs, /mnt/games prefix candidates) + etc/games-prereq-root.block (root: wine 11.15 + wine-mono/gecko, vulkan-loader + lib32-vulkan-loader, cabextract/unzip/p7zip; rollback line included; samba withheld as named ntlm_auth fallback); void-packages template facts via gh: wine 11.15 rev1 is one multilib package replacing wine-32bit, samba-winbind and vulkan-tools templates ABSENT"
        ],
        "nextGateAskFirst": "Compiz live accepted 2026-08-22 (operator: compiz working). Leave the start terminal open. Optional reboot later to confirm login without __GL_YIELD. Games stay parked until the operator says otherwise.",
        "handoffFixUnconfirmed": [
            "Plutonium under Steam Proton reportedly does not work; plain Wine prefix is the known-good route - unconfirmed on this target until probe/install receipts",
            "boiii is abandonware/C&D'd; t7x (alterware.dev) is the maintained BO3 client - operator acceptance of t7x over boiii to confirm",
            "Lunar Client java invoke root cause still unconfirmed, now narrowed to the flatpak variant com.lunarclient.LunarClient - fix picked after probe2 log receipts",
            "BO3 Steam registration broken (no final appmanifest_311210.acf) - the t7x path needs a clean Steam-side BO3 state first; approach decided after probe2 dir receipts",
            "CPU x86-64-v3 fitness unconfirmed until lscpu receipt (MASTER says Intel DDR4 so likely fine) - gates which proton-cachyos build survives the declutter",
            "wine 11.15 multilib claim verified in template (single wine package replaces wine-32bit) but unverified on target until the games-prereq-root receipts and a 32-bit exe run",
            "Compiz --replace via setsid produced 0-byte log and never took WM; cause unconfirmed (crash before stdio, exec never happened, or NVIDIA abort). Next start must be foreground on a TTY with visible rc",
            "Whether login at 06:43 actually ran Compiz until the 07:31 clean-room is unconfirmed",
            "Emerald not started by compiz-session",
            "Operator desktop after wave-4 Ctrl-C may have no WM; wave-5 restores at most one xfwm4"
        ],
        "bootGate": "MIGRATION COMPLETE 2026-08-21 (carried, durable): bootGate2 + persistence PASS - operator verdicts: i booted, pressed escape for zbm boot menu upon turning on. and saw the nvme dir, it worked; just rebooted and let it do its thing; findmnt / = nvme/ROOT/void; BootCurrent 0002 direct NVMe ZBM; BootOrder 0002,0008; tank/games 460G self-mounted at boot; pools nvme+tank ONLINE no errors. games-probe.block RECEIVED 2026-08-22; wave-2 gate = games-probe2 + games-prereq-root receipts before any wave-3 action block.",
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
            "NVIDIA 595.84 + Compiz 0.8.18: __GL_YIELD=USLEEP makes --replace exit silent rc0; proven start is /usr/bin/compiz --replace ccp with no yield"
        ],
        "knownRisks": [
            "Plutonium + DXVK replaces DLLs; Plutonium anti-cheat flags DLL replacement - community reports no bans for stock DXVK, risk remains",
            "32-bit CoD titles on glibc Void need lib32 multilib packages; missing lib32-vulkan-loader etc breaks DXVK for 32-bit",
            "ntsync device CONFIRMED present (/dev/ntsync world-rw on 6.18.35-tkg-bore); proton-cachyos ntsync may still be env-gated per build - verify launch env at wave-3 before relying on it",
            "boiii is C&D'd/abandonware - prefer t7x; do not run t7patch + boiii together (both patch the same BO3 install)",
            "Steam library on ZFS tank/games: CoW with heavy writes; keep steamapps and wine prefixes on tank/games, not the nvme root pool",
            "Steam appmanifest .acf.NNN.tmp swarms (311210/3354750/4000/730/284160) are interrupted manifest writes - delete only with Steam fully stopped, wave-3"
        ]
    },
    "parked": [
        "games-cod-plutonium-launchers paused 2026-08-22: operator directed Compiz recovery first; last unpaid gate was games-probe2 + games-prereq-root",
        "phase7 leftovers (operator direction only): doas hardening / sudo removal decision (base-system + testdisk reverse-depend sudo), durable machine logging, network control/interception",
        "menu opacity via obs plugin; operator go-ahead only",
        "M18 icon stitching and UI sound after switcher direction",
        "Tier-2 USB work",
        "xfce4-screensaver XMB Sleep Wave installed and selected",
        "Scale with title filter is correct mission-control answer; one-big-cube rejected"
    ]
}
