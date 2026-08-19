# MASTER

The single instructional space for this project, and the master context of the
work done. Read `README.md` first, then read this file top to bottom before
your first command.

Five parts, in reading order:

- **I. Guidelines** — how you work. Fundamentals only.
- **II. Quality control** — the check you run every time, without exception.
- **III. Constraints** — what is settled and must not be re-litigated.
- **IV. Ground truth** — verified facts about the two machines.
- **V. Master context** — what has been built, why, and where it stands. Its
  "ACTIVE OBJECTIVE" heading is where a new session starts work.

Parts I–III are stable. Part IV grows only when a command produces a new fact.
Part V is the project's memory: it is edited to stay true, not appended to.

---

## I. Guidelines

Eleven fundamentals. They apply to every agent on every task.

### 1. Optimize relentlessly

Your output is judged by how much work it removes from the operator, not by
how much work it shows. Fewer steps, fewer round trips, fewer things to
remember. Every block you deliver should do the most work that can be safely
verified in one pass — batch what is independent, and never split across two
turns what one turn can prove.

### 2. Orient before you act

Read the repository state, the branch, and this file before touching anything.
Restate the objective in one sentence. If the objective is ambiguous, ask one
sharp question and then proceed.

### 3. Verify everything you claim

Every statement traces to something you ran: a path you listed, a command
whose output you read, a commit you resolved, a page you fetched. If you did
not verify it, label it unverified. Confidence is not evidence.

State plainly where the work happened. "Authored and syntax-checked in the
sandbox, unexecuted on target" is an honest and useful status. "It works" is a
claim only the target can license.

### 4. Prefer the deterministic substitute

When a task is manual, repeated, and error-prone, replace the human in the hot
path: parameterize the input, turn the steps into commands, and let it run
unattended. When a task is already one-shot, apply the least machinery that
removes the error. Name the method you are using in one line before you start,
and abandon it the moment the situation contradicts it.

This is not an abstraction. It is the project's founding move: OBS screen
recording was replaced by a headless bake, and that substitution is what made
the wallpaper reproducible. Apply the same test to every new task.

### 5. Ship the inverse with the change

Any change to the window manager, session, autostart, or config carries its
exact reversal, written before the forward step is applied. A desktop the
operator cannot recover is the worst outcome available to you. Re-issue the
config with every delivery: a rollback restores the config too, so an omitted
config silently retunes the next trial.

### 6. One agent, one task, run in parallel

Split work into the fewest streams that do not block each other, give each a
bounded deliverable, and run them concurrently. Where a dependency exists,
make the handoff explicit: agent B consumes agent A's verified output rather
than re-deriving it. No agent holds two jobs; no job is unowned.

### 7. Hand off permission explicitly

Say who may do what, and when it expires. Three levels:

- **Agent-owned** — sandbox authoring, syntax checks, repo reads, commits to
  the session branch. Proceed without asking.
- **Operator-gated** — anything that runs on the target, changes the session,
  or is judged by eye. Deliver the block, name the gate, wait for the verdict.
- **Operator-directed** — merges, scope changes, and anything overriding a
  constraint in Part III. Requires an explicit instruction, quoted when you
  record it.

Never infer a grant from silence, and never carry a grant forward past the
task it was given for.

### 8. Communicate in structure

Report: what you did, what you verified, what you could not verify, and the
one next action. Direct declarative sentences. No filler, no hedging padding,
no invented detail. Litotes is the one permitted rhetorical exception where it
carries real precision ("not yet proven on target" says something "unproven"
does not).

### 9. Inspect images closely

An attached image is primary evidence, not decoration. Inspect the whole frame,
then make deliberate passes over geometry, hierarchy, typography, contrast,
colour, texture, edges, spacing, and artifacts. Distinguish what is visible
from what is inferred, and never invent detail hidden by resolution or
compression. Machine inspection describes pixels; it does not replace the
operator's judgement of legibility, depth, motion, or aesthetic success.

### 10. Two files, and no more

`README.md` and `MASTER.md` are the entire documentation surface. Do not
create continuation prompts, session notes, handoff files, summaries, plans,
or status files — every one of those is a second place to look, and a second
place to look is a second place to drift. This has happened before: a
`CONTINUE_PROMPT.md` accumulated beside MASTER.md, went stale, and contradicted
it about which edge was current.

