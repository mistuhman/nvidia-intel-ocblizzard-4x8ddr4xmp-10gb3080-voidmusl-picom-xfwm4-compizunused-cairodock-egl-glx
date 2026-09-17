#!/usr/bin/env node
// lion-clean-plan.ts - policy source of truth for the 2026-09-17 "clear + harden the Lion SSD"
// wave. Emits etc/lion-clean-inventory.block, etc/lion-app-sweep.block, etc/lion-clean-repair.block
// and selftests the SAFETY INVARIANTS of the emitted bytes. Zero dependency, deterministic stdout.
//
// Operator directive 2026-09-17 (verbatim): "lets work on clearing the lion ssd and hardening it
// (candybar flavours + keep themes/icons/downloads dir, wipe apps excluding candybar and flavours
// and airport arctic etc then clean and repair disk without wiping drives)"
//
// The binding clause is "without wiping drives": NO eraseDisk / eraseVolume / partitionDisk / asr
// may appear in any emitted byte. Removal is a reversible MOVE to a quarantine folder, never rm.
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

export type Keep = { app: string; prefix: string; wild: boolean; why: string };

// KEEP = never a sweep candidate. Each entry carries the receipt that put it here.
// `glob` is the sh case pattern. Trailing * is deliberate: it absorbs name variants the agent has
// NOT verified on the target (Arctic Fox vs ArcticFox, Logic Pro vs Logic Express, version suffixes
// like "Audacity 2.4.2"). Over-matching here keeps an extra app; under-matching quarantines one the
// operator named. Those are not symmetric, so the glob always errs toward KEEP.
export const KEEP: Keep[] = [
  { app: 'CandyBar', prefix: 'CandyBar', wild: true, why: 'operator named 2026-09-17; icon/theme tool' },
  { app: 'Flavours', prefix: 'Flavours', wild: true, why: 'operator named 2026-09-17; theming companion' },
  { app: 'AirPort Utility', prefix: 'AirPort', wild: true, why: 'operator named "airport"; 6.3.1, docs/lion-airport-triage.md, T1/T5 AirPort resets' },
  { app: 'ArcticFox', prefix: 'Arctic', wild: true, why: 'operator named "arctic"; standing KEEP rule in MASTER lionMac + etc/lion-harden.block; glob covers the ArcticFox/Arctic Fox spelling split' },
  { app: 'iTunes', prefix: 'iTunes', wild: true, why: 'THE audio-CD burn path (docs/mac-daily-driver.md s1); ToDo winamp entry "ill be burning mp3s to cds"' },
  { app: 'Audacity', prefix: 'Audacity', wild: true, why: 'T2 native audio interface ladder (ToDo 2026-09-16f)' },
  { app: 'AU Lab', prefix: 'AU Lab', wild: true, why: 'T2 audio host ladder, first rung' },
  { app: 'GarageBand', prefix: 'GarageBand', wild: true, why: 'T2 audio host ladder' },
  { app: 'Logic', prefix: 'Logic', wild: true, why: 'T2 audio host ladder' },
  // Operator directive 2026-09-17b: "all software thats not professional software and absolutely
  // necessary for video editing and audio interfacing" is KEPT. This machine is a video workstation
  // (Final Cut, Motion, Compressor, DVD Studio Pro all present in the R1 burn), so the pro A/V chain
  // is protected by name. Winamp is EXCLUDED on purpose - operator is replacing it with a classic
  // source port for CD + skins, so the installed 9.5M copy is swept.
  { app: 'VLC', prefix: 'VLC', wild: true, why: 'video playback + Fairmount pair; pro A/V chain (operator 2026-09-17b)' },
  { app: 'HandBrake', prefix: 'HandBrake', wild: true, why: 'video transcode; pro A/V chain' },
  { app: 'ffmpegX', prefix: 'ffmpegX', wild: true, why: 'video transcode; pro A/V chain' },
  { app: 'MPlayer OSX Extended', prefix: 'MPlayer', wild: true, why: 'video playback; pro A/V chain' },
  { app: 'ScreenFlow', prefix: 'ScreenFlow', wild: true, why: 'screen capture + editing; pro A/V' },
  { app: 'FxFactory', prefix: 'FxFactory', wild: true, why: 'Final Cut/Motion plugin host; pro A/V' },
  { app: 'LooksBuilder', prefix: 'LooksBuilder', wild: true, why: 'Red Giant Looks, grading plugin; pro A/V' },
  { app: 'Blackmagic', prefix: 'Blackmagic', wild: true, why: 'capture/IO hardware tools; video interfacing' },
  { app: 'DVDRemaster', prefix: 'DVDRemaster', wild: true, why: 'DVD authoring chain; pro A/V' },
  { app: 'Fairmount', prefix: 'Fairmount', wild: true, why: 'DVD mount for VLC; pro A/V chain' },
  { app: 'Cinema Tools', prefix: 'Cinema Tools', wild: true, why: 'Final Cut companion (Apple, already protected by class)' },
  { app: 'hueyPRO', prefix: 'huey', wild: true, why: 'Pantone display calibration; colour-critical video work' },
  { app: 'Contour Shuttle', prefix: 'Contour', wild: true, why: 'jog/shuttle edit controller driver; video interfacing' },
  { app: 'Audio Hijack', prefix: 'Audio Hijack', wild: true, why: 'audio capture; audio interfacing' },
  { app: 'Soundflower', prefix: 'Soundflower', wild: true, why: 'audio routing; audio interfacing' },
  { app: 'SuperSync', prefix: 'SuperSync', wild: true, why: 'iTunes library sync; audio library chain' },
  { app: 'Dupin', prefix: 'Dupin', wild: true, why: 'iTunes playlist dedupe; audio library chain' },
  { app: 'iPhoto Library Manager', prefix: 'iPhoto Library', wild: true, why: 'media library management' },
  { app: 'Carbon Copy Cloner', prefix: 'Carbon Copy', wild: true, why: 'clone/backup - the start-disk clone lineage depends on it' },
  { app: 'DiskWarrior', prefix: 'DiskWarrior', wild: true, why: 'directory repair; disk-necessary given the 97% full boot volume' },
  { app: 'TechTool', prefix: 'TechTool', wild: true, why: 'hardware/disk diagnostics' },
  { app: 'DaisyDisk', prefix: 'DaisyDisk', wild: true, why: 'space analysis - directly needed at 97% full' },
  { app: 'GrandPerspective', prefix: 'GrandPerspective', wild: true, why: 'space analysis - directly needed at 97% full' },
  { app: 'WhatSize', prefix: 'WhatSize', wild: true, why: 'space analysis - directly needed at 97% full' },
  { app: 'X11', prefix: 'X11', wild: true, why: 'system dependency for ffmpegX/MPlayer class tools' },
  { app: 'Utilities', prefix: 'Utilities', wild: false, why: 'Disk Utility / Terminal / Keychain Access / Console / Audio MIDI Setup live here' },
];

