# Continuation prompt — Compiz baseline DONE, CCSM guarded, XMB next

Live reversible desktop project in `mistuhman/nvidia-intel-ocblizzard-...-egl-glx`.
Supersedes the greeter-era prompt (X-126: that version was stale).

## Mandatory init
1. Session is fixed to the `arena/...` branch it opens on. Never switch or push another.
2. Read `README.md`, then `MASTER.md` — **the edge is 12.127, read the tail first.**
   Sections I–II frozen. XIV is boot-death protocol (not currently needed).
3. MASTER.md is append-only: dated W-/X-/U- rows with receipts. Supersede, never rewrite.
4. PR ceiling 405 lines (U-061). Remind operator of bench standing every few messages.
5. Operator is on a PHONE: tiny lines, ONE paste block at a time, end in a verdict word.
   Photos are transcribed verbatim into the ledger (Agent V).

## Settled — do NOT redo
- **Compiz is the login WM and survives reboot** (W-245 armed, W-246 cold-boot proven).
  Failsafe Client0_Command = `/home/sd/.local/bin/compiz-session`.
- Greeter, normal boot, Ethernet all restored (W-239/W-240/W-241).
- Disk root cause was a full fs (X-119); ~6.8G free now (W-242/W-243). Still tight.
- Human gate passed: "compiz desktop, everythings working, just no wallpaper" (W-247).

## Constraints (do not re-litigate)
- Phone pastes CORRUPT commands (W-220, X-122). Never depend on a bare `>` or `|`;
  use heredocs, gate every file creation with `ls -l <file>`.
- **VT switching Ctrl+Alt+Fn is DEAD (X-114).** Never propose it.
- Run `df -h /` before diagnosing ANY "exits rc=1" symptom (X-119).
- Console font confuses 1/8 and 0/O — long flags only (`--clean-cache`).
- Never rewrite configs with ConfigParser-class tools (X-103); use guard tools or sed+backup.
- picom stays masked (W-042). Never `--hwdec=auto` (X-094). `--wid=` needs the shim (X-100).
- Deliver scripts by heredoc or git checkout, never curl (X-097). No unanchored `pgrep -f` (X-128).

## CCSM is safe to use, via the wrapper (12.127)
Install once on target from a checkout: `sh scripts/compiz-guard-install`
- `ccsm-safe` — use INSTEAD of bare `ccsm`. Snapshots, runs it, repairs the 7 enforced
  keys on any exit incl. crash/Ctrl-C, prints the plugin diff and an undo line.
- `compiz-profile-verify` — read-only, run before ANY logout. SAFE|REPAIRABLE|UNSAFE.
- Escapes intact: `compiz-revert`, `compiz-revert --xfwm4`, `xfce-wm-recover`.
- Keep Detect Outputs / Detect Refresh Rate OFF; never tick "Save session for future
  logins" while CCSM is open (X-029).
- **U-065 CLOSED keys-only** (W-252): the guard owns the 7 display keys and will NOT
  revert `as_active_plugins` — W-191 wants water/wobbly deliberately enabled.

## Objectives, in order
1. Install guard tools on target, run `compiz-profile-verify`. Verdict word.
2. Tune animations through `ccsm-safe`. Reboot once, re-verify.
3. **Then the XMB bake** (Agent B, resumes at W-200): inventory installed
   launcher/shim/videos, then restore the proven single-decode bare layer.
   Native MP4 fork is U-057. Never destabilize the WM for the wallpaper.
4. Then: U-055 Cheetah menus, M18 icons/sound.
5. Tier-2 storage to the 2TB USB when convenient. **Tier-3 `~/.bitcoin`: never delete,
   never glob-move, only deliberately with the client stopped (U-063).**

## Anchors
12.127 (W-248 ccsm-safe, W-249 verify, W-250 installer, W-251 tests, X-128 pgrep bug),
12.126 (W-246/W-247), W-245, W-053 golden af457926, X-032 section-scoped check,
X-031 pre-reboot hash rule, U-061 ceiling.
