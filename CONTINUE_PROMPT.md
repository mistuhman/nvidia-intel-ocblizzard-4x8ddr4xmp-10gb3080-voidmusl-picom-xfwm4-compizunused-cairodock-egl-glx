# Continuation prompt — stabilize smooth Compiz, then configure animations

You are continuing a live, reversible desktop migration in the Git repository
`mistuhman/nvidia-intel-ocblizzard-4x8ddr4xmp-10gb3080-voidmusl-picom-xfwm4-compizunused-cairodock-egl-glx`.

## Mandatory initialization

1. This Arena session is fixed to branch `arena/019fff13-nvidia-intel-ocblizzard-4x8ddr`. Do not switch, create, or push another branch.
2. Read `README.md` first, then read `MASTER.md` completely from top to bottom before proposing any target command.
3. Treat `MASTER.md` as the canonical append-only audit log. Add dated receipt-backed rows only to Section VI ledgers and Section VII milestones. Never rewrite, remove, reformat, or silently correct an old row; supersede it.
4. Check `git status`, recent commits, and PR #3, “MASTER.md: record smooth Compiz scheduler fix.” Commit and push each verified receipt step to the fixed branch.
5. Do not merge PR #3 unless the user explicitly requests it. This continuation prompt was updated only because the user explicitly authorized it after opening PR #3.
6. Do not copy MASTER into chat. Refer to IDs such as W-040/X-027/M8 and retain only the capsule below.

## Interaction protocol — non-negotiable

- The sandbox cannot operate the user’s Void X server/GPU. Author commands; the user runs them and pastes complete output through the returned prompt.
- Give exactly ONE copy-paste target block at a time, then wait.
- Before issuing the next target block, append the prior receipt to MASTER Section VI/VII, run `git diff --check`, commit, and push.
- Never fabricate process, file, performance, or visual success. A user visual report is a receipt, but it is distinct from process/file evidence.
- Every WM/compositor-changing block must begin with the exact TTY escape command: `/home/sd/.local/bin/xfce-wm-recover`.
- Keep the logged-in Ctrl+Alt+F2 recovery TTY available.
- Resolve one measured variable per block. Prefer compact Python orchestration over long shell logic when useful; shell remains the copy-paste transport and emergency surface.
- Never run picom with Compiz. The user rejected picom.
- Keep CCSM closed or reversibly suspended during machine-authored baseline/stability tests; it is a proven profile writer (W-033/W-034/W-038/W-040).
- Keep screenshots, videos, themes, and baked artifacts outside Git. Record only findings, paths, versions, and checksums in MASTER.
- No wallpaper tuning before M8 is stable/persistent. No screen recording ever; the later XMB bake is deterministic seek-driven rendering only.

## Immediate objective

Get the already-proven smooth Compiz Reloaded 0.8.18 configuration live, stable, and persistence-safe under XFCE with Emerald, xfce4-panel, and cairo-dock. Then work interactively with the user to configure animations in small reversible groups, recording every accepted profile diff and resource/visual receipt.

Only after M8 survives a keep-live dwell, logout/login, and reboot may M16 theming begin. Only after M8/M16 may M9–M14 deliver the deterministic XMB video wallpaper. M15 remains the final machine-readable state-machine/prompt capsule.

## Proven target facts

- Void x86_64, glibc 2.41; proprietary NVIDIA 595.84; RTX 3080; OpenGL 4.6; direct rendering.
- Compiz Reloaded/core/plugins/CCSM/Emerald 0.8.18 installed.
- cairo-dock 3.4.1 plus plugins installed and runs with `-o`; xfce4-panel survives bounded trials.
- DP-2 primary: `2560x1440+0+0 @ 120.00`; DP-0 right/inverted: `1920x1080+2560+197 @ 119.98`; X screen `4480x1440`.
- NVIDIA ForceCompositionPipeline and ForceFullCompositionPipeline are enabled for both outputs. NVIDIA SyncToVBlank=1 and AllowFlipping=1.
- Picom is stopped and both XDG autostarts are masked. xfwm4 internal compositing is false.
- Persistent XFCE Client0 still names `xfwm4`; Compiz is not logout/reboot persistent yet.
- Original session backups: `/home/sd/xfce4-session.xml.bak.1786687627` and `/home/sd/wm-command.bak`.
- Picom rollback directory: `/home/sd/picom-autostart-backup.1786688178`.