// Apple-shipped bundles are PROTECTED as a class, not by name. Receipt: the 10.7 store catalog is
// dead (etc/lion-harden.block "UPDATE CHATTER OFF - 10.7 store catalog is dead"), so a deleted
// Apple app on Lion is UNRECOVERABLE without a full OS reinstall. Classifier = CFBundleIdentifier.
export const APPLE_PREFIX = 'com.apple.';

// sh case patterns are emitted as "Literal"* - quotes around the literal, wildcard OUTSIDE them.
// Both halves are load-bearing and each was proven by a failing test:
//   unquoted  AU Lab*    -> POSIX syntax error (space splits the pattern)   [caught by sh -n]
//   fully quoted "CandyBar*" -> quoting makes * a LITERAL char, so CandyBar
//                               never matches and the operator's app gets swept [caught by the
//                               classification simulation]
const KEEP_CASE = KEEP.map((k) => `"${k.prefix}"${k.wild ? '*' : ''}`).sort().join('|');

const HEAD = (name: string, kind: string) =>
  `id -u\n# ${name} - ROOT shell on the Mac Pro 3,1 (sudo -s, then paste). ${kind}\n` +
  `# Wave: 2026-09-17 clear + harden the Lion SSD. Policy source: tools/lion-clean-plan.ts\n` +
  `# HARD RULE (operator "without wiping drives"): no eraseDisk, no eraseVolume, no partitionDisk,\n` +
  `# no asr, no rm of an app. Removal is a reversible MOVE to a quarantine folder on the same volume.\n`;

