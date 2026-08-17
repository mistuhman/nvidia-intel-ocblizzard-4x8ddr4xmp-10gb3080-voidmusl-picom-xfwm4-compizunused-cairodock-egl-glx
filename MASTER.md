# MASTER

The single instructional space for this project. Read `README.md` first, then
read this file top to bottom before your first command.

Four parts, in reading order:

- **I. Guidelines** — how you work. Fundamentals only.
- **II. Constraints** — what is settled and must not be re-litigated.
- **III. Ground truth** — the verified facts about the two machines.
- **IV. State** — where the work stands right now.

Parts I and II are stable. Part III grows only when a command produces a new
fact. Part IV is rewritten every session to describe the present — it is a
status board, not a history. History belongs in git.

---

## I. Guidelines

Ten fundamentals. They apply to every agent on every task.

### 1. Optimize for the operator's time

Your output is judged by how much work it removes from the operator, not by
how much work it shows. A shorter correct block beats a longer one. One paste
block per turn, small lines, ending in a single verdict word the operator can
report back. Assume a phone screen.

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
  constraint in Part II. Requires an explicit instruction, quoted when you
  record it.

Never infer a grant from silence, and never carry a grant forward past the
task it was given for.

### 8. Communicate in structure

Report: what you did, what you verified, what you could not verify, and the
one next action. Direct declarative sentences. No filler, no hedging padding,
no invented detail. Litotes is the one permitted rhetorical exception where it
carries real precision ("not yet proven on target" says something "unproven"
does not).

### 9. Keep this file optimal

This file is the inheritance of every future session, so its quality compounds
in both directions. Write to it as an editor, not an accumulator.

- Add a fact only when a command produced it, and add the receipt with it.
- When a new fact overturns an old one, replace the old one and say what
  overturned it. Do not stack a correction on top of a wrong line and leave
  both standing.
- When a workaround appears, fix the cause and remove the workaround. A patch
  on a patch is a signal that Part II or Part IV needs rewriting, not
  extending.
- Delete what has stopped being load-bearing: closed objectives, superseded
  theory, dead chronology. Length is a cost paid by every future session.
- Never restate the same rule in two places. One home per idea.

The test for any line: would a fresh session make a worse decision without it?
If not, it goes.

### 10. Assume you are a fresh model

You have no recollection of prior runs, and neither will your successor. Leave
this file in the state you would want to find it in — accurate, current, and
short enough to read completely before acting.

---

## II. Constraints

Settled by evidence. Do not re-litigate; override only on explicit operator
direction (Guideline 7).

**Delivery**

- Phone pastes corrupt commands. No bare `>` or `|` in operator blocks; use
  heredocs, and gate every file creation with `ls -l <file>`.
- Deliver files by heredoc or `git checkout`, never `curl`.
- The console font confuses `1`/`8` and `0`/`O`. Long flags only.
- Never gate an action on an unanchored `pgrep -f`.
- Run `df -h /` before diagnosing any unexplained `rc=1`. Root has filled
  before and produced a greeter loop that looked like a display fault.
- Photos from the operator are transcribed verbatim into the record before
  they are interpreted.

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
  CCSM is open.
- After any `compiz-revert --xfwm4`, `xfce-wm-recover`, or session-XML
  restore, persistence is OFF until `compiz-persist-arm` runs and verifies
  SAFE.
- `compiz-profile-repair --floor` is additive only, never subtractive.
- CCSM gtk.css and pixbuf warnings are benign. Do not escalate them.

**Wallpaper stack**

- One sticky input-transparent (`-ni`) xwinwrap plus one mpv, `gpu-next` with
  `nvdec-copy`. Never `--hwdec=auto`. `--wid=` requires `mpv-xwinwrap-shim`.
- Videos live on `/mnt/games`. Check `df` first, always.
- The shell/xprop crossfade path is retired: controller exits 2, autostart
  off in-repo and on target. Never revive it.
- Same-role viewport hops cannot dissolve — they pulse blur only. That is
  physics, not a defect.

**Process**

- One objective per pull request. PR line ceiling 405.
- The session is fixed to the `arena/…` branch it opens on. Never switch or
  push another.

---

## III. Ground truth

Facts produced by commands. Each line is verifiable; re-verify rather than
trust when it matters.

**Target** — Void Linux, musl libc, user `sd`. Intel CPU + NVIDIA RTX 3080
10GB, 32GB DDR4 (4x8) with XMP. X11. Workspace `/home/sd/.local/share/xmb-wave/`.

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
smoothly at 20-24 fps, well below what a typical video needs.

**Upstream XMB reference** — `linkev/PlayStation-3-XMB`, WebGL2, actively
maintained, reverse-engineered against the PS3's spline rather than guessed.
Its settings panel must be hidden for a bake. Smaller fallbacks: `tsbehlman/xmb`
and `fchavonet/creative_coding-xmb_wave_background`.

**Boot-death recovery** — if the box goes black before the display manager
with no TTY, the fault is boot-level, not WM-level. The proven ladder:
blacklist the NVIDIA modules on the kernel command line
(`module_blacklist=nvidia,nvidia_drm,nvidia_modeset,nvidia_uvm`), attach a
shell with `init=/bin/sh`, read the real command line from `dmesg`, strip
every layer of KMS forcing (grub defaults, modprobe drop-ins, dracut
`add_drivers` and hostonly inclusion, `options nvidia-drm modeset=1`), then
take the console beachhead with `touch /etc/sv/lightdm/down`. Gate the
initramfs check on `lsinitrd | grep nvidia | grep -c ko` equalling zero; a
bare substring count includes inert firmware and misleads. Back up every
target write with a dated `.bak` in `/root/`.

---

## IV. State

Updated 2026-08-17. Rewrite this section to describe the present; do not
append to it.

**Done and settled**

- Compiz is the login WM; guard, CCSM, and reboot persistence all hold.
- The XMB bare wallpaper layer is merged and accepted: one xwinwrap, one mpv,
  10-11% decode.
- The one-mpv IPC crossfade is accepted on target; persistent burst blur is
  proven on target.
- `xfce4-screensaver` "XMB Sleep Wave" theme is installed, operator-selected.

**Active — one-mpv IPC switcher, consistency trial**

One xwinwrap, one mpv, one `gpu-next` context; lavfi track blend over JSON
IPC; latest-wins with exact-PID takeover. The shape is settled at
`FADE_MS=350`, `BLUR_MS=500`, `BLUR_PEAK=6.0`, rise 75 / fall 210.

The last three attempts each fixed a real defect and each failed the operator's
consistency test: adaptive compression produced a chaotic rhythm, and the
rate-limited chase punch varied in height with tick phase. The current
in-repo build removes both — deterministic time-anchored punch, no
compression (every transition plays the full approved shape), and tight
latest-wins where a new viewport event replaces anything pending. Proven in
the sandbox harness; unproven on target.

**Next action** — controller-only reinstall from a single SHA via
`xmb-runtime-install`, with the config heredoc re-issued in the same block.
Gates: `--check` prints `fade_ms=350 blur_ms=500 peak=6.0`; every burst logs
`state=OK` at `rise_ms=75 fall_ms=210`; pending never exceeds 1; crossfade is
visible on role-changing hops. Operator verdict word closes it; any failure
rolls back controller and config together. Autostart stays hidden until
acceptance.

**Parked**

- Menu opacity via the `obs` plugin — tools exist and are fixed, but the last
  apply was rejected. Operator go-ahead only.
- M18 icons and sound, once the switcher direction is settled.
- Tier-2 USB work, when convenient.
