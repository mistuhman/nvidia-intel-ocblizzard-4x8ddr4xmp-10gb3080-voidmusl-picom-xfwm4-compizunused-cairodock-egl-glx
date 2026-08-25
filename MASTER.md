{
    "schema": "arena-master-context.v1",
    "updated": "2026-08-25",
    "purpose": "Single compact context file for future agents. README.md bootstraps; this file is machine-readable project state, constraints, and active objective.",
    "repo": {
        "branchFixed": "arena/01a0373c-nvidia-intel-ocblizzard-4x8ddr",
        "baseCommit": "54eb76bb0b7286d6285bcec600efa1a771b283aa",
        "priorSession": "arena/01a0277c branch merged to main as PR #33 (commit 7a8b9fd); session 01a03599 closed 2026-08-25 and merged to main as PR #35 at operator direction",
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
        "performance": "ACTIVE OBJECTIVE 2026-08-25: sub-zero work baseline. p3-nowall PASS 05:13. p3-xorg PASS: quoted Device+Coolbits, ARC 4G. Xorg is safe. Next p4-sv dangling links + measure. Keep bluetooth/privoxy/tor/libvirt. No wallpaper."
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
        "id": "extreme-optimization-oc",
        "summary": "OPERATOR DIRECTIVE 2026-08-25: get processes and memory to absolute minimum while keeping the desktop beautiful; EXTREME optimization for overclocking the 12700KF and 3080 10GB. Granular inspection and analysis before proceeding. Six-phase plan: (1) full system probe, (2) process/service diet, (3) kernel/sysctl tuning, (4) NVIDIA OC, (5) CPU optimization with P/E core aware IRQ pinning, (6) measurement and iteration. Games campaign remains PARKED.",
        "operatorQuotes": [
            "lets get my processes and memory usage to an absolute minimum, still want the machine to be beautiful. and with EXTREME optimization, since we're overclocking my 12700kf and 3080 10gig. granular inspection and analysis before proceeding so we can get the best out of the hardware and software baseline"
        ],
        "currentState": [
            "p3-nowall PASS 05:13 UTC: xmb-wallpaper-controller.desktop.off; xwinwrap/mpv not running. lama/fleasion/Dl still .disabled.",
            "p3-xorg PASS 05:13 UTC: 20-nvidia.conf 190 bytes, quoted Device from bak plus Option Coolbits 28; zfs_arc_max=4294967296. Xorg is safe to restart when operator wants Coolbits live. Do not restart in p4.",
            "Dangling runit: /etc/sv/nvidia-persistenced zfs-zed rc.local do not exist. omen-sqm IS real and run (pid 1334, has run/finish/log). p4-sv removes the three dangling links and cats omen-sqm/run.",
            "Operator 2026-08-25: keep bluetooth, keep privoxy, yes I run VMs, no animated wallpaper, ultimate sub zero with work prefs. Keep tor with privoxy. Keep libvirt. ARC 4G for VMs.",
            "Work KEEP: bluetooth, privoxy, tor, libvirt, yeetmouse, NM/dbus/lightdm/polkitd/pipewire/chronyd/rtkit, beauty stack, xfdesktop/panel/Thunar/ulauncher, session browsers. Next: p4-sv then p4-measure."
        ],
        "nextGateAskFirst": "Operator pastes etc/perf-p4-measure.block as sd, then sudo -i and pastes etc/perf-p4-sv.block. Do not restart X. omen-sqm kill/keep is decided from the run script receipt.",
        "handoffFixUnconfirmed": [
            "12700KF OC targets are BIOS-level work; operator must apply in BIOS and report stability/temps",
            "RTX 3080 OC via coolbits requires X11 xorg.conf.d changes + restart; persistence mode via runit service survives reboots",
            "Service pruning reversible via `ln -s /etc/sv/<name> /var/service/` to re-enable",
            "Compiz plugin changes reversible via ccsm-safe or profile restore",
            "ZFS ARC cap via module parameter; revert by removing /etc/modprobe.d/zfs.conf line"
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