## Proven recovery artifact

Executable: `/home/sd/.local/bin/xfce-wm-recover`

SHA-256: `3f9402d2731d560fecae27a899b8f36c78b1c3a2527bda4a9fb2bdd354e19c24`

It was syntax/self-check verified in W-029 and destructively proven in W-030/W-040. It restores persistent Client0 to xfwm4 when xfconf is reachable, kills Compiz/Emerald, starts `xfwm4 --replace`, and verifies xfwm4-live/Compiz-absent.

Emergency TTY command:

```sh
/home/sd/.local/bin/xfce-wm-recover
```

## Smoothness solution — proven and accepted

W-040 is the key result. A sole fresh process launched as:

```sh
env __GL_YIELD=USLEEP compiz --replace --sm-disable
```

The process environment verified `__GL_YIELD=USLEEP`; it owned `_NET_SUPPORTING_WM_CHECK`; Emerald, panel, and dock survived. The user reported: **“IT WORKS, SMOOTH!”**

W-040 resource snapshots:

- Initial: Compiz 7.5% CPU, 162212 KiB RSS; GPU 23%, 890 MiB, 55.07 W.
- End: Compiz 5.4% CPU, 164036 KiB RSS; GPU 38%, 901 MiB, 29.92 W.
- Log: known no-XI2 and Emerald GTK/Wnck warnings only; no fatal Compiz event.

Official NVIDIA 595.84 documentation supports this result: default `sched_yield()` can schedule an OpenGL composite manager out for too long while moving/repainting windows; `__GL_YIELD=USLEEP` is the documented workaround. See W-036.

Do not repeat VBlank checkbox, refresh-rate, output-list, broad `Context.Write()`, or fresh-process-without-USLEEP experiments. They were rejected in W-025/X-018, W-026/X-019, X-016, and W-030/X-020.

## Accepted profile baseline

Active path: `/home/sd/.config/compiz/compizconfig/Default.ini`

Exact accepted guard created before the smooth trial:

`/home/sd/.config/compiz/compizconfig/Default.ini.pre-gl-yield-usleep.1786692457`

Required SHA-256:

`dcefbadd6fe348807abc71303975dfd3e83d2a4ec7758e624b1f0bf65748426c`

Exact content:

```ini
[core]
as_active_plugins = core;ccp;move;resize;place;decoration;text;winrules;workarounds;grid;svg;regex;imgjpeg;png;animation;animationaddon;fade;switcher;
s0_detect_refresh_rate = false
s0_refresh_rate = 120
s0_detect_outputs = false
s0_outputs = 2560x1440+0+0;1920x1080+2560+197;
s0_sync_to_vblank = true
s0_lighting = true
as_texture_filter = 0
```

## Critical CCSM/profile behavior

CCSM is a proven transient writer, not a harmless resident GUI:

- It reordered the active plugin list, removed `ccp`, sometimes added `wobbly`, and rewrote the profile during trials (W-031/W-033/W-034/W-038/W-040).
- It can return about 12 seconds after termination. Its historical launcher remains unidentified; do not invent a cause.
- At W-040, CCSM PID 15146 appeared during the smooth trial and the post-trial profile became SHA-256 `61eff706add069d4aaf1bdff6c80943215c4e3419579867cb79c9bcea8c1b1c5`.
- Because CCSM was live, the automatic profile guard correctly refused to overwrite the file. X-027 therefore remains the current file-state gate.
- The good guard above remains intact and has the required `dcefbadd...` checksum.

For the immediate keep-live launch, if exactly one CCSM process exists, reversibly `SIGSTOP` that exact `/usr/bin/python3 /usr/bin/ccsm` PID before restoring the good guard. A stopped writer remains present so its delayed launcher should regard it as alive, but it cannot rewrite. Record its PID and exact resume command `kill -CONT PID`. Never kill generic Python processes.

## Exact live handoff state — verify; do not trust stale PIDs

The last fully executed target block was W-040’s bounded smooth trial. It automatically recovered to xfwm4 PID 15573, but that PID may now be stale. At that receipt:

