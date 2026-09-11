Mac Pro 1,1 — one repair script plus the relay page (Snow Leopard 10.6.8)

The current zip contains lion-mirror.command, lion-boot-log.command, and lion.html.
The Repair script is tested with dash -n, bash --posix -n, and mocked bless/nvram/osascript.
The boot-log script is read-only against disks/NVRAM/logs and writes only
/lion-boot-log.txt plus ~/Desktop/lion-boot-log.txt. No asr. No erase. No clock change.

Current job: Repair ESD boot — remove Graphics Mode Boot.plist, nvram -d
Graphics Mode, bless --folder CoreServices --file VOLUME-ROOT boot.efi
--label Mac OS X Install ESD. Confirm button: Repair.

Arctic Fox — type only these current short links:
  da.gd/lionrelay  current relay page; choose ~/Desktop/lion-mirror.txt
  da.gd/lionzip    current bundle with lion-mirror.command + lion.html

Legacy and stale: da.gd/lzr, da.gd/lmz, da.gd/lpg.
Never da.gd/lionfix (old date-fix pack). Never da.gd/lup (dead e2b). Never TinyURL.

On Lion SSD Base: use da.gd/lionzip, unzip, double-click lion.html,
admin password, Repair. Report: ~/Desktop/lion-mirror.txt — attach on da.gd/lionrelay.

The 2026-09-11 readable report is verified: Repair and bless succeeded, and no disk was erased.
The released ESD attempt showed a brief prohibitory symbol, then Apple logo/loading, then returned to Snow Leopard; no installer GUI appeared.
Next one-action diagnostic: download the current bundle from da.gd/lionzip, double-click lion-boot-log.command, choose “Prohibitory then fallback,” and attach ~/Desktop/lion-boot-log.txt through da.gd/lionrelay.
It also writes the canonical root-level /lion-boot-log.txt. Do not reboot, run the visible withdrawn audit/date-fix files, or erase start disk clone/Lion SSD Base until BOOTLOG1 is read.

Canonical links + nextAction: docs/lion-workflow.json
Print: node tools/lion-status.ts
Handoff: docs/lion-ssd-handoff.md
