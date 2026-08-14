# Continuation prompt — Void XFCE → Compiz + XMB wallpaper

You are continuing a live, reversible desktop migration in the Git repository
`mistuhman/nvidia-intel-ocblizzard-4x8ddr4xmp-10gb3080-voidmusl-picom-xfwm4-compizunused-cairodock-egl-glx`.

## Mandatory initialization

1. Work only on branch `arena/019ffedb-nvidia-intel-ocblizzard-4x8ddr`.
2. Read `README.md` first, then read `MASTER.md` completely from top to bottom before proposing a command.
3. Treat `MASTER.md` as the canonical audit log. It is append-only: add dated rows only to Section VI ledgers and Section VII milestones. Never delete, rewrite, reformat, or silently correct old rows; supersede them with a new receipt-backed row.
4. Check `git status`, recent commits, and PR #2. Commit and push each verified target step to the fixed Arena branch.
5. Do not copy the whole MASTER into chat. Conserve context by referring to IDs such as W-026/X-019/M8 and retaining only the state capsule below.

## Interaction protocol — non-negotiable

- You cannot operate the user's Void machine. The sandbox has no target X server/GPU/xbps. Author commands; the user runs them and pastes output.
- Give exactly ONE copy-paste shell block at a time, then wait for complete output and the returned shell prompt.
- Before the next block, append receipt-backed rows to MASTER Section VI/VII, validate with `git diff --check`, commit, and push.
- Never fabricate execution or visual success. User observations are receipts; distinguish them from process/file receipts.
- Every WM/compositor-changing block must begin with an exact escape/rollback command. Keep the logged-in Ctrl+Alt+F2 recovery TTY available.
- No decision-tree walls. Resolve one measured variable per block.
- Never run picom with Compiz. The user rejected picom.
- Never use screen recording for the wallpaper. The bake is seek-driven deterministic rendering only.
- Keep screenshots, videos, baked frames, themes, and other binaries outside Git. Record only their factual findings/checksums/paths in MASTER.

## Objective

Finish a stable, reboot-safe Compiz Reloaded 0.8.18 desktop under XFCE with cairo-dock and xfce4-panel, smooth high-refresh animations, reversible theming, and then deliver a deterministic PS3 XMB-wave video wallpaper via the HEADLESS BAKE in MASTER Sections VIII–IX.

The user also wants a reversible monochrome/skeuomorphic style inspired by early-2000s Windows and OS X 10.4/10.6 plus their “sorbet visualizer” reference. This is M16 and comes only after M8 stability/persistence. Identify the exact “Monochrome” artifact, source, license, and checksum before downloading it. Coordinate Emerald, GTK/XFCE, panel, and cairo-dock; preserve a one-command visual rollback.

At the end, complete M15: derive a compact machine-readable state machine/prompt capsule from MASTER (facts, predicates, dependencies, actions, expected observations, receipts, rollback, troubleshooting, glossary, and `next_action`) without replacing the human audit log.

## Target facts already proven

- Void `x86_64`, GNU libc 2.41 — not musl.
- NVIDIA proprietary 595.84, RTX 3080, OpenGL 4.6, direct rendering.
- Compiz Reloaded/core/plugins/ccsm/Emerald 0.8.18 installed.
- cairo-dock 3.4.1 and plugins installed; cairo-dock runs with `-o`.
- mpv 0.41 installed; xwinwrap was not installed at the last package receipt.
- Displays:
  - DP-2 primary: `2560x1440+0+0`, current 120.00 Hz.
  - DP-0 right/inverted: `1920x1080+2560+197`, current 119.98 Hz.
  - X screen: 4480x1440.
  - NVIDIA ForceCompositionPipeline and ForceFullCompositionPipeline are enabled for both outputs.
- Picom is stopped and both XDG autostart names are masked with `Hidden=true`. Rollback directory: `/home/sd/picom-autostart-backup.1786688178`.
- xfwm4 internal compositing is false; original value backup: `~/xfwm-use-compositing.bak`.
- XFCE persistent Client0 command is STILL `xfwm4`; Compiz is not yet persistence/reboot safe.
- Session backup: `/home/sd/xfce4-session.xml.bak.1786687627`; command backup: `/home/sd/wm-command.bak`.
- Emergency WM recovery:

```bash
export DISPLAY=:0.0
pkill -x compiz 2>/dev/null || true
pkill -x emerald 2>/dev/null || true
nohup xfwm4 --replace > ~/xfwm4-tty-recovery.log 2>&1 &
```

## Live handoff state — verify before trusting PID

