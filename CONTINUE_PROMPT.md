# Continuation prompt — theme the working Compiz desktop (M16 + M18)

You are continuing a live, reversible desktop project in the Git repository
`mistuhman/nvidia-intel-ocblizzard-4x8ddr4xmp-10gb3080-voidmusl-picom-xfwm4-compizunused-cairodock-egl-glx`.

**The window-manager migration is DONE.** Do not redo it. Your job is theming,
icons, and sound — the aesthetic layer on top of a desktop that already works.

## Mandatory initialization

1. This Arena session is fixed to whatever `arena/...` branch it opens on. Do not
   switch, create, or push another branch.
2. Read `README.md`, then read `MASTER.md` **completely**, before proposing any
   target command. Sections XI and XII are the live edge; Sections I–II are the
   frozen constitution.
3. `MASTER.md` is an append-only audit log. Add dated, receipt-backed rows to the
   Section VI ledgers (W-/X-/U-) and Section VII/XI/XII milestones. **Never**
   rewrite, delete, reformat, or silently correct a prior row — supersede it with
   a new row that cites the evidence which overturned it.
4. Do not copy MASTER into chat. Refer to IDs (W-049, X-041, M18) and keep only
   the capsule below in working memory.
5. Commit and push each verified receipt to the fixed branch as you go.

## Interaction protocol — non-negotiable

- **The sandbox is not the target.** It has no X server, no GPU, no Compiz. You
  author commands; the user runs them on their Void box and pastes the output.
- Give **exactly ONE copy-paste block at a time**, then wait for output.
- Before issuing the next block: append the prior receipt to MASTER, commit, push.
- **Never fabricate** process, file, or visual success. A user's visual report is
  a valid receipt but is distinct from file/process evidence — label which you have.
- Any block that can change the WM must state the escape first:
  `/home/sd/.local/bin/xfce-wm-recover`  (TTY: Ctrl+Alt+F2 → `xfwm4 --replace &`).
- Verify your own checks. A wrong verification command produced a false alarm
  once already (X-032); prefer section-scoped, labelled assertions.

## Current state — all target-verified, do not re-litigate

- **Compiz Reloaded 0.8.18 is the login WM.** Cold boot → `xfce4-session` runs
  `/home/sd/.local/bin/compiz-session` → `env __GL_YIELD=USLEEP compiz --replace ccp`.
  Verified `_NET_WM_NAME = "compiz"` (W-049).
- **Smoothness is solved** by `__GL_YIELD=USLEEP` (W-040). Do not experiment with it.
- **Geometry is pinned and self-healing.** `/home/sd/.local/bin/compiz-profile-repair`
  runs at every login and enforces exactly 7 `[core]` keys, incl.
  `s0_outputs = 2560x1440+0+0;1920x1080+2560+197;` and `s0_refresh_rate = 120`
  (W-048, option C). It touches nothing else, so CCSM edits survive.
- **Escapes exist:** `compiz-revert` (restore golden + restart),
  `compiz-revert --xfwm4` (bail to xfwm4), `xfce-wm-recover`.
  Golden snapshot: `~/.local/share/compiz-guard/Default.ini.golden`, 7/7 keys.
- **picom is masked and must stay off** (X-008/W-042). Compiz composites.
- Live processes after login: compiz 1210, emerald 1270, xfce4-panel 1251,
  xfdesktop 1272, cairo-dock 1306.

