# OMEN daily driver — Steam, Vesktop+Vencord, SM7B/MicPort/EasyEffects, RPCS3, AirPods (2026-09-16)

> **MISPLACED 2026-09-16d — BANNER.** Operator correction verbatim: "no, you completely
> misunderstood. this is all on mac os x lion. not the void pc whatsoever". Every demand in the
> 2026-09-16 message (Steam, Vesktop/Discord+Vencord, SM7B+MicPort+EasyEffects, RPCS3) was
> re-judged Mac-side in docs/mac-daily-driver.md sections 8-10: the Lion-native audio chain lives
> there (section 9), and the four binaries that cannot exist on Lion are parked pending a named
> modern host (section 10). THIS FILE IS DEMOTED to (a) the record of the misplacement and (b) a
> fallback-host plan if the operator ever names the Void box (or another modern machine) as a
> deliberate exception. Do NOT execute anything here as the operator's intent; gate-12 still
> blocks all OMEN execution regardless.

Target: Void Linux glibc on the HP BlizzardOC 8917 (i7-12700KF, RTX 3080), user sd, runit,
pipewire, lightdm+XFCE+compiz beauty stack FROZEN. HARD GATE: the board does not POST today
(gate 12, HP 3.2 memory-init beeps, docs/case-swap-3-2-beep.md; bench POST wave owed per
docs/case-swap-macpro-plan.md Phase 0). NOTHING below is executed on target until the bench POST
receipt lands and gate 12 closes; this doc is the authored, receipt-backed plan so the tracks are
install-ready in one wave each. Operator directive 2026-09-16 verbatim: "then even install steam
maybe? prepare it for use w vesktop/discord w/ vencord and sm7b audio software for the sound
design micpre and centrance micport pro. easyeffects pitch, eq, noise suppression, all interfaced
upon every reboot and usable every time the mic is connected for ease of use, with feedback for
calls and everything. I also wanna get rpcs3 roms working for when i eventually get a blu ray
drive installed".

## 1. Steam ("install steam maybe?")

- Void ships it: srcpkgs/steam/template on void-packages master = steam 1.0.0.87_1, repository
  nonfree, archs i686+x86_64, deps zenity/xz/curl/dbus/... + steam-udev-rules (receipt:
  raw.githubusercontent.com/void-linux/void-packages/master/srcpkgs/steam/template fetched
  2026-09-16). Install wave (root): `xbps-install -S` then `xbps-install -y steam` (nonfree repo
  must be enabled in /etc/xbps.d/; it already is if nonfree packages like nvidia are installed -
  verify with `xbps-query -L` first).
- Multilib: steam is 32-bit; Void's steam template pulls the -32bit libs it needs; the repo names
  them with the -32bit suffix (MASTER lessons).
- Library location: keep games on /fast/steam or /mnt/games (STATE.md disk map; ~/Downloads is a
  symlink to /mnt/games/Downloads - use find -L, MASTER lessons).
- Fallback if the native package fights the beauty stack: flatpak com.valvesoftware.Steam (system
  flatpak already in use for Vesktop).
- Proton for Windows games: Steam's own Proton; the w3-* blocks in etc/ record the older
  Cod4x/Promod prefix work (games campaign stays PARKED per 2026-08-25 directive - Steam install
  is infra, not the campaign).

## 2. Vesktop + Vencord (Discord)

- Already installed: dev.vencord.Vesktop 1.6.7 stable SYSTEM flatpak (STATE.md). Scripts exist:
  scripts/omen-vesktop-find.sh / -fix.sh / -flatpak.sh.
- Rules that cost time before (STATE.md Rules 6, 10): never `su USER -c` without HOME/USER/
  LOGNAME/XAUTHORITY (flatpak otherwise lands in /root/.local/share/flatpak and Vesktop opens
  blank); flatpak Chromium-style flags go AFTER the app id and before @@u.
- Wave (post gate-12): update check `flatpak update dev.vencord.Vesktop`, verify Vencord settings
  survive (config in ~/.config/vesktop), enable Vencord > Notifications + "Disable DMs" off; audio
  device pick = the EasyEffects virtual source (section 3) so every call gets the processed mic.
- Feedback for calls: Vesktop input meter shows the EasyEffects-processed level; sidetone comes
  from section 3 monitoring, not from Discord.

## 3. SM7B + CEntrance MicPort Pro + EasyEffects (the sound-design chain)

