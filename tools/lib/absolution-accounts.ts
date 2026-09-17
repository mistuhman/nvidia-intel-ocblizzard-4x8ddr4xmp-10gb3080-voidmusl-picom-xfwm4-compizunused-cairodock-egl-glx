// absolution-accounts.ts - SINGLE SOURCE for the tertiary-account removal script.
//
// Lives in lib/ so both consumers import the same bytes and can never drift:
//   tools/absolution.ts        -> ships it as absolution-accounts.command via the permanent link
//   tools/lion-clean-plan.ts   -> emits etc/absolution-accounts.block as the paste fallback
// (lib imports nothing from either, so there is no import cycle.)
//
// Operator directives encoded here, verbatim:
//   2026-09-17d "el is the only keeper, samael is nick for el"
//   2026-09-17e "we're using the icons and img textures i downloaded on my el admin account.
//                since thats the only account ive used since downloading lion"
//
// CONSEQUENCE OF 17e: the icons and textures are inside /Users/el/Downloads, and el is the keeper,
// so they are protected BY CONSTRUCTION - this script never reads, moves or deletes anything under
// the keeper's home. It proves that by counting them before and after and comparing.
// revo's 54G of Downloads is therefore NOT the texture source; it is still harvested, but only as a
// precaution against data the operator has not inventoried, never as the thing being rescued.

export const KEEPER = 'el';

