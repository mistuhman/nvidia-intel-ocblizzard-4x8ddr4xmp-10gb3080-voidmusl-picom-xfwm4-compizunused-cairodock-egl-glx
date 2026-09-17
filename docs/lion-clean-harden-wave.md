# Lion clear + harden wave (2026-09-17, session 01a0ad71)

Operator directive, verbatim:

> "lets work on clearing the lion ssd and hardening it (candybar flavours + keep themes/icons/downloads
> dir, wipe apps excluding candybar and flavours and airport arctic etc then clean and repair disk
> without wiping drives)"

## Numbered demand list (promptScreening)

| # | Demand | Where it is satisfied |
|---|---|---|
| 1 | clear the Lion SSD | `etc/lion-app-sweep.block` (apps) + `etc/lion-clean-repair.block` (caches/logs/trash) |
| 2 | harden it | `etc/lion-harden.block` — already authored, unchanged, re-run as phase 4 |
| 3 | keep CandyBar + Flavours | KEEP list in `tools/lion-clean-plan.ts`, behaviorally asserted |
| 4 | keep themes / icons / Downloads dirs | inventory + repair blocks measure and re-measure them; nothing in the wave writes to them |
| 5 | wipe apps EXCLUDING candybar, flavours, airport, arctic, "etc" | sweep block: Apple class + KEEP allowlist protected, everything else quarantined |
| 6 | clean and repair disk | `repairPermissions /` + `verifyVolume /`, with the single-user `fsck -fy` escalation named |
| 7 | **without wiping drives** | asserted against emitted bytes: no eraseDisk/eraseVolume/partitionDisk/asr; removal is a MOVE |

## The most important finding: the old wipe block is the WRONG tool

`etc/lion-ssd-wipe.block` (wave `lion-wipe-harden.txt`, 2026-09-15) runs
`diskutil eraseDisk JHFS+ "SSD SCRATCH" /dev/$TARGET`. That is a whole-disk erase. Demand 7 forbids
it, and `docs/lion-workflow.json` independently marks that wave **SUSPENDED** with
`doNot: "Erase start disk clone (CURRENT BOOT per 2026-09-16 LIONONE1)"` plus the MASTER STORAGE HOLD.

"Clearing the SSD" in this directive therefore means **selective removal on the live boot volume**,
not a format. This wave is authored from scratch for that; the old block stays un-armed history and
its CONFIRM line is never to be reused.

## Safety model

- **Reversible by construction.** The sweep MOVES app bundles to
  `/Users/Shared/lion-quarantine/<timestamp>/`. Same volume, so it is a rename, not a copy — fast and
  space-neutral. Inverse: `mv "/Users/Shared/lion-quarantine/<stamp>/<App>.app" /Applications`.
  Space is only reclaimed later, after the operator confirms every kept app still launches.
- **Apple bundles protected as a class**, by `CFBundleIdentifier` prefix `com.apple.`, not by name.
  Receipt: the 10.7 store catalog is dead (`etc/lion-harden.block` disables the failing update
  checks), so a deleted Apple app on Lion cannot be reinstalled without a full OS reinstall.
- **Two-stage gating.** Inventory is read-only. The sweep's first run maps only and prints its own
  `CONFIRM=SWEEP` line; nothing moves until that exact line is pasted back.
- **KEEP globs err toward keeping.** Patterns are prefix globs (`"Arctic"*`) so unverified spellings
  — `Arctic Fox` vs `ArcticFox`, `Audacity 2.4.2`, `Logic Express` — still match. Over-matching keeps
  an extra app; under-matching destroys one the operator named. Not symmetric.

## Two real bugs the gates caught before the Mac saw them

1. **POSIX syntax error.** `case "$N" in AU Lab|AirPort Utility)` — an unquoted pattern containing a
   space is a parse error (`Syntax error: word unexpected`). The outer block passed `bash -n` because
   a heredoc body is opaque until runtime, so the selftest now extracts each inner script and runs
   `sh -n` on it.
2. **Silently inverted keep-list.** The obvious fix, fully quoting the pattern as `"CandyBar*"`, makes
   `*` a *literal asterisk*: `CandyBar` stops matching and the app the operator explicitly named gets
   quarantined. It looks correct on inspection and fails in practice. The selftest now runs the real
   emitted patterns against synthetic fixtures and asserts the resulting classification, which is the
   only check that catches this.

Correct emitted form: `case "$N" in "AU Lab"*|"AirPort"*|"Arctic"*|... ) CLASS="KEEP";; esac`
— quotes around the literal, wildcard outside them.

## Disk repair: what is actually possible while booted

- `diskutil repairPermissions /` **works** on a booted Lion volume (MacRumors 1305738, Lion + RAID).
  Deprecated in later macOS; Lion is exactly where it still applies.