Hardware facts (STATE.md): CEntrance MicPort Pro = USB id 1c07:0001, USB Audio Class 1; "12 Mbit
full-speed is CORRECT, not a fault". SM7B is a low-output dynamic (-60 dBV class): it needs ~60 dB
clean gain - the MicPort Pro preamp provides it in hardware; set hardware gain first (clip one
notch below red at loudest shout), then trim in software.

Software: Void packages easyeffects 8.2.9_2 (receipt: raw void-packages template fetched
2026-09-16): cmake build against pipewire, rnnoise (noise suppression), webrtc-audio-processing-2
(echo/noise), soundtouch + rubberband-class deps (pitch), fftw/ladspa/lilv (EQ/plugins),
libebur128 (loudness). Everything the operator named exists in this one package:
pitch (Pitch plugin), eq (Equalizer, 10+ bands), noise suppression (RNNoise + WebRTC).

Chain design (pipewire): MicPort Pro (source) -> EasyEffects input pipeline (gain -> compressor ->
EQ -> RNNoise -> pitch if wanted) -> EasyEffects virtual SINK/SOURCE -> apps (Vesktop/Discord,
recorders) see ONLY the processed source. EasyEffects creates "Easy Effects" virtual devices in
PipeWire; set the virtual SOURCE as the system default so every app inherits it.

Per-boot interface ("all interfaced upon every reboot"):
1. Autostart the service session-side: upstream ships Easy Effects with an XDG autostart entry
   running `easyeffects --gapplication-service`; on Void+XFCE verify
   ~/.config/autostart/easyeffects.desktop exists (or copy from /usr/share/applications with
   X-GNOME-Autostart-enabled=true). Runit alternative (operator choice): a user-run runsv dir is
   NOT stock on Void; prefer the autostart entry, keep `sv` out of it.
2. Preset persistence: EasyEffects saves input+output presets and reloads the last preset at
   start; save the chain as preset "sm7b-micport" and enable "Load last preset at startup" in
   Preferences.
3. Default-device stickiness: set the EasyEffects virtual source as pipewire default with
   `pactl set-default-source <easyeffects-source-node>` inside a small script that runs AFTER
   autostart (sleep-loop until the node appears, max 20 tries) - put that script in the same
   autostart dir (second .desktop). This is what makes "usable every time" true across reboots.

Per-connect interface ("usable every time the mic is connected"):
- udev rule on USB add: SUBSYSTEM=="usb", ATTR{idVendor}=="1c07", ATTR{idProduct}=="0001",
  RUN+="/usr/local/bin/micport-attach" where micport-attach does
  `runuser -u sd -- env XDG_RUNTIME_DIR=/run/user/$(id -u sd) /usr/local/bin/micport-select`.
  micport-select: pactl list short sources | grep -i micport -> pactl set-default-source it, then
  easyeffects --quit + relaunch is NOT needed (EasyEffects follows the default input device when
  its input is set to "Default device" - keep that setting).
- Feedback for calls (sidetone/monitoring): EasyEffects input section has a monitor toggle that
  routes the processed input to the default output at low gain; enable it only with headphones
  (speaker monitoring howls). For hardware-zero-latency sidetone the MicPort Pro has direct
  monitoring in hardware (CEntrance spec) - prefer hardware monitor when tracking, EasyEffects
  monitor when checking the processed chain.
- Level discipline receipt to capture post-install: `pw-dump | grep -A5 MicPort` node volumes +
  one EasyEffects preset export (JSON) committed to etc/ so the chain is rebuildable from repo.

Files shipped 2026-09-16c (session 01a0a9ee) so the chain is one paste post-gate-12:
- scripts/micport-select - one-shot or --wait (60 s poll) default-source switcher, exit 1 when
  the MicPort node is absent (bash -n gated in test-all).
- scripts/micport-attach - root udev RUN wrapper handing the switch to sd's pipewire session.
- etc/micport-udev.rules - the add-rule for 1c07:0001 (installs as 60-micport.rules).
- etc/easyeffects-autostart.desktop - per-boot `easyeffects --gapplication-service`.
- etc/micport-default-autostart.desktop - per-boot default-source waiter.
- etc/omen-audio-chain.block - the whole install wave, BLOCK_LINT --target-console PASS,
  rollback listed before forward per house rule.