If something is worth writing down, it belongs in Part V. If it is not worth
Part V, it is not worth a file. Scratch work stays out of the repository, and
generated artifacts stay out of git.

### 11. Keep this file optimal

This file is the inheritance of every future session, so its quality compounds
in both directions. Write to it as an editor, not an accumulator.

- Add a fact only when a command produced it, and add the receipt with it.
- When a new fact overturns an old one, replace the old one and say what
  overturned it. Do not stack a correction on a wrong line and leave both.
- When a workaround appears, fix the cause and remove the workaround. A patch
  on a patch means Part III or Part V needs rewriting, not extending.
- Preserve every lesson that still changes a decision. Compress the narrative
  around it; never drop the lesson itself.
- One home per idea. Never state the same rule in two places.

The test for any line: would a fresh session make a worse decision without it?
If not, it goes. If yes, it stays however old it is.

---

## II. Quality control

Run this every time. Not on large changes, not when uncertain — every time.
Consistency is the whole point: a check applied selectively is a check that
has already failed.

### Before you deliver

1. **Re-read the objective.** Does this block advance the one active
   objective, or has scope crept? Drop anything that is not the objective.
2. **Trace every claim to a receipt.** Walk your own output line by line. Any
   sentence without a command, path, hash, or quote behind it is either
   labelled unverified or deleted.
3. **Check the file paths exist.** Do not reference a script, config, or
   directory you have not listed this session.
4. **Confirm the SHA.** Any install or patch names the exact source SHA, and
   the delivered bytes match it. Never patch a copy that has diverged.
5. **Re-issue the config.** If the block installs anything tunable, the config
   heredoc is in the same block. No exceptions — this rule exists because an
   omitted config silently invalidated a trial.
6. **Write the rollback.** The exact inverse exists, in the same block or
   named immediately after it, before the forward step is applied.
7. **Name the gate.** State what output means pass, what means fail, and what
   the operator should report back.

### After the operator responds

8. **Read what they actually said,** not what you expected. A partial pass is
   a fail until the remainder is proven. Quote the verdict when you record it.
9. **Attribute the cause before proposing the fix.** If you cannot say why it
   failed, the next block is a diagnostic, not a fix. Guessing at fixes is how
   bandaids accumulate.
10. **Update Part V** to reflect the new true state, editing what is now wrong
    rather than appending a correction beneath it.

### The failure modes this catches

Every item above exists because it failed here first:

- A trial ran against a stale config because the block omitted the config.
- An install patched a target copy whose SHA had diverged from repo HEAD.
- A fix was proposed for a symptom whose cause was never attributed, and the
  real defect surfaced three attempts later.
- A greeter loop was theorized as a display fault for several rounds; the
  cause was a full root filesystem, which one `df -h /` would have shown.
- A wrong judgement was left standing next to its correction, and a later
  session acted on the wrong one.

If a new failure mode appears, add it here and add the check that would have
caught it.

---

## III. Constraints

Settled by evidence. Do not re-litigate; override only on explicit operator
direction (Guideline 7).

**Delivery**

- Deliver files by heredoc or `git checkout`, never `curl`. A CDN served a
  stale script and cost a full debugging cycle.
- Gate every file creation with `ls -l <file>`.
- Never gate an action on an unanchored `pgrep -f`.
- Run `df -h /` before diagnosing any unexplained `rc=1`.
- Never paste JavaScript into a shell. Browser-side and shell-side steps are
  separate blocks with separate verification.

**Target safety**

- VT switching (`Ctrl+Alt+Fn`) is dead on this box. Never propose it.
- picom stays masked.
- Never let a tool rewrite a config it does not fully model; no
  ConfigParser-class rewrites of Compiz or session XML.
- Never re-patch an installed copy whose SHA has diverged from repo HEAD.
  Reinstall whole files from one SHA via `scripts/xmb-runtime-install`.
- Never destabilize the window manager for the sake of the wallpaper.
- `~/.bitcoin` is wallet and chain state: never delete it, never glob-move it,
  and touch it only with the client stopped.

**Compiz**

- Compiz is the login WM and CCSM changes survive reboot.
- Reach CCSM through `scripts/ccsm-safe` only. "Detect Outputs" and "Detect
  Refresh Rate" stay off. Never tick "Save session for future logins" while
  CCSM is open, and never leave CCSM open at logout.
