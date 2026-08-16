# Continuation prompt — greeter revival from live tty1, then Compiz restore + U-055/M12 (post boot-death recovery)

You are continuing a live, reversible desktop project in the Git repository
`mistuhman/nvidia-intel-ocblizzard-4x8ddr4xmp-10gb3080-voidmusl-picom-xfwm4-compizunused-cairodock-egl-glx`.

**BOOT DEATH RESOLVED (12.108–12.116, Section XIII).** The box boots
6.18.35-tkg-bore to a tty1 login prompt (lightdm intentionally downed), user
`sd` logs in, nvidia loads at real-root with console surviving, X initializes
with no fatal EE. The desktop is NOT yet back — greeter/display-signal stage is
the current edge, now debuggable from a live shell.

## Mandatory initialization

1. This Arena session is fixed to whatever `arena/...` branch it opens on. Do not switch, create, or push another branch.
2. Read `README.md`, then `MASTER.md` **completely** before proposing any target command. Section XIII is the proven boot-death recovery protocol; 12.116 is latest; Sections I–II frozen constitution.
3. MASTER.md is append-only audit log: dated, receipt-backed rows (W-/X-/U-), supersede never rewrite.
4. Refer to IDs; do not copy MASTER into chat.
5. **PR weight ceiling is 405 (U-061).** Rescue was ledger-only; keep script weight for milestones. Remind the operator of bench standing every few messages (standing order).
6. Operator is on a PHONE: tiny lines, ONE copy-paste block at a time, verdict words. Photos are transcribed verbatim into the ledger (Agent V role — beware console-font 1/8 misreads, X-113).

## Hard-won constraints (do not re-litigate)

- **VT switching Ctrl+Alt+Fn is DEAD on this box (X-114). Never propose it** until a working desktop proves otherwise.
- Rescue boots use GRUB `e` + `module_blacklist=nvidia,nvidia_drm,nvidia_modeset,nvidia_uvm init=/bin/sh`; exit via sync + sysrq b. Should rarely be needed now — tty1 is live.
- `nomodeset` does NOT stop proprietary nvidia_drm (X-107).
- lsinitrd gates: `| grep nvidia | grep -c ko` (firmware lines lie, X-112).
- presence ≠ inert (X-083/X-100/X-111): dracut-embedded modules coldplug with no cmdline reference.
- Never rewrite configs with ConfigParser/CCSM-class tools (X-103, W-033/W-046). sed with backup, verify gate, or heredoc.
- picom stays masked (W-042). Never `--hwdec=auto` (X-094). `--wid=` needs shim (X-100).

## Current target state

- Kernel 6.18.35-tkg-bore (name per operator; ledger earlier misread 6.10, X-113). dracut initramfs CLEAN of nvidia .ko (omit_drivers 99-no-nvidia.conf + rd.driver.blacklist on cmdline, initramfs-scoped only).
- `/etc/sv/lightdm/down` exists → boots land on tty1 login. **Reverse when greeter fixed: `rm /etc/sv/lightdm/down`.**
- Removed with backups in /root/: `xorg.conf.bak.x114` (static xorg.conf with STALE MetaMode — do not restore as-is), `anti-tear.bak.x114`, `nvidia-modeset.bak.x114` (options nvidia-drm modeset=1 — the layer-4 killer, X-115), `nvblk.bak.x109`, `dracut-nv.bak.x109`; grub backups `/etc/default/grub.bak.x109/.x112`.
- `/etc/X11/xorg.conf.d/20-nvidia.conf` retained (driver selection).
- Xorg.0.log (last run): only WW font-OTF + acpid socket; `(==) AllowNVIDIAGpuScreens`; reaches MIT-SCREEN-SAVER. No EE. Monitors previously dropped signal at DM/X handoff — root cause of THAT specific signal drop not yet receipt-proven (candidates: greeter modeset without xorg.conf geometry, lightdm config, monitor DPMS during old KMS era — collect lightdm.log first).
- Session failsafe `Client0_Command` still points at compiz-session (X-105) — WM landmine waiting BEHIND the greeter fix. Plan: set failsafe to xfwm4 BEFORE re-enabling lightdm, then compiz-revert once stable.
- Compiz profile: golden Default.ini SHA dcefbadd... was restored earlier during panic; verify against W-045 before Compiz relaunch. compiz-revert / compiz-profile-repair / xfce-wm-recover all installed and proven.

## Immediate objectives, in order

1. **From tty1 as sd**: `sudo tail -30 /var/log/lightdm/lightdm.log` (one command per line — phone pastes that join commands produce "invalid context" errors, W-220) + `ls /root/*.bak*` inventory as receipts.
2. **Manual X probe from console**: set failsafe to xfwm4 FIRST (X-105), then `startx /usr/bin/xfce4-session` (or xinit probe). This isolates greeter-vs-X. If displays light up: problem was lightdm handoff; fix lightdm.conf (candidates: display-setup-script xrandr line for DP-2 2560x1440+0+0 primary + DP-0 1920x1080+2560+197), `rm /etc/sv/lightdm/down`, reboot to greeter.
3. **Compiz restore** (only after xfwm4 desktop stable): compiz-revert path, verify `_NET_WM_NAME=compiz`, `s0_*` geometry via compiz-profile-repair, golden plugin list (W-191 divergence: water/wobbly/snow must go before opacity work).
4. **Then resume the queue**: U-055 Cheetah menus (opacity plugin + gtk.css overlay + terminal transparency), M12 efficient mp4 wallpaper (xfdesktop --quit + single 4480x1440 sticky, W-199/W-200 proven; fork plan U-057), M18 icons/sound.
5. Wallpaper relaunch reminders: shim + nvdec-copy + `-b -s -g 4480x1440+0+0 -st -sp -nf -ov -fdt`, xfdesktop Desktop windows must be gone (W-198).

## Ledger anchors for this edge
X-114 (no VT), X-115/W-218 (modeset=1 removal), W-219/W-220 (lightdm down,
tty1 live, X clean init), Section XIII (recovery protocol), X-105 (failsafe
landmine), W-191 (plugin divergence), W-199/W-200 (efficient wallpaper),
U-055/U-057 (menus + fork), U-061 (PR ceiling 405 + bench reminders).