Preset recipe (START VALUES, operator-tuned at the mic; the receipt is the exported preset JSON
committed back to etc/): input device = Default device; chain order Gain 0 dB (MicPort hardware
knob ~70% at loudest shout first) -> Compressor threshold -18 dB ratio 3:1 attack 5 ms release
100 ms -> Equalizer HPF 80 Hz 12 dB/oct + peaking +3 dB @ 4 kHz Q 1 + peaking -2 dB @ 200 Hz ->
Noise Suppression RNNoise defaults -> Pitch (sound-design only, cents offset) -> Limiter -1 dB.
Save as preset "sm7b-micport", enable load-last-preset-at-startup.

## 4. RPCS3 + PS3 discs ("roms working for when i eventually get a blu ray drive installed")

- No rpcs3 package in void-packages (404 on srcpkgs/rpcs3/template, fetched 2026-09-16). Install
  classes: (a) Flathub net.rpcs3.RPCS3 (fits the existing system-flatpak setup), or (b) official
  AppImage from rpcs3.org. Prefer (a) for updates.
- Firmware: RPCS3 requires the PS3 system firmware installed from Sony's PS3UPDAT.PUP (official
  download page) - legal, Sony-distributed.
- Disc path 2026 reality (receipts: rpcs3.net quickstart; heldgames 2026-09-07; generationamiga
  2026-09-08): since 2026-08-31 RPCS3 on Linux boots PS3 discs DIRECTLY from compatible Blu-ray
  drives (no dump needed): add the drive via VFS/games settings; the disc still needs its
  decryption key in RPCS3's data/redump folder (Linux: create the folder by hand - flagged by the
  devs); keys for your own discs are extracted with PS3-side homebrew (disc key/ID/PIC) or the
  PS3 Disc Dumper tool on a compatible drive. Classic dump-first workflow (PS3 Disc Dumper ->
  folder/ISO -> import) remains supported.
- Drive compatibility: only drives on the RPCS3 community list (LG/ASUS/Samsung/Lite-On/Sony/HP/
  Plextor/BenQ families; WH14NS40 cited as a working example); unlisted Mediatek +6-offset drives
  sometimes work - buy from the list, receipt before purchase.
- "roms": PSN digital titles install from .pkg via File > Install Packages/RAPs/Edats into
  dev_hdd0/game/<TITLEID>; dumped disc dirs live in the games dir. Keep all of it under
  /mnt/games/rpcs3 (pool bulk) with a symlink into the RPCS3 VFS - never on the NVMe root pool.
- Legal line: only dump discs/firmware/keys you own; the repo stores no ROM bytes.

## 5. AirPods gen 2 on the OMEN (the daily-driver audio that CAN work)

- Void: BlueZ + PipeWire (both already running per STATE.md services). Pair: bluetoothctl ->
  agent on -> scan on -> pair <MAC> -> trust -> connect; A2DP (playback, AAC/SBC via pipewire) +
  HFP/HSP (mic for calls). AirPods 2 are BT 5.0 - the OMEN's BT radio (or any BT4+ USB dongle)
  satisfies the hardware requirement that the Mac Pro 3,1 cannot (docs/mac-daily-driver.md §5).
- Call routing: HFP profile switches the AirPods to headset mode (mono out + mic in) - expected
  quality drop during calls is the profile, not a fault; music returns to A2DP after the call.
- uBlock/modern web on the OMEN: Zen (tarball) + Brave (flatpak) already installed per STATE.md;
  uBlock Origin from each store = trivial, no doc needed beyond this line.

## 6. Wave order after gate 12 closes (one wave, one receipt, per house rules)

1. Bench POST receipt (gate 12) - gates everything here.
2. Read-only inventory wave: xbps-query -L, flatpak list, pw-dump sources, bluetoothctl show.
3. Steam install wave = etc/omen-steam-install.block + launch receipt.
4. Audio chain wave = etc/omen-audio-chain.block (installs easyeffects + micport-select/attach +
   udev rule + both autostart entries); reboot gate; per-connect test = unplug/replug MicPort and
   watch `pactl get-default-source` flip; preset per the recipe above; export preset JSON back.
5. Vesktop audio-binding wave (default source = EasyEffects virtual; call test).
6. RPCS3 wave = etc/omen-rpcs3-setup.block + firmware GUI step (no discs yet - drive not installed).
7. AirPods pairing wave = etc/omen-airpods-pair.block (optional, operator paces).

Every block: one command per line, console-safe, root blocks start with id -u, rollback named
before forward (STATE.md Rules 1-3, MASTER hardConstraints.consolePaste).
