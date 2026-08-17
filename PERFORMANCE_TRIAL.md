# Wallpaper and Compiz performance trial

This is a reversible target-machine trial. The sandbox has no X server or NVIDIA GPU, so CPU, RSS, decoder utilization, transition smoothness, and game FPS must be measured on the desktop.

## 1. Install and verify the wallpaper runtime

From this checkout, as the desktop user (not root):

```sh
bash scripts/xmb-runtime-install
~/.local/bin/xmb-wallpaper-controller --check
~/.local/bin/xmb-wallpaper-controller start --replace
sleep 3
~/.local/bin/xmb-wallpaper-controller --status
```

An idle controller should report:

- `mode=idle`
- `selected-video-track-count=1`
- `pause=false`
- a steady graph containing one `[vidN]null[vo]`
- `hwdec-current` identifying the hardware decoder

The shader remains registered to avoid switch-time compilation churn, but both shader passes have `//!WHEN xmb_strength 0 >`; libplacebo skips them at idle strength zero.

Switch between workspaces and check status/logs. A role-changing fade may select two video tracks for 350 ms. It must return to one afterward. Moves between workspaces mapped to the same role intentionally skip the effect and stay at one track.

Status also samples mpv CPU, RSS, selected tracks, dropped frames, estimated filter FPS, and NVIDIA GPU/decoder/VRAM totals. Compare after a fresh controller restart; an allocator does not always return already-allocated memory immediately.

## 2. Verify fullscreen game suspension

`PAUSE_FULLSCREEN=1` is installed by default. Open a fullscreen game, wait up to one second, and run:

```sh
~/.local/bin/xmb-wallpaper-controller --status
```

Expected values are `mode=fullscreen-paused`, `fullscreen-paused=true`, and `pause=true`. On leaving fullscreen, they should return to `mode=idle` and `pause=false`. Compare game FPS and frame-time consistency in the same scene/settings before and after this change.

To disable automatic suspension, set `PAUSE_FULLSCREEN=0` in `~/.config/xmb-wallpaper.conf`, then restart the controller.

## 3. Optional Compiz fullscreen unredirection trial

Fullscreen unredirection can reduce compositor overhead, but NVIDIA and multi-monitor configurations have historically shown tearing or transition regressions. It is therefore opt-in and owns only one profile key.

```sh
sh scripts/compiz-guard-install
~/.local/bin/compiz-game-performance --status
~/.local/bin/compiz-game-performance --apply
~/.local/bin/compiz-profile-verify
```

Log out and back in to make Compiz reread the profile; do **not** use an unguarded `compiz --replace`. Retest both monitors, fullscreen entry/exit, tearing, game FPS, and frame times.

Rollback the Compiz trial with:

```sh
~/.local/bin/compiz-game-performance --restore
```

Then log out/in and run `compiz-profile-verify` again.

## 4. Wallpaper rollback

Return immediately to the proven direct single-wallpaper renderer with:

```sh
~/.local/bin/xmb-wallpaper-controller --restore
```

That stops the controller and launches the direct `main-red` wallpaper path. Keep the before/after `--status` output and game benchmark receipt with the trial result.
