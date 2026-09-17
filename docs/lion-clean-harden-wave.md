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

## Burn channel (added 2026-09-17, same session)

Operator directive: "use the typescript burn and write link tool so we can get any missing context
before running a final wipe". `tools/lion-burn-link.ts` is that tool.

The sweep list must be computed from the machine, not from memory. The agent cannot log into the
Mac, so context arrives through the proven burn loop.

| Piece | What it is |
|---|---|
| `lion-clean-probe.command` | READ-ONLY Mac-side probe. Writes `~/Desktop/lion-clean.txt`, opens it. Selftest asserts no sudo/rm/mv/erase/asr/bless/nvram/curl on any executable line, and `sh -n` parses it. |
| `lion-clean.html` | ES5-only burn page (Arctic Fox 47 = FF52 class). FileReader + XMLHttpRequest; refuses to burn a file lacking the `LIONCLEAN1` tag. |
| `lion-clean.zip` | both of the above, one download |
| `parse` subcommand | turns the burned text into a decided sweep plan |

Channel facts, measured this session, not assumed:
- `curl https://webhook.site` and `curl https://da.gd` both return **HTTP 000** (TLS blocked from the
  sandbox). Confirms MASTER `lionMac.logChannel`. The agent reads the inbox **only** with `fetch_page`.
- The inbox is **live**: `fetch_page` on the token URL returned the 2026-09-16 `LIONONE1` burn
  (uuid `292c1de5`, and POST uuid `1c474145`), so the read path is proven working before use.
- webhook.site stores a `text/plain` POST body in `content` and a GET `?log=` in `query.log`; both are
  readable. Multipart file attachments are NOT (content empty, per-file routes need owner auth).
  That is why the page sends the report as TEXT, twice (POST body + capped querystring fallback).

Keep-list is IMPORTED from `tools/lion-clean-plan.ts` (`KEEP`, `APPLE_PREFIX`), so the probe's
classifier and the sweep block can never drift apart. Selftest asserts the probe embeds the exact
shared pattern string.

Parser gate: a burn missing the `LIONCLEAN1_DONE` trailer is reported INCOMPLETE and the plan prints
`GATE: burn INCOMPLETE - do not sweep.` A truncated burn can therefore never authorize a wipe.

### Why no new da.gd short link was minted
da.gd is unreachable from the sandbox (HTTP 000) and its slugs are write-once, so the agent cannot
mint or verify one. The raw GitHub + htmlpreview URLs printed by `links` work as-is. If a short slug
is wanted for typing on the Mac, the operator mints it from a browser aimed at the page URL; the
existing `da.gd/sQ7bEo` page still burns to the same inbox but is frozen to an older branch.
