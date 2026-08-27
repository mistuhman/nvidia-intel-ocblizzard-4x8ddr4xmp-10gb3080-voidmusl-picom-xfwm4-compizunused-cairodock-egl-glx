"""
Finder Search - Ulauncher extension.

Type the keyword, then part of a file name. Results are files on this machine;
Enter reveals the file in Finder (Nemo) with it selected, Alt+Enter opens the
file itself with its default application.

Search backends, in order of preference:
  1. plocate / locate  - instant, index-backed. Requires the index to actually
                         cover ZFS: /etc/updatedb.conf ships PRUNEFS with zfs
                         in it on most distros, which would make the index
                         empty here since / IS zfs. The installer fixes that.
  2. fd / fdfind       - fast parallel walker, no index needed.
  3. find              - always present, slowest.

Roots default to ~ plus the pools (/mnt/games, /bulk, /fast) so game and media
files are searchable, not just the home directory.
"""

import os
import shlex
import subprocess
from pathlib import Path

from ulauncher.api.client.EventListener import EventListener
from ulauncher.api.client.Extension import Extension
from ulauncher.api.shared.action.ExtensionCustomAction import ExtensionCustomAction
from ulauncher.api.shared.action.HideWindowAction import HideWindowAction
from ulauncher.api.shared.action.RenderResultListAction import RenderResultListAction
from ulauncher.api.shared.event import ItemEnterEvent, KeywordQueryEvent
from ulauncher.api.shared.item.ExtensionResultItem import ExtensionResultItem

ICON = "images/icon.png"
ICON_DIR = "images/folder.png"

# Directories that are never interesting and only add noise.
NOISE = (
    "/.git/", "/node_modules/", "/__pycache__/", "/.cache/",
    "/.var/app/", "/proc/", "/sys/", "/dev/", "/run/",
    "/.zfs/snapshot/",   # snapshots would multiply every hit by every snapshot
)


def which(name):
    for d in os.environ.get("PATH", "/usr/bin:/bin").split(":"):
        p = os.path.join(d, name)
        if os.path.isfile(p) and os.access(p, os.X_OK):
            return p
    return None


def expand_roots(raw):
    out = []
    for r in (raw or "").split(":"):
        r = r.strip()
        if not r:
            continue
        r = os.path.expanduser(r)
        if os.path.isdir(r):
            out.append(r)
    return out or [str(Path.home())]


def run(cmd, timeout=6):
    try:
        res = subprocess.run(
            cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
            timeout=timeout, check=False,
        )
        return res.stdout.decode("utf-8", "replace").splitlines()
    except Exception:
        return []


def search(term, roots, limit, dirs_only, hidden):
    """Return a list of absolute paths matching `term`."""
    hits = []

    locate = which("plocate") or which("locate")
    if locate:
        cmd = [locate, "-i", "-l", str(limit * 6), "--", term]
        for line in run(cmd):
            if not line:
                continue
            if any(n in line for n in NOISE):
                continue
            if not any(line.startswith(r) for r in roots):
                continue
            if dirs_only and not os.path.isdir(line):
                continue
            if not hidden and any(
                part.startswith(".") for part in Path(line).parts[1:]
            ):
                continue
            hits.append(line)
            if len(hits) >= limit:
                return hits

    if len(hits) < limit:
        fd = which("fd") or which("fdfind")
        for root in roots:
            if len(hits) >= limit:
                break
            if fd:
                cmd = [fd, "--absolute-path", "--ignore-case",
                       "--max-results", str(limit * 2)]
                cmd += ["--type", "d"] if dirs_only else ["--type", "f"]
                if hidden:
                    cmd.append("--hidden")
                cmd += ["--", term, root]
            else:
                cmd = ["find", root, "-maxdepth", "8",
                       "-type", "d" if dirs_only else "f",
                       "-iname", "*%s*" % term, "-print"]
            for line in run(cmd):
                if not line or any(n in line for n in NOISE):
                    continue
                if line in hits:
                    continue
                hits.append(line)
                if len(hits) >= limit:
                    break
    return hits


class FinderSearchExtension(Extension):
    def __init__(self):
        super().__init__()
        self.subscribe(KeywordQueryEvent, KeywordQueryEventListener())
        self.subscribe(ItemEnterEvent, ItemEnterEventListener())


class KeywordQueryEventListener(EventListener):
    def on_event(self, event, extension):
        prefs = extension.preferences
        term = (event.get_argument() or "").strip()
        dirs_only = event.get_keyword() == prefs.get("fs_dirkw")

        if len(term) < 2:
            return RenderResultListAction([
                ExtensionResultItem(
                    icon=ICON,
                    name="Type at least 2 characters",
                    description="Enter reveals in Finder  ·  Alt+Enter opens the file",
                    on_enter=HideWindowAction(),
                )
            ])

        try:
            limit = int(prefs.get("fs_limit", "25"))
        except ValueError:
            limit = 25
        roots = expand_roots(prefs.get("fs_roots", "~"))
        hidden = prefs.get("fs_hidden", "no") == "yes"

        paths = search(term, roots, limit, dirs_only, hidden)

        if not paths:
            return RenderResultListAction([
                ExtensionResultItem(
                    icon=ICON,
                    name="No match for '%s'" % term,
                    description="Roots: %s   ·   If this is always empty, run: sudo updatedb"
                                % ", ".join(roots),
                    on_enter=HideWindowAction(),
                )
            ])

        items = []
        for p in paths:
            try:
                size = os.path.getsize(p)
                human = ("%.1f MB" % (size / 1048576.0)) if size >= 1048576 \
                    else ("%d KB" % (size / 1024))
            except OSError:
                human = ""
            items.append(ExtensionResultItem(
                icon=ICON_DIR if os.path.isdir(p) else ICON,
                name=os.path.basename(p.rstrip("/")) or p,
                description="%s   %s" % (os.path.dirname(p), human),
                on_enter=ExtensionCustomAction(
                    {"action": "reveal", "path": p}, keep_app_open=False),
                on_alt_enter=ExtensionCustomAction(
                    {"action": "open", "path": p}, keep_app_open=False),
            ))
        return RenderResultListAction(items)


class ItemEnterEventListener(EventListener):
    def on_event(self, event, extension):
        data = event.get_data() or {}
        path = data.get("path", "")
        action = data.get("action", "reveal")
        if not path:
            return HideWindowAction()

        q = shlex.quote(path)
        if action == "open":
            cmd = "xdg-open %s" % q
        else:
            # `finder <file>` opens the containing folder with the file
            # selected. Falls back to nemo, then xdg-open on the parent.
            parent = shlex.quote(os.path.dirname(path) or "/")
            cmd = ("if command -v finder >/dev/null 2>&1; then finder {p}; "
                   "elif command -v nemo >/dev/null 2>&1; then nemo {p}; "
                   "else xdg-open {d}; fi").format(p=q, d=parent)
        try:
            subprocess.Popen(["/bin/sh", "-c", cmd],
                             stdout=subprocess.DEVNULL,
                             stderr=subprocess.DEVNULL,
                             start_new_session=True)
        except Exception:
            pass
        return HideWindowAction()


if __name__ == "__main__":
    FinderSearchExtension().run()
