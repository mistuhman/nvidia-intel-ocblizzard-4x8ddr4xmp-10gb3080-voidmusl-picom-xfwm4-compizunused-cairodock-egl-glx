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

## Target Usage

```sh
# Probe hub, hidraw node, OpenRGB, and profile state:
sh rgb-omen probe

# Test fans-wave immediately with icy blue (#00d0ff) or any custom hex color:
sudo -i
sh rgb-omen fans-wave 00d0ff med

# Make it permanent across boots (installs /etc/sv/omen-rgb):
sh rgb-omen persist fans-wave 00d0ff med

# Check service status:
sh rgb-omen status

# Reverse / disable boot service:
sh rgb-omen unpersist
```

## Related receipts

- `docs/case-swap-sff-triage.md` §5b — hub wiring, USB 9-pin header.
- `STATE.md` — machine facts, runit list (`omen-perf`, `omen-sqm`), `/var/service`.
- `MASTER.md` durableFacts.caseSwap — hub confirmed in circuit (`103c:84fd`).
