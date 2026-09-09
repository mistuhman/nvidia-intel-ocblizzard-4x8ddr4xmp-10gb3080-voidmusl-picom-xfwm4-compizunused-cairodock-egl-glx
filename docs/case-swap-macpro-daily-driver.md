# Mac Pro 1,1 daily-driver — legacy-Mac browser bootstrap (session 01a085aa, 2026-09-09)

Companion to `docs/case-swap-macpro-plan.md` PIVOT 2026-09-08i (keep-as-Mac). This file is
the **operator-verified** recipe for getting a modern-engine web browser onto the assembled
Mac Pro 1,1 running Mac OS X **10.6.8 Snow Leopard**, starting from a machine whose only
browser is dead Safari 5.1.10. Every step here was executed on the target and confirmed by
photo receipt this session.

## State correction (supersedes the stale repo note)

The repo (`case-swap-macpro-plan.md` Track A, `MASTER.md` latestReceipts) had the Mac logged
as **mid-reassembly** (R0 owed: risers/sleds/DVD out). **That is wrong as of 2026-09-09.**
Operator confirmed and photo-verified: the Mac Pro is **fully assembled, booted, and online**,
running Snow Leopard 10.6.8, with AirPort Utility 6.x already seeing the Time Capsule
("Smart Happy Time Capsule", 10.0.1.1, fw 7.8.1, AirPort ID B8:C7:5D:0A:D0:98). Hostname on
the box: `RevolYOUtionarys-Mac-Pro` (scrub during the anonymity pass). So "AirPort browsing
freedom" is effectively already demonstrated; the daily-driver work is software from here.

## OS ceiling reality (decides every app)

- Mac Pro 1,1 (A1186, 2006) hard ceiling: **10.6.8 native**, El Capitan **10.11 max** via the
  Piker-Alpha boot.efi hack. Operator's current call: stay on 10.6.8 for now, "modernize with
  mods / source ports," push anonymity at the OS/network layer.
- **Libreboot/coreboot is NOT available for the Mac Pro tower** — coreboot supports only the
  MacBook 1,1/2,1 (A1181) laptops, which share nothing with the 5000X-chipset tower. The
  "flash Libreboot from 10.6.8" trick is the *MacBook*, constantly conflated. Anonymity goal
  does not need firmware freedom; it lives at OS/network (MAC randomization, hostname scrub,
  no telemetry, VPN/Tor, egress control, RAM/cache-wipe scripts).
- Native chat/voice stack (Element, Vesktop/Discord) requires macOS 10.15/12+ — impossible on
  this Mac at any supported OS. Path for that stack = web apps in a modern legacy browser, or
  keep it on the Linux/APEX box.

## The bootstrap chain (all steps operator-verified this session)

1. **Dead Safari can still reach macintoshrepository.org.** That site detects old Macs and
   serves plain HTTP ("SSL has been deactivated for you"), bypassing Safari 5.1.10's dead
   TLS 1.0. This is the only reliable download beachhead from a bone-stock 10.6.8 box.
2. **First browser = TenSixFox** (TenFourFox Intel build, 10.6–10.8), from
   `macintoshrepository.org/47026-...`. Served as a self-contained `.app.zip` (Safari
   auto-unzips, then deletes the zip — so `shasum` on the zip afterward fails; that's normal,
   not corruption). Newer TLS than Safari → can reach GitHub. But its ~2016 Firefox 45 engine
   is too old to fully *drive* modern SPAs: it renders Arena but cannot send messages / open
   the sidebar / log in. It is the bootstrap, not the daily driver.
3. **Clock trap.** The PRAM/CMOS battery (CR2032) is dead → clock resets to **2001-01-01** on
   every power-loss. Modern HTTPS certs then read as "not yet valid"
   (`SEC_ERROR`/`MOZILLA_PKIX_ERROR_NOT_YET_VALID_ISSUER_CERTIFICATE`), and GitHub's HSTS
   forbids adding an exception → hard wall in the browser. Fix (reversible, touches no files):
   `sudo date MMDDhhmmYY` (e.g. `sudo date 0909001226` = 2026-09-09 00:12). **Replace the
   CR2032 during the hardware pass** so this stops recurring. NOTE: a wrong clock will also
   break a clean OS install (installer signature/date checks) — fix it *before* any reinstall.
