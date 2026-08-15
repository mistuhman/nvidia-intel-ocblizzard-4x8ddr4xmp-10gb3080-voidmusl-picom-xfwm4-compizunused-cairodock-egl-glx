# Continuation prompt — wallpaper efficient spanning + Cheetah menu + mp4 fork (M12/M16/M18 + U-055/U-057)

You are continuing a live, reversible desktop project in the Git repository
`mistuhman/nvidia-intel-ocblizzard-4x8ddr4xmp-10gb3080-voidmusl-picom-xfwm4-compizunused-cairodock-egl-glx`.

**WM migration DONE, bake DONE, wallpaper HW decode DONE but spanning inefficient.** Theming (Cheetah transparency) and mp4-native spanning are the current edge.

## Mandatory initialization

1. This Arena session is fixed to whatever `arena/...` branch it opens on. Do not switch, create, or push another branch.
2. Read `README.md`, then read `MASTER.md` **completely**, before proposing any target command. Sections 11-12 are live edge (12.103 is latest); Sections I–II are frozen constitution.
3. `MASTER.md` is append-only audit log. Add dated, receipt-backed rows to Section VI ledgers (W-/X-/U-) and Section VII/XI/XII milestones. **Never** rewrite, delete, reformat, or silently correct a prior row — supersede with evidence.
4. Do not copy MASTER into chat. Refer to IDs (W-195, X-100, U-057) and keep capsule below.
5. Commit and push each verified receipt to the fixed branch as you go. PR weight must stay below 465.

## Interaction protocol

- Sandbox is not target (no X, no GPU, no Compiz). Author commands; user runs on Void box and pastes output.
- **Exactly ONE copy-paste block at a time**, then wait.
- Before next block: append receipt to MASTER, commit, push.
- Never fabricate process/file/visual success. Human visual receipt is valid but labeled separately.
- WM-changing blocks must state escape: `/home/sd/.local/bin/xfce-wm-recover` (TTY Ctrl+Alt+F2 → `xfwm4 --replace &`).
- Verify your own checks. `--really-quiet` previously hid diagnostics (X-092, X-099, X-100) — use `XMB_MPV_VERBOSE=1` for debug.

## Current state — target-verified, do not re-litigate

- **Compiz Reloaded 0.8.18 login WM**: `xfce4-session` → `/home/sd/.local/bin/compiz-session` → `__GL_YIELD=USLEEP compiz --replace ccp`, `_NET_WM_NAME=compiz` (W-049). Smoothness solved by `__GL_YIELD=USLEEP` (W-040).
- **Geometry pinned**: `compiz-profile-repair` enforces `s0_outputs = 2560x1440+0+0;1920x1080+2560+197;` and `s0_refresh_rate=120` (W-048). `s0_*` keys are truth (W-024). Current live `as_active_plugins` has diverged to include water/wobbly/snow/shift/animationplus (W-191) — not golden dcefbadd..., needs repair before adding opacity.
- **Bake DONE**: 3 deterministic 4480x1440 HEVC 60s loops (W-178): main-red 156MB SHA 1f8de512..., sleep 177MB, work-monochrome 240MB, machine+human PASS.
- **mpv 0.41.0 hwdec table — verbose probe (W-195) supersedes rc-only W-185**:
  - `no` → software (expected)
  - `nvdec` → `Could not create device` → software fallback (rc=0 but not HW) — X-100, same class as X-083 presence≠capability
  - `nvdec-copy` → `Using hardware decoding (nvdec-copy)` — **WINNER**
  - `vaapi`, `vaapi-copy`, `cuda` → Could not create device → software
  - `cuda-copy` → `Using hardware decoding (cuda-copy)` — second HW path
  - `vaapi auto` → `auto` segfaults rc=139 (W-185, X-094) via hevc-vulkan (W-183)
  - `vulkan` → looks at hevc-vulkan, crashes in prior runs
  Therefore **never use `--hwdec=auto`** and never probe by rc alone — grep `Using hardware decoding`.

- **xwinwrap WID catch-22 (X-100)**: `xwinwrap.c` only replaces exact arg `strcmp(argv[i],"WID")==0`. mpv 0.41.0 rejects `--wid WID` (space) and requires `--wid=value`. `--wid=WID` not replaced → `wid option must be an integer: WID`. Fix: shim `mpv-xwinwrap-shim WID` → `--wid=INT` (W-194, SHA 25e78f48). Launcher `xmb-wallpaper` SHA 101185b4 → b711df8d → now uses shim + sticky spanning.

- **Wallpaper live but inefficient (W-196–W-199, X-101/X-102)**:
  - Single: `xwinwrap -b -s -g 4480x1440+0+0 -st -sp -nf -ov -fdt -- shim WID ... --hwdec=nvdec-copy --vo=gpu-next` → PID 27192+27194, 12% decoder, hardware PASS, but visual not spanning due to xfdesktop Desktop windows.
  - Dual per-monitor: DP-2 `2560x1440+0+0` PID 27333+27336 and DP-0 `1920x1080+2560+197` PID 27334+27337, both hardware, wmctrl shows `0x01a0000d 0 0 0 2560 1440 Desktop` and `0x01a00011 0 5120 394 1920 1080 Desktop` — xfdesktop's 2 Desktop windows obscure bare layer even after blanking `image-style 0`/`last-image ''` (X-097, W-198). They are above root, forcing 3-layer composite.
  - Dual decode doubles NVDEC cost (2x 10-12%, 2x 1.3s vulkan device creation). Desired: **single decode at 4480x1440 → single GL texture → per-output cropping at bare composite layer, headless, no mpv player UI**.
  - Immediate efficient workaround (W-199): `xfdesktop --quit` or `/desktop-icons/style 0` to remove Desktop windows, then single sticky 4480x1440 wallpaper is bare layer.

