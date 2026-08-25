# ToDo — extreme optimization sprint (operator directive 2026-08-25)

> Directive: "lets get my processes and memory usage to an absolute minimum, still want the machine to be beautiful. and with EXTREME optimization, since we're overclocking my 12700kf and 3080 10gig. granular inspection and analysis before proceeding"

## Phase 1: Probe
- [x] `etc/perf-probe.block` partial receipt 2026-08-25 04:53 UTC (paste started mid-ps)
- [ ] Paste `etc/perf-head.block` — missing free/meminfo, governor, sysctl, runit, top RSS, lscpu -e

## Phase 2: Diet (from receipts)
- [ ] Root: `etc/perf-p2-root.block` — ARC 8G + sysctl + Coolbits write, no X restart
- [ ] User autostart after answers: lama/ollama, fleasion, Dl, blueman, spice-vdagent, orca
- [ ] Runit prune only after head probe lists `/var/service`
- [ ] Do not kill Vesktop, Element, Zen, easyeffects, cairo-dock, compiz, emerald

## Phase 3-5: after head + p2-root receipts
- [ ] IRQ pin: GPU off E-core 17, NIC off that same core; USB CPU 5 stays
- [ ] Clock offsets only after Coolbits-live X restart
- [ ] BIOS 5.0P/4.0E @ 1.28-1.32V is operator-only

## Phase 6: Measure
- [ ] Before/after: RSS, ARC size, GPU util/VRAM, operator smoothness

## Parked
- [ ] `etc/w3-postreboot-probe.block` if wave-3 leftovers still unknown
- [ ] Games campaign PARKED
- [ ] doas / logging / Tier-2 USB