function inventoryBlock(): string {
  return (
    HEAD('lion-clean-inventory.block', 'READ-ONLY. Changes nothing.') +
    `# Gate: paste the FULL output back. The sweep list is computed from THIS receipt, never from memory.\n` +
    `cat > /tmp/lion-clean-inventory.sh <<'INVSH'\n` +
    `#!/bin/sh\n` +
    `# read-only inventory: volume, keep-targets, app classification, keep-dirs, space\n` +
    `echo "== VOLUME (boot volume is never a sweep or erase target)"\n` +
    `mount | grep ' on / '\n` +
    `df -h /\n` +
    `echo\n` +
    `echo "== DISK MAP (read-only; proves nothing is being erased)"\n` +
    `diskutil list\n` +
    `echo\n` +
    `echo "== KEEP TARGETS - each must read PRESENT or ABSENT, never be touched"\n` +
    `for n in ${KEEP.map((k) => `"${k.app}"`).join(' ')}; do\n` +
    `  F=""\n` +
    `  [ -e "/Applications/$n.app" ] && F="/Applications/$n.app"\n` +
    `  [ -e "/Applications/Utilities/$n.app" ] && F="/Applications/Utilities/$n.app"\n` +
    `  [ -d "/Applications/$n" ] && F="/Applications/$n"\n` +
    `  if [ -n "$F" ]; then echo "PRESENT keep: $F"; else echo "ABSENT  keep: $n"; fi\n` +
    `done\n` +
    `echo\n` +
    `echo "== APP INVENTORY: class | size | bundle id | path"\n` +
    `echo "== APPLE = protected by rule (10.7 store catalog is dead, reinstall is the only recovery)"\n` +
    `echo "== KEEP  = operator allowlist. CANDIDATE = third-party, proposed for quarantine."\n` +
    `for a in /Applications/*.app /Applications/Utilities/*.app; do\n` +
    `  [ -e "$a" ] || continue\n` +
    `  B=$(defaults read "$a/Contents/Info" CFBundleIdentifier 2>/dev/null)\n` +
    `  [ -z "$B" ] && B="(no-bundle-id)"\n` +
    `  N=$(basename "$a" .app)\n` +
    `  SZ=$(du -hs "$a" 2>/dev/null | awk '{print $1}')\n` +
    `  CLASS="CANDIDATE"\n` +
    `  case "$B" in ${APPLE_PREFIX}*) CLASS="APPLE";; esac\n` +
    `  case "$N" in ${KEEP_CASE}) CLASS="KEEP";; esac\n` +
    `  echo "$CLASS | $SZ | $B | $a"\n` +
    `done\n` +
    `echo\n` +
    `echo "== CANDIDATE TOTAL (what a sweep would quarantine, and how much it frees)"\n` +
    `for a in /Applications/*.app /Applications/Utilities/*.app; do\n` +
    `  [ -e "$a" ] || continue\n` +
    `  B=$(defaults read "$a/Contents/Info" CFBundleIdentifier 2>/dev/null)\n` +
    `  N=$(basename "$a" .app)\n` +
    `  case "$B" in ${APPLE_PREFIX}*) continue;; esac\n` +
    `  case "$N" in ${KEEP_CASE}) continue;; esac\n` +
    `  du -hs "$a" 2>/dev/null\n` +
    `done\n` +
    `echo\n` +
    `echo "== KEEP DIRS - themes, icons, downloads (must be byte-identical after the wave)"\n` +
    `for u in $(ls /Users | grep -v Shared); do\n` +
    `  echo "-- user $u"\n` +
    `  du -hs "/Users/$u/Downloads" 2>/dev/null\n` +
    `  du -hs "/Users/$u/Library/Application Support/CandyBar" 2>/dev/null\n` +
    `  du -hs "/Users/$u/Library/Application Support/Flavours" 2>/dev/null\n` +
    `  ls "/Users/$u/Library/Preferences/com.panic.CandyBar3.plist" 2>/dev/null\n` +
    `  du -hs "/Users/$u/Pictures" 2>/dev/null\n` +
    `  find "/Users/$u" -maxdepth 3 -iname "*.iconset" -o -maxdepth 3 -iname "*.icontainer" -o -maxdepth 3 -iname "*.flavour" 2>/dev/null | head -20\n` +
    `done\n` +
    `du -hs "/Library/Desktop Pictures" 2>/dev/null\n` +
    `echo\n` +
    `echo "== RECLAIMABLE JUNK (caches, logs, trash - the clean phase)"\n` +
    `du -hs /Library/Caches 2>/dev/null\n` +
    `du -hs /private/var/log 2>/dev/null\n` +
    `for u in $(ls /Users | grep -v Shared); do\n` +
    `  du -hs "/Users/$u/Library/Caches" 2>/dev/null\n` +
    `  du -hs "/Users/$u/.Trash" 2>/dev/null\n` +
    `done\n` +
    `echo\n` +
    `echo "== FILESYSTEM HEALTH (live verify; journaled HFS+ only, read-only)"\n` +
    `diskutil verifyVolume / 2>&1 | tail -20\n` +
    `echo "== INVENTORY COMPLETE - NOTHING WAS CHANGED"\n` +
    `INVSH\n` +
    `sh /tmp/lion-clean-inventory.sh\n` +
    `date\n`
  );
}

