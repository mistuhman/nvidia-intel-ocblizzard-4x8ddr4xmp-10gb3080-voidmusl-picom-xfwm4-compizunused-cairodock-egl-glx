# Make the OMEN RGB use your OpenRGB profile — persistence and the pre-boot gap

## The honest model first

The OMEN 45L case lighting is driven by a small **USB HID controller on the lighting
hub** — `103c:84fd "HP TracerLED"` (the `M82868-001` PCA lighting control board). It is
fed by **SATA power straight from the PSU**, so it lights up **before the CPU/BIOS/
Linux**. That is exactly why you see the OMEN default *before* anything software can
touch.

On the board it is a **USB 2.0 9-pin** device (not SATA data). It enumerates as a USB
HID device once the kernel's xHCI controller is up. OpenRGB ships a driver that matches
this VID/PID and exposes it as **`HP Omen 30L`** with seven zones:

| Zone (OpenRGB name) | Hub zone ID | Component | Mode in `fans-wave` |
|---|---|---|---|
| Omen Logo | 0x01 | Logo LED | Static (`0x01`) |
| Light Bar | 0x02 | Bar LED | Static (`0x01`) |
| Front Fan | 0x03 | Fan LED | Wave (`0x09`) |
| CPU Cooler | 0x04 | CPU LED | Static (`0x01`) |
| Front Bottom Fan | 0x05 | Bottom Fan LED | Wave (`0x09`) |
| Front Middle Fan | 0x06 | Middle Fan LED | Wave (`0x09`) |
| Front Top Fan | 0x07 | Top Fan LED | Wave (`0x09`) |

The driver header is marked **`@save :x:`** — that is the key line. It means OpenRGB
**cannot save-to-device** here: the hub has no writable onboard profile, so it can only
hold whatever the *last* HID write set, and it loses that on every USB re-enumeration
(every boot) and on power loss. So the factory rainbow is the hub's own default; your
colour is software-applied on top at runtime.

## The two ways to "make it permanent"

1. **Re-apply at boot (what this repo does).** A runit service re-sends your profile/HID
   commands once the OS is up. This is the *only* software lever for this hub.
