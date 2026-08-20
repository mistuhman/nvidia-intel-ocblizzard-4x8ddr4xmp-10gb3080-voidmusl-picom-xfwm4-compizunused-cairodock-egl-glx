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

**Target disks** (receipt: Stage-0 run transcript, 2026-08-20; kernel
`6.18.35-tkg-bore`) — `nvme0n1` 953.9G WDC PC SN530 SDBPNPZ-1T00-1: p1
512M vfat `/boot/efi`, p2 667.4G ext4 `/mnt/games` (GAMEDRIVE), p3
121.2G ntfs (Windows), p4 8G vfat (INSTALL), p5 154.8G ext4 `/`, p6 2G
ext4 unmounted (purpose unknown — identify before any merge). `sda` 1.8T
"Disk Device" serial 00000000458C: single unmounted ntfs partition
labeled `50` — spare/pool candidate. Boot: `BootCurrent 0006`
(void_grub), Windows Boot Manager entry `0001` present.

**Target** — Void Linux, musl libc, user `sd`. Intel CPU + NVIDIA RTX 3080
10GB, 32GB DDR4 (4x8) with XMP. X11, dual monitor, combined 4480x1440.
Kernel 6.18.35-tkg-bore (dkms also knows 6.18.34_1–6.18.41_1 stock).
Workspace `/home/sd/.local/share/xmb-wave/`, bake output on `/mnt/games`.

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
| zfs | 2.4.3 | DKMS kernel module, dracut integration, no libc guard; ships only the `zfs-zed` runit service (`vsv zed`) |
| zfsbootmenu | 3.1.0 | dracut-based root-on-ZFS bootloader |
| opendoas | 6.8.2 | portable OpenBSD doas; a `doas` package does not exist |
| nftables | 1.1.5 | default-deny firewall path |
| suricata | 8.0.6 | IDS path; orphaned in void-packages, built `--disable-suricata-update` |
| audit | 4.2.1 | musl build uses `--disable-zos-remote` |
| fail2ban | 1.1.0 | |
| snort / doas | absent | use suricata / opendoas instead |

Absent from the repo: plain `compiz`, `fusion-icon`, `ffmpeg7`, `x11-utils`
(Void splits these into `xorg-*`), `snort`, and any package named `doas`.

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

### Phase 6 — desktop performance (parked — a separate objective per operator)

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

### Phase 7 — ZFS, doas, hardening (ACTIVE OBJECTIVE)

Operator direction, quoted: "currently i need to set this up for work" —
the desktop-performance objective is separate and parked; this phase is the
work-infrastructure campaign: ZFS filesystem, doas replacing sudo, and full
hardening with network interception, control, and machine logging. Tracked
in `ToDo.md` (the only exception to the two-file rule, operator-directed).

