{
    "schema": "arena-master-context.v2",
    "updated": "2026-08-27",
    "purpose": "Single compact context file for future agents. README.md bootstraps; this file is machine-readable project state, chat workflow, brute-problem-solving doctrine, OC objective, and constraints. It is JSON context, not prose policy.",
    "debloated": "2026-08-27 (session 01a042f7, operator directive): removed the halt machinery and all crisis-era junk - tools/stall-check.ts deleted, interactionModel.crisisDiscipline, requiredHaltLine/haltWhen/onHalt/haltRepoFreeze, crisis.closedTestClasses, crisis.openSearchClasses, sessionMisbehavior, and the 47KB currentState append-log all removed. Brute problem solving is kept and elevated as doctrine below. Recovery history stays readable in docs/ and ToDo.md receipts; it is not policy.",
    "repo": {
        "branchFixed": "arena/01a04446-nvidia-intel-ocblizzard-4x8ddr",
        "baseCommit": "ebeee828ab7ebec5b3fecf314010c15cc33eff19",
        "priorSessions": "01a0277c PR #33 through 01a04148 PR #44 (DDR4 1.55V failure, BIOS-recovery decision, crisis sessions); 01a04157 + 01a0416e worked the no-POST recovery to completion (THE OMEN POSTS AGAIN 2026-08-27); 01a042f7 remade README/MASTER for the OC-era chat workflow and built the deterministic command registry.",
        "prLineTarget": 405,
        "prNote": "This remake (README + MASTER rewrite + tools/cmd.ts + registry + stall-check removal) exceeds the normal line target BY NECESSITY: the operator explicitly ordered the files remade and debloated. Future feature PRs return to prLineTarget unless the operator explicitly overrides again. Session 01a04446 (GPU OC lab: 5 tools + 4 workflows + target applier + fixtures) also exceeds prLineTarget by operator direction (\"deploy agents to make tools for github workflows\"); feature PRs after it return to 405.",
        "files": {
            "README.md": "human bootstrap: cold-start protocol, project, machines, layout",
            "MASTER.md": "this JSON: workflow rules, brute doctrine, OC objective, machines, constraints",
            "ToDo.md": "operator-directed live checklist (OC + storage gates); operator-owned, agents quote it, do not rewrite it",
            "etc/": "target config files and canonical .block text saved for reuse",
            "tools/": "agent-facing TypeScript utilities run by node; zero dependency; deterministic stdout; GPU OC lab = lib/gpu-model.ts + gpu-oc-plan.ts + gpu-curve.ts + gpu-bench-parse.ts + gpu-oc-verify.ts, target applier scripts/gpu-oc-apply, guide docs/oc-3080-oc-lab.md",
            "scripts/": "target-facing installed desktop and migration utilities",
            "docs/": "OC + recovery history: oc-plan.md, oc-3080-gwe-recipe.md, oc-cpu-bios-checklist.md, omen-free-recovery-runbook.md, omen-reassembly-checklist.md, hardware-retrospective.md, next-chat-last-power-on.md, bios-flash-decision.md, recovery-research.md, open-classes-pass2.md, open-classes-pass3.md, games-receipts.md, perf-optimization-plan.md",
            ".github/workflows/": "CI + GPU OC lab workflows: oc-tools-ci (selftests, shellcheck, determinism, pr-budget), gpu-oc-lab (manual sweep + undervolt graph + pasteable blocks), gpu-clock-feature-matrix (core-only / memory-only / power-trim / combined / efficiency-hunt), gpu-receipt-ingest (paste dmon + Superposition, get ADVANCE/HOLD/REVERT and commit the ledger)",
            "receipts/": "gpu-oc-receipts.json: normalized metered runs (the only thing that outranks the model)",
            "tests/": "fixtures for the receipt parsers (dmon, Superposition, Geekbench)"
        }
    },
    "promptScreening": {
        "rule": "Every operator chat message is read with high-definition screening BEFORE acting, this chat and every future one. Treat each granular feature, named file, named tool, named syntax, format, and prohibition as its own requirement.",
        "steps": [
            "decompose the message into a numbered demand list: every clause, every explicit string or syntax (e.g. the token form ?(example command)), every 'while also' and 'also', every removal or debloat instruction is its own item",
            "reproduce the demand list in the work plan and deliver every item; an undelivered item must be reported as skipped with a reason - silently dropping a requirement is a gate failure",
            "when the operator quotes an exact string, syntax, or tool name, implement that exact form; never paraphrase, rename, or 'improve' it",
            "re-read the message once more after drafting the plan and again before delivery; the second pass exists to catch dropped granularity",
            "if an instruction changes a prior instruction, the latest is authoritative; record both verbatim with dates",
            "ask at most one targeted question, and only when a requirement would otherwise be dropped; brute context gathering runs first, not after"
        ]
    },
    "interactionModel": {
        "truthOrder": [
            "operator report",
            "target command output",
            "repo files",
            "git history",
            "external web"
        ],
        "chatWorkflow": {
            "mode": "commands and receipts flow through chat directly. Operator directive 2026-08-27: NO registry ceremony, NO ?(name) tokens. Agent writes pasteable command blocks inline in chat - one command per line, console-safe (no <>& chaining), root blocks start with id -u. Operator pastes output back, agent reads it, proposes next single knob.",
            "loop": [
                "1. agent writes pasteable bash blocks directly in chat, grouped by shell (root vs user)",
                "2. operator runs on target and pastes the FULL output back",
                "3. agent reads the output, quotes the verdict, attributes cause, proposes next step",
                "4. one wave at a time until receipt returns"
            ],
            "reciprocation": "every command sent expects its receipt returned before the next wave ships",
            "oneWaveAtATime": "hard rule from operator 2026-08-21: never send a second wave of target commands until the first wave output has arrived"
        },
        "permission": {
            "agentOwned": [
                "repo reads",
                "sandbox authoring",
                "syntax/lint checks on command blocks before delivery",
                "commits to fixed branch"
            ],
            "operatorGated": [
                "target execution",
                "session changes (log-out/in, X restart)",
                "visual judgement",
                "reboot gates",
                "BIOS F10 changes",
                "power-ons"
            ],
            "operatorDirected": [
                "scope changes",
                "merges",
                "irreversible disk operations",
                "constraint overrides"
            ]
        },
        "agentUse": "Split into independent bounded agents: one task, source set, hypothesis, or verification target per agent; fan out for hard problems; merge only receipts, never vibes.",
        "toolStyle": "TypeScript-first, zero dependency unless justified, run with node directly, deterministic stdout (same bytes for same input, sorted output), small explicit functions, fail fast with nonzero exits, no hidden policy in comments.",
        "deliverableShape": [
            "what changed",
            "receipts",
            "unverified limits",
            "gate",
            "next action"
        ]
    },
    "bruteProblemSolving": {
        "doctrine": "Keep the method that solved the no-POST crisis: exhaustive context gathering, class enumeration, bounded agent fan-out, receipt-only merges - now pointed at overclocking and run through the direct chat loop (pasteable commands, no ceremony).",
        "required": [
            "gather as much context as possible before acting: README, this file, ToDo, every docs/ file relevant to the objective, git log, and all returned target receipts; report what was NOT read",
            "run node tools/agent-deploy.ts --objective=<...> to print the bounded fan-out; one agent per source set / hypothesis / verification target",
            "free context first, then search (node tools/web-scrape.ts, node tools/recovery-research.ts --plan lanes, gh api), then hardware action last",
            "every claim traces to a path, command output, hash, or operator quote; receipts before conclusions",
            "unknown is allowed; 'impossible' is not a verdict without a search receipt",
            "on FAIL: state exactly what the receipt excludes, then search or select a NEW class; never relabel a closed test as a new experiment",
            "collapse independent verifications into one big filtered pasteable block when they can be safely verified together; keep risky or password-gated entry steps separate"
        ]
    },
    "qualityGate": {
        "beforeDelivery": [
            "re-read objective plus the numbered demand list from promptScreening; every item addressed or explicitly skipped with reason",
            "trace every claim to a command, path, hash, or operator quote",
            "check mentioned paths exist (ls or node tools/orient.ts output)",
            "name exact source SHA for installs or patches",
            "re-issue config with tunable installs",
            "include rollback before forward for every target-changing step",
            "name the pass/fail gate in the same message as the commands",
            "LOG THE INTERFACE, NOT JUST THE VALUE: every target-changing action records HOW it was applied - BIOS F10 menu path, efivar/efibootmgr, SMBus/i2c SPD write, sysfs node, package, or GUI app (born from the 1.55V incident that cost five diagnostic turns because the value was logged but not the mechanism)",
            "every command block pasted into chat is console-safe: one command per line, no chaining (&&/||/;), no redirect/ampersand glitches, bash -n passes, root blocks start with id -u",
            "run bash -n and a console-paste hygiene check on every block before pasting"
        ],
        "afterOperator": [
            "quote the actual verdict from the paste-back before interpreting it",
            "attribute cause before proposing fix",
            "edit this JSON to true current state; do not append contradictions",
            "when the operator says a setting was 'applied', establish applied HOW before diagnosing anything"
        ]
    },
    "objective": {
        "id": "extreme-optimization-oc",
        "summary": "Operator directive 2026-08-25, resumed 2026-08-27 after recovery: absolute minimum processes and memory while keeping the desktop beautiful; EXTREME optimization for overclocking the 12700KF and the RTX 3080 10GB, with granular inspection before every step. Games campaign remains PARKED.",
        "officialCompare": "Geekbench 6.7.1 (CPU + Compute) + Unigine Superposition 1.1 at 1080p Extreme - the same preset forever, meter every step with nvidia-smi dmon CSV (1s) + turbostat; stock baselines recorded below",
        "stockBaseline": [
            "Geekbench 6.7.1 CPU https://browser.geekbench.com/v6/cpu/19061796 SC 2715 MC 14569",
            "Geekbench 6.7.1 Compute OpenCL https://browser.geekbench.com/v6/compute/6845489 score 194800",
            "Superposition 1080p Extreme Score 8717, FPS Min 19.76 Avg 65.20 Max 81.37, GPU Temp 39-81C",
            "Meter peaks: cpu 811 samples PkgW 145.02W Bzy 4476MHz Tmp 70C; gpu 201W 47C mclk 9501 pclk 1935"
        ],
        "knobs": {
            "gpu3080": "GWE 0.15.5 needs Coolbits live (operator logs out/in, no VT switch). Step 1 = +60 graphics / +250 memory then re-bench (same Geekbench+Superposition+dmon protocol as stock baseline). Linux has NO voltage-curve undervolt for Pascal+ - scope is power limit + offsets. Power-limit RAISE is impossible (max==default==320W, receipt 2026-08-27); power trim down is the only Linux undervolt. Meter with dmon; docs/oc-3080-gwe-recipe.md holds slider values and stop rules. Lab added 2026-08-27: plan/sweep/curve/parse/verify tools plus GitHub workflows model every candidate and rank it BEFORE anything is pasted; power limit above 100% stays refused without the step-4 PSU gate.",
            "cpu12700kf": "Multiplier locked by HP firmware; ratio/Vcore work is BIOS-only and operator-gated per docs/oc-cpu-bios-checklist.md (targets: all P-cores on, P 51-52 / E 41-42 try, 1.28-1.32V). Voltage offsets are blocked by Plundervolt mitigations per HP staff. Reversible software path first: read-only MSR probe (msr-tools), then PL1/PL2 via MSR 0x610 - usually writable even where voltage is locked and the biggest legal win since the KF is power-limited at stock. OS side already landed: governor powersave + EPP, BORE kernel, IRQ pinning; CPU knob persistence still undecided (runit service vs re-apply per boot - proven non-persistent).",
            "ddr4": "4x8GB Kingston HP37D4U1S8MR-8X (die UNVERIFIED), board 4-DIMM 2DPC so the IMC is the binding limit. Live baseline = XMP 3733 1.35V. 4000 @1.50V booted but was NEVER stability-validated - treat as marginal-unproven, not known-good. 1.55V FAILED to boot: do not repeat, and no further VDIMM beyond 1.50V without die ID and DIMM load temps. Never declare any memory OC stable without stress-ng --vm + memtest + clean zpool scrub (ZFS root means silent corruption is the failure mode, not just crashes). Before anything else: verify BIOS Advanced shows XMP 3733 with no remnant of the 4000 custom profile."
        },
        "liveGates": [
            "1. First boot after reassembly: Escape -> ZBM -> nvme/ROOT/void explicitly, run the postboot diag (root, read-only), paste FULL output; do not stress CPU or GPU until this receipt is read",
            "2. If POST reports the 90B prompt again, run a fan-probe and paste output before continuing",
            "3. Boot order / monitor-delay track: run drive probe; boot-order fix ships ONLY after that receipt is pasted back",
            "4. AHCI vs RAID decision (ToDo Phase 3) gates all SATA storage work; switching is safe with NVMe root but is its own operator-gated step",
            "5. SATA -> zpool work (ToDo Options A-D): one drive per power-on, /dev/disk/by-id only, zpool status + zfs list pasted after each create, autotrim on SSD pools, scrub baseline at the end",
            "6. Verify memory XMP 3733 in BIOS, no 4000 remnant (gates any GPU/CPU stress)",
            "7. GWE step 1 +60/+250 re-bench - Coolbits CONFIRMED LIVE 2026-08-27 (offset queries return 0), so this gate is open",
            "8. CPU knob persistence decision, then CPU BIOS OC per docs/oc-cpu-bios-checklist.md - operator applies in F10 and reports stability/temps"
        ],
        "unconfirmedHandoff": [
            "IRQ pin GPU=CPU4 NIC=CPU18 is live until reboot; persist it (runit or sysctl) in the next PR",
            "ZFS ARC cap 4G lives in /etc/modprobe.d/99-arc-cap.conf; revert = echo 0 to zfs_arc_max then rm that conf",
            "omen-sqm is CAKE 780Mbit SQM - KEEP (work bufferbloat control, not an HP thermal daemon)",
            "Coolbits is written to xorg conf; live only after X restart",
            "dangling persistenced/zfs-zed/rc.local runsvdir links already removed"
        ]
    },
    "durableFacts": {
        "recovery": "2026-08-27: THE OMEN POSTS AGAIN and boots clean to Void with no Enter press. 90B cleared by landing the spare front fan on FFAN1. LED hub M82868-001 deliberately left unplugged (operator prefers no RGB; keeps the original fault's standout suspect out of circuit; cause stays UNATTRIBUTED by choice - acceptable to operator). PSU M83827-001 800W ATX Gold exonered on the bench (A1b: POST code AA with OMEN PSU); fault was board M81915-601 or CPU-side, closed by reassembly. Full ladder and receipts: docs/omen-free-recovery-runbook.md, docs/open-classes-pass2.md, docs/open-classes-pass3.md, docs/hardware-retrospective.md.",
        "boot": "ZBM at Boot0002/Boot0008 on the NVMe ESP (512M vfat, UUID 5010-EA01); BootOrder advisory on this firmware (it self-prunes dead entries and self-enumerates the EFI/BOOT fallback). Four SATA drives were added in ONE pass 2026-08-27 (2 HDD + 2 SSD) which can inject SATA boot entries and rename sd* nodes - hence liveGate 1 and 3. After Power Loss = Off (did NOT cause the old cord-in auto-cycle; that mechanism stays unattributed).",
        "desktop": "XFCE runs compiz-reloaded (use scripts/ccsm-safe; Detect Outputs and Detect Refresh Rate off; golden profile af457926, post-recovery b94b49e0; __GL_YIELD=USLEEP mattered) with gunmetal Emerald + GTK3 theme frozen and accepted, cairo-dock, and the bare wallpaper layer: one sticky input-transparent xwinwrap + one mpv (gpu-next, nvdec-copy, never --hwdec=auto, --wid needs equals form via scripts/mpv-xwinwrap-shim) playing three deterministic 60s 4480x1440 HEVC loops (sleep, main-red, work-monochrome). xfdesktop Desktop windows obscure the bare layer - do not simply restart xfdesktop; the shell/xprop crossfade path is retired (controller exits 2); same-role viewport hops pulse blur only; NVENC cannot encode 4480 width, HEVC can. picom stays masked. The desktop is accepted and frozen: do not churn it for OC work.",
        "perf": "p4-measure PASS: 12G used / 18G avail (was 15/16), ARC cap 4G, swappiness 1, nmi_watchdog 0, GPU idle 25% 57W. Keep for work: bluetooth, privoxy, tor, libvirt, yeetmouse, omen-sqm, NM/dbus/lightdm/polkitd/pipewire/chronyd/rtkit, xfdesktop/panel/Thunar/ulauncher, session browsers. Wallpaper stack off during benchmarking.",
        "disks": {
            "nvme0n1": "953.9G: p1 ESP 512M vfat (ZBM) + p2 pool nvme, dataset nvme/ROOT/void. Never a wipe target. ~811G free after 2026-08-27 SATA wipe.",
            "fast": "ata-CT1000MX500SSD1_2317E6CCE92E MX500 ~900G at /fast (vm/work/steam). autotrim on.",
            "bulk": "ata-ST2000NM0033-9ZM175_Z1X6R7P5 + ata-TOSHIBA_DT01ACA200_95CWVMJAS stripe ~3.6T at /bulk /mnt/games /bulk/media /bulk/archive. Kingston SV300 L2ARC cache. No redundancy.",
            "tank": "DESTROYED 2026-08-27 17:11 UTC. Export was blocked by vesktop/bwrap mount namespaces, not host fuser."
        },
        "gpu": "Target receipt 2026-08-27 (user shell): RTX 3080, driver 595.91.07, power.limit 320.00 W == power.default_limit 320.00 W == power.max_limit 320.00 W -> NO power-limit headroom exists on this vBIOS, the old step-4 'PSU gate' is moot and nvidia-smi -pl above 320W will be refused; trimming DOWN is the only power knob. clocks.max.graphics 2100 MHz (so anything past core +165 is dead offset), clocks.max.memory 9501 MHz. COOLBITS IS LIVE: nvidia-settings -q GPUGraphicsClockOffset -t and -q GPUMemoryTransferRateOffset -t both return 0 with no error. Idle at receipt time: 765 MHz core / 5001 MHz mem / 65.22 W / 40 C / fan 30%. /home/sd/oc-meters already holds Aug-25 meter logs incl. gpu-stock-671-superpos.csv (47 KB) - mine it with scripts/gpu-dmon-summary rather than pasting it. WAVE-2 receipts 2026-08-27: nvidia-smi -q -d POWER Min Power Limit 100.00 W (undervolt floor = 31%), Max/Default 320.00 W. Stock Superposition 1080p Extreme meter (gpu-stock-671-superpos.csv, 535 samples): pwr_max 314 W, pwr_avg 133 W (log includes menu/idle), gtemp_max 81 C, sm_avg 50.7%, pclk_max 1905, mclk_max 9501 -> at stock the card is ALREADY PINNED (314 W of 320 W) and only 2 C from the 83 C stop rule; clock offsets are therefore near-free thermally (watts are capped either way) but the real wins on this card are the power-trim tiers. Geekbench-compute meter: pwr_max 201 W, gtemp_max 47 C, pclk_max 1920. Model anchors updated to coreMHz 1905 / referenceW 314. Lab installed on target at /home/sd/oc-lab (git clone of the session branch). WAVE-3 receipt 2026-08-27: apply of +60/+250 REPORTED success but read back 0/0, and revert via GPUGraphicsClockOffsetAllPerformanceLevels was refused with 'The current user does not have permission for operation' -> per-level writes vs all-level writes differ on this Coolbits value; applier rewritten to assign+read back [gpu:0]/GPUGraphicsClockOffset[LEVEL] with a perf-level auto-detect (GPUPerfModes) and an ERROR-text check. Meter run was aborted by the operator (mouse polling), no bench data lost. Operator directive: undervolt AND overclock together (standard practice for this card class) -> UV+OC ladder added (uvoc-1..uvoc-max) and the verdict engine now pairs a proven offset step with its power trim before climbing to more clock. WAVE-4 caps receipt 2026-08-27: GPUPerfModes shows FIVE levels and the top is perf=4 (memclock 9501, memTransferRate 19002, nvclockmax 2100) - the original scripts wrote perf level 3 (memclock 9251), i.e. the wrong level, which is why the read-back looked like nothing happened. PER_LEVEL_WRITE=ALLOWED, ALL_LEVELS_WRITE=DENIED. Coolbits 28 lives in /etc/X11/xorg.conf.d/20-nvidia.conf (backups in xorg.conf.nvidia-xconfig.bak and xorg.conf.d.bak/10-nvidia.conf). Idle: current_perf_level 2, GPUPowerMizerMode 0 (adaptive), GPUFanControlState 0, fan target 30%. memTransferRate == 2x memclock is now CONFIRMED, so a +250 nvidia-settings memory offset = +125 MHz mclk."
    },
    "machines": {
        "sandbox": {
            "has": [
                "node v22 running .ts directly",
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
            "network": "repology.org and Void mirrors filtered; use GitHub API for void-packages facts",
            "role": "author, verify, register, commit - never pretend to have observed the target"
        },
        "target": {
            "user": "sd",
            "os": "Void Linux glibc (repo name still says musl; ZFS root nvme/ROOT/void via ZBM since 2026-08-21)",
            "kernel": "6.18.35-tkg-bore",
            "hardware": [
                "Intel i7-12700KF 12C/20T (KF = NO integrated graphics)",
                "NVIDIA RTX 3080 10GB",
                "32GB DDR4 XMP 3733 (4x8, 2DPC)",
                "HP OMEN 45L GT22-0139 board BlizzardOC SSID 8917 Z690",
                "dual monitor 4480x1440"
            ],
            "paths": {
                "workspace": "/home/sd/.local/share/xmb-wave/",
                "benchMarks": "/home/sd/oc-meters/",
                "superposition": "/home/sd/Downloads/Unigine_Superposition-1.1"
            },
            "role": "execute, observe, judge; operator pastes output back into chat"
        }
    },
    "packageFacts": {
        "nvidia": "595.91.07 nonfree + nvidia-opencl-595.91.07_1 (nvidia.icd live, clinfo shows RTX 3080), Vulkan-Tools installed (vulkaninfo GPU0 api 1.4.329)",
        "geekbench": "6.7.1 Build 603632 (6.5.0 FAILED with upload code 35, LibreSSL bug)",
        "superposition": "1.1 free Linux build at /home/sd/Downloads",
        "gwe": "0.15.5 in Void repo (upstream archived, functional); fallback nvidia-settings CLI",
        "cpuTools": "msr-tools 1.3.0.20170320_1, intel-undervolt 1.7_1, fwupd 2.1.7_1 confirmed via void-packages GitHub API",
        "stress": "stress-ng + turbostat installed via oc-p6-install",
        "compiz-reloaded": "0.8.18",
        "cairo-dock": "3.6.2",
        "xwinwrap": "0.9",
        "mpv": "0.41.0",
        "zfs": "2.4.3 DKMS, zfs-zed service only",
        "zfsbootmenu": "3.1.0 generate-zbm",
        "opendoas": "6.8.2; plain doas package absent",
        "absent": [
            "plain compiz",
            "fusion-icon",
            "ffmpeg7",
            "snort"
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
            "no CPU/GPU stress until the post-recovery diag receipt is read - cooling state must be proven by tach data, not memory",
            "BIOS flash is irreversible on 8917/BlizzardOC (one-way per F.57 PREREQUISITES, no dual BIOS, modified images fail Boot Guard and do not POST): requires explicit operator direction plus dmidecode SSID receipt before any flash command is authored; flashing also risks removing the memory-OC Advanced menu that currently works",
            "memory OC stays at or below 1.50V; a booted profile is not a stable profile; ZFS integrity gates apply",
            "SATA changes: one drive per power-on, /dev/disk/by-id paths only, never /dev/sdX - renames break live mounts",
            "no config rewrite by tools that do not fully model the file",
            "never patch an installed copy whose SHA differs from repo HEAD",
            "do not destabilize the WM for wallpaper; beauty stack is frozen and accepted",
            "never delete or glob-move ~/.bitcoin; touch only with client stopped",
            "no VT switching advice",
            "picom stays masked"
        ],
        "consolePaste": [
            "root shell entry is separate from the root command block",
            "target web console may escape < > & and stop after partial paste - author every block with one command per line, no chaining/redirects",
            "root blocks start with id -u",
            "one command per line",
            "avoid chaining, redirects, ampersands, and quotes when possible",
            "xbps-install uses -y"
        ],
        "process": [
            "one objective per PR unless the operator overrides",
            "run node tools/pr-budget.ts main 405 before delivery",
            "never switch or push another branch; this session is fixed to repo.branchFixed",
            "run node tools/test-all.ts before delivery",
            "paste commands directly in chat; no registry/ceremony tokens. Blocks must be console-safe: one command per line, bash -n passes, no chaining/redirects that break on web-console paste, root blocks start with id -u",
            "after an operator paste-back, read the output verbatim and attribute cause before proposing the next step - reciprocity is part of the contract",
            "do not conclude impossible; search a new class or gather more context first"
        ]
    },
    "lessons": [
        "LOG THE INTERFACE, NOT JUST THE VALUE: record HOW a setting was applied (F10 vs sysfs vs efibootmgr vs package vs GUI). The 1.55V incident cost five diagnostic turns because values were logged without the mechanism, and recovery differs completely between a setup-variable write and a DIMM SPD write.",
        "booted OK is not stable: an unvalidated memory profile is a coin flip near the IMC edge and a silent-corruption risk on ZFS root; never log an unvalidated boot as a known-good baseline.",
        "more VDIMM is not more stability at 2DPC: the binding limit is the CPU memory controller (12700KF rated DDR4-3200, lower at 4-DIMM); fix marginality with speed/timings or fewer DIMMs, not volts.",
        "do not stack unverified assumptions into a conclusion and present it as a finding; reconstruct the timeline from receipts, list what is UNKNOWN and who holds it, pick the one test whose two outcomes separate the live hypotheses.",
        "generic checklists are not diagnosis; quote the operator's actual words before attributing anything to them.",
        "when a fault gets worse DURING troubleshooting, suspect the troubleshooting itself; reseat and verify connectors before escalating to firmware or parts.",
        "console paste hygiene: the target web console escapes < > & and drops trailing output - one command per line, no chaining, echo tail-trick for long output.",
        "escaped globs in pasted blocks: backslash-star works for find patterns but defeats ls glob expansion - for ls use a bare unquoted glob or list the parent dir.",
        "xbps 'failed to download package signature - Not Found' = stale local repodata; run xbps-install -S to re-sync before retrying.",
        "Void names 32-bit packages with a -32bit suffix (vulkan-loader-32bit), not a lib32- prefix.",
        "USB port moves on this rig rename sd* nodes under live mounts - power off before moving disks.",
        "ntfs-3g FUSE wedges on sustained reads after hot replug - use kernel ntfs3 for big NTFS reads.",
        "HP 8917 BIOS updates are one-way and the newest revision buys only security - never a recovery tool for a bad setting, never free CPU control.",
        "a conflict between a caution and a measurement is not a tie: resolve class questions with primary receipts (HP PartSurfer, board silkscreen photos, accepted forum solutions), not hedging.",
        "nvidia-settings LIES BY OMISSION: it prints \"Attribute 'GPUGraphicsClockOffset' assigned value 60.\" and exits 0 even when the offset did not take, and on this Coolbits setup the AllPerformanceLevels attributes are permission-denied while the per-level [gpu:0]/ATTR[N] form is allowed. Always assign per level, always read back the exact [gpu:0]/ATTR[N] form, and treat any ERROR line in the output as failure - the exit code is not evidence.",
        "shift is a POSIX special built-in: in dash a failed `shift` terminates the script even when written as `shift || true`, which silently ate a usage message. Guard it with `if [ $# -gt 0 ]; then shift; fi`.",
        "perf level indexes are per card, not per convention: this 3080 exposes perf=0..4 and the LOAD level is 4 (memclock 9501), not the 3 that older recipes assume. Auto-detect the top level from GPUPerfModes before writing any offset - writing level 3 applies an offset the benchmark never sees."
    ],
    "parked": [
        "phase7 leftovers (operator direction only): doas hardening / sudo removal decision (base-system + testdisk reverse-depend sudo), durable machine logging, network control/interception",
        "menu opacity via obs plugin; operator go-ahead only",
        "M18 icon stitching and UI sound after switcher direction",
        "Tier-2 USB work",
        "xfce4-screensaver XMB Sleep Wave installed and selected",
        "games campaign (CoD/Promod/Lunar stack) - remains PARKED per 2026-08-25 directive until OC objective closes",
        "viewport switcher target trial after desktop performance baseline is fixed"
    ]
}