### Hardware
Void x86_64, glibc 2.41, NVIDIA proprietary 595.84, RTX 3080, OpenGL 4.6.
DP-2 primary `2560x1440+0+0 @120`; DP-0 right/**inverted** `1920x1080+2560+197`;
X screen `4480x1440`. The asymmetry matters — see X-039.

## Standing rules learned the hard way

- **CCSM rewrites the whole profile** from its own state (W-046). It is safe to
  use *because* of the repair hook, but never snapshot the profile while CCSM is
  running (X-035), and never leave CCSM open at logout (X-028/X-029).
- **Never tick "Save session for future logins."** That is the suspected origin of
  the `[WM_COMMAND] (1) "ccsm"` relaunch record cleared in W-050.
- **Never enable Detect Outputs or Detect Refresh Rate** in CCSM. They discard the
  pinned geometry and reproduce X-011 (cropped display) / X-013 (choppy).
- Avoid `reflex`, `blur`, `mblur`, `bench`, `showmouse`, `mousepoll` (X-013).
- Add GPU-visible plugins **one at a time**, re-judging smoothness after each.
- Keep themes, screenshots and binaries **out of Git**. Record paths, versions and
  checksums in MASTER only.

## Immediate objectives, in order

### M16 — AMOLED / OS X 10.4–10.6 theming (12.9, 12.11)
Brief: *"quake live style, sleek, black, like mac os X but amoled black and the
10.4-10.6 aesthetic with metal and glossyness."* Four separable attributes:
AMOLED `#000000` (colour), brushed metal + gloss (pixmap artwork), Aqua glass
controls (widget geometry), Quake (accent + typography). Quake fights Aqua —
reconcile by using Quake for **accent/type** and OS X for **surface**.

**Compose from what the user already owns** (W-056) — do not clone from scratch:
`~/.themes/` holds `Skeuo-Dark-Leopard`, `mac-os-x-cheetah-dark`,
`OS-X-Cheetah-grey`, `ReVista-dark`, `ReVista-main`, `Win2-7(Pixmap)`,
`Slickness-Reborn`, `OmNu-Ice`.
Engines confirmed present (W-055): `libpixmap.so`, `libmurrine.so`, GTK2 + GTK3.

Method: **fork** a theme (never edit in place), grep the CSS for the greys it
actually ships (`#2b2b2b`/`#303030`/`#383838` are the usual culprits), drive
backgrounds to `#000000`, and take glossy pixmap assets from `Win2-7(Pixmap)`.

**Blocker to clear first:** `~/.emerald/themes/` **does not exist** (X-041), yet
emerald is the live decorator — so current titlebars belong to no inventoried
theme. `mkdir -p ~/.emerald/themes && emerald-theme-manager &`. Candidates in
R-22 (notably the black+glossy pixmap "Glossy Emerald Theme"). Fallback if
emerald misbehaves (X-009/W-047): `gtk-window-decorator`.

### M18 — icons (12.13)
(a) Swap the **Zen browser** icon for the **OS X Safari compass**.
(b) Fix missing/wrong icons for **Thunar, xfce4-terminal** and other system apps.
(c) Keep the set coherent with the 10.4–10.6 era.
**Do (b) before (a)** — the fallback chain may itself resolve some wrong icons.
Root cause is almost always an incomplete theme with no `Inherits=` chain in
`index.theme`; prefer fixing inheritance + `gtk-update-icon-cache` over
hand-placing files. Never edit under `/usr/share` (xbps overwrites on update) —
use `~/.icons/` and `~/.local/share/applications/`.

### Sound (12.7, 12.8, 12.12) — independent, can run in parallel
`libcanberra-utils` and `sound-theme-freedesktop` are **installed** (W-058).
Four things still required, none done: `EnableEventSounds=true`,
`EnableInputFeedbackSounds=true`, `SoundThemeName=freedesktop` (**not** `default`
— X-040, that directory does not exist), and `canberra-gtk-module` in
`GTK_MODULES`. Decisive test: `canberra-gtk-play -i bell`.
Honest limits: Compiz has **no** audio subsystem (R-16), and canberra hooks GTK
widget events only — cube/Scale/animations will **never** make sound. The stock
freedesktop theme lacks most UI events (R-18); a Quake-style set means authoring
a custom theme in `~/.local/share/sounds/<name>/` (no root needed).
`ocean-sound-theme` is available as a fuller alternative.

## Cube / switcher work, if the user returns to it

`scalefilter` (type-to-filter Scale) is the keyboard Mission Control (R-12) —
bind Scale as a **toggle or hot corner**, never a hold-chord, or the binding eats
the keystrokes (R-13). Scale and Expo **cannot** be merged in 0.8 (R-14).
One switcher owns Alt+Tab (R-5). **One big cube across both monitors requires
collapsing `s0_outputs` to a single rectangle** (X-038) — which conflicts with the
enforced geometry and looks bad on these mismatched panels (X-039); per-output
cubes are the recommended default. All plugins are installed (W-051).

## Open questions carried forward
X-030 (mid-session reset, cause narrowed to CCSM-side), X-036 (`/usr/lib` vs
`/usr/lib64` compiz dirs), X-037 (`hsize` unset — cube renders flat until = 4),
X-041 (no emerald themes dir), U-017, U-022 (which sound events actually fire),
U-023 (does scalefilter work here), plus three uncollected human checks:
smoothness re-confirm, titlebars present, panel behaviour on workspace switch.