2. **True pre-POST persistence.** Not possible for this hub (no onboard flash memory
   and no save-to-device). The only way to get your colour *in BIOS* is to move the
   lighting onto a controller that stores its profile in onboard EEPROM (the case-swap
   triage doc's fallback: a standalone 5V ARGB controller), which is a physical change.

### The unavoidable trade-off

Because the hub has no onboard store and is powered before the CPU, **there will always
be the OMEN default during POST/BIOS**, then your colour lands once the boot service
applies it at boot (right around login). Software cannot bridge that pre-boot window.

## Per-zone modes: Fans Wave + Static elsewhere

Standard OpenRGB only exposes **one device-wide mode** across all zones (`DeviceUpdateMode`
loops over every zone with the same mode). However, the underlying 58-byte TracerLED HID
protocol supports independent per-zone modes via `usb_buf[0x03]` and zone index `usb_buf[0x36]`.

`scripts/rgb-omen` implements the per-zone HID engine directly:

- **`fans-wave [HEX_COLOR] [SPEED]`**: Sets all 4 fans (zones 3, 5, 6, 7) to `Wave` (`0x09`)
  with a 6-step dynamic gradient, while keeping the Logo (zone 1), Light Bar (zone 2),
  and CPU Cooler (zone 4) solid `Static` (`0x01`) in that same universal color family.
- **`static [HEX_COLOR]`**: Sets all 7 zones to a flat solid color.
- **`wave-all [HEX_COLOR] [SPEED]`**: Sets all 7 zones to wave animation.
- **`set-zone ZONE MODE HEX_COLOR [SPEED]`**: Granular single-zone configuration.
- **`apply PROFILE_NAME`**: Loads a standard OpenRGB `.orp` profile (e.g. `s3`).

## Smooth apply — once, whole layout (operator directive 2026-08-30)

Operator directive, verbatim intent: *"after applying, only ONCE and only after applying does
the entire rgb layout change color"* and *"it needs to change colors smoothly."* So the boot
model is: **one smooth fade of all 7 zones per apply, then nothing touches the lights.**

- **`apply [HEX] [FROM_HEX] [STEPS] [DELAY_MS]`** — the one command. Fades the entire layout
  (Logo/Bar/CPU solid + fan wave re-based each step) to the target, then writes the exact
  final color. Defaults are **quick** per operator receipt 2026-08-30 ("the fades kinda slow,
  just a quick transition"): 10 steps × 20 ms ≈ 0.3 s. Default HEX is the operator theme
  **`#031CC0`**. Start color resolution: explicit `FROM_HEX`, else the last applied color
  (remembered in `/var/lib/rgb-omen/last-color`), else black. Same color as last time →
  fade-in from black (never a silent no-op, so a post-reboot factory rainbow always fades).
- **`preview [HOLD_MS] [STEPS] [DELAY_MS]`** — the color selector: quick-fades through a
  named 12-color palette (below), holding each ~2.5 s and printing `SHOW <name> #hex` as it
  lights, then returns to the last applied color. State file untouched — previewing is not
  applying. Defaults: hold 2500 ms, fade 8 × 20 ms.
- **`persist apply HEX 000000`** — boot service that fades in from black **once per boot**,
  then parks. No polling, no status zone, no repaint.
- `unpersist` removes every rgb service (inverse). `profile NAME` is the old OpenRGB `.orp`
  loader (apply no longer means OpenRGB profile).

Palette = operator-refined 2026-08-30 (replaces the starter 12; yellow rejected as
"kinda abrasive to the eyes"): `red #FF0000 · green #1EFF00 · purple #9000FF ·
orange #FF2600`. Preview returns to the last applied color, so blue still shows last.

One honest limit: the hub is write-only with no read-back, so the very first frame out of an
unknown state (factory rainbow at power-on) is a step, not a fade — everything after that
first frame is interpolated. Between two known colors (apply → apply) the whole transition
is smooth. Same applies after an **OpenRGB GUI session**: OpenRGB-written colors are
invisible to the state file, so the next `apply` fades from *our* last recorded color, not
what OpenRGB last set (first frame may step).

## Reboot survival & trigger verification (2026-08-30)

Operator: "we need to make sure it survives reboot. both the wave+static blue profile but
the color switching itself. and how can i know itll work on each circumstances trigger?"
That question caught a **real bug**, receipted by regenerating the service file in the
sandbox: `"$@"` inside the unquoted persist heredoc collapses to ONE quoted argument, so the
boot service actually ran `apply "031CC0 000000"` — and the old len-3 fallback in
`parse_rgb` silently expanded `0,3,1` → **`#003311`**. That is the true source of the
mystery dark green in the state file (the earlier OpenRGB attribution is superseded by this
mechanism receipt). Boot survival was broken since the first `persist`. Fixed both ways:

- the generated run file now word-splits correctly (`apply 031CC0 000000`), and
- `parse_rgb` is strict — exactly 3 or 6 hex chars or it exits loudly instead of guessing.

How each half is now provable:

1. **Layout survives reboot** — the runit service quick-fades the full layout (statics +
   fan wave) once per boot, and now **appends every boot apply to `/var/log/omen-rgb.log`**
   with a timestamp. The hub can't be read back, so that log IS the receipt: after a reboot,
   `cat /var/log/omen-rgb.log` must show a fresh `APPLY=OK smooth from=#000000
   to=#031CC0` line, and the rig must visually be blue wave+static.
2. **Color switching survives reboot** — the toolkit is the script itself
   (`/home/sd/oc-lab/scripts/rgb-omen`); after reboot run `rehearse` (below) or
   `preview`/`apply` as usual. `status` now also prints the state file and boot-log tail.
3. **Every trigger, proven on demand** — `rehearse [ZONE] [HOLD_MS]` fires all four
   conditions through the REAL evaluation code with canned inputs and paints each status
   color on the rig (~3 s each): green = pools ONLINE/no errors/temps normal, magenta =
   scrub in progress, amber = cpu 95 °C, red = pool FAULTED + Xid line. It self-checks the
   mapping (`REHEARSE=PASS 4/4`, exit 1 on any mismatch) and restores the blue layout.
   You watch each trigger fire; no real failure needed.

Canonical waves: `etc/rgb-reboot-verify.block` (pre-reboot: regenerate the fixed service,
watch the log line appear, then reboot) and `etc/rgb-postreboot-verify.block` (after login:
service receipt, boot log, state file, rehearse).

## `health` — on-demand only (not a boot path)

- **`health [HEX] [ZONE|all]`**: manual probe + optional paint — fans keep the art wave, the
  status zone (default `4` = CPU cooler LED) shows system state: green OK, magenta scrub
  running, amber warn (CPU ≥ 90 °C / GPU ≥ 80 °C / pool DEGRADED), red crit (pool
  FAULTED/UNAVAIL/OFFLINE, MCE/Hardware-Error/NVIDIA-Xid/EDAC-error lines in dmesg, CPU ≥ 100 °C,
  GPU ≥ 85 °C). Probes are read-only. Run it when you want a verdict; it is **not** persisted
  (the poll-service experiment was unpersisted on target the same day — it repaints zones,
  which the apply-once directive forbids).
- **False-positive class CLOSED with the target receipt (2026-08-30):** the first live read
  flagged CRIT on 3 dmesg lines; the grep receipt named them — `EDAC MC: Ver: 3.0.0`,
  `EDAC ie31200: No ECC support` ×2 (benign boot noise), and separately the r8169 NIC prints
  its chip revision as `XID 541` — **not** an NVIDIA Xid. The pattern now matches only
  error-bearing lines (`Machine check|Hardware Error|NVRM.*Xid|Xid \(PCI|EDAC.*error`),
  verified against the exact target lines → 0. No real MCE/Xid exists on this machine.
- The **green statics** seen once after the first smooth apply were the removed health loop's
  last gasp: runit lets the in-flight `sleep 15` finish, so one final iteration ran the
  refined regex, read OK, and painted green *after* the blue apply. Teardown race, service
  now gone — cannot recur.

Pre-POST debug state is impossible on this hub (no save-to-device; USB enumerates late) — for
the hardware half of debugging (beep codes, blink codes, and why POST-code cards don't exist
for this board) see `docs/feature-pack-accessories.md`.

## Target Usage

```sh
# Probe hub, hidraw node, OpenRGB, and profile state:
sh rgb-omen probe

# ONE quick fade of the entire layout to the operator color #031CC0 (~0.3 s):
sudo -i
sh rgb-omen apply 031CC0

# Preview every palette color on the hardware (~2.5 s each), returns to the applied color:
sh rgb-omen preview

# Boot persistence: quick fade-in from black ONCE per boot, then never touch the lights:
sh rgb-omen unpersist
sh rgb-omen persist apply 031CC0 000000
sv status omen-rgb

# On-demand health probe (manual only, never persisted):
sh rgb-omen health 031CC0 4

# Inverse / disable boot service:
sh rgb-omen unpersist
```

## Related receipts

- `docs/case-swap-sff-triage.md` §5b — hub wiring, USB 9-pin header.
- `STATE.md` — machine facts, runit list (`omen-perf`, `omen-sqm`), `/var/service`.
- `MASTER.md` durableFacts.caseSwap — hub confirmed in circuit (`103c:84fd`).
