# Continuation prompt — XMB bare layer MERGED (PR #15); Cheetah menus next

Live reversible desktop project in `mistuhman/nvidia-intel-ocblizzard-...-egl-glx`.
Supersedes the 12.127 prompt: its XMB-next objectives are closed. This is the
12.134 edge. (X-126 lesson: a stale prompt costs real work.)

## Mandatory init
1. Session is fixed to the `arena/...` branch it opens on. Never switch or push another.
2. Read `README.md`, then `MASTER.md` — **the edge is 12.134, read the tail first.**
   Sections I–II frozen. XIV is boot-death protocol (not currently needed).
3. MASTER.md is append-only: dated W-/X-/U- rows with receipts. Supersede, never rewrite.
4. PR ceiling 405 lines (U-061). Remind operator of bench standing every few messages.
5. Operator is on a PHONE: tiny lines, ONE paste block at a time, end in a verdict word.
   Photos are transcribed verbatim into the ledger (Agent V).

## Settled — do NOT redo
- Compiz is the login WM and CCSM work survives reboot (W-267). **BUT X-134 rule:**
  persistence is one mutable key — after ANY `compiz-revert --xfwm4`,
  `xfce-wm-recover`, or session-XML restore it is OFF until
  `scripts/compiz-persist-arm` re-arms it and verify says SAFE.
- CCSM via `ccsm-safe` only: 3 consecutive SAFE sessions (W-265/W-275/W-284).
  Guard is keys-only (W-252); the plugin floor self-heals a dropped `ccp`
  automatically (W-265). Keep Detect Outputs / Detect Refresh Rate OFF; never
  tick "Save session for future logins" while CCSM is open (X-029).
  Active profile 314d29f6..., golden af457926.
- XMB bare layer MERGED (PR #15): one sticky input-transparent (-ni) xwinwrap +
  one mpv, gpu-next + nvdec-copy (10-11% dec), --no-stop-screensaver,
  --panscan=1.0, explicit geometry 4480x1440+0+0 or -fs. main-red is the
  proven role; videos live on /mnt/games (root is 96% used — df first, always).
- Shell/xprop crossfade is RETIRED (X-143): controller exits 2 disabled,
  autostart off in-repo AND on target (.desktop.disabled). Never re-enable.
- xfce4-screensaver "XMB Sleep Wave" theme installed; operator-select gated.
- Human gates passed: "compiz loads and all my animations are set after reboot"
  (W-267), input "works perfectly" (W-275), wallpaper "restored" (W-279).

## Constraints (do not re-litigate)
- Phone pastes CORRUPT commands (W-220, X-122). Never depend on a bare `>` or `|`;
  use heredocs, gate every file creation with `ls -l <file>`.
- **VT switching Ctrl+Alt+Fn is DEAD (X-114).** Never propose it.
- Run `df -h /` before diagnosing ANY "exits rc=1" symptom (X-119).
- Console font confuses 1/8 and 0/O — long flags only (`--clean-cache`).
- Never rewrite configs with ConfigParser-class tools (X-103); use guard tools or sed+backup.
- picom stays masked (W-042). Never `--hwdec=auto` (X-094). `--wid=` needs the shim (X-100).
- Deliver scripts by heredoc or git checkout, never curl (X-097). No unanchored `pgrep -f` (X-128).
- CCSM's four gtk.css + pixbuf warnings are known benign (X-135); never escalate (X-130c).
- Never destabilize the WM for the wallpaper. nvdec-copy's copy cost is cheaper
  than a second decoder/context — do not trade correctness for zero-copy (W-282).

## Objectives, in order
1. CLOSED: guard tools on target + verify. CLOSED: ccsm-safe tuning + reboot re-verify.
2. CLOSED/MERGED: XMB bake (bare layer accepted; crossfade retired; screensaver
   theme installed but operator-gated).
3. **NEXT — U-055 Cheetah menu transparency.** Step 1 is a READ-ONLY target
   collect (profile [opacity] section, current gtk.css, xfce4-terminal keys).
   Step 2 author two reversible tools: `scripts/gunmetal-cheetah-menu-overlay`
   (rgba(0,0,0,0.82) pinstripe gtk.css) and `scripts/compiz-opacity-menus`
   (enable opacity plugin, menus 88 / utility 92). Both hash-recorded, with
   --restore, and never edit /usr/share.
4. M18 icons/sound: three sub-tasks, do not conflate (see M18 row) — (a) Zen
   icon -> Safari override via user theme or ~/.local copy, (b) missing
   Thunar/terminal icons, (c) sound chain.
5. U-070 single-renderer switcher: parked spec, operator go-ahead required.
   Acceptance metrics: frame time, dropped frames, decoder%, VRAM, RSS.
6. Tier-2 storage to the 2TB USB when convenient. **Tier-3 `~/.bitcoin`: never
   delete, never glob-move, only deliberately with the client stopped (U-063).**

## Anchors
12.134 (W-284, M12-POST-MERGE), 12.133 (W-281/X-143/W-282/U-070/W-283),
12.132 (W-275/X-139), 12.130 (W-265/W-266/W-267), 12.129 (W-264/X-134),
W-053 golden af457926, X-031 pre-reboot hash rule, X-032 section-scoped check,
U-061 ceiling 405.
