# ToDo — extreme optimization sprint (operator directive 2026-08-25)

> Directive: "lets get my processes and memory usage to an absolute minimum, still want the machine to be beautiful. and with EXTREME optimization"

## Phase 1: Probe
- [x] `etc/perf-probe.block` partial 04:53 UTC + `etc/perf-head.block` 05:04 UTC

## Phase 2: this wave
- [ ] User: `etc/perf-p2-user.block` — disable lama/fleasion/Dl, hide spice-vdagent/orca
- [ ] Root: `etc/perf-p2-root.block` — ARC 8G + sysctl + Coolbits write + IRQ pin, no X restart

## After p2 receipts
- [ ] Ask: bluetoothd, tor+privoxy, libvirtd, xfdesktop (115M, it came back)
- [ ] Persist IRQ pin across reboot
- [ ] Clock offsets only after Coolbits-live X restart
- [ ] BIOS 5.0P/4.0E @ 1.28-1.32V is operator-only

## Parked
- [ ] Games campaign. doas / logging / Tier-2 USB. w3-postreboot-probe if needed.