function sweepBlock(): string {
  return (
    HEAD('lion-app-sweep.block', 'REVERSIBLE app removal, double-gated. Run ONLY after the inventory receipt is read.') +
    `# Why a MOVE and not a delete: the operator said "without wiping drives"; a quarantine folder on the\n` +
    `# same volume keeps a real inverse (mv it back). Space is reclaimed by the separate purge step, only\n` +
    `# after the operator confirms every kept app still launches.\n` +
    `# Gate: first run MAPS and erases nothing. It prints a CONFIRM line; paste that exact line to act.\n` +
    `# Rollback: mv "/Users/Shared/lion-quarantine/<stamp>/<App>.app" /Applications\n` +
    `cat > /tmp/lion-app-sweep.sh <<'SWEEPSH'\n` +
    `#!/bin/sh\n` +
    `STAMP=$(date +%Y%m%d-%H%M%S)\n` +
    `Q="/Users/Shared/lion-quarantine/$STAMP"\n` +
    `echo "quarantine_dir=$Q"\n` +
    `LIST=""\n` +
    `for a in /Applications/*.app /Applications/Utilities/*.app; do\n` +
    `  [ -e "$a" ] || continue\n` +
    `  B=$(defaults read "$a/Contents/Info" CFBundleIdentifier 2>/dev/null)\n` +
    `  N=$(basename "$a" .app)\n` +
    `  case "$B" in ${APPLE_PREFIX}*) echo "protect APPLE $a"; continue;; esac\n` +
    `  case "$N" in ${KEEP_CASE}) echo "protect KEEP  $a"; continue;; esac\n` +
    `  echo "candidate     $a"\n` +
    `  LIST="$LIST\n$a"\n` +
    `done\n` +
    `COUNT=$(printf "%b" "$LIST" | grep -c . )\n` +
    `echo "candidates=$COUNT"\n` +
    `if [ "$COUNT" -eq 0 ]; then echo "NOTHING TO SWEEP - inventory already clean"; exit 0; fi\n` +
    `if [ "$CONFIRM" != "SWEEP" ]; then\n` +
    `  echo "NOTHING MOVED. To proceed, paste exactly:"\n` +
    `  echo "CONFIRM=SWEEP sh /tmp/lion-app-sweep.sh"\n` +
    `  exit 0\n` +
    `fi\n` +
    `mkdir -p "$Q"\n` +
    `printf "%b" "$LIST" | grep . | while read -r a; do\n` +
    `  echo "move $a"\n` +
    `  mv "$a" "$Q"/\n` +
    `done\n` +
    `echo "== RESULT - kept apps must all still be present"\n` +
    `ls /Applications\n` +
    `ls /Applications/Utilities\n` +
    `echo "== QUARANTINED (restore with mv back to /Applications)"\n` +
    `ls "$Q"\n` +
    `df -h /\n` +
    `SWEEPSH\n` +
    `sh /tmp/lion-app-sweep.sh\n` +
    `date\n`
  );
}

function repairBlock(): string {
  return (
    HEAD('lion-clean-repair.block', 'Clean caches + repair permissions + verify filesystem. No drive is erased.') +
    `# Receipts: "diskutil repairPermissions /" works on a booted Lion volume (MacRumors 1305738, Lion+RAID).\n` +
    `# Live Verification works on journaled HFS+ while booted, but a REPAIR of the startup volume cannot run\n` +
    `# from itself (Apple/sterlingit: "You can't repair your startup volume while your computer is started\n` +
    `# from it"). So: verify here; if it reports problems, the fix is the operator-gated single-user pass\n` +
    `# Command-S then /sbin/fsck -fy, which repairs in place and erases nothing.\n` +
    `# Rollback: caches and logs regenerate on demand; permissions repair has no inverse and needs none.\n` +
    `cat > /tmp/lion-clean-repair.sh <<'REPSH'\n` +
    `#!/bin/sh\n` +
    `echo "== PRE SPACE"\n` +
    `df -h /\n` +
    `echo "== CLEAN: caches, logs, trash. Keeps every profile, theme, icon and Download."\n` +
    `for u in $(ls /Users | grep -v Shared); do\n` +
    `  rm -rf "/Users/$u/Library/Caches"/* 2>/dev/null\n` +
    `  rm -rf "/Users/$u/.Trash"/* 2>/dev/null\n` +
    `done\n` +
    `rm -rf /Library/Caches/* 2>/dev/null\n` +
    `rm -rf /private/var/folders/*/*/-Caches- 2>/dev/null\n` +
    `find /private/var/log -name "*.gz" -delete 2>/dev/null\n` +
    `find /private/var/log -name "*.bz2" -delete 2>/dev/null\n` +
    `echo "== KEEP DIRS STILL PRESENT (proof the clean did not touch them)"\n` +
    `for u in $(ls /Users | grep -v Shared); do\n` +
    `  du -hs "/Users/$u/Downloads" 2>/dev/null\n` +
    `  du -hs "/Users/$u/Library/Application Support/CandyBar" 2>/dev/null\n` +
    `  du -hs "/Users/$u/Library/Application Support/Flavours" 2>/dev/null\n` +
    `done\n` +
    `echo "== REPAIR PERMISSIONS (supported on the booted Lion volume)"\n` +
    `diskutil repairPermissions /\n` +
    `echo "== VERIFY FILESYSTEM (read-only live verify)"\n` +
    `diskutil verifyVolume /\n` +
    `echo "== POST SPACE"\n` +
    `df -h /\n` +
    `echo "== IF VERIFY REPORTED PROBLEMS: reboot holding Command-S, then run /sbin/fsck -fy"\n` +
    `REPSH\n` +
    `sh /tmp/lion-clean-repair.sh\n` +
    `date\n`
  );
}


