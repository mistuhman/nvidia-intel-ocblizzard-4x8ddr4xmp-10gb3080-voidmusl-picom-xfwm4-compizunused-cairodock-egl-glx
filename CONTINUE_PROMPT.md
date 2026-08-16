# Continuation prompt — U-070 one-mpv IPC switcher target trial; U-055 closed

Live reversible desktop project in `mistuhman/nvidia-intel-ocblizzard-...-egl-glx`.
Supersedes the 12.139 prompt. This is the 12.140 pre-target edge.
(X-126 lesson: a stale prompt costs real work.)

## Mandatory init
1. Session is fixed to the `arena/...` branch it opens on. Never switch or push another.
2. Read `README.md`, then `MASTER.md` — **the edge is 12.140, read the tail first.**
   Sections I–II frozen. XIV is boot-death protocol (not currently needed).
3. MASTER.md is append-only: dated W-/X-/U- rows with receipts. Supersede, never rewrite.
4. PR ceiling 405 (U-061). **Resumes at 405 after X-147.** One objective per PR.
   Remind operator of bench standing every few messages.
5. Operator works at the desktop terminal (normal-sized lines are fine). No
   phone-style tiny-line / one-paste / verdict-word gating — that 12.140-era
   guidance was stale and caused unacceptable delivery behavior (W-301).
   Open a pull request only when the operator explicitly asks.

## Settled — do NOT redo
- Compiz is the login WM and CCSM work survives reboot (W-267). **X-134 rule:**
  after ANY `compiz-revert --xfwm4`, `xfce-wm-recover`, or session-XML restore,
  persistence is OFF until `compiz-persist-arm` + verify SAFE.
- CCSM via `ccsm-safe` only. Guard keys-only (W-252); plugin floor self-heals
  dropped `ccp` (W-265). Detect Outputs / Detect Refresh Rate OFF. Never tick
  "Save session for future logins" while CCSM is open (X-029).
  Golden af457926. Post-recovery active was b94b49e0... (W-290).
- XMB bare layer MERGED (PR #15): one sticky input-transparent (-ni) xwinwrap +
  one mpv, gpu-next + nvdec-copy (10-11% dec), --no-stop-screensaver,
  --panscan=1.0, geometry 4480x1440+0+0 or -fs. main-red proven role; videos
  on /mnt/games (root 96% — df first, always).
- Shell/xprop crossfade RETIRED (X-143): controller exits 2 disabled,
  autostart off in-repo AND on target. Never re-enable that path.
- xfce4-screensaver "XMB Sleep Wave" theme installed; operator-select gated.
- Human gates: reboot animations OK (W-267), input OK (W-275), wallpaper
  restored (W-279).
- **U-055 Cheetah menus: NOT accepted.** Tools exist (`compiz-opacity-menus`
  uses plugin `obs` not `opacity` — X-145; `--reload` companions only — X-146).
  gtk.css is stock 206 B. Do not re-apply cheetah overlay or obs without
  explicit operator go-ahead. Full `compiz-session` replace orphans emerald/dock.

## Constraints (do not re-litigate)
- Phone pastes CORRUPT commands (W-220, X-122). No bare `>` or `|`; heredocs;
  gate every file creation with `ls -l <file>`.
- **VT switching Ctrl+Alt+Fn is DEAD (X-114).** Never propose it.
- `df -h /` before any "exits rc=1" diagnosis (X-119).
- Console font confuses 1/8 and 0/O — long flags only.
- Pasted commands can corrupt special chars (W-220, X-122). Keep heredocs, no
  bare `>` or `|`; gate every file creation with `ls -l <file>`.
- Never ConfigParser-class config rewrites (X-103). picom stays masked (W-042).
- Never `--hwdec=auto` (X-094). `--wid=` needs the shim (X-100).
- Deliver by heredoc or git checkout, never curl (X-097). No unanchored `pgrep -f` (X-128).
- CCSM gtk.css/pixbuf warnings benign (X-135). Never destabilize WM for wallpaper (W-282).
- One objective per PR (X-147). Ceiling 405.

## Objectives, in order
1. CLOSED: guard + CCSM + reboot. CLOSED/MERGED: XMB bare layer (PR #15).
2. CLOSED/MERGED: U-055 tools + failed apply + recovery (PR #17). Menus OFF.
3. **ACTIVE — Gaussian blur only (W-301/W-302/U-083).** One-mpv switcher is
   already live on target (12.141-12.143, running controller PID on desktop).
   Scope is the transition Gaussian blur ONLY: strong, persistent, performant.
   Shader is a downsampled separable Gaussian (1/4 MAIN, sigma 6.5 H+V, ~26 px
   effective); persistence lives in the running controller's blur lifecycle,
   so no controller change ships. NEXT: overwrite the shader on target and
   confirm visually. No crossfade/controller edits in this objective; revert
   any that creep in. Autostart remains Hidden/false until operator accepts.
4. M18 icons/sound after switcher direction is clear.
5. Optional later: obs menu opacity retry (fixed tool) — operator go-ahead only.
6. Tier-2 USB when convenient. **Tier-3 `~/.bitcoin`: never delete, never
   glob-move, only with client stopped (U-063).**

## Anchors
12.145 (W-301/W-302/U-083 blur-only), 12.144 (W-300),
12.140 (W-292/X-148/W-293/U-073), 12.139 (W-291/X-147 merge),
12.138 (W-290 RECOVERED), 12.137 (X-145/X-146),
12.136 (W-286), 12.135 (W-285), 12.134 (W-284), 12.133 (W-281/X-143/U-070),
W-053 golden af457926, X-031, X-032, U-061 ceiling 405 (resumed).
