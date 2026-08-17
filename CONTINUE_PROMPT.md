# Continuation prompt — U-070 one-mpv IPC switcher target trial; U-055 closed

Live reversible desktop project in `mistuhman/nvidia-intel-ocblizzard-...-egl-glx`.
Supersedes the 12.147 prompt. This is the 12.148 pre-target edge.
(X-126 lesson: a stale prompt costs real work.)

## Mandatory init
1. Session is fixed to the `arena/...` branch it opens on. Never switch or push another.
2. Read `README.md`, then `MASTER.md` — **the edge is 12.140, read the tail first.**
   Sections I–II frozen. XIV is boot-death protocol (not currently needed).
3. MASTER.md is append-only: dated W-/X-/U- rows with receipts. Supersede, never rewrite.
4. PR ceiling 405 (U-061). **Resumes at 405 after X-147.** One objective per PR.
   Remind operator of bench standing every few messages.
5. Operator is on a PHONE: tiny lines, ONE paste block at a time, end in a verdict word.
   Photos are transcribed verbatim into the ledger (Agent V).

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
- One-mpv IPC crossfade TARGET-ACCEPTED (W-301): events flow, blends run at
  60 fps, eased cos curve. Persistent burst blur TARGET-PROVEN (W-304/W-306:
  8- and 11-hop bursts state=OK). X-156: a peak-hold blur released only AFTER
  the fade masked the dissolve; the REVEAL envelope (W-307) releases from the
  fade midpoint so the crossfade shows as blur lifts. Default BLUR_PEAK 4.0.
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
- Never ConfigParser-class config rewrites (X-103). picom stays masked (W-042).
- Never `--hwdec=auto` (X-094). `--wid=` needs the shim (X-100).
- Deliver by heredoc or git checkout, never curl (X-097). No unanchored `pgrep -f` (X-128).
- CCSM gtk.css/pixbuf warnings benign (X-135). Never destabilize WM for wallpaper (W-282).
- One objective per PR (X-147). Ceiling 405.
- Never re-patch an installed copy whose SHA diverges from repo HEAD;
  re-install whole files from one SHA via xmb-runtime-install (X-154).

## Objectives, in order
1. CLOSED: guard + CCSM + reboot. CLOSED/MERGED: XMB bare layer (PR #15).
2. CLOSED/MERGED: U-055 tools + failed apply + recovery (PR #17). Menus OFF.
3. **ACTIVE — U-070 one-mpv IPC switcher target trial (W-292/W-293/U-073).**
   Collect proved Compiz viewport switching works; main-red never changes
   because no controller is running. New controller is one xwinwrap + one mpv
   + one gpu-next context, lavfi track blend over JSON IPC, latest-wins, and
   exact-PID takeover. Sandbox + FFmpeg graphs PASS; target remains unproven.
   Crossfade TARGET-ACCEPTED (W-301); persistent burst blur TARGET-PROVEN
   (W-304/W-306). Timings operator-directed: FADE_MS=350, BLUR_MS=500 = total
   blur window (U-084/W-305). X-156 found the peak-hold blur masked the
   crossfade; W-307 REVEAL envelope releases from the fade midpoint so the
   X-157 then proved the masking numerically (blur at fade end still ~2.7;
   cos fall stays >25% of peak ~84% of its time); U-086/W-309 punch-and-
   reveal: blur punches to peak in FADE_MS/4, holds during queued bursts,
   releases on a cos^4 fast curve to exact 0 exactly at fade end; BLUR_MS
   capped at FADE_MS; blend motion back to linear so mix motion lands in the
   clean tail. NEXT: reinstall controller (config stays 350/500/4.0),
   --check must print fade_ms=350 blur_ms=500 peak=4.0; switch slow + fast;
   burst lines must read rise_ms=88 fall_ms=262 state=OK; the crossfade
   must be VISIBLE on different-role hops (same-role hops pulse blur only,
   by design). Verdict word; any failure: rollback block (controller +
   config). Autostart remains Hidden/false until accept. Never run target's
   old SHA 7484d253 controller or revive X-143.
4. M18 icons/sound after switcher direction is clear.
5. Optional later: obs menu opacity retry (fixed tool) — operator go-ahead only.
6. Tier-2 USB when convenient. **Tier-3 `~/.bitcoin`: never delete, never
   glob-move, only with client stopped (U-063).**

## Anchors
12.148 (W-308 gates green at peak 4.0, X-157 masking proven numerically,
U-086/W-309 punch-and-reveal + linear dissolve, sandbox-proven),
12.147 (X-156 crossfade masked by peak-hold blur, U-085/W-307 reveal envelope
+ BLUR_PEAK 4.0, sandbox-proven),
12.145 (W-301 crossfade target-accepted, X-155 blur-at-speed fail,
W-302/U-083 persistent burst blur, sandbox-proven),
12.144 (X-154/W-300/U-082 blur peak + eased crossfade, sandbox-proven),
12.140 (W-292/X-148/W-293/U-073), 12.139 (W-291/X-147 merge),
12.138 (W-290 RECOVERED), 12.137 (X-145/X-146),
12.136 (W-286), 12.135 (W-285), 12.134 (W-284), 12.133 (W-281/X-143/U-070),
W-053 golden af457926, X-031, X-032, U-061 ceiling 405 (resumed).
