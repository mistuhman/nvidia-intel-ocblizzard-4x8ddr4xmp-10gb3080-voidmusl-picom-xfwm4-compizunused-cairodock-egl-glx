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
- SoundCloud: HTML5 audio-only player; works on 52-class when TLS 1.2 min is on. If the waveform
  player fails, the mobile UA trick is the same fallback. No DRM on SoundCloud = no EME blocker
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
Where AirPods DO work daily: the OMEN (Void Linux, BlueZ + PipeWire: A2DP playback + HFP mic) and
any phone. The sound-design mic chain (SM7B + CEntrance MicPort Pro + EasyEffects) lives on the
OMEN per STATE.md ("Audio IF | CEntrance MicPort Pro (USB 1c07:0001)") - see
docs/omen-daily-driver.md. "mic working smoothly" is therefore an OMEN-side deliverable, authored
and gated behind gate-12 bench POST.

## 6. Steam / Discord on the Mac: not possible, by receipt

- The current Steam client requires a macOS far newer than 10.7 (Valve progressively dropped
  legacy-OS support from 2019 onward); on Lion it will not install or run. Steam = OMEN track
  (Void nonfree `steam` package template exists: raw.githubusercontent void-packages master
  srcpkgs/steam/template, fetched 2026-09-16).
- Discord desktop = Electron, no Lion build; Discord web needs modern JS+WebRTC that a 52-class
  engine cannot fully run. Vesktop+Vencord = OMEN track (already a system flatpak per STATE.md).

## 7. Daily-driver checklist (Mac)

- [x] one link channel: da.gd/lionone (verified 2026-09-16b: slug+ coshorten OK, page+zip refs
      alive on origin, inbox readable, 18 entries, newest 09-12 FORENSIC1)
- [ ] wipe-harden transcripts (lion-wipe-harden.txt BLOCK1+BLOCK2) - STILL OWED from 2026-09-15
- [ ] AirPort triage wave - docs/lion-airport-triage.md
- [ ] Arctic Fox hardening wave - lion-arcticfox-harden.command (this wave)
- [ ] uBlock legacy XPI install (section 3)
- [ ] YouTube/SoundCloud UA fallback only if a stall is observed (section 4)
- [ ] iTunes audio-CD burn: native, no agent step; burn a test CD-R before the important one