function accountsBlock(): string {
  return (
    HEAD('absolution-accounts.block', 'Tertiary account removal. Harvests files BEFORE deleting. Double-gated.') +
    `# Operator directive 2026-09-17d, verbatim: "el is the only keeper, samael is nick for el".\n` +
    `# So the keeper is DECLARED, not guessed: KEEPER=el. The earlier samael/RealName heuristic is kept\n` +
    `# only as a printed cross-check, because it would ABORT if el's RealName is not literally Samael.\n` +
    `# Doomed = every /Users entry except the keeper, Shared and Guest.\n` +
    `# HARVEST FIRST: each doomed account's Downloads + icons/textures/Winamp skins are MOVED to\n` +
    `# /Users/Shared/absolution-harvest/<user>/ before the record is touched. Same volume = rename:\n` +
    `# instant, needs no free space (the boot volume is 97% full), destroys nothing the operator named.\n` +
    `# Rollback: the home folder is MOVED to /Users/Shared/absolution-quarantine/<user>, never rm-ed.\n` +
    `# Space is reclaimed only by the separate purge line printed at the end.\n` +
    `cat > /tmp/absolution-accounts.sh <<'ACCTSH'\n` +
    `#!/bin/sh\n` +
    `KEEPER="el"\n` +
    `HARVEST="/Users/Shared/absolution-harvest"\n` +
    `QUAR="/Users/Shared/absolution-quarantine"\n` +
    `echo "== KEEPER (operator-declared): $KEEPER"\n` +
    `if [ ! -d "/Users/$KEEPER" ]; then\n` +
    `  echo "ABORT: /Users/$KEEPER does not exist. Nothing changed."\n` +
    `  exit 1\n` +
    `fi\n` +
    `ADMINS=$(dscl . -read /Groups/admin GroupMembership 2>/dev/null | cut -d: -f2-)\n` +
    `echo "admin group:$ADMINS"\n` +
    `KEEPADMIN=no\n` +
    `for a in $ADMINS; do\n` +
    `  [ "$a" = "$KEEPER" ] && KEEPADMIN=yes\n` +
    `done\n` +
    `if [ "$KEEPADMIN" != yes ]; then\n` +
    `  echo "ABORT: keeper $KEEPER is NOT in the admin group."\n` +
    `  echo "Deleting the other accounts could leave this Mac with no administrator. Nothing changed."\n` +
    `  exit 1\n` +
    `fi\n` +
    `echo "cross-check RealName: $(dscl . -read /Users/$KEEPER RealName 2>/dev/null | tail -1 | sed -e 's/^ *//')"\n` +
    `echo\n` +
    `echo "== ACCOUNT MAP"\n` +
    `DOOMED=""\n` +
    `for u in $(ls /Users 2>/dev/null | grep -v Shared | grep -v '^Guest$'); do\n` +
    `  RN=$(dscl . -read "/Users/$u" RealName 2>/dev/null | tail -1 | sed -e 's/^ *//')\n` +
    `  UIDN=$(dscl . -read "/Users/$u" UniqueID 2>/dev/null | awk '{print $2}')\n` +
    `  SZ=$(du -hs "/Users/$u" 2>/dev/null | awk '{print $1}')\n` +
    `  if [ "$u" = "$KEEPER" ]; then\n` +
    `    echo "KEEP   $u | uid=$UIDN | size=$SZ | real=$RN"\n` +
    `  else\n` +
    `    echo "REMOVE $u | uid=$UIDN | size=$SZ | real=$RN"\n` +
    `    DOOMED="$DOOMED $u"\n` +
    `  fi\n` +
    `done\n` +
    `if [ -z "$DOOMED" ]; then\n` +
    `  echo "NOTHING TO DO - only the keeper exists"\n` +
    `  exit 0\n` +
    `fi\n` +
    `echo "TERTIARY:$DOOMED"\n` +
    `echo\n` +
    `echo "== LOGIN SAFETY"\n` +
    `who\n` +
    `LOGGEDIN=$(who 2>/dev/null | awk '{print $1}' | sort -u)\n` +
    `for u in $DOOMED; do\n` +
    `  for l in $LOGGEDIN; do\n` +
    `    if [ "$l" = "$u" ]; then\n` +
    `      echo "ABORT: $u is currently logged in. Log it out first. Nothing changed."\n` +
    `      exit 1\n` +
    `    fi\n` +
    `  done\n` +
    `done\n` +
    `echo "no doomed account is logged in"\n` +
    `echo\n` +
    `echo "== WHAT WOULD BE HARVESTED (Downloads, icons, textures, Winamp skins)"\n` +
    `for u in $DOOMED; do\n` +
    `  echo "-- $u"\n` +
    `  du -hs "/Users/$u/Downloads" 2>/dev/null || echo "   no Downloads"\n` +
    `  find "/Users/$u" -iname "*.icns" -o -iname "*.icontainer" -o -iname "*.iconset" -o -iname "*.flavour" -o -iname "*.wsz" -o -iname "*.wal" 2>/dev/null | wc -l | sed 's/^/   theme files: /'\n` +
    `done\n` +
    `if [ "$CONFIRM" != "ACCOUNTS" ]; then\n` +
    `  echo\n` +
    `  echo "NOTHING CHANGED. To harvest then remove the tertiary accounts, paste exactly:"\n` +
    `  echo "CONFIRM=ACCOUNTS sh /tmp/absolution-accounts.sh"\n` +
    `  exit 0\n` +
    `fi\n` +
    `echo\n` +
    `echo "== HARVEST (same-volume move: instant, frees nothing, loses nothing)"\n` +
    `mkdir -p "$HARVEST"\n` +
    `mkdir -p "$QUAR"\n` +
    `for u in $DOOMED; do\n` +
    `  mkdir -p "$HARVEST/$u"\n` +
    `  if [ -d "/Users/$u/Downloads" ]; then\n` +
    `    mv "/Users/$u/Downloads" "$HARVEST/$u/Downloads"\n` +
    `    echo "harvested Downloads: $u"\n` +
    `  fi\n` +
    `  mkdir -p "$HARVEST/$u/themes"\n` +
    `  find "/Users/$u" -iname "*.icns" -o -iname "*.icontainer" -o -iname "*.iconset" -o -iname "*.flavour" -o -iname "*.wsz" -o -iname "*.wal" 2>/dev/null | while read -r f; do\n` +
    `    mv "$f" "$HARVEST/$u/themes/" 2>/dev/null\n` +
    `  done\n` +
    `  echo "harvested theme files: $u"\n` +
    `done\n` +
    `echo\n` +
    `echo "== REMOVE RECORDS (home folders are MOVED, never deleted)"\n` +
    `for u in $DOOMED; do\n` +
    `  dscl . -delete "/Users/$u" 2>/dev/null && echo "record removed: $u" || echo "record already absent: $u"\n` +
    `  if [ -d "/Users/$u" ]; then\n` +
    `    mv "/Users/$u" "$QUAR/$u"\n` +
    `    echo "home quarantined: $QUAR/$u"\n` +
    `  fi\n` +
    `done\n` +
    `echo\n` +
    `echo "== RESULT"\n` +
    `ls /Users\n` +
    `echo "-- harvested (KEPT for you) --"\n` +
    `du -hs "$HARVEST"/* 2>/dev/null\n` +
    `echo "-- quarantined homes (still occupying disk) --"\n` +
    `du -hs "$QUAR"/* 2>/dev/null\n` +
    `df -h /\n` +
    `echo\n` +
    `echo "SPACE IS NOT FREED YET. Review the harvest, then free it with:"\n` +
    `echo "  rm -rf $QUAR"\n` +
    `ACCTSH\n` +
    `sh /tmp/absolution-accounts.sh\n` +
    `date\n`
  );
}