- **picom masked** (W-042, X-008). Do not re-enable.

- **GTK override**: `~/.config/gtk-3.0/gtk.css` 206 bytes generic, NOT Gunmetal aggregate 98f019d... (W-191). Needs Cheetah overlay.

### Hardware
Void x86_64, glibc 2.41, NVIDIA 595.84, RTX 3080, OpenGL 4.6. DP-2 primary `2560x1440+0+0 @120`, DP-0 right/inverted `1920x1080+2560+197`, X 4480x1440, Wall virtual 17920x1440. Asymmetry matters X-039.

## Immediate objectives, in order (U-057 fork plan)

### M12 — Efficient spanning mp4 wallpaper (bare composite layer)
**Problem**: xwinwrap works but inefficient (dual decode) and obscured by xfdesktop. jpg-only xfdesktop/compiz wallpaper cannot accept mp4.

**Fork plan per Directive 4 (agents)**:
- Agent A — xfdesktop: trace `xfdesktop-backdrop.c`, how it loads jpg/png per monitor. Patch to play mp4 via gstreamer or mpv shim per monitor, or make it not draw so xwinwrap is sole layer (quick win).
- Agent B — Compiz wallpaper plugin (in compiz-plugins-extra/main): image-only. Fork to `video-wallpaper` that ffmpeg-decodes mp4 → GL texture each frame, respects `__GL_YIELD=USLEEP` + 120Hz.
- Agent C — Spanning without fork: single 4480x1440 sticky wallpaper after `xfdesktop --quit`, efficient bare layer (W-199) — ship now.
- Agent D — Menu Cheetah (U-055): parallel, does not block wallpaper.

**Do not use `--hwdec=auto`, do not use `--wid WID` space, do not use `--really-quiet` for debug.** Use shim, `nvdec-copy`, `-b -s -fs|-g -st -sp -nf -ov -fdt`.

### M16/U-055 — Cheetah menu transparency + pinstripe + terminal
Operator request: `(type=Menu | PopupMenu | DropdownMenu | Tooltip | Notification) → 88` and `(type=Utility | Dialog | ModalDialog) → 92`, plus lined like Mac OS X Cheetah.

- **Compiz opacity**: enable `opacity` plugin (absent from current W-191 list). Add section `[opacity]` with `s0_opacity_matches = (type=Menu | PopupMenu | DropdownMenu | Tooltip | Notification);(type=Utility | Dialog | ModalDialog)` and `s0_opacity_values = 88;92`. Do NOT edit active_plugins without backup — use `compiz-profile-repair` as template, preserve golden.

- **GTK Cheetah**: `~/.config/gtk-3.0/gtk.css` overlay (NOT bash):
  ```css
  menu, .menu, .context-menu, popover.background {
    background-color: rgba(0,0,0,0.82);
    background-image: repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 6px);
    border: 1px solid rgba(90,90,90,0.6);
    border-radius: 9px;
  }
  ```
  That's pinstripe (1px line every 6px) + rgba transparency + rounded.

- **Terminal**: `xfce4-terminal` transparency via `xfconf-query -c xfce4-terminal --create -p /background-mode -s TERMINAL_BACKGROUND_TRANSPARENT` and `/background-darkness`, or `terminalrc` `BackgroundMode=TERMINAL_BACKGROUND_TRANSPARENT` + `BackgroundDarkness=0.85`. Must use `--create`.

**Tools to author** (keep PR weight <465):
- `scripts/gunmetal-cheetah-menu-overlay` — writes gtk.css overlay with backup, hash receipt.
- `scripts/compiz-opacity-menus` — adds opacity plugin and rules, preserves 7 pinned core keys.
- `scripts/xfdesktop-mp4-fork` / `scripts/compiz-video-wallpaper` — fork starters, document image→video path.

### M18 icons + sound
Same as prior prompt, unchanged.

## Open questions / ledger anchors
X-030 mid-session reset, X-036 lib dirs, X-037 hsize, X-041 emerald themes dir, U-022/U-023 sound/scalefilter, plus:
- X-094 auto segfault rc139, X-096/X-097 wid syntax, X-100 catch-22, X-101 spanning fail, X-102 inefficiency
- W-195 hardware table (nvdec-copy winner), W-196 hardware wallpaper LIVE, W-197/W-198 geometry tests, W-199 efficient workaround
- U-055 Cheetah transparency, U-056/U-057 fork for mp4 spanning

## Standing rules addenda (from recent failures)
- Never `curl` raw GitHub without cache-buster for fresh launcher — CDN stale (X-097). Prefer heredoc install for critical fixes.
- Never paste GTK CSS or Compiz match rules into bash — they are not shell (X-098).
- Never probe hwdec by rc alone — check `Using hardware decoding` verbose (X-100, W-195).
- Always include `-s -st -sp` sticky for Compiz Wall (4 viewports) or wallpaper vanishes on viewport switch (W-193, U-030).
- For efficient wallpaper, `xfdesktop --quit` after blanking removes Desktop windows `0x01a0000d/0x01a00011` that obscure bare composite layer (W-198/W-199).