4. **`curl` is a dead end on 10.6.8.** System curl speaks only TLS 1.0; GitHub requires
   TLS 1.2 → `curl: (35) SSL23_GET_SERVER_HELLO:tlsv1 alert protocol version`. This is
   upstream of cert validation, so `-k` and the clock are irrelevant. Use the *browser*
   (TenSixFox, with the clock fixed) to pull from GitHub, not curl.
5. **Daily driver = Arctic Fox** (`github.com/rmottola/Arctic-Fox`, NOT `wicknix/AF-OSX-PPC`
   which is PowerPC-only). Latest v47.3 (2026-07-29). Pick the build by arch:
   - Wrong: any `linux`, `powerpc`, `netbsd`, `sparc64`, `mac64-10.7`, `mac64-10.9`.
   - `mac64-10.6.dmg` (64-bit) is the natural pick BUT is **broken on 10.6**: the bundled
     `libc++.from.MP.10.6.mac64.zip` is missing the `___emutls_get_address` symbol, so the
     64-bit browser dies with `dyld: Symbol not found: ___emutls_get_address` (repo issue
     #214; multiple 10.6.8 users confirm). Only a full MacPorts libcxx install fixes the
     64-bit build — heavy, not worth it.
   - **WINNER: `arcticfox-47.3.en-US.mac32-10.6.dmg` (32-bit)** + its matching
     **`libc++.from-MP.10.6.mac32.zip`** (v44.0 assets). Confirmed launching on this target.
6. **libc++ install.** Snow Leopard ships without libc++. Unzip the *matching-arch* libc++
   into BOTH `/usr/lib` and `/usr/local/lib` (the 10.6.8-confirmed location per repo issue
   #162):
   ```
   cd /usr/lib
   sudo unzip -o ~/Downloads/libc++.from-MP.10.6.mac32.zip
   cd /usr/local/lib
   sudo unzip -o ~/Downloads/libc++.from-MP.10.6.mac32.zip
   ```
   FILENAME TRAP: the 32-bit zip is `libc++.from-MP...` (hyphen); the 64-bit is
   `libc++.from.MP...` (dot). Easy to fat-finger; a wrong name silently downloads nothing.
7. **Diagnosing launch failure:** Finder's "cannot be opened because of a problem" dialog is
   useless — it's the generic dyld-load failure and never names the cause. Run the binary
   directly to get the real error:
   `/Applications/ArcticFox.app/Contents/MacOS/arcticfox`
   That prints the exact `dyld: Symbol not found` / `Library not loaded` line.
8. **First run:** Arctic Fox shows an Import Wizard → choose **"Don't import anything"** (do
   not drag dead-Safari state into the clean browser, especially given anonymity goals). The
   `__NSAutoreleaseNoPool` lines in Terminal are harmless startup chatter.

RESULT 2026-09-09: Arctic Fox 47.3 mac32 launched on the target (Import Wizard reached).
Pending operator confirm: Arena fully drivable (send message / sidebar / login) in it.

## Next tracks (gated, one at a time)

- **A. Anonymity / hardening pass:** scrub `RevolYOUtionarys-Mac-Pro` hostname, MAC
  randomization, disable the failing Software Update (the "Rosetta can't be installed" nag),
  kill telemetry, egress control, VPN/Tor.
- **B. RAM-clearing / cache-wipe shell scripts** (Sorbet-style): `purge`, cache flush,
  secure-erase-free-space, logout hooks.
- **C. Audio for calling:** SM7B → CEntrance MicPort Pro (class-compliant, driverless on
  10.4+) → Mac. System-wide EQ/DSP (EasyEffects analog) needs a virtual-device + DSP host;
  the modern stack (Loopback/SoundSource/Audio Hijack) needs 10.11+, so on 10.6.8 it's
  Soundflower + Audio Hijack Pro 2.x (routing yes, modern noise-suppression no).
- **D. Source ports** (titles TBD by operator).
- **E. DESTRUCTIVE — drive backup → swap → wipe → clean install → new admin account.**
  Operator's stated flow: back up currently-installed drives to the removable HDD sleds,
  clean the boot drive, swap in new drives, install OS on the new set, create new admin user,
  then wipe the old removed drives. NOT started; needs a confirmed drive-by-drive plan and
  the clock fixed first (installer date checks). `zpool export` / by-id / one-drive-per-power
  rules apply if any pool drives are involved.
- **F.** Only then back to the APEX (gate 12 bench POST, unchanged).
