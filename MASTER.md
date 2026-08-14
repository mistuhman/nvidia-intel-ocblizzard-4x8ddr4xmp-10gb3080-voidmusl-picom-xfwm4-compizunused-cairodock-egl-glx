the following instructions must be read only after reading the precursor given by the README.md, serious consultation must be in order before altering, moving, or interacting with this file.

1. ORIENT BEFORE YOU ACT.
Map the full surface of your working environment in the first pass: the files in the web
workspace, the repository and its git history via GitHub integration, the tools and model
capabilities you actually hold. Produce a one-screen inventory (workspace layout, branch
state, available toolchain, and the single objective) and restate the goal in your own words
back to the user before touching anything. Do not begin solving until the objective is
unambiguous. If it is not, ask one sharp clarifying question and proceed — never guess the
mission and never read the mission into work that does not exist yet.

2. RUN THE "MANUAL-TO-HEADLESS" DIAGNOSTIC — IT IS YOUR PRIMARY PATTERN.
Recall the canonical transformation in your notes: you started with OBS, manually maneuvering
recording, faulting and correcting for human error in every run — then you moved to headless
baking: a scripted, deterministic, context-aware pipeline that took a given input (the XMB
wave web) and rendered it straight to video with no hands on the wheel. Before you execute any
task, ask: Is this being done manually — repeated, error-prone, needing my attention each
cycle? If yes, the correct methodology is to build the headless bake: parameterize the input,
turn the manual steps into deterministic commands, remove the human from the hot path, and let
it run. If it is already headless or one-shot, do not over-engineer; apply the least machinery
that removes the error and the repetition.

3. RECOGNIZE THE METHODOLOGY BEFORE YOU EXECUTE, AND DERIVE IT FROM THE CONTEXT.
Do not pick a method by habit. Reconstruct the steps you took in the OBS-to-headless example
and generalize them into a reusable decision chain: (a) identify the real context — the exact
situation and artifact (web → video, file → data, idea → working code); (b) map the current
manual sequence and mark every point where human error or attention is required; (c) determine
the deterministic substitute that preserves the context while removing the faulting; (d) only
then choose tools. Your methodology must be derived from the situation, not imposed on it.
State which methodology you are executing and why, in one line, before you begin — and be
prepared to abandon it the moment the context proves otherwise.

4. DECOMPOSE INTO SPECIALIZED AGENTS — ONE AGENT, ONE TASK, ALL IN PARALLEL.
Deploy agents the way you deployed bakes: explicitly and by allocation. This agent handles
this example, that agent handles that example — no agent does two jobs, and no job goes
unowned. Split the work into the fewest independent workstreams that never block each other,
spawn a dedicated agent for each, and give each a bounded deliverable and a single handoff
point to the next stage. Run independent streams concurrently. Where a task depends on another,
make the dependency explicit in the handoff (the input of agent B is the verified output of
agent A) rather than re-deriving it. Parallelism is the force multiplier; specialization is
the correctness guarantee.

5. HALLUCINATION IS A PROCESS FAILURE — ENFORCE A GROUND-TRUTH DISIPLINE.
Everything you claim must trace to something you can verify inside this environment: a real
file path, an actual git commit, a live API response, output from a command you actually ran,
or a citation you actually fetched. Never state a file exists without listing it. Never claim
a change landed without running it. Never infer repo state from memory — read the branch. When
you are unsure, test the smallest thing that disambiguates (a quick git status, a read, a
one-line command) instead of generating a plausible answer. If you cannot verify it, label it
as unverified and say so. Confidence is not evidence; a plausible narrative is exactly the
failure mode the headless bake eliminated. Apply the same standard to your own reasoning: check
each claim against the context before it leaves your hands.

6. EXECUTE, VERIFY, HAND OFF, AND REPORT CONCRETELY.
Run the pipeline end to end, but verify at each gate before proceeding to the next — headless
only means unattended, not unverified; a bake that silently produces a corrupted frame is the
worst outcome of all. For every completed workstream, deliver the artifact and the evidence of
its correctness together (output plus the command/hash/log that produced it), and mark the
handoff explicitly for the next stage. Close by reporting what you did, what you verified,
what you could not verify, and the single next action the user should take. Keep the report
tight and factual — no filler, no invented detail, no claims without receipts.

================================================================================
SECTION II — SYSTEM PROMPT EXTENSION (DIRECTIVES 7-11)
appended 2026-08-14 | base commit 68b1872 | MASTER.md pre-append sha256
4635b91a9d0fc653514e2b7d6ca989e174e118cceb650a3b96ec65f28690f0fb
Directives 1-6 above are FROZEN. They are the constitution. Nothing below may
contradict them; everything below exists to make them survivable across a
context reset.
================================================================================

7. THIS FILE IS THE MEMORY. TREAT IT AS APPEND-ONLY.
You are almost certainly a fresh model with no recollection of the prior runs.
That is expected and planned for. This file is the entire inheritance. Read
README.md, then read this file top to bottom, before your first command. Then
obey the append-only law: Sections I and II are frozen; the LEDGERS (Section
VI) and MILESTONES (Section VII) are the only places you write new knowledge,
and you write by ADDING a dated row, never by deleting or rewording a prior
row. A wrong prior row is not deleted — it is superseded by a new row that
cites the evidence that overturned it. History of failure is the most valuable
data in this file, because it is the only thing preventing you from repeating
it. Do not "clean up" this document. Do not reformat it. Do not summarize it
into something shorter. Its length is the point; its structure is what makes
the length survivable.

8. EVERY CLAIM CARRIES ITS RECEIPT INLINE.
Directive 5 forbids hallucination; this directive specifies the enforcement
format. No fact enters the ledgers without the evidence that produced it, in
the same row: the exact command, the file path, the commit sha, the package
version string, or the URL actually fetched. A row with no receipt is not a
fact — it is a hypothesis, and it goes in the UNVERIFIED ledger with the exact
one-line command that would resolve it. When a later run resolves it, that run
moves it to WORKS or DOES-NOT-WORK with the output it saw. Confidence never
promotes a row. Only output promotes a row.

9. KNOW WHICH MACHINE YOU ARE ON. THEY ARE NOT THE SAME MACHINE.
There are two distinct environments in this project and conflating them is the
single easiest way to produce a confident, useless answer:
  (a) THE AGENT SANDBOX — an ephemeral Linux container holding the git
      checkout. No GPU, no X server, no ffmpeg, no chromium (verified, see
      6.3). It can plan, write scripts, read the web, and commit. It CANNOT
      bake, and it cannot test a window manager.
  (b) THE TARGET — the user's physical Void Linux desktop, user `sd`, Intel
      CPU + NVIDIA RTX 3080 10GB, 4x8GB DDR4 with XMP, running X11 with
      xfwm4 + picom today, cairo-dock and a compiz fork tomorrow, workspace
      /home/sd/.local/share/xmb-wave/.
Every artifact you produce is written in (a) and executed in (b). Therefore
every script must be self-checking on arrival: it verifies its own
preconditions on the target and exits loudly rather than half-running. Never
report "it works" for anything you could only have run in the sandbox. Say
"authored and syntax-checked in sandbox, unexecuted on target" — that is an
honest and useful status, and it is the status of most of this plan.

10. ORDER OF OPERATIONS IS PART OF THE METHOD, NOT A PREFERENCE.
The user has fixed the sequence: the window-manager/compositor swap
(xfwm4+picom -> compiz fork + XFCE + cairo-dock) lands BEFORE the animated
background. This is correct and it is not negotiable, for a technical reason
you must understand rather than merely obey: the wallpaper's delivery
mechanism is a compositing question. A video wallpaper on X11 either draws to
the root window or to a wrapped override-redirect window behind everything,
and which of those survives depends entirely on which compositor owns the
screen. Baking a video against picom's behaviour and then swapping the
compositor underneath it means baking twice. Establish the final compositing
stack first, THEN bake to it. If you find yourself tuning the wallpaper while
the WM is still in flux, you are burning a bake.

11. THE HUMAN IS OUT OF THE HOT PATH — INCLUDING OUT OF THE RECOVERY PATH.
Directive 2 removes the human from the run. This directive extends it to the
failure: any change you make to the target's window manager, session, or
autostart must ship with its exact inverse in the same breath, written down in
this file before the forward change is applied. A WM swap that leaves the user
staring at an undecorated, unmovable, unrecoverable desktop is precisely the
"corrupted frame" of Directive 6 — silent, unattended, catastrophic. Every
forward step in Section IX has a numbered rollback. Never apply a step whose
rollback you have not written.

================================================================================
SECTION III — VERIFIED ENVIRONMENT INVENTORY (Directive 1, one-screen)
Gathered 2026-08-14. Every line below was produced by a command actually run.
================================================================================

3.1 REPOSITORY (receipt: `git log`, `git status`, `git branch -a`)
  remote   github.com/mistuhman/nvidia-intel-ocblizzard-4x8ddr4xmp-10gb3080-
           voidmusl-picom-xfwm4-compizunused-cairodock-egl-glx
  branch   arena/019ffe03-nvidia-intel-ocblizzard-4x8ddr (session-locked)
  base     68b1872e4d19c7ac354cc6d9160b39fef4988c6b "Create MASTER.md"
  history  ONE commit. Two files. 65 lines total. There is no prior code in
           this repo — no scripts, no shaders, no pipeline. Anything a prior
           run claimed to have "built here" did not land here.
  files    README.md (4 lines), MASTER.md (61 lines pre-append)

3.2 THE NAME IS A SPEC. Decoded, because it encodes the whole problem:
  nvidia-intel      hybrid graphics: Intel iGPU + NVIDIA dGPU
  ocblizzard        overclocked / Blizzard-cooled build
  4x8ddr4xmp        32GB DDR4 in 4 sticks, XMP profile active
  10gb3080          RTX 3080 10GB
  voidmusl          Void Linux, musl libc  <-- SEE 6.2, THIS IS THE BLOCKER
  picom-xfwm4       the CURRENT stack (to be replaced)
  compizunused      compiz present but NOT in use — the gap to close
  cairodock         the intended dock/animation layer
  egl-glx           the two GL entry points in contention

3.3 AGENT SANDBOX TOOLCHAIN (receipt: `command -v` sweep, 2026-08-14)
  PRESENT  node /usr/local/bin/node, npm, python3 /usr/bin/python3,
           git, gh (authenticated), jq
  ABSENT   ffmpeg, chromium, google-chrome, xvfb-run
  NETWORK  github.com/api.github.com reachable (HTTP 200).
           repology.org and repo-default.voidlinux.org BOTH return curl code
           000 from this sandbox — egress is filtered. Consequence: package
           facts in this file were resolved through the GitHub API against
           void-linux/void-packages templates, which is the upstream source of
           truth anyway. Do not waste a future run re-trying repology; use
           `gh api repos/void-linux/void-packages/contents/srcpkgs/NAME/template
            --jq .content | base64 -d`.
  MEANING  The sandbox cannot bake. Do not plan to bake here. Author here,
           execute on target.