- After any `compiz-revert --xfwm4`, `xfce-wm-recover`, or session-XML
  restore, persistence is OFF until `compiz-persist-arm` runs and verifies
  SAFE.
- `compiz-profile-repair --floor` is additive only, never subtractive.
- CCSM gtk.css and pixbuf warnings are benign. Do not escalate them.
- Golden profile `af457926`. Post-recovery active is `b94b49e0` and never
  equals golden by design.

**Wallpaper stack**

- One sticky input-transparent (`-ni`) xwinwrap plus one mpv, `gpu-next` with
  `nvdec-copy`. Never `--hwdec=auto` — it segfaults. `--wid=` requires the
  `=` form and `mpv-xwinwrap-shim`.
- Videos live on `/mnt/games`. Check `df` first, always.
- xfdesktop's Desktop windows obscure the bare layer. Do not simply restart
  xfdesktop.
- The shell/xprop crossfade path is retired: controller exits 2, autostart off
  in-repo and on target. Never revive it.
- Same-role viewport hops cannot dissolve — they pulse blur only. That is
  physics, not a defect.

**Process**

- One objective per pull request. PR line ceiling 405.
- The session is fixed to the `arena/…` branch it opens on. Never switch or
  push another.

---

## IV. Ground truth

**Target** — Void Linux, musl libc, user `sd`. Intel CPU + NVIDIA RTX 3080
10GB, 32GB DDR4 (4x8) with XMP. X11, dual monitor, combined 4480x1440.
Kernel 6.18.x tkg-bore. Workspace `/home/sd/.local/share/xmb-wave/`, bake
output on `/mnt/games`.

**Sandbox** — ephemeral container, git checkout only. Present: node, npm,
python3, git, gh (authenticated), jq. Absent: ffmpeg, chromium, xvfb-run, GPU,
X server. Egress is filtered: `repology.org` and the Void mirrors are
unreachable; resolve package facts through the GitHub API against
`void-linux/void-packages` templates, which is upstream truth anyway.

**Void packages** (read from `srcpkgs/*/template`)

| Package | Version | Note |
|---|---|---|
| compiz-reloaded | 0.8.18 | the only compiz in the repo; pulls ccsm, emerald, all plugin sets |
| cairo-dock | 3.6.2 | EGL support is a configure flag in this family |
| xwinwrap | 0.9 | upstream `mmhobi7/xwinwrap` |
| mpv | 0.41.0 | |
| ffmpeg / ffmpeg6 | 4.4.8 / 6.1.6 | prefer ffmpeg6; ffmpeg7 absent |
| chromium | 151.x | built with `is_musl=true` — headless bake is viable |
| nvidia | 595.84 | nonfree repo; `nvidia-libs` is a subpackage, not standalone |
| xfwm4 / xfdesktop | 4.20.0 / 4.20.2 | mesa 26.1.7, libglvnd 1.7.0 |

Absent from the repo: plain `compiz`, `fusion-icon`, `ffmpeg7`, `x11-utils`
(Void splits these into `xorg-*`).

**Why the WM swap precedes the wallpaper** — a video wallpaper on X11 draws
either to the root window or to a wrapped override-redirect window behind
everything, and which one survives depends entirely on the compositor that
owns the screen. Establish the final stack, then bake to it, or bake twice.

**Why xwinwrap** — with a compositor running, an mpv targeting the root window
renders nothing. xwinwrap creates the below-everything window and hands its
WID to the child.

**Frame rate is a power decision** — hardware-decoded video wallpaper is
cheap, software-decoded is not. The XMB wave is low-frequency motion and reads
smoothly well below what a typical video needs.

**Encoder limits** — NVENC H.264 is width-capped at 4096 and cannot encode
4480x1440. HEVC via `hevc_nvenc` accepts it. HEVC hardware decode is available
through NVDEC/CUVID.

**Upstream XMB reference** — `linkev/PlayStation-3-XMB`, WebGL2, actively
maintained, reverse-engineered against the PS3's spline rather than guessed.
Its settings panel must be hidden for a bake. Smaller fallbacks:
`tsbehlman/xmb` and `fchavonet/creative_coding-xmb_wave_background`.

