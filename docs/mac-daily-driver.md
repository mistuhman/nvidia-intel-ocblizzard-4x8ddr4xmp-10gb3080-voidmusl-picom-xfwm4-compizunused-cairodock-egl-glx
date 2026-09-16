# Mac daily driver — Arctic Fox hardening, modern web, audio reality (2026-09-16)

Machine: Mac Pro 3,1 Early 2008, Lion 10.7.5 on Bay 1 "Lion SSD Base", GTX 285 dual displays,
admin Samael. Operator state 2026-09-16 verbatim: "been using the mac for a bit, added candybar,
flavours, some itunes stuff and im gonna be burning music to the cd" + "mostly need to get stuff
like ublock, modern web, youtube, soundcloud, airpod gen 2's and mic working smoothly. making it
daily drivable". This doc records the app state, the browser hardening wave, and what is
physically possible on this hardware, each claim with its receipt.

## 1. Installed-state record (operator report 2026-09-16)

| Item | State | Note |
|---|---|---|
| CandyBar | installed (operator) | icon/theme tool, working per operator; config-only, no agent action needed |
| Flavours | installed (operator) | theming companion; same class as CandyBar. No agent action needed |
| iTunes | installed + library growing (operator) | Lion ships iTunes 10.x; audio-CD burn is native: select playlist -> File > Burn Playlist to Disc -> Audio CD. Use CD-R at <=16x if burns fail at high speed |
| Arctic Fox 47.3 mac32 | installed, launched, agent-channel proven | v47.3 IS the current upstream release (released 2026-07-29, github.com/rmottola/Arctic-Fox/releases v47.3). mac32 sha256 1534d71bf33fa95dfdc78c0e7dc4ba9d78731c54d155e2aa4cef06cab9908c30; the mac64-10.7 build sha256 16667520f9352eca3c944c5620d2cb91ce7727d6fb350dbbdeefb8b6233a4566 exists but is BROKEN on this Mac (missing ___emutls_get_address, upstream issue #214) - stay on mac32 |
| AirPort Utility 6.3.1 | installed (operator 2026-09-15) | see docs/lion-airport-triage.md |

Rule carried from MASTER lionMac: hardening is CONFIG-ONLY and KEEPS Arctic Fox. No browser
replacement, no system-file patching, no SIP-era tricks (Lion has none).

## 2. Arctic Fox hardening wave (ships as lion-arcticfox-harden.command, double-click, no sudo)

What the helper does: finds the Arctic Fox profile (prefs.js under
~/Library/Application Support/ArcticFox), backs up prefs.js once to prefs.js.prehardened and any
existing user.js to user.js.prehardened, writes a user.js with the pref list below, then writes
~/Desktop/lion-arcticfox.txt (LIONARCTIC1 ... LIONARCTIC1_DONE) and opens it for the One-page Burn.
It changes no disk, no NVRAM, no clock, no network. Removal = delete user.js (prefs.js backup
stays as the rollback).

user.js pref set (all keys valid on Firefox-52-class Goanna; Arctic Fox is a Pale-Moon-lineage
fork per udger browser id 869 + upstream repo):

| Pref | Value | Why |
|---|---|---|
| security.tls.version.min | 3 | refuse TLS < 1.2; modern web (YouTube/SoundCloud/GitHub) already demands 1.2+ |
| network.cookie.cookieBehavior | 1 | reject third-party cookies |
| privacy.trackingprotection.enabled | true | built-in tracking protection (FF52 key) |
| privacy.donottrackheader.enabled | true | send DNT |
| geo.enabled | false | no geolocation prompts/leaks |
| dom.battery.enabled | false | battery API off (FF52 key) |
| browser.cache.offline.enable | false | drop offline-cache site storage |
| dom.event.clipboardevents.enabled | false | sites cannot watch clipboard events |
| security.warn_entering_secure | false / security.warn_leaving_secure | false | kill click-through noise on a 2026 web that is TLS-everywhere |
| xpinstall.signatures.required | false | REQUIRED to install the legacy uBlock XPI (unsigned). Deliberate, scoped tradeoff: only install XPIs from the exact URLs in section 3 |
| media.peerconnection.enabled | false (COMMENTED in user.js) | WebRTC IP leak guard; commented because 47.3 backports WebRTC webcam and the operator may want calls. Uncomment = leak-proof, webcam-calls dead |
| security.OCSP.require | false (COMMENTED) | hard-OCSP would break many legacy-cert sites on this box; left off |

After writing user.js: restart Arctic Fox, then verify in about:config that
security.tls.version.min reads 3 and network.cookie.cookieBehavior reads 1 (user.js prefs show as
locked/bold). Paste or burn the about:config reads with the report if anything reads differently.

## 3. uBlock Origin (operator: "ublock")

Receipt: uBlock legacy branch (gorhill/uBlock-for-firefox-legacy) is the maintained XUL line for
FF45-52-class browsers; legacy update.xml currently serves 1.16.4.30; MSFN receipt: uBO >=1.17 is
WebExtension-only and will NOT run on FF52-class; WebRTC leak blocking only works on the legacy
branch on FF52.

Install (Arctic Fox GUI, not Terminal):
1. Tools/Add-ons -> gear -> "Install Add-on From File..." OR open the URL directly:
   https://github.com/gorhill/uBlock-for-firefox-legacy/releases/download/firefox-legacy-1.16.4.30/uBlock0_1.16.4.30.firefox-legacy.xpi
2. Accept the unsigned-add-on prompt (works because xpinstall.signatures.required=false).
3. Keep the default filter lists; do not add experimental lists on this CPU-weak box.

## 4. Modern web / YouTube / SoundCloud on a 52-class engine

Facts with receipts:
- Arctic Fox 47.3 release notes (2026-07-29): "network & security updates", "assorted updates to
  media, gfx & js, css, devtools", WebGL fixed on 10.6/10.7, WebRTC webcam backport "to be
  evaluated in 47.3". It is the newest engine that runs on Lion at all; there is no Chrome/Safari
  path (Safari 6 on Lion is TLS-1.2-at-best and unpatched since 2015).
- YouTube on old Gecko: the desktop player rotates breakages; the proven fallback class is a
  per-site user-agent override to a mobile/Safari UA so YouTube serves its lighter player
  (receipt: about:config key useragent.override.youtube.com with an iPad Safari UA fixed YouTube
  playback on Arctic Fox-class engines, Hyperion forum Arctic Fox thread). If videos stall or
  "something went wrong": set useragent.override.youtube.com =
  Mozilla/5.0 (iPad; CPU OS 10_2_1 like Mac OS X) AppleWebKit/602.4.6 (KHTML, like Gecko) Version/10.0 Mobile/14D27 Safari/602.1
  and retry; m.youtube.com is the expected landing.
- SoundCloud: HTML5 audio-only player, no DRM - EXPECTED to work on 52-class with TLS 1.2 min
  (unverified first-hand as of 2026-09-16; verify on first visit and report back - it is a
  flagged expectation, not a receipt). If the waveform player stalls, the same mobile-UA
  fallback as YouTube applies. No DRM on SoundCloud = no EME blocker
  (Arctic Fox has NO DRM/EME at all: receipt reddit r/mac Arctic Fox thread - "doesn't support
  any kind of DRM"). Consequence: Spotify web / Netflix / Prime will NEVER play here; iTunes and
  local files remain the music path (operator's CD burn plan fits).
- GitHub/da.gd/webhook.site: proven working from this browser (the whole one-link channel runs
  through it, inbox UA receipts).

## 5. AirPods gen 2 + mic: the hardware truth

Receipts: Apple compatibility (AirPort/Apple Community 253010466): 1st-gen AirPods need macOS
>=10.12, 2nd-gen need macOS >=10.14; MagicPods doc: any AirPods require Bluetooth 4.0+ hardware.
Mac Pro 3,1 = Bluetooth 2.0+EDR, and Lion predates the AirPods pairing stack.
VERDICT: AirPods gen 2 CANNOT pair with this Mac - not a config fault, no dongle fixes the OS
stack on 10.7. Daily-driver audio on the Mac = wired/USB audio (built-in jacks, USB DAC) or the
speakers already connected (ToDo 2026-09-15).
Where AirPods DO work daily: any phone or a modern Mac/PC (the Void OMEN included) - not this Mac.
The sound-design mic chain (SM7B + CEntrance MicPort Pro) is MAC-SIDE per operator correction
2026-09-16d verbatim: "no, you completely misunderstood. this is all on mac os x lion. not the
void pc whatsoever". The STATE.md row "Audio IF | CEntrance MicPort Pro (USB 1c07:0001)" is stale
as to host and is logged as a discrepancy in agent-memory. The Lion chain = section 9 below
(CoreAudio UAC1 + Audacity 2.4.2 + Apple Audio Units); "mic working smoothly" is a Mac-side
deliverable, and its wave is queued in etc/lion-command.txt.

## 6. Steam / Discord on the Mac: not possible, by receipt

- The current Steam client requires a macOS far newer than 10.7 (Valve cut Lion/Mountain Lion/
  Mavericks/Yosemite support on 2019-01-01 and the modern floor is 10.15-class; receipts below in
  section 8); on Lion it will not install or run. Full matrix + what replaces it: section 8.
- Discord desktop = Electron, no Lion build; Discord web needs modern JS+WebRTC that a 52-class
  engine cannot fully run. Vesktop+Vencord = same Electron class. Matrix + substitutes: section 8.

## 7. Daily-driver checklist (Mac)

- [x] one link channel: da.gd/lionone (verified 2026-09-16b: slug+ coshorten OK, page+zip refs
      alive on origin, inbox readable, 18 entries, newest 09-12 FORENSIC1)
- [ ] wipe-harden transcripts (lion-wipe-harden.txt BLOCK1+BLOCK2) - STILL OWED from 2026-09-15
- [ ] AirPort triage wave - docs/lion-airport-triage.md
- [ ] Arctic Fox hardening wave - lion-arcticfox-harden.command (this wave)
- [ ] uBlock legacy XPI install (section 3)
- [ ] YouTube/SoundCloud UA fallback only if a stall is observed (section 4)
- [ ] iTunes audio-CD burn: native, no agent step; burn a test CD-R before the important one
- [ ] Mic chain wave (section 9): Audacity 2.4.2 + Sound pref input + login item + monitor path
- [ ] Parked-with-receipt review (section 10): operator names a modern host or accepts substitutes

## 8. App-stack feasibility matrix, ALL MAC-SIDE per correction 2026-09-16d

Operator correction verbatim: "no, you completely misunderstood. this is all on mac os x lion. not
the void pc whatsoever". Latest instruction wins: every item below is judged on Lion 10.7 on the
Mac Pro 3,1. Where a named binary cannot exist on Lion, the substitute is named in the same row -
no requirement is silently dropped.

| Named item | Lion 10.7 verdict | Receipt | Substitute / plan |
|---|---|---|---|
| Steam | IMPOSSIBLE (client support for 10.7 ended 2019-01-01; modern floor 10.15-class) | Valve notice via Steam forum 1744479063984354544; current-minimum Catalina per Steam forum 4030223998577542894 | Native Mac games + source ports (the keep-as-Mac pivot's own list); GOG/old retail installs where licensed; Steam library stays on whatever modern host you name |
| Vesktop / Discord + Vencord | IMPOSSIBLE as clients (Discord app floor was already 10.10 in 2016 and is macOS 11-class now; Vesktop = modern Electron; Vencord needs Discord web/app which a 52-class engine cannot parse) | r/discordapp 44zuew (10.10 hard cap, "no way around"); r/discordapp 1jdy0oc + 1qth63l (minimum macOS 11, 2026) | Discord stays on phone/modern machine; Mac-side chat substitute = none native (do not install junk clients); if a text bridge is ever wanted it needs a host you name (section 10) |
| EasyEffects (pitch/eq/noise-suppression) | BINARY IMPOSSIBLE (Linux/PipeWire-only: Void template short_desc "Sound effects for systems using PipeWire"); the CAPABILITIES are possible natively, see section 9 | void-packages easyeffects template (fetched 2026-09-16); easyeffects upstream is PipeWire/Linux | Lion chain section 9: Audacity 2.4.2 (EQ, pitch shift, noise reduction offline, playthrough monitor) + Apple-shipped Audio Units (AUParametricEQ/AUNBandEQ = eq, AUPitch = pitch, AUDynamicsProcessor gate = real-time noise gate); real-time RNNoise-class suppression does not exist on Lion - offline NR in Audacity is the honest equivalent |
| RPCS3 + PS3 discs/BD drive | IMPOSSIBLE on Lion (RPCS3 needs macOS 12+/15-class, AVX2-class CPU, Vulkan/Metal GPU; the 3,1's GTX 285 has neither Vulkan nor Metal) | rpcs3.net/requirements 2026 table (macOS 15 minimum column, macOS 12 in quickstart mirrors); tech-insider 2026 requirement recap (AVX2 non-negotiable) | The disc/dump/key plan in docs/omen-daily-driver.md section 4 stays VALID AS DOCUMENTATION for the future modern host you name; on Lion nothing emulates PS3 |
| SM7B + CEntrance MicPort Pro | WORKS NATIVE (USB Audio Class 1 = CoreAudio class driver; STATE.md already records 1c07:0001 UAC1 "12 Mbit full-speed is CORRECT") | STATE.md audio row; USB-IF UAC1 support in CoreAudio since 10.0-era | Section 9 chain |
| uBlock / modern web / YouTube / SoundCloud | POSSIBLE (sections 3-4) | as cited above | as cited above |
| AirPods gen 2 | IMPOSSIBLE on this Mac (section 5) | Apple compat matrix + BT4.0 requirement | phone/modern machine |

## 9. Lion sound-design chain: SM7B -> MicPort Pro -> CoreAudio -> Audacity/AUs

Signal path: SM7B (dynamic, ~-60 dBV class) -> MicPort Pro hardware preamp (set hardware gain so
loudest shout peaks one notch below red) -> USB UAC1 -> CoreAudio input device "MicPort Pro".
Lion remembers the chosen default input across reboots (System Preferences > Sound > Input), and
CoreAudio hot-plugs UAC1 devices on connect - that IS "interfaced upon every reboot and usable
every time the mic is connected" natively; no daemon needed. What needs authoring is only the
processing + monitoring layer:

1. Audacity 2.x line, ladder 2.4.2 -> 2.1.3 -> 2.0.6 (first that installs AND runs on this box).
   Audacity's 2.x-era OSX notes say "OS X 10.7 Lion and later"; the exact last 10.7-capable build
   is UNVERIFIED first-hand, hence the ladder (audacityarchive.org keeps every old build;
   macintoshrepository is the proven SSL-off HTTP route from docs/case-swap-macpro-daily-driver.md).
   3.x needs 10.13+ per current download pages - do not waste a download on it. Gives:
   Equalization filter (eq), Change Pitch / Pitch shift (pitch), Noise Reduction (offline noise
   suppression), software playthrough (monitoring).
2. Real-time inserts (if you want eq/pitch live, not per-recording): Apple ships Audio Units on
   Lion - AUParametricEQ / AUNBandEQ (eq), AUPitch (pitch), AUDynamicsProcessor (gate = the
   real-time noise-suppression substitute). Host them in AU Lab if present on this unit (Apple's
   Core Audio host of the 10.7 era; presence UNVERIFIED here), or in GarageBand '11 if iLife '11
   is installed on this unit (it does not ship with the OS - verify before relying on it), or
   skip live inserts and use Audacity per-recording (fully sufficient for sound design).
3. Monitoring / "feedback for calls": prefer the MicPort Pro's own hardware direct monitor
   (zero latency, OS-independent - confirm the monitor control on your unit); software fallback =
   Audacity software playthrough or AU Lab monitoring, HEADPHONES ONLY (speaker monitoring howls).
   Calls on Lion (FaceTime/Skype-class) take the system default input, i.e. the MicPort, with no
   extra config once Sound pref input is set.
4. Per-boot nicety (optional, config-only): add the monitor host to login items so monitoring is
   up at login: osascript System Events make login item (pasteable line ships in the wave).

Wave (queued in etc/lion-command.txt item 4, ships after the open Wave-1 receipts land):
Sound pref input=MicPort Pro (GUI, one click) -> Audacity 2.4.2 install from the named source ->
set Audacity recording device = MicPort Pro, playthrough on with headphones -> optional login-item
line -> receipt = lion-one.command burn (it already captures system_profiler SPAudioDataType) plus
one 10-second test recording pasted description (levels, noise floor with gate/NR on).

## 10. Parked-with-receipts (needs one operator decision)

Four named binaries cannot exist on Lion at all: Steam, Discord/Vesktop+Vencord, EasyEffects,
RPCS3 (matrix above). Their plans are authored and receipt-backed but HOSTLESS now that the Void
PC is excluded by the 2026-09-16d correction: docs/omen-daily-driver.md (demoted to fallback-host
plan, bannered) holds the Steam/RPCS3/AirPort-free blocks; section 9 covers everything Lion can
actually do for the mic. The single open decision: name the modern host (future machine? console-
adjacent PC? the Void box as a deliberate exception?) or accept "parked until such a host exists".
Nothing is dropped: the BD-drive PS3 plan, the redump-key procedure and the drive-compatibility
rule all survive verbatim for that host.
