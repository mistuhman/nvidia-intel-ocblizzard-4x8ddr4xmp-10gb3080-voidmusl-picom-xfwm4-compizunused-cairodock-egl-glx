# Continuation prompt — U-055 Cheetah tools AUTHORED (sandbox); target collect+apply next

Live reversible desktop project in `mistuhman/nvidia-intel-ocblizzard-...-egl-glx`.
Supersedes the 12.134 prompt: XMB bare layer stays merged; Cheetah tools now
exist in-repo. This is the 12.135 edge. (X-126 lesson: a stale prompt costs
real work.)

## Mandatory init
1. Session is fixed to the `arena/...` branch it opens on. Never switch or push another.
2. Read `README.md`, then `MASTER.md` — **the edge is 12.135, read the tail first.**
   Sections I–II frozen. XIV is boot-death protocol (not currently needed).
3. MASTER.md is append-only: dated W-/X-/U- rows with receipts. Supersede, never rewrite.
4. PR ceiling 405 (U-061). X-144 disclosed an honest exceed for this U-055 pair;
   ceiling resumes at 405 after merge. Remind operator of bench standing every few messages.
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
- **U-055 tools AUTHORED (W-285), sandbox 21/21 PASS, NOT YET on target.**
    `scripts/compiz-opacity-menus` (40be1340...) — opacity plugin + 88/92 rules.
    `scripts/gunmetal-cheetah-menu-overlay` (d1d79bc1...) — rgba(0,0,0,0.82) pinstripe.
    Both in `compiz-guard-install`. Both have --check/--restore. Never /usr/share.

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
- Do not add opacity via CCSM by hand (X-098). Use compiz-opacity-menus.

## Objectives, in order
1. CLOSED: guard tools + CCSM + reboot. CLOSED/MERGED: XMB bare layer (PR #15).
2. **NEXT — U-055 target land (U-071 gate).**
   (a) ONE read-only collect paste (profile plugins + [opacity] + gtk.css head +
       terminal keys). Confirm still no opacity / no cheetah block.
   (b) `sh scripts/compiz-guard-install` then both --check (expect NOT-APPLIED).
   (c) apply both, `setsid $HOME/.local/bin/compiz-session`, verify SAFE.
   (d) operator visual gate on menu look; --restore either layer if rejected.
   (e) optional: xfce4-terminal background transparency after menus accepted.
3. M18 icons/sound: three sub-tasks, do not conflate — (a) Zen icon -> Safari
   override via user theme or ~/.local copy, (b) missing Thunar/terminal icons,
   (c) sound chain.
4. U-070 single-renderer switcher: parked spec, operator go-ahead required.
5. Tier-2 storage to the 2TB USB when convenient. **Tier-3 `~/.bitcoin`: never
   delete, never glob-move, only deliberately with the client stopped (U-063).**

## Anchors
12.135 (W-285/X-144/U-071), 12.134 (W-284, M12-POST-MERGE), 12.133
(W-281/X-143/W-282/U-070/W-283), 12.132 (W-275/X-139), 12.130 (W-265/W-267),
W-053 golden af457926, X-031 pre-reboot hash rule, X-032 section-scoped check,
U-061 ceiling 405 (X-144 one-time exceed for U-055 pair).
