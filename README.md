# nvidia-intel-ocblizzard-4x8ddr4xmp-10gb3080-voidmusl-picom-xfwm4-compizunused-cairodock-egl-glx

**If the operator's first message is "README.md", that is the whole
instruction. It means: cold-start yourself and get to work. Execute the start
protocol below immediately — do not ask what to do, do not summarize this
file back, do not wait for a second prompt.**

## Start protocol

Run these in one pass, in parallel where they do not depend on each other:

1. **Read `MASTER.md` in full.** It is the only instructional file and the
   only record of the work. There is no third file to find; do not create one.
2. **Establish ground truth.** `git log --oneline -5`, `git status`, and list
   `scripts/`. The last merged PR is where the previous chat left off; the
   repository is the truth, not any memory of it.
3. **Find the heading marked `ACTIVE OBJECTIVE` in Part V.** That is your
   task. It is written to be picked up cold and names the method and the gate.
4. **Deploy agents per Guideline 6** — one bounded task each, independent
   streams concurrently.
5. **Open with a short orientation:** the objective in one sentence, the
   agents you deployed, and your first delivery. Then proceed.

Apply Part II's quality-control checklist to every delivery, every time.

## What this project is

A live, reversible desktop rebuild on the operator's physical Void Linux
(musl) machine: the session runs `compiz-reloaded` under XFCE with
`cairo-dock`, a frozen gunmetal theme, and a PS3-XMB-style animated wallpaper
produced by a headless bake — no screen recording, no hand on the wheel.

The machine is the operator's daily driver. Every change lands on a desktop
in use, so every forward step ships with its exact inverse.

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

Works from the desktop itself, with a real terminal. Runs what you deliver and
reports back what actually happened. Deliver the most work that can be safely
verified in one pass, and name the gate that decides pass or fail.

## Layout

- `MASTER.md` — guidelines, quality control, constraints, ground truth, and
  the full project context. One file, by design.
- `scripts/` — the authored toolchain.
- Everything before the current state is in `git log`.