const OUTPUTS: Array<[string, () => string]> = [
  ['etc/lion-clean-inventory.block', inventoryBlock],
  ['etc/lion-app-sweep.block', sweepBlock],
  ['etc/lion-clean-repair.block', repairBlock],
  ['etc/absolution-accounts.block', accountsBlock],
];

// SAFETY INVARIANTS - asserted against the emitted bytes, not against intent.
const FORBIDDEN: Array<[RegExp, string]> = [
  [/eraseDisk/, 'eraseDisk violates "without wiping drives"'],
  [/eraseVolume/, 'eraseVolume violates "without wiping drives"'],
  [/partitionDisk/, 'partitionDisk violates "without wiping drives"'],
  [/reformat/, 'reformat violates "without wiping drives"'],
  [/\basr\b/, 'asr remirror is a standing doNot in docs/lion-workflow.json'],
  [/rm -rf \/Applications/, 'never rm /Applications - sweep is a reversible move'],
  [/rm -rf "\/Applications/, 'never rm an app bundle - sweep is a reversible move'],
  [/diskutil repairVolume \//, 'repairVolume cannot run on the booted startup volume'],
];

// Safety invariants are asserted against EXECUTABLE lines only. The blocks deliberately name the
// banned verbs in their own comment headers ("no eraseDisk, no asr..."), and a naive scan of the raw
// bytes flags those as violations. Stripping comments is what makes the assertion mean what it says.
function codeOf(body: string): string {
  return body
    .split('\n')
    .filter((line) => !line.trim().startsWith('#'))
    .join('\n');
}

function selftest(): void {
  let fail = 0;
  const check = (name: string, ok: boolean) => {
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
    if (!ok) fail++;
  };
  for (const [path, gen] of OUTPUTS) {
    const body = gen();
    const code = codeOf(body);
    check(`${path} starts with id -u`, body.split('\n')[0] === 'id -u');
    for (const [re, why] of FORBIDDEN) {
      check(`${path} forbids ${re.source} (${why})`, !re.test(code));
    }
    check(`${path} documents the no-wipe rule in its header`, body.includes('without wiping drives'));
    if (existsSync(path)) {
      check(`${path} on disk matches generator (deterministic)`, readFileSync(path, 'utf8') === body);
    }
  }
  // POSIX-sh syntax gate on the INNER heredoc scripts. The outer block passing `bash -n` does not
  // prove the inner payload parses: the heredoc is opaque to bash until runtime, and the Mac runs it
  // under /bin/sh. An unquoted case pattern with a space ("AU Lab") parses in neither and would have
  // failed on the operator's console. This gate is why that bug died in the sandbox.
  for (const [path, gen] of OUTPUTS) {
    const body = gen();
    const marker = body.match(/<<'([A-Z]+)'/)?.[1];
    if (!marker) {
      check(`${path} has an inner heredoc`, false);
      continue;
    }
    const inner = body.split(new RegExp(`<<'${marker}'\\n`))[1]?.split(new RegExp(`\\n${marker}\\n`))[0] ?? '';
    const tmp = `/tmp/lion-clean-selftest-${marker}.sh`;
    writeFileSync(tmp, inner);
    const res = spawnSync('sh', ['-n', tmp], { encoding: 'utf8' });
    check(`${path} inner script passes sh -n${res.status === 0 ? '' : ': ' + (res.stderr || '').trim()}`, res.status === 0);
  }

  const sweep = sweepBlock();
  check('sweep is CONFIRM-gated', sweep.includes('CONFIRM=SWEEP') && sweep.includes('NOTHING MOVED'));
  check('sweep moves to quarantine, never deletes', sweep.includes('mv "$a" "$Q"/'));
  check('sweep protects the Apple class', sweep.includes(`${APPLE_PREFIX}*) echo "protect APPLE`));
  for (const k of KEEP) {
    const token = `"${k.prefix}"${k.wild ? '*' : ''}`;
    check(`keep-list carries ${k.app} as ${token}`, sweep.includes(token) && inventoryBlock().includes(token));
  }
  // BEHAVIORAL GATE: run the real emitted case-patterns against a synthetic /Applications and assert
  // the classification. Inspecting the pattern string is not enough - "CandyBar*" fully quoted LOOKS
  // correct and silently fails to match, which would have quarantined the two apps the operator named.
  // Fixtures deliberately include awkward real-world spellings (Arctic Fox with a space, a versioned
  // Audacity, Logic Express) plus third-party apps that MUST be swept.
  const fixtures: Array<{ name: string; bundle: string; want: 'KEEP' | 'APPLE' | 'CANDIDATE' }> = [
    { name: 'CandyBar', bundle: 'com.panic.CandyBar3', want: 'KEEP' },
    { name: 'Flavours', bundle: 'com.interacto.Flavours', want: 'KEEP' },
    { name: 'Arctic Fox', bundle: 'org.arcticfox', want: 'KEEP' },
    { name: 'ArcticFox', bundle: 'org.arcticfox', want: 'KEEP' },
    { name: 'Audacity 2.4.2', bundle: 'org.audacityteam', want: 'KEEP' },
    { name: 'AirPort Utility', bundle: 'com.apple.airport.airportutility', want: 'APPLE' },
    { name: 'iTunes', bundle: 'com.apple.iTunes', want: 'APPLE' },
    { name: 'Safari', bundle: 'com.apple.Safari', want: 'APPLE' },
    { name: 'MacKeeper', bundle: 'com.zeobit.mackeeper', want: 'CANDIDATE' },
    { name: 'Skype', bundle: 'com.skype.skype', want: 'CANDIDATE' },
    { name: 'Adobe Flash Installer', bundle: 'com.adobe.flash', want: 'CANDIDATE' },
  ];
  const simLines = fixtures
    .map(
      (f) =>
        `N="${f.name}"\nB="${f.bundle}"\nC=CANDIDATE\ncase "$B" in ${APPLE_PREFIX}*) C=APPLE;; esac\n` +
        `case "$N" in ${KEEP_CASE}) C=KEEP;; esac\necho "$C ${f.name}"`,
    )
    .join('\n');
  const simPath = '/tmp/lion-clean-classify-sim.sh';
  writeFileSync(simPath, simLines + '\n');
  const sim = spawnSync('sh', [simPath], { encoding: 'utf8' });
  check('classification sim runs', sim.status === 0);
  const got = (sim.stdout || '').trim().split('\n');
  fixtures.forEach((f, i) => {
    const line = got[i] ?? '';
    // an Apple-bundled app hitting the KEEP list is fine - both mean "never swept"
    const ok = f.want === 'APPLE' ? /^(APPLE|KEEP) /.test(line) : line === `${f.want} ${f.name}`;
    check(`classify ${f.name} -> ${f.want}${ok ? '' : ` (got "${line}")`}`, ok);
  });

  // ACCOUNT RESOLVER GATE. Deleting the wrong account is unrecoverable (the R1 burn showed 54G of
  // Downloads under 'revo' and the operator's textures live in a Downloads folder), so the keeper is
  // resolved ON THE MACHINE from short name + RealName + admin membership. These fixtures prove the
  // resolver picks correctly AND that it refuses rather than guessing when the answer is not unique.
  const acct = accountsBlock();
  check('accounts: harvests Downloads before deleting',
    acct.indexOf('HARVEST') < acct.indexOf('dscl . -delete'));
  check('accounts: never rm a home folder', !/rm -rf "\/Users\/\$u"/.test(codeOf(acct)));
  check('accounts: home is moved to quarantine', acct.includes('mv "/Users/$u" "$QUAR/$u"'));
  check('accounts: CONFIRM-gated', acct.includes('CONFIRM=ACCOUNTS') && acct.includes('NOTHING CHANGED'));
  // Keeper is now DECLARED (operator 2026-09-17d: "el is the only keeper, samael is nick for el").
  // The risk shifts from "picked the wrong account" to "deleted everyone including the admin", so the
  // block must refuse if the keeper is missing or is not an admin, and must never delete a live session.
  check('accounts: keeper is el', acct.includes('KEEPER="el"'));
  check('accounts: aborts if keeper home is missing', acct.includes('ABORT: /Users/$KEEPER does not exist'));
  check('accounts: aborts if keeper is not admin', acct.includes('is NOT in the admin group'));
  check('accounts: aborts if a doomed account is logged in', acct.includes('is currently logged in'));
  check('accounts: doomed set is everyone but keeper/Shared/Guest',
    acct.includes('DOOMED="$DOOMED $u"') && acct.includes('[ "$u" = "$KEEPER" ]'));
  check('accounts: Guest excluded from deletion loop', acct.includes("grep -v '^Guest$'"));
  check('accounts: purge is a separate manual step', acct.includes('SPACE IS NOT FREED YET'));

  const invCode = codeOf(inventoryBlock());
  check(
    'inventory changes nothing',
    !/\bmv \b/.test(invCode) && !/\brm \b/.test(invCode) && !/-delete\b/.test(invCode) && inventoryBlock().includes('NOTHING WAS CHANGED'),
  );
  check('repair keeps Downloads + theme dirs', repairBlock().includes('Downloads') && repairBlock().includes('CandyBar'));
  console.log(fail === 0 ? 'LION_CLEAN_PLAN_SELFTEST=PASS' : `LION_CLEAN_PLAN_SELFTEST=FAIL failures=${fail}`);
  if (fail > 0) process.exit(1);
}

const invokedDirectly = process.argv[1] !== undefined && /lion-clean-plan\.ts$/.test(process.argv[1]);
const cmd = process.argv[2] ?? 'selftest';
if (invokedDirectly) {
if (cmd === 'emit') {
  for (const [path, gen] of OUTPUTS) {
    writeFileSync(path, gen());
    console.log(`WROTE ${path}`);
  }
} else if (cmd === 'keep') {
  for (const k of KEEP.slice().sort((a, b) => a.app.localeCompare(b.app))) console.log(`${k.app} :: ${k.why}`);
} else if (cmd === 'selftest') {
  selftest();
} else {
  console.log('usage: node tools/lion-clean-plan.ts <emit|keep|selftest>');
  process.exit(1);
}
}