- Compiz and Emerald were absent after recovery.
- xfce4-panel PID 1252 and cairo-dock PID 1301 survived.
- Picom was absent.
- CCSM PID 15146 existed during/end of trial and may now be stale.
- Active Default.ini had mutated to SHA-256 `61eff706...` and was not restored because CCSM was live.
- The subsequent “keep-live smooth Compiz” block was authored in chat but **was not run before PR #3 was requested**. Never claim it passed.

## Exact continuation sequence

1. Report that README and MASTER were read completely. Restate the gate in no more than five lines. Check clean Git state and PR #3.
2. Issue one concise read-only target block only. Reverify:
   - current WM name and xfwm4/Compiz/Emerald/picom/panel/dock processes;
   - exact CCSM PID(s), command lines, and states;
   - active profile checksum/content;
   - good guard checksum;
   - recovery artifact checksum and `--check` result.
3. Append/commit/push that receipt before the next target block.
4. If runtime is safe xfwm4, good guard is `dcefbadd...`, and exactly one CCSM writer exists:
   - begin with `/home/sd/.local/bin/xfce-wm-recover` as the stated TTY escape;
   - `SIGSTOP` only the exact CCSM PID and verify state `T`;
   - back up the mutated active profile outside Git;
   - restore the exact good guard;
   - launch `nohup env __GL_YIELD=USLEEP compiz --replace --sm-disable ... &`;
   - after 8–15 seconds verify sole Compiz PID/WM ownership, environment, Emerald/panel/dock survival, CCSM still stopped, profile checksum unchanged, logs, and resources;
   - leave Compiz live if all gates pass. Otherwise invoke the recovery artifact automatically.
5. If CCSM is absent, do not fabricate a PID. Restore the guard only while xfwm4 owns the screen, then use a bounded low-resource monitor during the keep-live launch; if exact CCSM appears, stop it immediately and verify whether the profile changed before proceeding.
6. Ask the user to confirm smoothness once more in the keep-live session. Log the user observation separately from process receipts.
7. Dwell the accepted live process. Only then prepare persistence:
   - make the USLEEP environment part of the persistent Compiz launcher, preferably a small self-checking target script rather than relying on an interactive shell export;
   - preserve a one-command inverse;
   - clear stale session cache per X-010;
   - set Client0 to the wrapper/Compiz command;
   - test logout/login first, then reboot;
   - recover from TTY on any failure.
8. After keep-live/persistence is stable, configure animations collaboratively:
   - one plugin/effect group at a time;
   - back up the exact accepted profile first;
   - avoid D-Bus and the rejected heavy all-at-once stack;
   - capture exact before/after INI diff, process stability, resources, and user visual acceptance;
   - ensure `ccp`, explicit display values, and USLEEP launcher remain intact;
   - keep an immediate per-group rollback.
9. Only after M8 logout/login and reboot are DONE: M16 reversible theme work, then M9–M14 deterministic XMB bake/wallpaper, then M15.

## Failures not to repeat

- X-011: manual output detection with no output list caused a tiny/cropped desktop.
- X-015: water/wobbly/mblur/blur/cube/rotate/cubeaddon/cubemodel/gears/3d/bench plus D-Bus caused choppiness, duplicate D-Bus registrations, assertion, and respawn.
- X-016: broad libcompizconfig `Context.Write()` collapsed important settings.
- W-025/X-018: VBlank-only hot change did not improve refresh.
- W-026/X-019: explicit 120 Hz/output hot writes did not improve refresh.
- W-030/X-020: fresh `--sm-disable` without USLEEP remained visually poor.
- X-021/X-027: launching/exiting with an uncontrolled CCSM writer collapses or rewrites the profile.
- Do not assume visible CCSM checkbox state is authoritative; use file/process receipts.

## Git/PR state

- Fixed branch: `arena/019fff13-nvidia-intel-ocblizzard-4x8ddr`
- HEAD before this prompt update: `922b7df` (`MASTER.md: accept smooth NVIDIA Compiz scheduler`). Verify actual HEAD after initialization.
- Open PR: #3, “MASTER.md: record smooth Compiz scheduler fix.”
- Base: `main`; head: fixed Arena branch.
- PR #2 is already merged and is historical.
- Tracked files: `README.md`, append-only `MASTER.md`, and `CONTINUE_PROMPT.md`.
- Push only the fixed Arena branch.

Begin the new chat by reading README then all of MASTER, checking Git/PR state, reporting the current gate in at most five lines, and issuing only the first read-only target verification block.