At the last receipt, Compiz PID 18768 owned `_NET_SUPPORTING_WM_CHECK`, was a direct child of `xfce4-session`, and had `--sm-client-id`. Emerald, xfce4-panel, and cairo-dock were live; xfwm4 and picom were absent. The PID can become stale between chats, so the first target block must verify, not assume.

Active profile: `/home/sd/.config/compiz/compizconfig/Default.ini`

Expected clean plugin list:

```text
core;ccp;move;resize;place;decoration;text;winrules;workarounds;grid;svg;regex;imgjpeg;png;animation;animationaddon;fade;switcher;
```

Expected Compiz 0.8 core display settings:

```ini
s0_detect_refresh_rate = false
s0_refresh_rate = 120
s0_detect_outputs = false
s0_outputs = 2560x1440+0+0;1920x1080+2560+197;
s0_sync_to_vblank = true
s0_lighting = true
as_texture_filter = 0
```

Latest profile backup: `/home/sd/.config/compiz/compizconfig/Default.ini.pre-explicit-display.1786690556`.
VBlank backup: `Default.ini.pre-vblank.1786690388`.
Pre-clean experimental backup: `Default.ini.pre-clean.1786690102`.

The current appearance/plugin baseline is accepted as memory-efficient, themed, animated, and immediately stable. Refresh smoothness is NOT accepted. Last snapshot after IX.4B-3: Compiz 7.1% CPU, 253220 KiB RSS; GPU 44%, 934 MiB, 29.01 W. Treat it as a comparison point, not an idle performance target.

## Failures already tested — do not repeat

- Initial `compiz --replace` with manual output detection disabled and no output list exposed only a tiny part of the main monitor (X-011).
- Adding the exact two output rectangles fixed the crop (W-018).
- Enabling water/wobbly/mblur/blur/cube/rotate/cubeaddon/cubemodel/gears/3d/bench together, with D-Bus, caused choppiness, hundreds of duplicate D-Bus registrations, a boolean assertion, and XFCE session-manager respawn (X-015).
- The heavy stack and D-Bus were removed. Effects must return one measured plugin group at a time.
- Hot-changing only VBlank false→true did not improve perceived refresh (W-025/X-018).
- Hot-writing explicit detect-refresh=false, refresh=120, detect-outputs=false, exact outputs, and VBlank=true also produced no perceived refresh change even though file and XRandR receipts were correct (W-026/X-019).
- Do not repeat checkbox, output-list, numeric-refresh, or broad `Context.Write()` experiments.
- Compiz 0.8 live core values use `[core] s0_*`; old `[opengl]/[composite] as_*` lines were not authoritative (W-024).

## Exact continuation point

M8 is blocked on X-019. Do NOT persist, log out, or reboot yet.

The next agent should:

1. Run one concise READ-ONLY block to reverify the live WM/PID/profile and collect renderer scheduling evidence that has not yet been measured: relevant `__GL_*` environment selectors, NVIDIA sync/flipping settings, current MetaMode, and the current Compiz log/process ancestry. Do not re-query facts already proven unless needed to detect state drift.
2. Before replacing the WM again, install and receipt a simple TTY recovery command/script so reboot safety has an executable artifact, not only chat text.
3. Perform a bounded fresh-process test of the already-written clean profile using `compiz --replace --sm-disable`, with automatic xfwm4 rollback. This is required because renderer-affecting core options may not have reinitialized during hot writes, and `--sm-disable` prevents XFCE from silently respawning another XSMP Compiz client.
4. Compare visual smoothness and resource numbers against W-026. If the fresh process is still choppy, change exactly one NVIDIA/GLX scheduling variable per bounded A/B test; do not combine guesses. Preserve the exact profile and plugin list.
5. Only after visual smoothness, stable PID/WM ownership, panel/dock survival, and no fatal log event: create the permanent recovery command, clear stale session cache per X-010, set Client0 to Compiz, test a full logout/login, then test reboot. Append receipts at every gate.
6. Only after M8 is DONE: perform M16 theming, then continue M9–M14 for the deterministic XMB bake/wallpaper. Never record the screen; implement `window.__xmb.seek(t)` and CDP BeginFrame as specified in MASTER.

## Git state

- Fixed branch: `arena/019ffedb-nvidia-intel-ocblizzard-4x8ddr`
- Open PR: #2, “MASTER.md: record target desktop migration receipts”
- Push only the fixed Arena branch.
- At handoff, tracked work consists of `README.md`, append-only `MASTER.md`, and this continuation prompt. Verify actual status and history instead of trusting this sentence.

Begin by reporting that you read README and MASTER in full, restating the current gate in no more than five lines, checking Git state, and then issuing only the first read-only target block.
