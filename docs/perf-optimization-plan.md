# Performance receipts 2026-08-25 04:53 UTC (partial)

Probe paste began mid `ps --sort=-rss` (PID 812+). Missing: free/meminfo, governor/pstate, sysctl, runit list, top RSS. Recover with `etc/perf-head.block`.

## Confirmed

### ZFS ARC — largest RAM leak
- `zfs_arc_max=0` `zfs_arc_min=0` so `c_max=32313466880` (~30.1G) on 32G
- live `size=7232439432` (~6.7G), 98.9% hits (6036034 / 66484)
- Cap live+persist at 8G (`8589934592`). Do not drop to 4G while tank/games holds Steam.

### NVIDIA 595.84 / 20-nvidia.conf
- Persistence-M already On. irqbalance and thermald already absent.
- 37C P3 57W/320W, 1209/10240 MiB, 45% util with **no** xwinwrap/mpv
- VRAM: Xorg 456, Vesktop-class 224+31, Zen 194, electron 53, easyeffects 36, dock 14, compiz 5
- Device options: ForceCompositionPipeline + ForceFullCompositionPipeline, **no Coolbits**
- Supported max 2100 / 9501. `nvidia-smi -q -d` failed (console ate `-d`)
- 45% GPU is session browsers + full composition pipeline + Compiz, not cairo-dock
- `nvidia-oc.desktop.bak` exists (prior OC attempt)

### IRQ (12700KF 8P+4E)
- GPU 149 → CPU 17 (E-core). NIC enp3s0 151 → **same** CPU 17. USB xhci 124 → CPU 5 (P-core, keep)
- default affinity `fffff`. Do not pin until `lscpu -e` from the head probe.

### Autostart
KEEP: cairo-dock `-o`, easyeffects, pipewire, ulauncher, gnome-keyring.
Already hidden: picom, xmb-wallpaper-controller.
ASK: `lama.desktop` (ollama serve at login), fleasion, Dl/dotline.
System waste: spice-vdagent (bare metal), orca. blueman + `krfcommd` live. iwlwifi IRQs 152-167 — do not kill wpa.

### Session (not autostart — do not kill)
Vesktop x2, Element/Riot x2, Zen. Defunct `zypak-sandbox` + `xdg-open`.

## Do not touch
compiz `--replace ccp`, emerald, cairo-dock, gunmetal, XMB controller, picom mask.

## Next
1. `etc/perf-head.block` — missing numbers
2. `etc/perf-p2-root.block` — ARC 8G + sysctl + Coolbits write, no X restart
3. User autostart `.disabled` after operator answers
4. IRQ pin after `lscpu -e`; clock offsets only after Coolbits-live X restart
5. BIOS 5.0P/4.0E @ 1.28-1.32V is operator-only