**Boot-death recovery** — if the box goes black before the display manager
with no TTY, the fault is boot-level, not WM-level; WM-era fixes are
unreachable. The proven ladder:

1. Blacklist the NVIDIA modules on the kernel command line:
   `module_blacklist=nvidia,nvidia_drm,nvidia_modeset,nvidia_uvm`. `nomodeset`
   alone is insufficient — `nvidia_drm` ignores it.
2. Attach a shell with `init=/bin/sh`. No job control is normal there; exit
   with `sync` then `echo b > /proc/sysrq-trigger`, never a bare exit.
3. Read the real command line from `dmesg`; `/etc/default/grub` can look
   plausible while `grub.cfg` carries the poison.
4. Strip every KMS-forcing layer — all four, since any one alone keeps the
   screen black: grub defaults, the self-blacklisting modprobe drop-in, dracut
   `add_drivers` **and** hostonly auto-inclusion, and
   `options nvidia-drm modeset=1`. Gate the initramfs on
   `lsinitrd | grep nvidia | grep -c ko` equalling zero; a bare substring count
   includes inert GSP firmware and misleads.
5. Take the console beachhead with `touch /etc/sv/lightdm/down`, which lands
   normal boot on a tty1 login. Every later fix happens in a live shell.

Back up every target write with a dated `.bak` in `/root/`.

---

## V. Master context

What this project has built, in the order it was built, with the reasoning that
still matters. Edit this to stay true; do not append corrections beneath wrong
lines.

### The mission

Move the operator's daily-driver desktop off `xfwm4 + picom` onto
`compiz-reloaded` under XFCE with `cairo-dock`, then run a PS3-XMB-style
animated wallpaper produced entirely by a headless bake. The machine is the
product, and it must stay usable through every step.

### Phase 1 — the window manager swap (complete)

Replacing XFCE's window manager persistently is one xfconf key — the session's
`Client0_Command` — not a hack. `--replace` plus save-session is the volatile
form and was the right tool for the first reversible test.

The swap took many attempts, and the reason is worth keeping: **CCSM itself
was the profile writer that kept undoing the fix.** Repeated trials corrected
output geometry, refresh rate, and plugin lists, only to find the profile
mutated again afterward. Causality was eventually proven directly, and the
resolution was a guarded wrapper rather than manual discipline — the
`ccsm-safe` / `compiz-guard-install` / `compiz-persist-arm` /
`compiz-profile-verify` / `compiz-profile-repair` toolchain now in `scripts/`.
Smoothness, separately, was solved by the NVIDIA `__GL_YIELD=USLEEP` setting.

Compiz is now the login WM, survives reboot, and self-heals a dropped `ccp`
plugin. Reboot, input, and animation gates all carry human acceptance.

### Phase 2 — the theme (complete and frozen)

A reversible gunmetal desktop: `Quake-Gunmetal-Aqua` Emerald decorations plus a
matching GTK3 fork, both generated by composers in `scripts/` rather than
hand-edited, both with `restore` paths.

The operator's standing aesthetic rule came out of this phase and governs all
future visual work: **depth is function, flatness is a failure.** A decoration
with depth pasted onto flat black GTK menubars and content wells reads as
pasted on. Uniform fill is not success. The first version passed the machine
gate and failed the human one for exactly this reason; a low-contrast
dimensional V2 was accepted and frozen.

### Phase 3 — the headless bake (complete)

The founding methodology, executed. Three roles — `sleep`, `main-red`,
`work-monochrome` — each captured from the live XMB web editor as an exact
JSON manifest, rendered to deterministic seeded previews, then baked to video.

The pipeline is two-pass: a frame-pump master render, then a seamless-loop
re-encode that crossfades the tail over the head and asserts exact dimensions,
frame rate, and duration before writing a receipt. Capture is
seek-never-play, driven frame by frame, so output is byte-identical across
runs.

Result: three 60-second 4480x1440 HEVC loops, hash-receipted, all three
machine-passed and human-accepted. The main-red master rendered 3,738 frames
in 495.8 s at a flat 7.5 fps with no thermal decay or leak. Tools:
`xmb-bake-profile.mjs`, `xmb-bake-video.mjs`, `xmb-render-previews.mjs`,
`xmb-stage`.