3.4 VOID PACKAGE AVAILABILITY (receipt: gh api against void-packages@master,
    2026-08-14; version= line read directly from each srcpkgs template)
  compiz-reloaded  0.8.18  PRESENT  metapackage, maintainer CoolOhm
                           pulls: compiz-core, compiz-bcop, libcompizconfig,
                           compizconfig-python, ccsm, compiz-plugins-main,
                           compiz-plugins-extra, compiz-plugins-experimental,
                           emerald, emerald-themes
  emerald          0.8.18  PRESENT   ccsm  0.8.18  PRESENT
  cairo-dock       3.6.2   PRESENT   (note: newer than the 3.4.1 that most
                           distro docs online describe; EGL support is a
                           configure flag in this family — see 6.4)
  xwinwrap         0.9     PRESENT   upstream github.com/mmhobi7/xwinwrap
  mpv              0.41.0  PRESENT   picom 13 PRESENT   xfwm4 4.20.0 PRESENT
  xfdesktop        4.20.2  PRESENT   mesa 26.1.7 PRESENT  libglvnd 1.7.0
  ffmpeg           4.4.8   PRESENT   ffmpeg6 6.1.6 PRESENT  (ffmpeg7 absent)
  chromium         151.0.7922.108 PRESENT, and its template contains 8 musl
                           references incl. `is_musl=true` and a musl-patches
                           directory — chromium IS built for musl on Void.
  nodejs           24.18.0 PRESENT   xdotool, wmctrl, feh, conky PRESENT
  nvidia           595.84  PRESENT but `archs="x86_64"`, `repository="nonfree"`
  NOT IN REPO      compiz (only compiz-reloaded), fusion-icon, ffmpeg7,
                   nvidia-libs (it is a SUBPACKAGE of nvidia, not standalone),
                   x11-utils (Void splits these into xorg-* packages)

3.5 UPSTREAM XMB REFERENCE (receipt: gh api repos/linkev/PlayStation-3-XMB)
  HEAD 1ec453a9, 2026-02-11, "Fix night/day dropdown"
  This is the best-in-class reference and it is ACTIVE, not abandoned. It is a
  reverse-engineering effort against the PS3's actual spline.elf rather than
  shader guesswork. Relevant paths in that tree:
    ps3xmbwave/index.html          entry point of the current implementation
    ps3xmbwave/spline.js           wave mesh render pass
    ps3xmbwave/spline-reverse.js   CPU-side reverse-engineered spline pipeline
    ps3xmbwave/particles.js        additive point-sprite sparkle layer
    ps3xmbwave/background-gradients-day.js / -night.js  12 monthly presets
    ps3xmbwave/settings-panels.js  live control UI (MUST be hidden for a bake)
    SPLINE_REVERSE_ENGINEER.md     what is traced and what is still missing
    old-research/                  the earlier guesswork-era implementation
  Renderer is WebGL2 only. Displacement is a CPU-generated 256x64 single-
  channel float texture uploaded per frame. Alternatives if that one resists
  headless baking: tsbehlman/xmb (GPL-3.0, RetroArch-inspired, minimal) and
  fchavonet/creative_coding-xmb_wave_background (single fragment shader,
  smallest possible surface).

================================================================================
SECTION IV — THE OBJECTIVE, RESTATED (Directive 1)
================================================================================
Restated in plain terms so a fresh model cannot drift:

  Deliver a PS3-XMB-style animated wave as the desktop wallpaper on the user's
  Void Linux machine, produced by a HEADLESS BAKE (web -> deterministic frames
  -> looping video), staged entirely inside /home/sd/.local/share/xmb-wave/,
  with no OBS, no screen recording, no human hand on the wheel — but ONLY
  AFTER the desktop stack has been moved off xfwm4+picom onto a compiz fork
  running under XFCE with cairo-dock providing dock animation.

  This turn's deliverable is NOT the video. This turn's deliverable is the
  plan and the gathered context, written into THIS FILE ONLY. No other file in
  this repository is to be created or modified by this turn. That constraint
  came from the user directly and it is honoured: `git status` after this
  append must show exactly one modified file, MASTER.md.

Why the bake, in one line (Directive 3 requires you to name your methodology):
  MANUAL-TO-HEADLESS — the input is a web artifact and the output is a video,
  the current method is a human watching a recorder and correcting it, so the
  correct substitute is a parameterized, seekable, deterministic frame pump
  whose output is byte-identical across runs and therefore verifiable.

================================================================================
SECTION V — AGENT ALLOCATION (Directive 4) — DEPLOYED 2026-08-14
One agent, one task. No agent held two jobs. Streams A-D ran concurrently
because none consumes another's output; E and F are gated on their inputs.
================================================================================

  AGENT A — REPO/GROUND-TRUTH.   Task: establish actual repository and
    toolchain state, no inference. Output: Section 3.1, 3.3. STATUS: COMPLETE.
    Finding of consequence: the repo is empty of work; the sandbox has no
    ffmpeg and no browser.

  AGENT B — XMB SOURCE SURVEY.   Task: find the highest-fidelity, actively
    maintained, headless-friendly web XMB wave. Output: Section 3.5.
    STATUS: COMPLETE. Finding: linkev/PlayStation-3-XMB, WebGL2, alive as of
    2026-02-11, with a documented reverse-engineered spline pipeline.

  AGENT C — DETERMINISTIC CAPTURE DOCTRINE.   Task: determine how to get
    identical pixels out of a browser every run. Output: Section 8.3.
    STATUS: COMPLETE. Finding: seek, never play; drive the compositor by hand
    via CDP; the whole technique is Linux-only, which is fine, the target is
    Linux.

  AGENT D — TARGET PLATFORM / DRIVER REALITY.   Task: confirm the graphics and
    libc situation on Void. Output: Section 6.2, the blocker. STATUS: COMPLETE
    with one CRITICAL finding that outranks everything else in this document.

  AGENT E — WM/COMPOSITOR SWAP.   Task: define the xfwm4+picom -> compiz fork
    + cairo-dock transition and its rollback. Input: Agent D's driver reality.
    Output: Section IX. STATUS: PLANNED, UNEXECUTED (needs target shell).

  AGENT F — BAKE PIPELINE DESIGN.   Task: design the workspace layout and the
    frame-pump-to-encoder path under the memory constraint. Input: Agents B
    and C. Output: Section VIII. STATUS: DESIGNED, UNEXECUTED (needs target).

================================================================================
SECTION VI — THE LEDGERS. THIS IS THE PART A FRESH MODEL READS FIRST.
Format: [DATE] [ID] claim -- receipt. Append only. Supersede, never delete.
================================================================================

--- 6.A WHAT WORKS / WHAT IS TRUE (established, with receipt) -------------------

[2026-08-14][W-001] compiz-reloaded 0.8.18 is packaged for Void as a
  metapackage and is the ONLY compiz in the repo — plain `compiz` does not
  exist there. This is the "new compiz fork" the mission refers to.
  RECEIPT: srcpkgs/compiz-reloaded/template via gh api; srcpkgs/compiz returns
  no content. Installing it pulls emerald + ccsm + all three plugin sets.

[2026-08-14][W-002] Replacing the XFCE window manager persistently is a
  single xfconf key, not a hack: the session's Client0_Command. The
  documented, reversible form is
    xfconf-query -c xfce4-session -p /sessions/Failsafe/Client0_Command \
      -n -a -t string -s compiz
  RECEIPT: Xfce Wiki howto/other_window_manager, corroborated across the
  Arch/Ask Ubuntu threads gathered this run. `--replace` + save-session is the
  volatile alternative and is the right tool for the FIRST, reversible test.

[2026-08-14][W-003] xwinwrap 0.9 is in the Void repo (upstream mmhobi7 fork,
  which is the maintained one — not the older ujjwal96 tree the blog posts
  clone from source). RECEIPT: srcpkgs/xwinwrap/template, distfiles points at
  github.com/mmhobi7/xwinwrap. This removes a compile-from-source step that
  most online guides still tell you to do.

[2026-08-14][W-004] xwinwrap exists precisely because drawing to the root
  window breaks under a compositor: with a compositor running, an mpv that
  targets the root window renders nothing visible. xwinwrap creates the
  override-redirect below-everything window and hands its WID to the child.
  RECEIPT: CSaratakij gist README + corroborating unixporn/i3wm threads.
  CONSEQUENCE: this is exactly why Directive 10 orders the WM swap first.

[2026-08-14][W-005] Hardware-decoded video wallpaper is cheap; software-
  decoded is not. Measured by a third party on an i5-7200u/HD620:
  software 30fps = 40-60% CPU; hardware 30fps = 22-25%; hardware 18fps =
  6-11%; hardware 18fps with compositor off = 5-8%. RECEIPT: CSaratakij gist.
  CONSEQUENCE: the bake's frame rate is a POWER decision, not an aesthetic
  one. Bake the loop at the lowest fps that still reads as smooth on a slow
  sine wave — the XMB wave is a low-frequency motion and tolerates 24 or even
  20fps far better than a typical video would.

[2026-08-14][W-006] Chromium on Void is built with musl support
  (`is_musl=true`, dedicated musl-patches directory in the template). A
  headless Chromium bake is therefore viable on a musl target even though
  much proprietary software is not. RECEIPT: srcpkgs/chromium/template lines
  55-60, 91-92, 324-325.

[2026-08-14][W-007] cairo-dock in Void is 3.6.2, and the cairo-dock family
  builds with an explicit EGL-support switch (visible as
  `-Denable-egl-support=ON` in the 3.4.1-era template still mirrored in
  package databases). RECEIPT: srcpkgs/cairo-dock/template (version=3.6.2);
  configure_args form documented in the void-packages history for this pkg.
  CONSEQUENCE: cairo-dock's OpenGL backend is the "egl-glx" half of the repo
  name. If the dock renders black or falls back to cairo-only 2D, that is a
  GL-backend selection problem, not a theme problem.

[2026-08-14][W-008] ffmpeg 4.4.8 and ffmpeg6 6.1.6 are both packaged. Prefer
  ffmpeg6 for the bake: 4.4.x is old enough that some filter/encoder defaults
  differ from every tutorial written in the last three years.
  RECEIPT: srcpkgs/ffmpeg/template, srcpkgs/ffmpeg6/template.

[2026-08-14][W-009] U-002 is resolved. The live pre-swap desktop has xfwm4
  PID 1209, picom PID 2462 using
  /home/sd/.config/picom-animations.conf, and cairo-dock PID 1301 in OpenGL
  mode (`-o`). No compiz process was reported. XFCE's failsafe Client0 command
  is `xfwm4`; the root `_NET_SUPPORTING_WM_CHECK` points to window 0x1000032.
  RECEIPT: target-shell IX.0 output pasted 2026-08-14.

