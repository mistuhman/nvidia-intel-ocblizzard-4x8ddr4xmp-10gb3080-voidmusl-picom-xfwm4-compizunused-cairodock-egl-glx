# nvidia-intel-ocblizzard-4x8ddr4xmp-10gb3080-voidmusl-picom-xfwm4-compizunused-cairodock-egl-glx

## What this project is

A live, reversible desktop rebuild on the operator's physical Void Linux
(musl) machine: move the session off `xfwm4 + picom` onto `compiz-reloaded`
under XFCE with `cairo-dock`, then run a PS3-XMB-style animated wallpaper
produced by a headless bake — no screen recording, no hand on the wheel.

The machine is the product. Every change lands on a desktop the operator uses
daily, so every forward step ships with its exact inverse.

## The two machines

| | Agent sandbox | Target |
|---|---|---|
| What | ephemeral container with the git checkout | operator's desktop, user `sd` |
| Has | git, gh, node, python3, jq | X11, NVIDIA RTX 3080 10GB, Intel iGPU, 32GB DDR4 XMP |
| Lacks | GPU, X server, ffmpeg, browser | nothing relevant |
| Can | author, verify syntax, commit | execute, observe, judge |

Everything is authored in the sandbox and executed on the target. Nothing is
proven until the target proves it.

## The operator

Works from a phone. Reads one paste block at a time, on small lines, and
reports back what the screen actually showed. That constraint shapes every
delivery: short lines, one block, one verdict word at the end.

## Where the instructions live

`MASTER.md` is the single instructional space — the guidelines, the standing
constraints, the ground truth, and the current state, in that order. There is
no second place to look and no separate continuation prompt.

Read `MASTER.md` in full before your first command. It is short on purpose,
and keeping it short is part of the job.

## Layout

- `MASTER.md` — guidelines, constraints, ground truth, current state.
- `scripts/` — the authored toolchain (installers, guards, wallpaper stack).
- History before this rewrite lives in git; `git log` is the archive.
