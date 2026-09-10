Mac Pro 1,1 — one script (Snow Leopard 10.6.8)

Zip contains ONLY lion-mirror.command (tested: dash -n, bash --posix -n,
mocked bless/nvram/osascript). No asr. No erase. No clock.

Current job: Repair ESD boot — remove Graphics Mode Boot.plist, nvram -d
Graphics Mode, bless --folder CoreServices --file VOLUME-ROOT boot.efi
--label Mac OS X Install ESD. Confirm button: Repair.

Arctic Fox:
  da.gd/lzr  current zip (SHA-pinned)
  da.gd/lpg  Aqua page: attach ~/Desktop/lion-mirror.txt + Burn (Burn -> lmz)
  da.gd/lmz  branch zip (jsDelivr cache 12h)

Never da.gd/lionfix (old date-fix pack). Never da.gd/lup (dead e2b).

On Lion SSD Base: unzip, double-click lion-mirror.command, admin password,
Repair. Report: ~/Desktop/lion-mirror.txt — attach on da.gd/lpg.

Then Restart, hold Option, click Mac OS X Install ESD only.
Install onto start disk clone. Do not erase it. Do not erase Lion SSD Base.

Canonical links + nextAction: docs/lion-workflow.json
Print: node tools/lion-status.ts
Handoff: docs/lion-ssd-handoff.md
