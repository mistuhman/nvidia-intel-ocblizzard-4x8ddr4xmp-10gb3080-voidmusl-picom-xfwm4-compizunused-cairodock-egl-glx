# Performance receipts 2026-08-25 (probe 04:53 + head 05:04)

## Baseline
- 31G RAM, **no swap**. used 15G / avail 16G. Anon 6.4G + ARC 6.7G.
- Fat RSS is the session: Isolated Web 1.0G+825M, zen 814M, vesktop 795+394M, electron 592M, element 247M, easyeffects 266M. Do not kill.
- Beauty: cairo-dock 123M, compiz 114M, Xorg 223M. xfdesktop is **back** at 115M.
- Governor already `intel_pstate` + `powersave` + `balance_performance`, no_turbo=0. THP `always`. KSM 0. NVMe `[none]`.
- Cmdline has both `intel_pstate=passive` and `intel_pstate=active` (active wins). Leave.

## Confirmed work
- ARC `c_max` 30.1G, live 6.7G, 98.9% hits. Cap 8G.
- sysctl already half-tuned: swappiness 10, dirty_ratio 15, vfs_cache_pressure 50. Still set 1 / 5 / 2, autogroup 0, nmi_watchdog 0. `sched_migration_cost_ns` absent (BORE).
- Coolbits missing. Persistence-M On. irqbalance/thermald absent.
- IRQ: GPU 149 + NIC 151 on CPU 17 (E-core 9). USB 124 on CPU 5 (P-core 2 HT, keep). Pin GPU→CPU 4, NIC→CPU 18.
- Topology: CPU 0-15 = P-cores 0-7 HT pairs, max 5000. CPU 16-19 = E-cores 8-11, max 3800. Stock, not BIOS-OC'd.

## Services (`/var/service`)
KEEP: NetworkManager, dbus, lightdm, polkitd, udevd, chronyd, rtkit, yeetmouse, agetty-tty*.
LIVE, ask before kill: bluetoothd, libvirtd+virtlockd+virtlogd, tor (94M), privoxy, omen-sqm.
Broken symlinks: nvidia-persistenced, rc.local, zfs-zed.
wpa_supplicant live (iwlwifi present). cupsd absent. ollama **not running**.

## Autostart
KEEP: cairo-dock, easyeffects, ulauncher, pipewire, gnome-keyring.
Disable (not running): lama, fleasion, Dl. Hide: spice-vdagent, orca.
Leave: blueman, xfce4-panel, Thunar, xfdesktop until operator says.

## Next
p2-user then p2-root (no X restart). Clock offsets after Coolbits-live X. BIOS 5.0P/4.0E @ 1.28-1.32V operator-only.