Two lessons survive from this phase. A black-frame warning during profiling
was an agent-side `readPixels` ordering artifact, not a render fault — the
completed artifact disproved it. And a projection built from a 20-frame sample
undershot the real run by 15%; treat such projections as lower bounds.

### Phase 4 — the live wallpaper (accepted)

Getting the baked loop onto the desktop took a long chain of narrow failures,
each of which is now a constraint in Part III: xwinwrap exiting immediately,
mpv segfaulting in `hevc-vulkan` hwdec init, `--wid` requiring the `=` form on
mpv 0.41.0, a CDN serving a stale script, and xfdesktop's Desktop windows
obscuring the layer.

The accepted result is the bare layer: one sticky `-ni` xwinwrap plus one mpv,
`gpu-next` with `nvdec-copy`, spanning 4480x1440, at 10-11% decode.
`nvdec-copy` is the real hardware decoder here; `auto` and `vulkan` were proven
false. Merged and live.

### Phase 5 — the viewport switcher (active)

The wallpaper changes role as the operator switches Compiz viewports. An early
shell/xprop crossfade was retired for spawning processes per transition. The
current design is one xwinwrap, one mpv, one `gpu-next` context, with lavfi
track blending driven over mpv's JSON IPC, latest-wins, and exact-PID takeover.

Settled shape: `FADE_MS=350`, `BLUR_MS=500`, `BLUR_PEAK=6.0`, rise 75 /
fall 210. Crossfade is accepted on target; persistent burst blur is proven on
target.

The instructive part of this phase is the sequence of near-misses, because each
one was a real defect and none of them was the last one:

- The crossfade appeared broken but was being **masked** by a peak-hold blur
  that only released after the dissolve had finished. A reveal envelope fixed
  the ordering.
- A trial then ran against a **stale config** the rollback had restored,
  because the delivery block omitted the config heredoc. This produced Part
  II's check 5.
- An **event flood** let a strict-order queue replay every intermediate
  viewport event; backlog reached 23 and the wallpaper lagged reality. Fixed
  by preloading the shader once at launch and capping the queue.
- **Adaptive compression** — scaling transition duration to backlog — was
  itself the inconsistency: compressed hops played weak irregular flickers
  between full-shape hops.
- The rate-limited **chase punch was non-deterministic**, running out of ticks
  before peak depending on tick phase, so punch height varied hop to hop.

The current in-repo build removes the last two: deterministic time-anchored
punch that emits the exact apex, no compression at all (every transition plays
the full approved shape), and tight latest-wins where a new viewport event
replaces anything pending. Proven in the sandbox harness across slow, fast,
flood, and degraded cases; unproven on target.

Pending target trial: controller-only reinstall from a single SHA via
`xmb-runtime-install`, config heredoc re-issued in the same block. Gates:
`--check` prints `fade_ms=350 blur_ms=500 peak=6.0`; every burst logs
`state=OK` at `rise_ms=75 fall_ms=210`; pending never exceeds 1; crossfade
visible on role-changing hops. Any failure rolls back controller and config
together. Autostart stays hidden until acceptance. **This trial is currently
behind Phase 6** — do not tune the switcher on a desktop that is already
dropping frames, or you will be tuning against the wrong baseline.

### Operator-directed — BeamNG.drive Proton Hotfix (ACTIVE OBJECTIVE)

Quoted request: get BeamNG working, quick, Void Linux, Proton Hotfix on Steam,
with the official “Unresponsive UI Process” page.

**Verified (sandbox fetch, 2026-08-19), not yet run on target**

- Official Linux page: native Vulkan is the Steam default since January 2026.
  The Proton versions they still test for Steamworks are **Proton 10.0-4** and
  **Proton Experimental** only. Proton Hotfix is the operator’s choice, not
  that list.
- “Unresponsive UI Process” is the CEF UI helper (`Bin64/BeamNG.drive.x64.ui.exe`)
  missing its heartbeat. Official write-up points at incompatible overlay /
  AV software. On this box the analogous causes are: CEF picking the Intel
  iGPU beside the 3080, Steam Overlay, and esync/fsync on musl.
- Dual-GPU CEF workaround they document elsewhere: `cefWorkaroundMultiGPU = true`
  in `startup.ini`.

**Method** — one reversible Steam-side apply, then measure the UI process.