- `diskutil verifyVolume /` **works** live on journaled HFS+ ("Live Verification").
- `diskutil repairVolume /` on the startup volume does **not** work while booted from it: *"You can't
  repair your startup volume while your computer is started from it."* The block therefore verifies
  and, if problems are reported, names the escalation: reboot holding **Command-S**, run
  `/sbin/fsck -fy`, repeat until "appears to be OK". That repairs in place and erases nothing.

## Phase order (one wave at a time, receipt before the next)

1. `etc/lion-clean-inventory.block` — read-only. Produces the candidate list, keep-dir sizes, junk
   totals and a live verify. **Nothing is decided before this receipt is read.**
2. `etc/lion-app-sweep.block` — map run, then the `CONFIRM=SWEEP` run.
3. `etc/lion-clean-repair.block` — caches/logs/trash, repair permissions, verify.
4. `etc/lion-harden.block` — unchanged config-only hardening (firewall + stealth, guest off, remote
   off, screensaver password, update chatter off).

## Not done / unverified limits

- No block has been run on the Mac; every claim here is sandbox-side (syntax, simulation, policy).
- The actual installed app list is **unknown** — that is what phase 1 exists to discover. The "wipe
  apps" set is proposed by classifier, confirmed by the operator, never assumed.
- Theme/icon payloads are measured (`du -hs`) but not hashed; byte-level proof would need a hash
  manifest pass if the operator wants it.
- Emptying `~/.Trash` is irreversible by nature. It is in the clean phase because "clearing" implies
  it; say so if it should be skipped.
- Quarantine is not purged by any block here. Reclaiming that space is a separate, later, gated step.

## ABSOLUTION - the burn channel (rollout R1)

Operator directive 2026-09-17: "burn page has to be shortened (no TinyURL), use the typescript repo
tooling to make it reproducible and persistent on the same link, with clear indication of which
branch and pr its on, and which rollout it is. one name for the command in this chat, one name for
it in the page and the log."

### One name, everywhere

The single string `absolution` names every surface. All of them derive from one `NAME` constant in
`tools/absolution.ts`, and the selftest asserts each derivation, so they cannot drift apart.

| Surface | Value |
|---|---|
| chat command | **absolution** |
| short link | **https://da.gd/absolution** |
| download | `absolution.command` |
| page | `absolution.html` |
| bundle | `absolution.zip` |
| log tag | `ABSOLUTION1` ... `ABSOLUTION1_DONE` |

### Rollout identity, visible in all three places

`ABSOLUTION1 rollout=R1 branch=arena/01a0ad71-nvidia-intel-ocblizzard-4x8ddr pr=91 session=01a0ad71 date=2026-09-17`

That exact stamp is (1) the first line the command writes, (2) rendered in the page header with the
PR hyperlinked, and (3) parsed back out of the burn. `parse` prints
`GATE: rollout MISMATCH` and refuses the plan if a stale `absolution.command` is used.

### Persistence: one frozen link, every future rollout

The short link is **write-once at da.gd and unreachable from the sandbox**, so it can never be
repointed later. Pinning it straight at a session branch therefore welds it to R1 forever. That is
not hypothetical: `docs/lion-workflow.json` records `da.gd/lmz` freezing to a dead session branch,
"unfixable because push is restricted to this branch, and da.gd is write-once".

So the page is a **launcher, not a snapshot**. At load it fetches `ABSOLUTION.json` - `main` first,
then the authoring branch, cache-busted - and retargets its own download links, rollout stamp, PR
link, log tag and inbox to whatever that pointer says. Baked-in values are only the offline fallback.

Consequence: a future wave ships by editing `ROLLOUT`/`BRANCH`/`PR` in `tools/absolution.ts` and
re-running `emit`. The link, the name and the operator's muscle memory never change.

Proven by the selftest, which runs the real page script in a VM with a stubbed DOM, feeds it a
**future R7 pointer on a different branch and PR**, and asserts the download URL, rollout text, PR
href and inbox all retarget. It also asserts `main` is tried before the session branch.

### Reproducibility is proven, not claimed

`emit` twice and diff: all three artifacts hash-identical. This needed a real fix - the system `zip`
binary stamps each entry with the current mtime, so the bundle differed on every run. The container
is now built in TypeScript with a fixed DOS timestamp and stored (uncompressed) entries. The
selftest asserts byte-equality across two builds, `unzip -t` integrity, and that the extracted
`.command` keeps mode 0755.

### Operator loop (two taps)

1. open **https://da.gd/absolution** in Arctic Fox, download **absolution.command**, double-click it
2. back on the page: attach `~/Desktop/absolution.txt`, press **Burn**, say **burned** in chat

The agent then reads the inbox with `fetch_page` and runs
`node tools/absolution.ts parse <file>` to get the decided sweep plan. A burn missing the
`ABSOLUTION1_DONE` trailer is reported INCOMPLETE and cannot authorize the wipe.
