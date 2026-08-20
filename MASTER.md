{
    "schema": "arena-master-context.v1",
    "updated": "2026-08-20",
    "purpose": "Single compact context file for future agents. README.md bootstraps; this file is machine-readable project state, constraints, and active objective.",
    "repo": {
        "branchFixed": "arena/01a01ef1-nvidia-intel-ocblizzard-4x8ddr",
        "baseCommit": "7fccbb61a6c2133bf312ff6aa59b9c07a8fa87b0",
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
            "os": "Void Linux musl",
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
                "nvme0n1": "953.9G: p1 ESP, p2 games ext4, p3 Windows ntfs, p4 INSTALL vfat, p5 root ext4, p6 2G ext4 unknown",
                "sda": "1.8T disk serial 00000000458C; p1 NTFS label 50; now also p2 ESP and p3 zroot after staging"
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
        "id": "phase7-zfs-doas-hardening",
        "summary": "Work-infrastructure campaign: ZFS root and data, opendoas over sudo, hardening, network control/interception, durable machine logging.",
        "operatorQuotes": [
            "currently i need to set this up for work",
            "lets not work on pools, waste of time. lets just get zfs working for the entirety of the bore kernel and delete windows",
            "i have a spare disk, and i want to delete my windows partition. i also need to merge my nvme partitions",
            "one big zfs nvme, this is what i told you explicitly. only listen to me",
            "FULLY WIPE THAT SHIT",
            "tar archive, and we could just boot off of the 2tb hdd"
        ],
        "currentState": [
            "Operator workflow clarified (2026-08-20): agents must listen literally, examine thoroughly, orchestrate large pre-verified command blocks, and use operator-pasted target output for main-model problem solving.",
            "Operator direction (2026-08-20): this context/tooling conversion is allowed to exceed the normal PR line target for this chat only; future PRs return to the configured target unless explicitly overridden.",
            "zfs and gptfdisk installed; dkms built zfs/2.4.3 for all installed kernels including 6.18.35-tkg-bore; zpool version zfs-2.4.3-1/zfs-kmod-2.4.3-1; zfs-zed linked",
            "sda1 NTFS label 50 was shrunk to about 1.1TiB and verified ro-mounted; p2 ESP 1024MiB; p3 zroot 765.3GiB",
            "zroot created on sda3 with lz4 xattr=sa posixacl atime=off; root copied to zroot/ROOT/void; rsync exit 24 only vanished browser cache entries",
            "zfsbootmenu 3.1.0 installed in copied root; generate-zbm built vmlinuz.EFI to sda2; efibootmgr Boot0007 was pruned by firmware on reboot",
            "Boot attempt 1 landed in void_grub on nvme ext4 root; ZFS root not yet booted",
            "props set: org.zfsbootmenu:commandline ro quiet loglevel=7 split_lock_detect=off intel_pstate=active; org.zfsbootmenu:kernel 6.18.35-tkg-bore",
            "opendoas 6.8.2_2 installed; sudo-1.9.17p2_1 still present; sudoers.d/wheel is %wheel ALL=(ALL:ALL) ALL; sudoers.d/nvidia-oc is sd ALL=(root) NOPASSWD: /usr/bin/nvidia-settings *; doas persist keepenv :wheel already matches wheel; nvidia-settings nopass not yet in live doas.conf; persist keepenv is looser than sudo secure_path; doas -n id was uid=0; nvme0n1p5 Use% 100% 1.2G avail; xbps reports glibc x86_64 not musl"
        ],
        "nextGateAskFirst": "Ask operator for output from the handed-off boot gate before changing disks.",
        "handoffFixUnconfirmed": [
            "mount /dev/sda2",
            "copy EFI/zbm/vmlinuz.EFI to EFI/BOOT/BOOTX64.EFI fallback path",
            "re-add efibootmgr entry",
            "reboot; if still grub, set 2TB HDD UEFI OS first in BIOS boot priority"
        ],
        "bootGate": "findmnt / shows zroot/ROOT/void zfs and uname shows 6.18.35-tkg-bore",
        "afterBootGate": [
            "identify nvme0n1p6 before merge",
            "keep nvme p1 ESP and p5 old root until ZFS root accepted",
            "operator-ordered irreversible wipe: nvme Windows p3 and INSTALL p4",
            "stage games as GNU tar --acls --xattrs in sda1 NTFS free space",
            "rebuild NVMe as one ZFS pool data mounted /mnt/games",
            "restore games tar into data"
        ],
        "knownRisks": [
            "firmware prunes third-party boot entries on second disk ESP unless fallback path or BIOS disk priority works",
            "nvme0n1p6 purpose unknown",
            "root filesystem was 100% full earlier; check df -h / before rc=1 diagnosis"
        ]
    },
    "parked": [
        "menu opacity via obs plugin; operator go-ahead only",
        "M18 icon stitching and UI sound after switcher direction",
        "Tier-2 USB work",
        "xfce4-screensaver XMB Sleep Wave installed and selected",
        "Scale with title filter is correct mission-control answer; one-big-cube rejected"
    ]
}