Tool: `scripts/beamng-proton-hotfix` (`--check`, `--apply-hotfix`,
`--proton-official`, `--native`, `--rollback`, `--logs`). Writes
`$game/startup.ini` only; Steam Compatibility and Launch Options stay
operator-gated (Steam GUI). Inverse: `--rollback` restores the previous
`startup.ini` and tells the operator to clear Launch Options.

**Gate**

- Pass: main menu, UI clickable, no Unresponsive UI Process dialog.
- Fail: that dialog, or `BeamNG.drive.x64.ui.exe` exits. Then `--logs` and
  `--proton-official` (10.0-4), not another Hotfix tweak.

Phase 6 desktop-performance work is paused until this gate or an explicit
return. Do not retune Compiz against a BeamNG CEF hang.

### Phase 6 — desktop performance (paused)

The operator reports FPS dipping and general jitter across the desktop. Every
phase above is functionally "complete" and none was ever optimized as a whole:
each was accepted on its own gate, in isolation, and the accumulated cost has
never been measured together. That is the defect. Treat this as one system,
not five features.

**What is known to be relevant, before measuring anything**

- Smoothness on this box was hard-won once already, via `__GL_YIELD=USLEEP`
  in the Compiz launch environment. Verify it is still in the running
  process's environ (`/proc/<pid>/environ`) before theorizing about anything
  else. It has silently vanished from the profile before.
- The display settings that must hold: `detect_outputs=false` with the two
  explicit output rectangles, `detect_refresh_rate=false`, `refresh_rate=120`,
  `sync_to_vblank=true`. CCSM has discarded every one of these before, more
  than once. Read the live profile, not the intended one.
- Heavy eyecandy plugins — `water`, `wobbly`, `cube`, `3d`, `gears`,
  `animationplus`, and especially `blur`, `mblur`, `reflex`, `bench`,
  `showmouse`, `mousepoll` — were the original choppiness suspects and have
  crept back into the active plugin list before on their own.
  `compiz-profile-repair` deliberately does not police the plugin list, so
  nothing is guarding this.
- The wallpaper is a permanent GPU tenant: one mpv decoding a 4480x1440 HEVC
  loop continuously at 10-11%. It is not free, and it now shares the GPU with
  a compositor, a dock, and whatever the operator is actually doing.
- Compositing a full-width dual-monitor surface interacts with NVIDIA
  `ForceFullCompositionPipeline`, which is a real lever here and has been
  observed on this box.

**Method — measure first, one variable at a time**

Do not ship a settings bundle. The failure mode this project has already lived
through is exactly that: many simultaneous changes, no attribution, and a
profile nobody can reason about. Sequence:

1. **Baseline, numerically.** Capture frame timing, GPU and CPU utilization,
   VRAM, clocks and power under three conditions — idle desktop, wallpaper
   only, and the operator's real workload. Distinguish a low average from
   frame-time spikes; "jittery" and "low FPS" are different faults with
   different causes.
2. **Attribute before fixing** (Part II, check 9). Establish whether the cost
   is the compositor, the plugin set, the wallpaper decode, the dock, or
   thermal and clock behaviour. One A/B per suspect, each reversible.
3. **Fix the cause, then re-measure** against the same baseline. A change that
   cannot be shown to move a number does not ship.

**Gate** — a measured improvement in frame-time consistency, plus the
operator's own verdict that the desktop feels smooth. Both, not either. Every
change carries its inverse, and the accepted state is re-verified SAFE and
persistent afterward.

**Then** — return to the Phase 5 switcher trial against the new, faster
baseline, and merge.

### Parked

- Menu opacity via the `obs` plugin (not `opacity` — wrong plugin name cost a
  cycle). Tools exist and are fixed; the last apply was rejected and a full
  `compiz-session` replace orphans emerald and the dock. Operator go-ahead only.
- M18 icon stitching and UI sound, once the switcher direction is settled.
  Compiz cannot produce UI sound; that belongs to a different layer.
- Tier-2 USB work, when convenient.

### Also settled

- `xfce4-screensaver` "XMB Sleep Wave" theme is installed and operator-selected.
- A 3D window-switcher / cube was researched and rejected in its "one big cube"
  form for a structural reason; Scale with a window-title filter is the correct
  mission-control answer on this stack.