Operator decisions, quoted: "both, staged" — a work data pool first, then
the root-on-ZFS migration once the pool is proven — was superseded the same
day by: "lets not work on pools, waste of time. lets just get zfs working
for the entirety of the bore kernel and delete windows". Also: "i have a
spare disk, and i want to delete my windows partition. i also need to
merge my nvme partitions" — the NVMe reorg belongs to the root-migration
stage. Root-disk answer: NVMe in-place ("one big zfs nvme, this is what i
told you explicitly. only listen to me"); Windows partitions: "FULLY WIPE
THAT SHIT". End state: the whole NVMe except the ESP becomes one ZFS pool —
root and data both on ZFS.

Current state:

- Delivery lesson: pasting `sudo -i` at the top of a big block stalls the
  whole paste at the password prompt (happened twice, 2026-08-20). Root
  shell entry is now delivered as its own separate step; the block after
  it is root-only commands.
- Delivery lesson 2: the operator's web console HTML-escapes pastes
  (`&gt;`, `&amp;&amp;` appeared inside commands, breaking redirects and
  chained `&&`; a paste also stopped right after `ls -d`). Blocks are now
  written with no `<`, `>`, or `&` characters, one command per line, no
  chaining.
- B1 partial: `id -u`=0 confirmed root; `/usr/src/linux-6.18.35-tkg-bore`
  confirmed present (the bore headers tree). zfs/gptfdisk install state
  unconfirmed — re-verified idempotently in the next block.
- B1 run 3 (green): `xbps-install -S -y zfs gptfdisk` succeeded. dkms
  built `zfs/2.4.3` against **all** installed kernels in one pass —
  6.18.35-tkg-bore, 6.18.36_1, 6.18.38_1, 6.18.39-tkg-bore, 6.18.40_1,
  6.18.41_1 — each `installed`, including the bore kernel (the
  compatibility risk is retired). `zpool version` = `zfs-2.4.3-1` /
  `zfs-kmod-2.4.3-1`. dracut regenerated every initramfs with the zfs
  module. `zfs-zed` service link present in /var/service. Root: 748M
  free, 100%.
- B2 checks (2026-08-20): root shell works (`[root@66 sd]#`). sda1 not
  mounted. `ntfsfix /dev/sda1` OK — MFT, MFTMirr, alternate boot sector
  all verified; volume version 3.1. `ntfsresize --info /dev/sda1`
  refused: "Volume is scheduled for check" — NTFS dirty flag still set
  (Windows unclean shutdown; not corruption). Next: `ntfsfix -d` to clear
  the flag, then re-run `ntfsresize --info`. Sizing decision (sda 2000GB):
  shrink sda1 to ~1150G (278G data + ~870G free for the games tar),
  sda2 = ESP (~1G), sda3 = ZFS root pool (~700G+, OS 144G fits with
  headroom). Games tar (~667G) rides inside sda1's free space, verified,
  then the NVMe is rebuilt as one big ZFS pool.
- B2c mishap and recovery (2026-08-20): the `--no-action` ntfsresize test
  passed clean (no writes). But the sgdisk block was wrong: `--new=1:0:0`
  recreated partition 1 at gdisk's 1MiB default (sector 2048) instead of
  preserving the original start (sector 34), where the NTFS boot sector
  actually lives (parted showed 17.4kB start; lsblk flagged the leftover
  gap 34–2047 as `ntfs` — proof). `--new=2:0:+1G` failed (overlap), and
  the gap became a 1007K BF00 partition 3. Data untouched; only the GPT
  changed. Lesson: when recreating a partition that holds an existing
  filesystem, pass the original start sector explicitly — never rely on
  gdisk defaults; shrink the filesystem first, then the partition.
  Recovery: delete p3 + p1, recreate p1 = 34 → 3907029134 (original
  extent), verify ntfs + mount before any further writes.
- B2c repair attempt (2026-08-20): the recovery block ran as `sd`, not
  root — all Permission denied, no changes. Then run correctly as root:
  `sgdisk --delete=3` and `--delete=1` completed, table now has one
  partition (1, start 2048, end 3907029134, code 0700). **gdisk still
  forced start to 2048** ("Moved requested sector from 34 to 2048 ... to
  align on 2048-sector boundaries") even when asked for 34 — so partition
  1 begins at 2048 while the NTFS boot sector is at sector 34, outside
  the partition. `mount` fails: `wrong fs type, bad option, bad
  superblock`. NTFS data intact on disk. Recovery (verified via web):
  keep partition 1 at start 2048 (gdisk alignment is immutable), rebuild
  the NTFS boot sector at the partition start using TestDisk
  `RebuildBS` (scans the backup boot sector, rewrites the primary at the
  partition start, `List` to verify before `Write`) — cgsecurity forum
  "NTFS Error: size boot_sector > partition" confirms this exact
  recovery. Do NOT re-create the partition or use ntfsfix to relocate.
- B2c RESOLVED (2026-08-20): TestDisk 7.2, EFI GPT mode, Quick Search
  found the original partition (`MS Data 34 3907028991 [50]`, Structure:
  Ok) — better than RebuildBS: it restored the partition table entry to
  the original start (sector 34), boot sector untouched. Written, reboot,
  verified: `lsblk -f` shows sda1 ntfs label 50 UUID 26E1196F4676D1DE;
  ro-mount succeeded; Games/, Videos/, 666.mp4, Temp/, $RECYCLE.BIN,
  .Trash-1000, System Volume Information all present. Data loss: none.
  Lesson recorded: TestDisk writes partition starts gdisk refuses
  (alignment); alternatively `sgdisk -a 1` disables the 2048 alignment —
  the repartition block MUST use `-a 1` when re-creating p1 at sector 34.
- B3 shrink + repartition COMPLETE (2026-08-20): `ntfsresize --no-action
  --size 1177600M` passed (24096540 relocations / 98700 MB predicted);
  real `ntfsresize --force --size 1177600M` succeeded ("Successfully
  resized NTFS"). New volume 1177599996416 bytes = 2299999993 sectors
  from sector 34 → last FS sector 2300000026. Repartition with `sgdisk
  -a 1` worked (no "Moved requested sector"; only a benign 4096-physical
  alignment warning). Final sda table: p1 `50` 0700 34–2300002303
  (1.1 TiB NTFS, ~880G free inside for the games tar), p2 `ESP` EF00
  2300002304–2302099455 (1024 MiB), p3 `zroot` BF00 2302099456–3907029134
  (765.3 GiB). Gate passed: sda1 ro-mounted after partprobe, all files
  listed. NTFS carries the "chkdsk scheduled" flag from ntfsresize —
  acceptable, Windows is being deleted; ntfsfix -d clears it if mount
  ever refuses.
- B4 pool + OS copy COMPLETE (2026-08-20): sda2 formatted vfat -F 32
  label ZBMESP. `zroot` created on sda3 (ashift=12, lz4, xattr=sa,
  posixacl, atime=off, mountpoint=none), datasets zroot/ROOT (none) +
  zroot/ROOT/void (mountpoint=/, canmount=noauto), bootfs=zroot/ROOT/void,
  pool ONLINE 740G avail. Root staged: mounted via `mount -o zfsutil -t
  zfs` at /mnt/newroot (df gate passed: 741G), then `rsync -aHAX
  --one-file-system --info=progress2 --exclude=/swapfile / /mnt/newroot/`
  — 148.9 GB, ~40 min, exit code 24 only (vanished zen-browser cache
  entries; harmless). Next: fix the COPY's fstab (live fstab untouched
  per constraint), chroot install zfsbootmenu + efibootmgr, generate-zbm
  onto sda2 ESP, EFI entry, boot gate.
- B5 zfsbootmenu install COMPLETE (2026-08-20): copy's fstab fixed (root
  + GAMEDRIVE lines deleted, ESP UUID 97EB-159F changed to E1B4-7577 =
  sda2; live fstab untouched). chroot: zfsbootmenu-3.1.0_1 +
  systemd-boot-efistub-256.6_2 (+ kexec-tools fzf pigz mbuffer perl deps)
  installed; config.yaml fetched from repo branch (EFI bundle mode,
  ImageDir /boot/efi/EFI/zbm); generate-zbm built vmlinuz.EFI (48.5 MB,
  from kernel 6.18.41_1) onto sda2; efibootmgr created Boot0007
  ZFSBootMenu, BootOrder now 0007,0006,... — void_grub 0006 intact as
  fallback. Live /proc/cmdline captured: intel_pstate=passive+active
  (active wins), split_lock_detect=off, ro, loglevel=7, misspelled
  rd.driver.blackllist (no-op, dropped). Pending before reboot: set
  org.zfsbootmenu:commandline (real args) and org.zfsbootmenu:kernel
  (6.18.35-tkg-bore — else ZBM version-sorts to 6.18.41_1).
- Operator direction (2026-08-20): "tar archive, and we could just boot
  off of the 2tb hdd". Revised end state: **OS root moves to sda**
  (shrink sda1 NTFS to ~1000G, new sda2 ESP, sda3 = ZFS root pool `zroot`
  on the remaining ~850G, boot via zfsbootmenu from sda's ESP); games
  staged as a tar archive inside sda1's NTFS free space; the NVMe is
  rebuilt as **one big ZFS pool** (`data`, mount /mnt/games) after Windows
  (p3/p4) and the old root (p5) and p2/p6 are deleted. The old NVMe root
  stays bootable until the sda root boots — the migration's safety net.
  NTFS can't store Linux ownership, so the games backup is a tar archive
  (GNU tar `--acls --xattrs` as root), not a file copy.
- Work-pool staging is dropped. The path is NVMe in-place root-on-ZFS on
  the bore kernel, then the full-NVMe merge. Windows deletion (p3 121.2G
  ntfs + p4 8G vfat INSTALL) is operator-ordered ("FULLY WIPE THAT SHIT")
  and has no inverse — it is the only irreversible step, so the old root
  p5 and the ESP/grub entry p1 stay untouched as the boot fallback until
  the ZFS root is accepted.
- **Headers correction:** Void headers install to `/usr/src/kernel-headers-
  <ver>` (per linux6.12 template `hdrdest`), not `linux-headers-*`; the
  earlier NO-HEADERS-FOUND was likely a false negative. Gate re-checks
  `/usr/src/kernel-headers-$(uname -r)` and `/lib/modules/$(uname -r)/build`.
- zfsbootmenu 3.1.0 verified from source: the void package ships only the
  example config (post_install `vcopy` to `/usr/share/examples/
  zfsbootmenu/config.yaml`); the operator creates `/etc/zfsbootmenu/
  config.yaml`. Upstream keys: `Global.BootMountPoint: /boot/efi`,
  `Components.ImageDir: /boot/efi/EFI/zbm`, `EFI.Enabled: false` by
  default (enable for the EFI stub), `Kernel.CommandLine: ro quiet
  loglevel=0`. Generator binary is `generate-zbm`.
- `nvme0n1p6` 2G ext4 unmounted — purpose unknown, must be identified
  before any merge (open question; forensics in the A0 block).

Plan (revised after B0 data): the freed Windows space (p3 121.2G + p4 8G
= ~129G) cannot hold the running root (144G used, `df -h /` 100% full,
537M free) — the hole-then-merge staging cannot fit the data. Route to
the operator's end state (one big ZFS NVMe) is single-stage:

- **B1** — make room on `/` (root is at 100%; du diagnosis, xbps-remove
  -O, target ≥2G free), install `zfs` + `gptfdisk`, prove the module on
  6.18.35-tkg-bore.
- **B2** — stage the whole NVMe on sda (1.8T): peek sda1's NTFS `50`
  first, reformat sda1 ext4, `rsync -a` `/` and `/mnt/games` (~811G
  total) to sda, verify byte counts. sda becomes the full backup/fallback.
- **B3** — keep p1 ESP; delete p2–p6; one ZFS partition (~933G);
  `zpool create zroot /dev/nvme0n1p2`; restore root + games from sda;
  zfsbootmenu; boot gate. Old root p5 is gone before the new root boots,
  but the full sda copy is the safety net (worse fallback than in-place,
  safer than the un-sizable 129G pool).

Verified state (B0 run): root `id -u`=0 (root shell works when entered
separately); headers for the bore kernel live at `/usr/src/linux-
6.18.35-tkg-bore` (the `/lib/modules/6.18.35-tkg-bore/build` target —
dkms built nvidia/yeetmouse against it, so the tree exists); zfs and
gptfdisk NOT installed; parted + ntfs-3g preinstalled; no pools exist;
`/var/service` zfs-zed line from the paste was ambiguous (re-check in
B1).

Risks: OpenZFS 2.4.3 dkms building against tkg-bore 6.18.35 (unverified
until GATE Z1); root `/` is 100% full (537M free) — the zfs dkms build
and initramfs need free space, so B1's make-room step precedes the
install; sda's NTFS `50` contents unknown until the B2 peek.

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
