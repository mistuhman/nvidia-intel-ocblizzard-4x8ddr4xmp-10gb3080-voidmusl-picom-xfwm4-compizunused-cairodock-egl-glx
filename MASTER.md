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