export function accountsScript(keeper: string = KEEPER): string {
  return `#!/bin/sh
# absolution-accounts - remove the tertiary accounts, keep "${keeper}" (Samael).
# Phase 1 (no root): read-only map + safety checks. Phase 2 (root + CONFIRM): harvest, then remove.
KEEPER="${keeper}"
HARVEST="/Users/$KEEPER/absolution-harvest"
QUAR="/Users/Shared/absolution-quarantine"

# --- keeper texture inventory. Operator 2026-09-17e: the icons and img textures are on el, the only
# --- account used since Lion was installed. This script must never touch them; these counts prove it.
keeper_textures() {
  D="/Users/$KEEPER/Downloads"
  echo "  Downloads size: $(du -hs "$D" 2>/dev/null | awk '{print $1}')"
  echo "  icns:      $(find "$D" -iname '*.icns' 2>/dev/null | wc -l | tr -d ' ')"
  echo "  iconsets:  $(find "$D" -iname '*.iconset' -o -iname '*.icontainer' 2>/dev/null | wc -l | tr -d ' ')"
  echo "  flavours:  $(find "$D" -iname '*.flavour' 2>/dev/null | wc -l | tr -d ' ')"
  echo "  skins:     $(find "$D" -iname '*.wsz' -o -iname '*.wal' 2>/dev/null | wc -l | tr -d ' ')"
  echo "  images:    $(find "$D" -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.tga' -o -iname '*.dds' -o -iname '*.tif' -o -iname '*.tiff' 2>/dev/null | wc -l | tr -d ' ')"
}

echo "== KEEPER: $KEEPER (declared by operator; Samael is the nickname)"
if [ ! -d "/Users/$KEEPER" ]; then
  echo "ABORT: /Users/$KEEPER does not exist. Nothing changed."
  exit 1
fi

echo "== KEEPER TEXTURES BEFORE (never touched by this script)"
keeper_textures
BEFORE=$(find "/Users/$KEEPER/Downloads" 2>/dev/null | wc -l | tr -d ' ')
echo "  total items under Downloads: $BEFORE"
echo

ADMINS=$(dscl . -read /Groups/admin GroupMembership 2>/dev/null | cut -d: -f2-)
echo "== ADMIN GROUP:$ADMINS"
KEEPADMIN=no
for a in $ADMINS; do
  [ "$a" = "$KEEPER" ] && KEEPADMIN=yes
done
if [ "$KEEPADMIN" != yes ]; then
  echo "ABORT: keeper $KEEPER is NOT an admin. Removing the others could leave this Mac"
  echo "with no administrator account. Nothing changed."
  exit 1
fi
echo "keeper is admin: OK"
echo "cross-check RealName: $(dscl . -read /Users/$KEEPER RealName 2>/dev/null | tail -1 | sed -e 's/^ *//')"
echo

echo "== ACCOUNT MAP"
DOOMED=""
for u in $(ls /Users 2>/dev/null | grep -v Shared | grep -v '^Guest$'); do
  RN=$(dscl . -read "/Users/$u" RealName 2>/dev/null | tail -1 | sed -e 's/^ *//')
  UIDN=$(dscl . -read "/Users/$u" UniqueID 2>/dev/null | awk '{print $2}')
  SZ=$(du -hs "/Users/$u" 2>/dev/null | awk '{print $1}')
  if [ "$u" = "$KEEPER" ]; then
    echo "KEEP   $u | uid=$UIDN | size=$SZ | real=$RN"
  else
    echo "REMOVE $u | uid=$UIDN | size=$SZ | real=$RN"
    DOOMED="$DOOMED $u"
  fi
done
if [ -z "$DOOMED" ]; then
  echo "NOTHING TO DO - only the keeper exists."
  exit 0
fi
echo "TERTIARY:$DOOMED"
echo

echo "== LOGIN SAFETY"
who
LOGGEDIN=$(who 2>/dev/null | awk '{print $1}' | sort -u)
for u in $DOOMED; do
  for l in $LOGGEDIN; do
    if [ "$l" = "$u" ]; then
      echo "ABORT: $u is logged in right now. Log it out first. Nothing changed."
      exit 1
    fi
  done
done
echo "no doomed account is logged in: OK"
echo

echo "== WOULD HARVEST (precaution: these are NOT the keeper's textures)"
for u in $DOOMED; do
  echo "-- $u"
  du -hs "/Users/$u/Downloads" 2>/dev/null || echo "   no Downloads"
  find "/Users/$u" -iname '*.icns' -o -iname '*.icontainer' -o -iname '*.iconset' -o -iname '*.flavour' -o -iname '*.wsz' -o -iname '*.wal' 2>/dev/null | wc -l | sed 's/^/   theme files: /'
done
echo

if [ "$(id -u)" != "0" ]; then
  echo "MAP ONLY - not running as root, so nothing can be changed."
  echo "To actually harvest and remove, run this in Terminal:"
  echo "  sudo CONFIRM=ACCOUNTS sh \\"$0\\""
  exit 0
fi
if [ "$CONFIRM" != "ACCOUNTS" ]; then
  echo "ROOT but NOT CONFIRMED - nothing changed."
  echo "To proceed, run:"
  echo "  sudo CONFIRM=ACCOUNTS sh \\"$0\\""
  exit 0
fi

echo "== HARVEST (same-volume move: instant, needs no free space)"
mkdir -p "$HARVEST"
mkdir -p "$QUAR"
for u in $DOOMED; do
  if [ "$u" = "$KEEPER" ]; then
    echo "REFUSE: keeper appeared in the doomed list. Aborting before any change."
    exit 1
  fi
  mkdir -p "$HARVEST/$u"
  if [ -d "/Users/$u/Downloads" ]; then
    mv "/Users/$u/Downloads" "$HARVEST/$u/Downloads"
    echo "harvested Downloads: $u"
  fi
  mkdir -p "$HARVEST/$u/themes"
  find "/Users/$u" -iname '*.icns' -o -iname '*.icontainer' -o -iname '*.iconset' -o -iname '*.flavour' -o -iname '*.wsz' -o -iname '*.wal' 2>/dev/null | while read -r f; do
    mv "$f" "$HARVEST/$u/themes/" 2>/dev/null
  done
  echo "harvested theme files: $u"
done
chown -R "$KEEPER" "$HARVEST" 2>/dev/null
echo "harvest owned by $KEEPER"
echo

echo "== REMOVE RECORDS (home folders are MOVED, never deleted)"
for u in $DOOMED; do
  dscl . -delete "/Users/$u" 2>/dev/null && echo "record removed: $u" || echo "record already absent: $u"
  if [ -d "/Users/$u" ]; then
    mv "/Users/$u" "$QUAR/$u"
    echo "home quarantined: $QUAR/$u"
  fi
done
echo

echo "== KEEPER TEXTURES AFTER (must match BEFORE exactly)"
keeper_textures
AFTER=$(find "/Users/$KEEPER/Downloads" 2>/dev/null | wc -l | tr -d ' ')
echo "  total items under Downloads: $AFTER"
if [ "$BEFORE" = "$AFTER" ]; then
  echo "TEXTURES INTACT: $BEFORE items before, $AFTER after."
else
  echo "WARNING: keeper Downloads changed from $BEFORE to $AFTER items. Report this."
fi
echo

echo "== RESULT"
ls /Users
echo "-- harvested (yours, under $KEEPER) --"
du -hs "$HARVEST"/* 2>/dev/null
echo "-- quarantined homes (still occupying disk) --"
du -hs "$QUAR"/* 2>/dev/null
df -h /
echo
echo "SPACE IS NOT FREED YET. Review the harvest, then free it with:"
echo "  sudo rm -rf $QUAR"
echo "ABSOLUTION1_ACCOUNTS_DONE No disk was erased."
`;
}
