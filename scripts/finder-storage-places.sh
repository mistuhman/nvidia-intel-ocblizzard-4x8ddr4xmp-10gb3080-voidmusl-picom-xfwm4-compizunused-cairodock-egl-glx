#!/bin/sh
# finder-storage-places.sh - ROOT or user sd.
# Makes the tiered zpools a visible hierarchy in Nemo/Finder:
#   ~/Storage/{Fast,Bulk,Games}  ->  /fast  /bulk  /mnt/games
#   gtk-3.0 bookmarks so they land in the Finder Places sidebar.
# Does not touch icon themes, GTK theme, or Thunar. Idempotent.
set -eu
say() { printf '\n=== %s ===\n' "$*"; }

if [ "$(id -u)" = 0 ]; then
	U=${SUDO_USER:-sd}
	UH=$(getent passwd "$U" | cut -d: -f6)
	[ -n "$UH" ] || UH=/home/$U
else
	U=$(id -un)
	UH=${HOME:-/home/$U}
fi
[ -n "$UH" ] || { echo "ABORT: no home for $U" >&2; exit 1; }

say "Finder storage places for $U ($UH)"

STOR=$UH/Storage
mkdir -p "$STOR"
ln -sfn /fast "$STOR/Fast"
ln -sfn /bulk "$STOR/Bulk"
ln -sfn /mnt/games "$STOR/Games"
# Type=Link entries so Finder shows named places even before following the symlink
write_link() {
	_name=$1
	_url=$2
	_icon=$3
	_file=$4
	cat > "$_file" <<EOF
[Desktop Entry]
Type=Link
Name=$_name
Icon=$_icon
URL=$_url
EOF
}
write_link "Fast (MX500 SSD)" "file:///fast" drive-harddisk-solidstate "$STOR/Fast.desktop"
write_link "Bulk (2x2TB HDD)" "file:///bulk" drive-harddisk "$STOR/Bulk.desktop"
write_link "Games" "file:///mnt/games" applications-games "$STOR/Games.desktop"

BOOKDIR=$UH/.config/gtk-3.0
BOOK=$BOOKDIR/bookmarks
mkdir -p "$BOOKDIR"
[ -f "$BOOK" ] || : > "$BOOK"
append_bm() {
	_line=$1
	if grep -F -x -q "$_line" "$BOOK" 2>/dev/null; then
		return 0
	fi
	printf '%s\n' "$_line" >> "$BOOK"
}
append_bm "file://$UH/Storage Storage"
append_bm "file:///fast Fast"
append_bm "file:///bulk Bulk"
append_bm "file:///mnt/games Games"
append_bm "file:///fast/work Work"
append_bm "file:///fast/vm VM"
append_bm "file:///bulk/media Media"
append_bm "file:///bulk/archive Archive"

if [ "$(id -u)" = 0 ]; then
	chown -R "$U": "$STOR" "$BOOKDIR" 2>/dev/null || true
fi

# convenience: ~/Games -> pool, only if absent (do not clobber a real directory)
if [ ! -e "$UH/Games" ]; then
	ln -sfn /mnt/games "$UH/Games"
	[ "$(id -u)" = 0 ] && chown -h "$U": "$UH/Games" 2>/dev/null || true
fi

say "AFTER"
ls -l "$STOR"
echo "--- gtk bookmarks ---"
cat "$BOOK"
echo
echo "Open a new Finder window. Places sidebar: Storage, Fast, Bulk, Games."
echo "Or: finder $STOR"
echo "DONE finder-storage-places"
date
