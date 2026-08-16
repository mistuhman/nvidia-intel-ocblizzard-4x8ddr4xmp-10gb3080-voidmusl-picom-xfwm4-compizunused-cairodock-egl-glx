# Continuation prompt — desktop restore after ROOT CAUSE FOUND (disk was full)

You are continuing a live, reversible desktop project in the Git repository
`mistuhman/nvidia-intel-ocblizzard-4x8ddr4xmp-10gb3080-voidmusl-picom-xfwm4-compizunused-cairodock-egl-glx`.

**THE GREETER MYSTERY IS SOLVED (12.118–12.122, ledger X-119).** The root
filesystem was at **100% / 0 bytes available**. A session exec cannot write
.Xauthority / ~/.cache / dbus state on a full fs, so it died `rc=1`, lightdm
tore X down and looped — while Xorg.0.log stayed CLEAN with no (EE) because X
itself needs no writes to initialize. That is why months of driver/KMS hunting
never found an error. Space is reclaimed (2.9G free). The desktop has NOT yet
been seen; that is the remaining work, and it may now simply work.

## Mandatory initialization

1. This Arena session is fixed to whatever `arena/...` branch it opens on. Do not switch, create, or push another branch.
2. Read `README.md`, then `MASTER.md` **completely**. Section XIV is the boot-death protocol; **12.118–12.122 is the current edge**; Sections I–II frozen constitution.
3. MASTER.md is append-only: dated, receipt-backed rows (W-/X-/U-), supersede never rewrite.
4. Refer to IDs; do not copy MASTER into chat.
5. **PR weight ceiling is 405 (U-061).** The 12.117–12.122 block already spent ~500 lines; ASK THE OPERATOR whether to squash those sections or raise the ceiling before adding more. Remind the operator of bench standing every few messages (standing order).
6. Operator is on a PHONE: tiny lines, ONE copy-paste block at a time, verdict words. Photos are transcribed verbatim into the ledger (Agent V role).

## Hard-won constraints (do not re-litigate)

- **Phone pastes CORRUPT commands. Twice proven (W-220 joined lines, X-122 dropped a `>` redirect).** Never write a block whose correctness depends on a bare `>` or `|` surviving. Prefer heredocs; ALWAYS follow any file creation with `ls -l <file>` as an existence gate.
- **VT switching Ctrl+Alt+Fn is DEAD on this box (X-114). Never propose it.**
- **Run `df -h /` before diagnosing ANY "process exits rc=1" symptom.** The whole 12.109–12.117 arc would have collapsed to one line. Ranked suspicion is not measurement (X-120: /var/log was predicted #1 hog, measured 1.5M).
- Console font confuses **1/8** (X-113) and **0/O** (X-121) — use long flags (`--clean-cache`, not `-O`).
- Never rewrite configs with ConfigParser/CCSM-class tools (X-103). sed with backup, or heredoc.
- picom stays masked (W-042). Never `--hwdec=auto` (X-094). `--wid=` needs shim (X-100).
- Deliver scripts to target by **heredoc, never curl** — the raw.githubusercontent CDN served stale content and cost a cycle (X-097).

## Verified current state (all receipt-backed this session)

- Disk: `/dev/nvme0n1p5 152G, 141G used, 2.9G avail, 99%`. Reclaimed via `xbps-remove --clean-cache --yes` + `rm -rf ~/.cache/*`. **Still tight — 2.9G is enough to log in, not to relax.**
- **X-105 landmine DISARMED (W-234):** session failsafe flipped to stock xfwm4 from `~/xfce4-session.xml.bak.1786722899`; `grep -c compiz` on the live `~/.config/xfce4/xfconf/xfce-perchannel-xml/xfce4-session.xml` returns **0**. Pre-flip file saved at `~/sess.bak.x117`.
- **NVIDIA/X proven healthy (W-237):** Xorg.1.log shows `NVIDIA(0) [DRI2] Setup complete`, `VDPAU driver: nvidia`, DPMS enabled, reaches MIT-SCREEN-SAVER, no (EE). A 20s `startx` on vt1 held display signal the whole time (monitors stayed powered) and exited `Server terminated successfully (0)`.
- `/etc/sv/lightdm/down` STILL EXISTS → boots land on tty1. Reverse: `rm /etc/sv/lightdm/down`.
- Backups in /root/: `xorg.conf.bak.x114` (STALE MetaMode, do not restore as-is), `anti-tear.bak.x114`, `nvidia-modeset.bak.x114`, `nvblk.bak.x109`, `dracut-nv.bak.x109`, grub `.bak.x109/.x112`.
- `scripts/x-probe-timed` exists in repo (54 lines, self-terminating X probe, 3 modes) — **not yet successfully run on target**.
- Unread log nobody has ever looked at: `/var/log/lightdm/x-0.log` (the greeter's own X output).

## Immediate objectives, in order

1. **The cheapest unread fact first (X-123):** `ls /usr/bin/xsetroot /usr/bin/xterm /usr/bin/xclock`. Probe 1 painted black, but black is X's DEFAULT root colour — if xsetroot is absent the probe proved nothing about paint. Do not theorize past this one line.
2. **Direct session attempt** (failsafe is already xfwm4-safe): `startx /usr/bin/xfce4-session -- :1 vt1`, self-terminating wrapper preferred. Verdict: desktop | black.
3. If desktop appears: `rm /etc/sv/lightdm/down`, reboot, confirm greeter. H2 (vt7 theory, X-117/W-238) is weakened — do NOT spend cycles on it unless a real greeter boot still fails.
4. **Space, properly (U-063):** operator has a **2TB USB HDD** for relocation. Tier 2 = `~/.var` (40G flatpak), `~/.local` (30G), Documents 4.9G, flutter 2.3G, OpenRGB 2.6G. **Tier 3 = `~/.bitcoin` (7.6G) — wallet/chain state, NEVER delete, NEVER move by glob, only deliberately with the client stopped.** Do this from a working desktop, not a tty at 0 bytes.
5. **Then Compiz** (Agent C): compiz-revert, verify golden Default.ini SHA dcefbadd... vs W-045, `_NET_WM_NAME=compiz`, `s0_*` geometry via compiz-profile-repair, plugin list (W-191: water/wobbly/snow go before opacity work).
6. **Then the queue:** U-055 Cheetah menus, M12 efficient mp4 wallpaper (W-199/W-200, fork U-057), M18 icons/sound.

## Ledger anchors for this edge
X-118/X-119 (disk full = root cause), X-120 (suspect-ranking retraction),
X-121 (0/O erratum), X-122 (paste dropped `>`), X-123 (xsetroot hypothesis),
W-234 (X-105 disarmed), W-237 (NVIDIA healthy), W-238 (H2 weakened),
U-063 (2TB USB plan), Section XIV (recovery protocol), U-061 (PR ceiling).