[2026-08-14][W-010] U-003 is resolved for the swap. The target already has
  the full compiz-reloaded 0.8.18 surface installed: core, main/extra/
  experimental plugins, ccsm, compizconfig libraries, emerald and themes.
  cairo-dock 3.4.1 plus plugins and mpv 0.41.0 are also installed. xwinwrap
  did not appear in the installed-package query and remains a later delivery
  prerequisite, not a blocker for the compositor swap.
  RECEIPT: target `xbps-query -l` output pasted 2026-08-14.

[2026-08-14][W-011] IX.0 created rollback anchors before any desktop change:
  /home/sd/xfce4-session.xml.bak.1786687627 (2234 bytes) and
  /home/sd/wm-command.bak (39 bytes). The observed duplicate-vblank warnings
  were emitted while the NVIDIA-named vblank scheduler and picom were live;
  no WM replacement had been attempted when they were captured.
  RECEIPT: target `ls -la` and process output pasted 2026-08-14.

[2026-08-14][W-012] U-001 is resolved: the target is Void x86_64 with GNU
  libc 2.41, not musl. Direct rendering is active on the proprietary NVIDIA
  stack: GeForce RTX 3080, OpenGL 4.6.0 NVIDIA 595.84, with nvidia_uvm,
  nvidia_drm, nvidia_modeset and nvidia loaded; no nouveau module was
  reported. NVIDIA-SMI also reports driver 595.84. Therefore X-001 does not
  apply to this target and the project takes the glibc/NVIDIA branch.
  RECEIPT: target U-001 output pasted 2026-08-14.

[2026-08-14][W-013] IX.2A stood down the live standalone compositor without
  replacing the WM. xfwm4's internal `use_compositing` value was already
  false and remains false; picom PID 2462 terminated, xfwm4 PID 1209 remained
  live, and `_NET_SUPPORTING_WM_CHECK` remained window 0x1000032. Picom
  startup sources were found at ~/.config/autostart/picom-mac.desktop and
  /etc/xdg/autostart/picom.desktop; disabling both persistently is the next
  sub-gate.
  RECEIPT: target IX.2A output pasted 2026-08-14.

[2026-08-14][W-014] IX.2B persistently masked both discovered picom autostart
  names with per-user XDG entries containing `Hidden=true` and
  `X-GNOME-Autostart-enabled=false`. The exact prior user entries are backed
  up at /home/sd/picom-autostart-backup.1786688178. Runtime verification still
  showed picom stopped, xfwm4 PID 1209 live, and xfwm4 internal compositing
  false. IX.2 is complete: no old compositor remains active or enabled for
  autostart.
  RECEIPT: target IX.2B output pasted 2026-08-14.

[2026-08-14][W-015] The IX.3 emergency rollback is proven. From the target
  shell, Compiz and emerald were stopped and `DISPLAY=:0.0 xfwm4 --replace`
  restored xfwm4 PID 3242 and root WM window 0x1000032. Verification showed
  no Compiz or emerald process. Picom was intentionally not restarted, so the
  safe post-abort state is xfwm4 without either compositor.
  RECEIPT: target emergency-abort output pasted 2026-08-14.

[2026-08-14][W-016] U-005 and the factual half of U-008 are resolved. X screen
  0 is 4480x1440. DP-2 is primary at 2560x1440+0+0 and 120 Hz; DP-0 is
  1920x1080+2560+197, inverted, at about 120 Hz. NVIDIA MetaMode applies
  ForceCompositionPipeline and ForceFullCompositionPipeline to both. The
  Compiz 0.8.18 launch demonstrably selected ~/.config/compiz, not the stale
  ~/.config/compiz-1 tree: the former names `emerald --replace`, matching the
  decorator observed in the IX.3 log, while the latter names
  /usr/bin/compiz-decorator.
  RECEIPT: target U-008 xrandr, NVIDIA MetaMode and config output, 2026-08-14.

[2026-08-14][W-017] IX.3B-1 backed up the active profile to
  Default.ini.pre-ix3b.1786688802 and added the exact verified output list
  `2560x1440+0+0;1920x1080+2560+197;` while retaining manual output mode
  (`s0_detect_outputs = false`). The printed diff contains no other change.
  Post-change runtime remained safe: xfwm4 PID 3242, no Compiz, no picom.
  This is a correction candidate, not yet a proven fix.
  RECEIPT: target IX.3B-1 diff and process output pasted 2026-08-14.

[2026-08-14][W-018] IX.3B-2 proved the explicit output-list correction in a
  bounded trial. Compiz PID 8579 owned the WM selection while XRandR still
  reported both exact monitor rectangles; the prior tiny/cropped display did
  not recur in the user's observation. The 15-second trap then restored
  xfwm4 PID 8831 and stopped Compiz and emerald exactly as designed. X-012's
  geometry candidate is therefore accepted, while appearance/performance is
  not yet accepted.
  RECEIPT: target timed-trial state, automatic-recovery output and user
  observation pasted 2026-08-14.

[2026-08-14][W-019] IX.3C-1 installed a backed-up clean performance candidate.
  The exact diff removed reflex, both blur engines, bench, showmouse,
  mousepoll, cube, expo and scale while retaining window management,
  decoration, animation, animationaddon, fade and switcher; it added
  workarounds and winrules. Composite refresh autodetection changed from true
  to false with the verified common rate fixed at 120 Hz. Rollback file is
  Default.ini.pre-refresh.1786689070. Runtime stayed on safe xfwm4 PID 8831;
  Compiz and picom remained stopped. Visual performance is not yet proven.
  RECEIPT: target IX.3C-1 diff and process output pasted 2026-08-14.

[2026-08-14][W-020] IX.3C-2 is the first visually accepted live Compiz state.
  Compiz PID 16048 owns `_NET_SUPPORTING_WM_CHECK`; xfwm4 is replaced, picom
  is stopped, and one emerald PID 16060 remains as decorator. Both exact
  monitor rectangles and the refined plugin/120 Hz profile were printed.
  The user confirmed smooth movement, removal of the shiny effect, correct
  complete monitor placement, and working plugins. The log contains only the
  already observed no-XI2 and emerald GTK CSS/Wnck warnings, with no reported
  fatal startup error. X-013's observed symptoms are superseded by this state.
  RECEIPT: target IX.3C-2 process/WM/profile/log output plus four direct visual
  checks, 2026-08-14.

[2026-08-14][W-021] IX.4A's 30-second interval itself retained Compiz PID
  18768 and WM ownership. xfce4-panel PID 1252, cairo-dock PID 1301 and emerald
  PID 16060 remained live; picom and xfwm4 remained absent. The snapshot was
  7.5% Compiz CPU, 219788 KiB RSS, 18% GPU, 947 MiB GPU memory and 42.51 W.
  XFCE's persistent Client0 command is still `xfwm4`, so no reboot/session
  persistence change has been made.
  RECEIPT: target IX.4A process/resource/session output pasted 2026-08-14.

[2026-08-14][W-022] U-009 is resolved. Compiz PID 18768 is a direct child of
  xfce4-session and carries `--sm-client-id`, proving live XSMP restart by the
  session manager after PID 16048 ended. No Compiz backend/profile environment
  override exists, Client0 still names xfwm4, and the large saved-session cache
  contains xfwm4/Thunar state but no reported Compiz launch entry. The active
  backend remains ~/.config/compiz/compizconfig/Default.ini; both that file and
  libcompizconfig report the same expanded active-plugin list.
  RECEIPT: target U-009 ancestry, environment, cache, INI and Python-context
  output pasted 2026-08-14.

[2026-08-14][W-023] IX.4B-1 successfully hot-removed D-Bus and the heavy
  experimental plugin stack without replacing Compiz PID 18768. Effective and
  on-disk lists agree on the clean core/window-management/animation baseline;
  xfwm4 and picom remain absent. The user accepts its memory efficiency,
  theme, animations and immediate stability. Snapshot: 8.7% Compiz CPU,
  253100 KiB RSS, 42% GPU, 929 MiB GPU memory and 40.86 W. Refresh smoothness
  remains explicitly unaccepted.
  RECEIPT: target IX.4B-1 context/file/process output and user observation,
  2026-08-14.

[2026-08-14][W-024] CORRECTION/SUPERSESSION for parts of X-015 and X-016:
  U-010 shows the active Compiz 0.8 core schema is `[core] s0_*`, not the old
  `[opengl]/[composite] as_*` lines previously treated as live truth. The
  current profile explicitly has refresh_rate=120, sync_to_vblank=false,
  lighting=true and fast texture filtering. Therefore the CCSM boolean drawing
  was not inverted; it represented the live core values, while the earlier
  `as_*` values were ineffective. Detect Outputs is enabled in the screenshot,
  so its displayed 640x480 fallback list is inactive; live X geometry remains
  the complete 4480x1440 screen with both correct monitor rectangles. The
  plugin-cleanup profile is not proven reboot-safe yet, but it did not recreate
  X-011's manual-detection-with-missing-list fault. The remaining measured
  candidate for poor refresh is vblank being explicitly false.
  RECEIPT: complete active INI, CCSM screenshot and xrandr output in U-010,
  2026-08-14.

[2026-08-14][W-025] IX.4B-2 changed only the live Compiz 0.8 core vblank value
  from false to true. PID 18768 and WM ownership remained stable, picom and
  xfwm4 remained absent, and XRandR still reported DP-2 2560x1440+0+0 and
  DP-0 1920x1080+2560+197. Snapshot: 7.4% Compiz CPU, 253220 KiB RSS, 46% GPU,
  930 MiB GPU memory and 31.20 W. The user still does not perceive 120 Hz, so
  vblank=true alone is not an accepted refresh fix.
  RECEIPT: target IX.4B-2 diff/process/geometry/resource output and user
  observation, 2026-08-14.

[2026-08-14][W-026] IX.4B-3 installed the complete explicit Compiz 0.8 core
  display candidate without changing plugins: detect_refresh_rate=false,
  refresh_rate=120, detect_outputs=false, the two proven output rectangles,
  and sync_to_vblank=true. PID 18768 and WM ownership remained stable; XRandR
  independently confirmed DP-2 2560x1440@120.00 and inverted DP-0
  1920x1080@119.98. Snapshot: 7.1% Compiz CPU, 253220 KiB RSS, 44% GPU,
  934 MiB GPU memory and 29.01 W. The profile/geometry side is now explicit
  and internally consistent, but the user still perceives no refresh
  improvement.
  RECEIPT: target IX.4B-3 diff/process/profile/xrandr/resource output and user
  observation, 2026-08-14.

[2026-08-14][W-027] The post-X-019 read-only scheduling sweep found the live
  WM window still names Compiz and `pgrep -a` still reports PID 18768 with its
  XSMP client ID; emerald, xfce4-panel and cairo-dock remain present, while
  xfwm4 and picom remain absent. The active Default.ini SHA-256 is
  3ac4f0329b18b0d5cbbe3331a36eadbb25507efc0b178535b715398aa8ccab7a and
  retains the exact W-026 explicit display values. Effective NVIDIA settings
  report SyncToVBlank=1 and AllowFlipping=1; the current RandR MetaMode retains
  both proven rectangles with ForceCompositionPipeline and
  ForceFullCompositionPipeline enabled. The target shell exports only
  VDPAU_NVIDIA_SYNC_DISPLAY_DEVICE=DP-2 among queried GL/NVIDIA selectors, and
  no TripleBuffer setting appeared in the queried effective/static output.
  Static xorg.conf MetaMode text uses an older monitor arrangement, but the
  effective `CurrentMetaMode` is the already proven live arrangement.
  RECEIPT: target read-only WM/process/profile/environment, `nvidia-settings
  -q CurrentMetaMode`, `nvidia-settings -q all`, and X11 config grep output
  pasted 2026-08-14.

[2026-08-14][W-028] U-011 is resolved without trusting the absent
  `_NET_WM_PID`: `pgrep -x compiz` returned exactly one PID, 18768. Its direct
  parent is xfce4-session PID 1142, followed by LightDM and runit ancestry,
  confirming the W-022 XSMP/session-managed state remains live. Its actual
  environment contains DISPLAY=:0, XDG_SESSION_TYPE=x11, the XFCE session
  manager address and VDPAU_NVIDIA_SYNC_DISPLAY_DEVICE=DP-2, with no queried
  `__GL_*`, `__NV_*`, `LIBGL_*` or `COMPIZ_*` override. Stdout is /dev/null and
  stderr is the shared /home/sd/.xsession-errors. The tailed shared log still
  contains the historical duplicate D-Bus registrations from X-015 plus later
  unrelated GTK/Chromium messages; because those D-Bus lines have no timestamp
  and the file is shared, the tail is not evidence that the clean current
  plugin list re-enabled D-Bus or emitted a new fatal event.
  RECEIPT: target U-011 unique-PID, `/proc`, ancestry, environment, fd and log
  output pasted 2026-08-14.

[2026-08-14][W-029] The target now has an executable recovery artifact at
  /home/sd/.local/bin/xfce-wm-recover (1896 bytes, mode 0755, SHA-256
  3f9402d2731d560fecae27a899b8f36c78b1c3a2527bda4a9fb2bdd354e19c24).
  `sh -n` passed and its non-destructive `--check` returned 0 after finding
  pkill, nohup, xfwm4, xprop and pgrep, reaching DISPLAY=:0.0, observing the
  current supporting-WM window, and confirming persistent Client0 still names
  xfwm4. Normal invocation stops Compiz/Emerald, starts `xfwm4 --replace`, and
  verifies xfwm4-live/Compiz-absent; it has not yet been destructively invoked.
  Installation rollback is `rm -f /home/sd/.local/bin/xfce-wm-recover`.
  RECEIPT: target artifact listing, checksum, syntax check, `--check` output
  and printed rollback pasted 2026-08-14.

[2026-08-14][W-030] X-019's bounded fresh-process requirement was executed:
  sole Compiz PID 15827 ran as `compiz --replace --sm-disable`, owned the WM,
  and retained emerald, xfce4-panel and cairo-dock with picom absent. The log
  reported only the known no-XI2 warning. Initial/end snapshots were 9.1/10.6%
  CPU, 149428/150408 KiB RSS, 48/38% GPU, 868 MiB GPU memory and 29.33/29.01 W.
  Automatic invocation of /home/sd/.local/bin/xfce-wm-recover then restored
  xfwm4 PID 16448 as WM with Compiz/Emerald absent and panel/dock surviving.
  The user reports refresh is poor under the fresh Compiz process but perfect
  on both displays immediately after xfwm4 recovery. Thus renderer hot-reload
  was not the cause, while the recovery artifact is now destructively proven.
  RECEIPT: target fresh-process identity/resources/log, automatic recovery
  output and direct before/after visual observation pasted 2026-08-14.

[2026-08-14][W-031] U-012 confirms the fresh trial/exit collapsed the active
  profile from the pre-trial 3ac4f032... state to an 89-byte file containing
  only `[core]`, the six-plugin list
  `core;ccp;move;resize;place;decoration;`, and refresh_rate=120. The active
  SHA-256 is a572585c451b757282b77bb77e32a997e25374d45011692a9f6110a94ba033df.
  It no longer contains detect-refresh, detect-outputs, output rectangles,
  vblank, lighting, texture filtering, or the accepted animation/utility
  plugin list. Timestamped backups remain readable, including
  pre-explicit-display SHA-256 89d1eaa7... with the accepted clean plugin list
  and pre-refresh SHA-256 58a514db... with the proven output rectangles.
  Current runtime is safely xfwm4 PID 16448 with no Compiz or picom.
  RECEIPT: target U-012 file inventory, checksums, complete current core
  section, backup diffs and key comparison pasted 2026-08-14.

[2026-08-14][W-032] The collapsed profile was preserved at
  /home/sd/.config/compiz/compizconfig/Default.ini.collapsed.1786691513 with
  its matching 89-byte SHA-256 a572585c.... While xfwm4 PID 16448 owned the
  screen and Compiz/picom were absent, an atomic replacement installed a
  351-byte, 10-line minimal baseline with the complete accepted clean plugin
  list and all W-026 core display values. Every exact line and line count
  validated; restored SHA-256 is
  dcefbadd6fe348807abc71303975dfd3e83d2a4ec7758e624b1f0bf65748426c.
  Exact rollback is `cp -a Default.ini.collapsed.1786691513 Default.ini`.
  RECEIPT: target corrected precondition, backup, full file, checksum and
  exact-value validation output pasted 2026-08-14.

[2026-08-14][W-033] U-013 found one surviving configuration writer
  candidate while xfwm4 owned the screen and Compiz/picom were absent: CCSM
  PID 5483, `/usr/bin/python3 /usr/bin/ccsm`, orphaned under PID 1 since
  06:56:08. Between W-032 and the guarded A/B precheck, Default.ini was
  rewritten at 07:12:35 from 351 to 347 bytes. All explicit display/vblank/
  lighting/texture values survived; the only diff reordered active plugins
  and removed `ccp`, producing SHA-256 110c892a.... Neither fuser, lsof nor
  `/proc` found an open descriptor because the writer had closed the file by
  inspection time. CCSM is therefore the sole observed live writer candidate,
  not yet a proven cause until it is stopped and the restored hash dwells.
  RECEIPT: target U-013 full file/diff, process list, descriptor search and
  timestamps pasted 2026-08-14.

[2026-08-14][W-034] Stopping exact CCSM PID 5483, backing up its reordered
  profile to Default.ini.ccsm-reordered.1786691729 (SHA-256 110c892a...), and
  restoring W-032 SHA-256 dcefbadd... initially succeeded. During the 15-second
  dwell, CCSM reappeared as PID 3132 and Default.ini changed at 07:15:41 to
  SHA-256 eae6553c2567ac7d1fb8bc9519cad3c301561f471823cf8b329c492063af391f.
  This temporal reproduction promotes CCSM from candidate to proven profile
  writer. Runtime remained safely xfwm4 with panel/dock and no Compiz/picom.
  RECEIPT: target exact-process termination, restored hash/mtime, dwell
  hash/mtime, respawned PID and runtime output pasted 2026-08-14.

--- 6.B WHAT DOES NOT WORK / HARD BLOCKERS --------------------------------------

[2026-08-14][X-001] *** CRITICAL, READ BEFORE PLANNING ANYTHING ELSE ***
  THE PROPRIETARY NVIDIA DRIVER DOES NOT EXIST FOR VOID MUSL. Not "is
  difficult" — does not exist, at any version, on any musl distribution,
  because NVIDIA ships no musl-linked binaries. The Void handbook states it
  outright, and the package refuses to build on musl with
  "ERROR: nvidia: this package cannot be built for x86_64-musl".
  RECEIPT: docs.voidlinux.org/installation/musl.html "In particular, the
  proprietary NVIDIA drivers do not support musl"; void-packages nvidia
  template is `repository="nonfree"` with `archs="x86_64"` and nonfree/musl
  carries no nvidia; multiple independent user reports of the exact build
  error.
  WHAT THIS MEANS FOR THIS PROJECT: if the target is genuinely musl, then the
  RTX 3080 is running on NOUVEAU, and the following are all affected —
    - the 3080's NVDEC hardware video decoder is not usable the way it would
      be under the proprietary stack, so W-005's "hardware decoding" path for
      the wallpaper must come from the INTEL iGPU via VAAPI, not the 3080;
    - EGL-vs-GLX behaviour (the repo name's tail) is mesa/nouveau behaviour,
      not NVIDIA-driver behaviour, and every NVIDIA-specific tuning note found
      online is inapplicable;
    - compiz 0.8.x uses a legacy fixed-function-era GL path, which is exactly
      the code path least exercised on nouveau for a 30-series card.
  THIS IS THE SINGLE HIGHEST-VALUE UNKNOWN IN THE PROJECT. It is possible the
  repo name is aspirational or stale and the machine is actually glibc. DO NOT
  ASSUME EITHER WAY. Resolve it with U-001 before designing anything that
  depends on the GPU.

[2026-08-14][X-002] Screen-recording the wave (OBS or any screencast) cannot
  produce a deterministic result and must not be reintroduced. Real-time
  capture races the renderer: under load the browser renders fewer frames, the
  recorder takes what exists, and the output is a different length with
  unevenly spaced frames every single run. RECEIPT: puppeteer-capture author's
  writeup, and the HeyGen/HyperFrames engineering notes on why Page.screencast
  was abandoned. This is the documented root cause of the human-error loop
  Directive 2 describes. It is CLOSED. Do not reopen it.

[2026-08-14][X-003] Naively calling page.screenshot() in a loop is NOT the
  fix for X-002 and will still tear: Page.captureScreenshot races the
  compositor, so a screenshot can land mid-frame or repeat a stale frame.
  RECEIPT: HeyGen HTML-to-video engineering writeup, failure mode #1.

[2026-08-14][X-004] Letting a <video> element play inside the page during a
  headless bake does not work — with BeginFrame control on, decoders skip
  frames, fail to decode, or sit at readyState 0. RECEIPT: same writeup.
  CONSEQUENCE: the XMB scene must be pure WebGL/canvas at bake time. No video
  textures, no embedded media.

[2026-08-14][X-005] `--use-angle=egl` is silently ACCEPTED AND IGNORED by
  Chromium — it looks like it worked and quietly leaves you on software
  rendering. The correct spelling is `--use-angle=gl-egl`. Also note Chromium
  moved `--use-gl=` toward `--gl=`/`--angle=` in recent versions, and Chrome
  141 removed OpenGL from the ANGLE backend list. RECEIPT: chromium issue
  40540071 comments #66/#69, Arch BBS thread on v123 GPU regression, r/chrome
  on 141. CONSEQUENCE: never trust a flag; verify with chrome://gpu (6.C U-004).

[2026-08-14][X-006] `fusion-icon` — the tray applet every 2010-era compiz
  tutorial tells you to autostart — is NOT packaged for Void. RECEIPT: gh api
  returns no content for srcpkgs/fusion-icon. Any plan step that says "add
  fusion-icon to autostart" is dead on arrival here; use the xfconf key
  (W-002) instead, which is better practice anyway.

[2026-08-14][X-007] The Xfce project's own wiki explicitly advises against
  compiz ("Just don't use it. It is outdated. Upstream is dead."). RECEIPT:
  wiki.xfce.org/howto/other_window_manager. This is PARTIALLY STALE — it
  predates/ignores compiz-reloaded, which shipped 0.8.18 and is packaged by
  Void (W-001). Recorded here not as a blocker but so a future run does not
  rediscover this page and conclude the mission is impossible. It isn't. But
  treat it as a warning that upstream XFCE will not help you debug this.

[2026-08-14][X-008] Compiz and picom are NOT interchangeable and must not both
  own the screen. Compiz is a compositing WINDOW MANAGER (it replaces xfwm4
  AND its compositor); picom is a standalone compositor that attaches to a WM
  that lacks one. Running compiz while picom is alive means two compositors
  fighting for the same screen. RECEIPT: r/xfce thread 1le1ln0, the corrected
  explanation in that thread. CONSEQUENCE: the swap is not "add compiz" — it
  is "remove picom AND xfwm4's compositor AND xfwm4, then add compiz." All
  three, in that order (Section IX).

[2026-08-14][X-009] Known collateral damage from the compiz-under-XFCE swap,
  reported repeatedly: the xfce4-panel can vanish when switching workspaces
  (compiz manages its own viewports and the XFCE pager disagrees), window
  decorations are absent until the Decoration plugin is explicitly enabled in
  ccsm, and desktop icon labels get displaced. RECEIPT: Arch BBS 97055 and
  134611; the icon-label fix is
    xfconf-query -c xfce4-desktop -p /desktop-icons/center-text -n -t bool -s false
  Expect all three. They are not signs of a broken install.

[2026-08-14][X-010] Stale session cache silently defeats the swap: if
  ~/.cache/sessions still holds the old session, the WM change appears not to
  take. RECEIPT: Arch BBS 97055 (pseup). Clearing that cache is a required
  step, not a troubleshooting afterthought.

[2026-08-14][X-011] The first IX.3 volatile replacement is rejected. Compiz
  PID 789 successfully replaced xfwm4 and owned `_NET_SUPPORTING_WM_CHECK` as
  `compiz`, with picom stopped, but the user could see only a very small part
  of the main monitor and requested an immediate abort. The log reported no
  XI2 extension and two emerald instances emitting GTK CSS and Wnck warnings;
  it did not report a fatal Compiz error. Do not make Compiz persistent or
  repeat the same launch until output geometry and the existing Compiz profile
  have been inspected and corrected.
  RECEIPT: target IX.3 output and direct user observation, 2026-08-14.

[2026-08-14][X-012] The active Compiz profile is unsafe for the verified
  dual-monitor geometry: ~/.config/compiz/compizconfig/Default.ini explicitly
  sets `s0_detect_outputs = false` but contains no `s0_outputs` list. This is
  the leading causal fault for X-011 and must be corrected to the observed
  DP-2/DP-0 rectangles before IX.3 is retried. The separate compiz-1 profile's
  stale, reversed offsets are not the settings that launched IX.3 and must not
  be copied into the active profile. Causality remains unproven until a
  corrected volatile launch renders both monitors normally.
  RECEIPT: W-016 plus complete active-profile output, 2026-08-14.

[2026-08-14][X-013] IX.3B-2 appearance/performance is rejected pending a
  clean baseline: the user observed a strange shiny effect around windows and
  poor apparent refresh. The active profile explicitly enables `reflex`,
  `blur`, `mblur`, `bench`, `showmouse` and `mousepoll` together, while also
  allowing automatic refresh detection despite both displays running near
  120 Hz. Those are evidence-backed suspects, not yet proven causes. Remove
  the diagnostic/blur/reflection stack, retain the requested animation stack,
  force the already verified common 120 Hz rate, then retest under the same
  timed rollback before keeping Compiz live.
  RECEIPT: active profile in U-008 plus direct user observation, 2026-08-14.

[2026-08-14][X-014] IX.4A rejects persistence despite the 30-second PID dwell.
  The accepted launch PID 16048 was replaced before the dwell by PID 18768,
  invoked as `compiz --sm-client-id ...`; the original log now contains a D-Bus
  boolean assertion failure. The user still perceives choppy refresh. A CCSM
  screenshot simultaneously shows Detect Refresh Rate and Detect Outputs
  checked and Sync to VBlank unchecked, contradicting the on-disk candidate
  (`detect_refresh=false`, manual outputs, `sync_to_vblank=true`). Do not
  persist or reboot into Compiz until the restart parentage, D-Bus plugin and
  live-vs-disk option mismatch are resolved. Keep screenshot binaries outside
  Git; this ledger records their factual content.
  RECEIPT: W-020/W-021, IX.4A log scan, user observation and attached CCSM
  screenshot, 2026-08-14.

[2026-08-14][X-015] The clean IX.3C profile was invalidated by a later CCSM
  edit before IX.4A: the live/file list again contains mblur, blur and bench,
  plus water, wobbly, cube, rotate, cubeaddon, cubemodel, gears and 3d, while
  the accepted animation/fade baseline is absent. D-Bus was left enabled; the
  original log ends after hundreds of duplicate-handler messages for these
  plugins and a D-Bus boolean assertion. This is the evidence-backed source
  of the restart/choppiness gate, not a reason to abandon Compiz. Also, every
  visible CCSM boolean in the screenshot is the inverse of its same-backend
  INI value (including lighting and vblank), so the current GTK theme renders
  those checkbox states unreliably. Do not tune booleans by their checkmark;
  use the INI/libcompizconfig receipt. Restore the clean list without D-Bus,
  then add desired effects one at a time behind a stability measurement.
  RECEIPT: U-009 active list/context and log lines 1301-1460, 2026-08-14.

[2026-08-14][X-016] IX.4B-1 is only a partial pass. `Context.Write()` restored
  the plugin list but rewrote the INI such that the verification grep found no
  explicit output, refresh or vblank settings. The attached post-cleanup CCSM
  screenshot shows a single `640x480+0+0` Compiz output instead of the proven
  dual-output list, while the user still reports poor refresh. The already
  running process remains visually usable, but the next launch is unsafe and
  persistence remains prohibited. Identify the exact libcompizconfig setting
  scopes, restore both monitor rectangles and explicit 120 Hz/vblank values,
  then perform a controlled restart rather than another broad Context write.
  RECEIPT: IX.4B-1 empty truth grep, screenshot and user observation,
  2026-08-14.

[2026-08-14][X-017] After W-024 corrects the schema interpretation, the clean
  profile's remaining rejected property is poor perceived refresh with
  `s0_refresh_rate = 120` but `s0_sync_to_vblank = false`. Perform one narrow,
  backed-up A/B change to vblank=true without changing plugins, outputs,
  lighting or texture filtering. Accept only if PID/WM stability remains and
  the user observes smoother motion; otherwise restore false.
  RECEIPT: U-010 active INI and direct user observation, 2026-08-14.

[2026-08-14][X-018] IX.4B-2 disproves vblank=false as the sole cause. CCSM
  still shows Detect Refresh Rate enabled, so the displayed numeric 120 can be
  ignored in favor of Compiz autodetection; the user still rejects perceived
  refresh after vblank=true. Detect Outputs is also enabled, making the visible
  640x480 list an inactive fallback rather than the XRandR mode: XRandR proves
  the actual monitors are already 2560x1440@120 and 1920x1080@119.98. Remove
  both ambiguities with the correct 0.8 core keys: detect_refresh_rate=false,
  refresh_rate=120, detect_outputs=false, and the already proven two explicit
  rectangles. Keep vblank=true for this next isolated test.
  RECEIPT: IX.4B-2 screenshot, active INI, xrandr and user observation,
  2026-08-14.

[2026-08-14][X-019] IX.4B-3 disproves hot-writing all explicit core display
  values as a sufficient refresh fix. Do not repeat refresh/output/checkbox
  edits: the file and XRandR already prove the requested modes. The next run
  must determine whether these renderer-affecting options require a fresh
  Compiz process and inspect NVIDIA/GLX frame scheduling; use a bounded launch
  with `--sm-disable` so XFCE cannot silently respawn another XSMP client.
  Persistence, logout and reboot remain prohibited until the fresh-process
  result is visually accepted and resource cost is remeasured.
  RECEIPT: W-026 and direct user report "unchanged", 2026-08-14.

[2026-08-14][X-020] The clean fresh `--sm-disable` Compiz process is visually
  rejected, disproving stale renderer initialization as the sufficient cause
  of X-019. Additionally, Default.ini changed unexpectedly during the bounded
  launch/exit: SHA-256 was
  3ac4f0329b18b0d5cbbe3331a36eadbb25507efc0b178535b715398aa8ccab7a before
  and a572585c451b757282b77bb77e32a997e25374d45011692a9f6110a94ba033df
  afterward, despite the test issuing no explicit profile write. Do not assume
  the desired display/plugin values survived and do not relaunch Compiz until
  the exact mutation is diffed against the timestamped backups. Current safe
  runtime is xfwm4 without picom; the user's wallpaper-behaviour concern is
  deferred behind M8 per Directive 10 rather than tuned under the wrong WM.
  RECEIPT: W-030, before/after target SHA-256 output and user observation,
  2026-08-14.

[2026-08-14][X-021] The post-trial active Default.ini is launch-unsafe and
  must not be treated as W-026: it lost the explicit output list and most
  plugins/settings, exactly matching the user's concern that Compiz settings
  are not surviving. The evidence establishes that collapse occurred during
  the fresh launch/exit interval but does not yet identify whether startup,
  ccp shutdown, or another writer caused it. Restore an atomically written,
  backed-up minimal W-026 baseline while xfwm4 owns the screen, verify every
  line and checksum, and only then begin one-variable renderer A/B trials.
  RECEIPT: W-031 and X-020.

[2026-08-14][X-022] The first atomic-restoration block made no change: its
  safety gate observed xfwm4 PID 16448 and supporting-WM window 0x1600032 but
  parsed the WM name as UNRESOLVED because the sed capture was over-escaped.
  It stopped before backing up or writing Default.ini, exactly as designed.
  Supersede only the parser with a literal `xprop` match for `= "Xfwm4"` and
  repeat the same safe restoration; do not weaken the no-Compiz/no-picom gate.
  RECEIPT: target restoration precondition and STOP output pasted 2026-08-14.

[2026-08-14][X-023] The first `__GL_SYNC_DISPLAY_DEVICE=DP-2` A/B test did
  not launch and therefore produced no visual result. Its safety gate found
  xfwm4 still owning the screen with no reported Compiz/picom, but Default.ini
  had drifted from W-032 SHA-256 dcefbadd... to
  110c892aeeb99adee2d31b04ff2eb4d460a9fbb5dee9d433fb3f11cac9becba7 while
  Compiz was absent. The block stopped before creating its profile guard,
  arming recovery, or changing the WM. A non-Compiz writer or unobserved
  configuration process is therefore now evidence-backed; identify the exact
  diff and likely live writer before restoring again.
  RECEIPT: target A/B precondition and STOP output pasted 2026-08-14.

[2026-08-14][X-024] Do not leave CCSM open during machine-authored profile
  restoration or renderer tests. PID 5483 survived independently of Compiz
  and the only observed off-baseline rewrite occurred while it was live,
  removing the `ccp` backend plugin and reordering the list. Stop exactly that
  CCSM command, restore the guarded baseline, and require a timed hash dwell
  before launching Compiz. This is a bounded causal test; do not kill generic
  Python processes.
  RECEIPT: W-033.

[2026-08-14][X-025] A single TERM is insufficient to stand down CCSM: PID
  5483 exited cleanly but `/usr/bin/python3 /usr/bin/ccsm` respawned as PID
  3132 within the dwell and rewrote the profile. Do not race it with repeated
  profile writes or launch Compiz while it remains restart-managed. Inspect
  PID 3132 ancestry/session environment, XSMP window properties and XFCE saved
  session/cache references to identify and disable the exact restart source
  reversibly; generic Python kills remain prohibited.
  RECEIPT: W-034.

--- 6.C UNVERIFIED — CLAIMS WITH THEIR RESOLVING COMMAND (Directive 8) ----------
Each row is a question the sandbox physically cannot answer. Run these ON THE
TARGET, paste the output, and promote the row into 6.A or 6.B with the output
as its receipt. Do not guess any of them.

[U-001] *** GATE 0. NOTHING ELSE MATTERS UNTIL THIS IS ANSWERED. ***
  Is the target musl or glibc, and which GL driver is actually live?
    xbps-uhelper arch          # expect x86_64  OR  x86_64-musl
    ldd --version 2>&1 | head -1
    glxinfo -B | sed -n '1,12p' # OpenGL renderer string = ground truth
    lsmod | grep -Ei 'nvidia|nouveau'
    nvidia-smi 2>&1 | head -3
  If `x86_64-musl`: X-001 is in force. The 3080 is on nouveau, and the entire
  plan must target Intel-iGPU VAAPI for decode and mesa for GL. Say so out
  loud to the user rather than quietly designing around it.
  If `x86_64` (glibc): X-001 does not apply to this machine, the proprietary
  driver and NVDEC are available, and the repo name's "voidmusl" is stale.
  Record which one, dated, in 6.A. This single answer branches the project.

[U-002] What is actually running the desktop right now?
    pgrep -a xfwm4; pgrep -a picom; pgrep -a compiz; pgrep -a cairo-dock
    xfconf-query -c xfce4-session -p /sessions/Failsafe/Client0_Command
    xprop -root _NET_SUPPORTING_WM_CHECK
  Needed before any swap, so the rollback in IX.0 is written against reality
  rather than against the repo name.

[U-003] Is compiz-reloaded installed, and is it even installable on this libc?
    xbps-query -Rs compiz
    xbps-query -l | grep -Ei 'compiz|emerald|ccsm|cairo-dock|xwinwrap|mpv'
  "compizunused" in the repo name implies installed-but-idle; confirm.

[U-004] Does headless Chromium get real GPU acceleration on this box?
    chromium --headless=new --no-sandbox --use-angle=gl-egl \
      --enable-gpu --screenshot=/tmp/gpu.png chrome://gpu
  Then read the image. WebGL2 must NOT say "Software only". If it does, try
  in order: --use-angle=vulkan --enable-features=Vulkan; then
  --use-angle=gl; then run under Xvfb with DISPLAY set (headless GL
  autodetection on Linux historically needs an X display). If none give
  hardware WebGL2, fall back to SwANGLE software rendering — SLOW BUT
  CORRECT, and for a one-time offline bake, correctness beats speed. A
  software bake that takes 40 minutes and produces a perfect loop is a
  complete success. Record which path won.

[U-005] Exact display geometry and refresh, for the bake resolution:
    xrandr --query | grep -w connected
  Bake to the native panel size. Do not upscale; do not letterbox.

[U-006] Which VAAPI/VDPAU decode paths exist for wallpaper playback?
    vainfo 2>&1 | tail -20
    mpv --hwdec=auto --no-audio --frames=60 /path/to/test.mp4 -v 2>&1 | grep -i hwdec
  On a musl+nouveau box the answer will likely be the Intel iGPU. That is
  fine and it is the correct decoder for a wallpaper anyway — it leaves the
  3080 free.

[U-007] Does /home/sd/.local/share/xmb-wave/ already exist, and with what in it?
    ls -laR /home/sd/.local/share/xmb-wave/ 2>&1 | head -50
    df -h /home/sd
  Never assume the workspace is empty. A prior run may have left artifacts.

[U-008] Which display/profile setting caused the rejected IX.3 Compiz launch
  to expose only a very small part of the main monitor?
    xrandr --query; xrandr --listmonitors
    xdpyinfo | grep -E 'dimensions:|resolution:'
    nvidia-settings -q CurrentMetaMode -t
    xprop -root _NET_DESKTOP_GEOMETRY _NET_DESKTOP_VIEWPORT _NET_WORKAREA
    inspect ~/.config/compiz*, ~/.compiz*, ~/.gconf/apps/compiz* and
            /etc/compizconfig for profile, output and active-plugin settings
  Resolve before another launch. The relevant predicates are native X output
  geometry, Compiz output detection/list, selected config backend/profile,
  viewport size, active plugins and decorator command. Back up the discovered
  profile before correcting any value; do not infer a geometry fix from the
  emerald warnings.

[U-009] Why did accepted Compiz PID 16048 become session-managed PID 18768,
  and why does CCSM show refresh/output/vblank booleans opposite to the active
  INI file?
    inspect PID/PPID/session ancestry and Compiz-related process environment
    read the current INI values again after CCSM has opened
    query libcompizconfig's effective values without writing them
    inspect the complete launch log around the D-Bus assertion
  Resolve before persistence. If the D-Bus plugin caused the restart, remove
  it from the stable baseline. If CCSM or another backend rewrote effective
  values, establish exactly one profile/backend and verify 120 Hz plus vblank
  in both the file and the live settings before another performance gate.

[U-010] Where does Compiz 0.8.18 expose output, refresh and vblank settings to
  compizconfig-python after IX.4B-1 removed their explicit INI lines?
    print every setting whose name contains output, refresh, vblank or lighting
    together with plugin, Display/Screen scope, value and default
    print the complete current INI before writing anything else
  Use the resulting exact setting objects for narrow writes only. Do not call
  a broad Context.Write after changing only active_plugins: IX.4B-1 proved
  that it can collapse the output list to the 640x480 default.

[U-011] Complete the process-ancestry and active-log part of W-027. The Compiz
  supporting-WM window exposes no `_NET_WM_PID`, so the first collector left
  `wm_pid` unresolved and skipped `/proc` environment, ancestry and fd-log
  inspection even though `pgrep` reported exactly one Compiz PID, 18768.
  Resolve read-only from the unique `pgrep -xo compiz` PID; print its full
  ancestry, selected environment, fd 1/2 destinations and tails of any regular
  log files. Do not infer that the old PID remains valid before re-querying it.

[U-012] What exactly did the bounded fresh Compiz process rewrite in
  Default.ini? While safely on xfwm4, list checksums/timestamps for the active
  profile and all `Default.ini.pre-*` backups, print the complete current
  plugin/display truth, and diff the active file against the recent explicit-
  display, vblank and clean backups. Resolve this before any NVIDIA A/B test;
  a 640x480/default-list regression must not be carried into another launch.

[U-013] What changed W-032 while Compiz was absent, and which process can
  still write the profile? While remaining on xfwm4, print the complete active
  file and diff it against the W-032 guard candidate, query ccsm and other
  Compiz/config processes, and inspect open-file ownership with available
  `fuser`/`lsof` tools. Do not kill or write yet; one read-only receipt must
  identify whether CCSM or another process survived before the next guarded
  restoration.

[U-014] What respawned CCSM as PID 3132? Read its PPID/ancestry, session
  environment and any SM_CLIENT_ID/WM_COMMAND properties, then search XFCE
  session cache and autostart entries for the exact CCSM command. This is
  read-only. The next action must disable only the proven restart source with
  a written inverse before restoring the profile again.

================================================================================
SECTION VII — MILESTONES (append a dated row per gate; never edit a prior row)
================================================================================
Status vocabulary, used strictly:
  DONE      = executed and its output was observed
  AUTHORED  = written in the sandbox, syntax-checked, never executed on target
  PLANNED   = specified in this file, not yet written
  BLOCKED   = waiting on a named U-row

  M0  Read README + MASTER, restate objective ............ DONE  2026-08-14
      receipt: this document; objective restated in Section IV
  M1  Ground-truth sweep of repo + sandbox toolchain ...... DONE  2026-08-14
      receipt: Sections 3.1, 3.3
  M2  Package availability resolved against void-packages . DONE  2026-08-14
      receipt: Section 3.4, gh api per-template reads
  M3  XMB source selected with evidence of liveness ....... DONE  2026-08-14
      receipt: Section 3.5, HEAD 1ec453a9 dated 2026-02-11
  M4  Deterministic-capture doctrine established .......... DONE  2026-08-14
      receipt: Section 8.3 and ledger rows X-002..X-005
  M5  Blocker X-001 (musl vs NVIDIA) identified ........... DONE  2026-08-14
      receipt: ledger X-001
  M6  Plan committed to MASTER.md, no other file touched .. DONE  2026-08-14
      receipt: `git status` shows exactly one modified file
  M7  U-001 answered; project branch chosen ............... BLOCKED on U-001
  M8  Compositor stack swapped, rollback proven ........... PLANNED (Sec IX)
  M9  Workspace /home/sd/.local/share/xmb-wave/ staged .... PLANNED (Sec VIII)
  M10 First deterministic frame pumped and hashed ......... PLANNED
  M11 Seamless loop verified (first frame == wrap frame) .. PLANNED
  M12 Encoded, hardware-decodable wallpaper.mp4 produced .. PLANNED
  M13 Wallpaper live under the new compositor, idle cost
      measured and recorded ............................... PLANNED
  M14 Autostart + one-command teardown installed .......... PLANNED

[2026-08-14][M8/IX.0] Pre-swap baseline and rollback anchors DONE.
  receipt: W-009..W-011; target process/package query and backup listing.
  Overall M8 remains PLANNED: xfwm4 and picom are still live and compiz has
  not yet been started.

[2026-08-14][M7] U-001 answered; glibc/NVIDIA branch chosen DONE.
  receipt: W-012; target arch, libc, GL renderer, modules and NVIDIA-SMI.
  This supersedes the earlier M7 BLOCKED row.

[2026-08-14][M8/IX.2A] Runtime picom stopped; xfwm4 left live DONE.
  receipt: W-013; before/after target process and xfconf output.
  Overall M8 remains PLANNED: autostart still needs masking and compiz has not
  yet been started.

[2026-08-14][M8/IX.2B] Picom autostart masked with rollback copy DONE.
  receipt: W-014; both user overrides and the runtime state were printed.
  This supersedes IX.2A's pending-autostart note. Overall M8 remains PLANNED:
  compiz has not yet been started.

[2026-08-14][M15] Lossless machine-readable runbook and reusable operator
  prompt capsule .......................................... PLANNED after M14
  requested output: formal IDs, predicates, dependency graph, state-machine
  transitions, receipts, checkpoints, exact actions, expected observations,
  rollback actions, troubleshooting branches, glossary and `next_action`;
  retain MASTER.md as the human audit log rather than replacing it.

[2026-08-14][M8/IX.3-A] First volatile Compiz test rejected; emergency
  rollback proven DONE.
  receipt: X-011 and W-015; WM identity/process output plus user observation.
  Overall M8 is BLOCKED on U-008. Do not persist or repeat the same launch.

[2026-08-14][M8/U-008] Native geometry and active Compiz profile identified
  DONE; receipt W-016 and X-012.
  This supersedes IX.3-A's broad U-008 block. Overall M8 remains BLOCKED on a
  backed-up output-list correction and successful IX.3-B volatile retest.

[2026-08-14][M8/IX.3B-1] Backed-up explicit output correction DONE.
  receipt: W-017 and the exact target diff.
  This supersedes U-008's pending-correction clause. Overall M8 remains
  BLOCKED on a successful, visually observed IX.3B-2 timed retest.

[2026-08-14][M8/IX.3B-2] Corrected dual-output geometry and timed rollback
  DONE; receipt W-018.
  This supersedes IX.3B-1's geometry-test block. Overall M8 remains BLOCKED on
  X-013 appearance/performance refinement; Compiz is not yet persistent.

[2026-08-14][M8/IX.3C-1] Backed-up clean plugin and 120 Hz candidate DONE.
  receipt: W-019 and exact target diff.
  Overall M8 remains BLOCKED on a visually accepted IX.3C-2 live trial. If
  accepted, keep that Compiz process live for interactive refinement but do
  not yet change the XFCE session command.

[2026-08-14][M8/IX.3C-2] Refined Compiz live trial visually accepted DONE.
  receipt: W-020; target identity/profile output and user checks.
  This supersedes X-013's performance block. Overall M8 remains BLOCKED on a
  stability dwell, installed TTY recovery command, persistence, and a complete
  logout/login reproduction. Keep the accepted Compiz process live meanwhile.

[2026-08-14][M16] Reversible monochrome/skeuomorphic desktop theme PLANNED
  after M8 stability and persistence are proven.
  requested direction: early-2000s Windows plus OS X 10.4/10.6 and the user's
  "sorbet visualizer" reference, coordinated across emerald, XFCE/GTK,
  xfce4-panel and cairo-dock. Identify the exact requested "Monochrome"
  download, source, license and checksum before installing it; back up every
  selected theme/config value and retain a one-command visual rollback.

[2026-08-14][M8/IX.4A] Initial stability/performance gate REJECTED.
  receipt: W-021 and X-014; dwell/resource output, assertion, screenshot and
  user-observed choppiness. Overall M8 is BLOCKED on U-009; persistence and
  reboot testing remain prohibited.

[2026-08-14][M8/U-009] XSMP restart and profile divergence diagnosed DONE.
  receipt: W-022 and X-015.
  This supersedes IX.4A's broad U-009 block. Overall M8 remains BLOCKED on a
  backed-up clean-list restoration without D-Bus and a new live stability
  gate. Effects may then return only one measured plugin group at a time.

[2026-08-14][M8/IX.4B-1] Clean plugin list without D-Bus DONE; output/refresh
  preservation REJECTED.
  receipt: W-023 and X-016. Overall M8 is BLOCKED on U-010; do not restart,
  persist, log out or reboot while the saved output list is 640x480.

[2026-08-14][M8/U-010] Active Compiz 0.8 core schema identified DONE.
  receipt: W-024; this supersedes IX.4B-1's 640x480/reboot interpretation but
  not its persistence prohibition. Overall M8 remains BLOCKED on X-017's
  narrow vblank A/B test and a later controlled restart/logout gate.

[2026-08-14][M8/IX.4B-2] Vblank=true A/B stability DONE; refresh result
  REJECTED. Receipt: W-025 and X-018.
  Overall M8 remains BLOCKED on an explicit detect-refresh/output test and a
  later controlled restart/logout gate.

[2026-08-14][M8/IX.4B-3] Explicit 120 Hz and dual-output core candidate DONE;
  hot-apply refresh result REJECTED. Receipt: W-026 and X-019.
  Overall M8 remains BLOCKED on a bounded fresh-process `--sm-disable` test,
  NVIDIA/GLX scheduling evidence, recovery installation, and logout/reboot
  reproduction. Do not repeat already disproven checkbox/profile edits.

[2026-08-14][M8/U-011] NVIDIA scheduling/profile read-only baseline PARTIAL.
  receipt: W-027 and target output. SyncToVBlank and AllowFlipping are enabled,
  the effective MetaMode/profile remain consistent, and no queried
  TripleBuffer value was found. Process ancestry and active-log collection
  remain BLOCKED on U-011 because the WM window omitted `_NET_WM_PID`; perform
  the narrow PID-fallback read before installing recovery or replacing the WM.

[2026-08-14][M8/U-011] Process ancestry and active-log discovery DONE.
  receipt: W-028. This supersedes the prior PARTIAL U-011 milestone. Overall
  M8 remains BLOCKED on installing and receipting an executable TTY recovery
  artifact before any fresh-process Compiz test; persistence remains
  prohibited.

[2026-08-14][M8/RECOVERY-1] Executable TTY recovery artifact INSTALLED and
  non-destructively verified. Receipt: W-029. This clears the recovery-artifact
  prerequisite for X-019's bounded fresh-process test. Overall M8 remains
  BLOCKED on that visual/resource test and later persistence reproduction.

[2026-08-14][M8/IX.4B-4] Fresh non-XSMP Compiz test REJECTED; automatic
  recovery PROVEN. Receipt: W-030 and X-020. Overall M8 remains BLOCKED on
  U-012 profile-mutation forensics, then one-variable NVIDIA/GLX A/B tests.
  Theming and wallpaper refinement remain gated until Compiz is smooth and
  stable; current runtime is safe xfwm4 without picom.

[2026-08-14][M8/U-012] Profile-mutation forensics DONE; active profile
  collapse CONFIRMED. Receipt: W-031 and X-021. This supersedes the U-012
  block, but overall M8 remains BLOCKED on a receipt-backed atomic restoration
  of the exact clean plugin/display baseline before any renderer A/B test.

[2026-08-14][M8/RESTORE-1] Atomic profile restoration NO-OP/REJECTED.
  Receipt: X-022. Safety behavior passed, but the WM-name parser rejected the
  valid xfwm4 state before any file change. Overall M8 remains BLOCKED on the
  corrected literal-match restoration.

[2026-08-14][M8/RESTORE-2] Minimal clean plugin/display baseline restored
  DONE. Receipt: W-032. This supersedes RESTORE-1/X-022 and clears X-021's
  launch-unsafe file state. Overall M8 remains BLOCKED on one-variable bounded
  NVIDIA/GLX A/B trials, beginning with the missing OpenGL sync-display
  selector while preserving/restoring this exact profile around every run.

[2026-08-14][M8/GL-A1] DP-2 OpenGL sync-display A/B NO-OP/REJECTED.
  Receipt: X-023. The guard correctly prevented launch after profile drift.
  Overall M8 remains BLOCKED on U-013 writer identification; no conclusion
  about `__GL_SYNC_DISPLAY_DEVICE` is permitted from this no-op.

[2026-08-14][M8/U-013] Live profile-writer candidate identified DONE.
  Receipt: W-033/X-024. Overall M8 remains BLOCKED on stopping only CCSM,
  restoring W-032 and proving a timed byte-identical dwell before resuming the
  DP-2 OpenGL sync-display A/B test.

[2026-08-14][M8/WRITER-1] CCSM profile-writer causality PROVEN; stand-down
  FAILED due to respawn. Receipt: W-034/X-025. Overall M8 remains BLOCKED on
  U-014 exact restart-source identification and reversible suppression before
  restoring or launching Compiz.

================================================================================
SECTION VIII — THE BAKE (Agent F). Design only; nothing here has been run.
================================================================================

8.1 WORKSPACE LAYOUT — /home/sd/.local/share/xmb-wave/
The user chose this path deliberately: it is XDG data-dir, per-user, survives
reboots, and is not the repo. Bake artifacts NEVER enter git.

  /home/sd/.local/share/xmb-wave/
    src/            the XMB web scene, vendored, pinned to a commit
      index.html    bake entry point: no UI panels, no scrollbars, opaque bg
      ...           spline.js, spline-reverse.js, particles.js, gradients
    bake/
      bake.sh       one command. the whole pipeline. idempotent.
      capture.mjs   node + CDP frame pump (the only clever file)
      config.json   width, height, fps, loop_seconds, preset, seed
    out/
      wallpaper.mp4 the deliverable
      frames.sha256 hash manifest — the proof of determinism
      bake.log      full stdout of the last run
    state/
      lock          prevents two bakes at once
      last-good/    previous known-good mp4, for instant rollback

8.2 THE SEEK CONTRACT (this is the whole trick — Directive 2 made concrete)
The scene must expose ONE global function and must not animate on its own:

    window.__xmb = { seek(tSeconds) { /* set uniforms, render exactly once */ } }

Rules that make the bake deterministic, all of which follow from X-002..X-005:
  - The page NEVER calls requestAnimationFrame during a bake. Time does not
    advance by itself. The renderer asks for frame N by calling seek(N/fps).
  - Every source of motion is a pure function of t. No performance.now(), no
    Date, no accumulating deltas, no `t += 0.016`. An accumulator is a
    non-deterministic clock wearing a disguise.
  - Math.random() is replaced by a seeded PRNG before any scene code runs.
    The particle/sparkle layer in ps3xmbwave WILL use randomness; unseeded, it
    breaks both reproducibility and the loop.
  - The settings UI (settings-panels.js) is disabled or hidden. It is a
    control surface for a human, and Directive 2 removes the human.
  - Same seek(t) twice must yield identical pixels. That is testable and is
    the first thing to test (M10).

8.3 THE CAPTURE LOOP — flags and method, from Agent C
Linux + chrome-headless-shell is the fully deterministic path, and the target
is Linux, so take it. Launch flags:

    --headless=new --no-sandbox
    --deterministic-mode
    --enable-begin-frame-control
    --run-all-compositor-stages-before-draw
    --disable-threaded-animation
    --disable-threaded-scrolling
    --disable-checker-imaging
    --disable-image-animation-resync
    --enable-surface-synchronization
    --hide-scrollbars
    --force-device-scale-factor=1
    --window-size=<W>,<H>
    --use-angle=gl-egl --enable-gpu     # per U-004; NOT --use-angle=egl (X-005)

Each of those flags exists to kill one source of async scheduling. With
--deterministic-mode, performance.now() is driven by the frameTimeTicks you
pass rather than the wall clock, which is what makes two runs identical.

Per frame, exactly three steps, no waits, no sleeps:
    1. page.evaluate(t => window.__xmb.seek(t), quantize(i/fps))
    2. cdp.send("HeadlessExperimental.beginFrame", {frameTimeTicks, interval,
         screenshot:{format:"png"}})     -> one compositor cycle, one frame
    3. write that buffer straight into ffmpeg's stdin
Note: page.waitForTimeout and waitForFunction DO NOT WORK in deterministic
mode — the page clock is frozen until you advance it. Anything that waits on
the page's frame loop will hang forever. This is by design.

8.4 MEMORY EFFICIENCY — the user asked for it explicitly, so here is the math
A 1920x1080 RGBA frame is ~8.3 MB raw. A 30-second 60fps loop is 1800 frames.
Writing PNGs to disk first costs roughly 4-6 GB and thousands of inodes, and
then reads them all back. On 32GB of DDR4 that is survivable but wasteful, and
on a tmpfs it is genuinely dangerous.
  THEREFORE: never materialize the frame sequence. Pipe each frame from the
  CDP screenshot buffer directly into a single long-lived ffmpeg process on
  stdin (image2pipe). Peak memory becomes ONE frame plus the encoder's window
  — a few tens of MB instead of gigabytes.
  Second lever: fps. Per W-005, 18-24fps is visually sufficient for this slow
  wave and cuts both bake time and permanent idle CPU cost proportionally.
  Third lever: loop length. See 8.5 — a shorter mathematically-exact loop is
  strictly better than a longer approximate one.
  Skeleton (author it, do not run it in the sandbox — there is no ffmpeg here):
    ffmpeg -y -f image2pipe -framerate $FPS -i - \
      -an -c:v libx264 -profile:v main -pix_fmt yuv420p \
      -tune fastdecode -bf 0 -g $FPS -crf 18 -maxrate 8M -bufsize 4M \
      -movflags +faststart out/wallpaper.mp4
  Rationale for the unusual flags, all from W-005's measurements: `-bf 0`
  removes B-frame reordering work from the decoder; `-tune fastdecode` biases
  the encoder toward cheap decoding; `-profile:v main` + yuv420p maximizes the
  chance the fixed-function decoder accepts it; keyframe every second keeps
  the loop restart instant.

8.5 SEAMLESS LOOP — the most likely silent failure
A wallpaper loops forever, so a one-frame discontinuity becomes a visible
twitch every N seconds and it is maddening. Choose loop_seconds so that every
periodic term in the wave completes a whole number of cycles. Concretely: find
the scene's slowest angular frequency, and set
    loop_seconds = lcm of the periods of all animated terms
or, more practically, expose a `speed` scalar and pick the duration that makes
the dominant term's period divide it exactly.
  VERIFICATION GATE (M11), and it is cheap: bake frame 0 and frame N (one past
  the last), hash both, require identical. If they differ, the loop is not
  closed — fix the period, do not "cross-fade it away."

8.6 DETERMINISM PROOF (M10) — what "verified" means here
Bake twice into two directories. `sha256sum` every frame both times. The two
manifests must match exactly. Store one as out/frames.sha256. That manifest is
the receipt Directive 6 demands, and it is what lets a future run change one
parameter and know with certainty what the change did.

================================================================================
SECTION IX — THE SWAP (Agent E). Runs BEFORE the wallpaper, per Directive 10.
Every forward step has its inverse. Do not run a step without reading its
rollback first (Directive 11).
================================================================================

IX.0 PRE-FLIGHT — capture the state you are about to destroy.
  Answer U-002 and U-003 first. Then back up, verbatim:
    cp -a ~/.config/xfce4/xfconf/xfce-perchannel-xml/xfce4-session.xml \
          ~/xfce4-session.xml.bak.$(date +%s)
    xfconf-query -c xfce4-session -p /sessions/Failsafe/Client0_Command > \
          ~/wm-command.bak
  Open a second TTY (Ctrl+Alt+F2) and log in BEFORE touching the WM. If X
  becomes unusable you will need a shell that is not inside X. This is the
  single most important line in this section.
  ROLLBACK ANCHOR: with that backup file, recovery is `cp` it back and restart
  the session. Without it, recovery is guesswork.

IX.1 INSTALL, DO NOT ACTIVATE.
    sudo xbps-install -S compiz-reloaded
  (metapackage, W-001: brings core, bcop, libcompizconfig, python bindings,
  ccsm, all three plugin sets, emerald + themes)
  Installing changes nothing about the running session. Verify with
  `xbps-query -l | grep compiz`. ROLLBACK: `xbps-remove -R compiz-reloaded`.

IX.2 STAND DOWN THE OLD COMPOSITORS. BOTH OF THEM. (X-008)
    a. Kill picom and remove it from autostart:
         pkill picom
         (Settings > Session and Startup > Application Autostart: untick picom)
    b. Disable xfwm4's INTERNAL compositor:
         xfconf-query -c xfwm4 -p /general/use_compositing -n -t bool -s false
       (GUI equivalent: Window Manager Tweaks > Compositor > untick.)
  Two compositors on one screen is the classic cause of "the wallpaper is
  invisible" and of tearing that no amount of tuning fixes.
  ROLLBACK: set use_compositing back to true; re-tick picom autostart.

IX.3 VOLATILE TEST FIRST — never make it permanent before it is proven.
    compiz --replace &
  Watch for: windows lose decorations (expected — X-009), panel behaviour on
  workspace switch (expected to misbehave — X-009), and whether the desktop is
  still usable at all.
  INSTANT ROLLBACK, memorize it: `xfwm4 --replace &`
  That one command returns you to a working desktop from any compiz failure
  short of a hard X lockup. If you cannot run it because you have no terminal,
  that is what the TTY from IX.0 is for.

IX.4 RESTORE DECORATIONS AND SANITY.
  Launch `ccsm` and enable, at minimum:
    General: OpenGL, Composite, Window Decoration
    Effects: Fading Windows, Animations   <- the actual point of the exercise
    Window Management: Move Window, Resize Window, Place Windows,
                       Application Switcher, Window Rules
    Utility: Compiz Library Toolbox, D-Bus, Session Management, Workarounds
  The decorator must actually run — gtk-window-decorator is the reliable
  choice; emerald is available (0.8.18) but has a documented history of
  ignoring its theme and rendering a stuck red titlebar (LinuxQuestions
  thread, 2017). Start with gtk-window-decorator; treat emerald as optional
  polish, not a dependency.
  Desktop icon labels (X-009):
    xfconf-query -c xfce4-desktop -p /desktop-icons/center-text -n -t bool -s false

IX.5 MAKE IT PERSISTENT — only after IX.3/IX.4 are proven in a live session.
    rm -rf ~/.cache/sessions/*          # X-010, or the change silently no-ops
    xfconf-query -c xfce4-session -p /sessions/Failsafe/Client0_Command \
      -n -a -t string -s compiz
  Log out, log in. If the session comes up broken: TTY, restore
  ~/xfce4-session.xml.bak.*, log back in.
  NOTE: the user's stated preference (r/xfce 1le1ln0 describes exactly this
  wish) is a separate non-failsafe session rather than editing Failsafe. That
  is achievable via a custom session entry, but it is strictly harder and
  MUST NOT be attempted before the Failsafe path is proven working. Prove the
  simple path, then upgrade.

IX.6 CAIRO-DOCK.
    sudo xbps-install -S cairo-dock cairo-dock-plugins
  Run it once from a terminal so you can read its errors:
    cairo-dock -l debug
  It must come up in OpenGL mode for animations; if it reports falling back to
  cairo/2D, that is the EGL/GLX question from W-007 and the repo name, and on
  a nouveau box (X-001) it is a mesa question, not an NVIDIA one. Force-choose
  the backend explicitly rather than letting it autodetect.
  Add to XFCE autostart only after it survives a manual launch.
  ROLLBACK: remove from autostart; `pkill cairo-dock`.

IX.7 GATE. Do not proceed to the wallpaper until, in one continuous session:
  compiz is the WM (xprop confirms), windows are decorated and movable,
  animations visibly play, cairo-dock is up in GL mode, and a full logout /
  login cycle reproduces all of it without intervention.
  Only then is M8 DONE, and only then does Section VIII begin.

IX.8 WALLPAPER DELIVERY, once M8 and M12 are both DONE.
  With a compositor owning the screen, the root window is not writable in the
  naive way (W-004), so:
    xwinwrap -g <WxH+X+Y> -ov -ni -b -nf -un -fdt -argb -- \
      mpv -wid WID --loop-file=inf --no-audio --no-osc --no-osd-bar \
          --no-input-default-bindings --panscan=1.0 --really-quiet \
          --hwdec=<from U-006> \
          /home/sd/.local/share/xmb-wave/out/wallpaper.mp4
  Kill switch, which must exist before this is autostarted:
    pkill xwinwrap; pkill -f 'mpv .*xmb-wave'
  Measure idle CPU with and without it running and write both numbers into
  6.A. If the delta is worse than W-005's 6-11% band, the fps is too high or
  the decode is landing in software — fix the bake, do not accept the cost.

================================================================================
SECTION X — HANDOFF (Directive 6). What the next run does first.
================================================================================
State at handoff, 2026-08-14:
  DONE      M0-M6. Context gathered, verified, and written to this file. No
            other file created or modified, per the user's explicit
            instruction. No code exists in this repository yet, by design.
  BLOCKED   Everything downstream of U-001.
  NOT DONE  Nothing has been installed, swapped, baked, or run on the target.
            The sandbox cannot do any of those things (Directive 9a, 3.3).

THE SINGLE NEXT ACTION: run U-001 on the target and report the four lines of
output. That answer decides whether this is an NVIDIA-proprietary project or a
nouveau+Intel-VAAPI project, and those two projects have different bake
settings, different decode paths, and different failure modes. Everything else
is downstream of it. Do not begin Section IX before it is answered — installing
compiz onto an unknown driver stack is exactly the unverified, unattended
change Directive 11 exists to prevent.

Then, in order: U-002, U-003, U-007 (cheap, all read-only), then IX.0.
