# Lion Bay-2 CCC — MX500 → Kingston (01a0af07, 2026-09-17j)
**PR #92 merged:** disk0 KINGSTON 240.06 GB GUID (GUID_partition_scheme+EFI 209.7 MB, Kingston 239.7 GB 312 MB used, bootable Intel HFS+). R6 `receipts/absolution/R6/diskutil-list-2026-09-17.md`. disk1s2+disk2s2 Apple_RAID survivors (WD Bay2 pulled → Raid X offline expected — never Erase/Create/Rebuild/Demote disk1/disk2). disk3s2 start disk clone (MX500 1 TB, Lion 10.7.5 live, +Recovery HD 650 MB). **Device numbers ≠ bays** — re-read `diskutil list` before any destructive line.
**Wave:** selective COPY not delete — MX500 untouched/rollback until Kingston trusted. New boot ~16.1 GB vs ~209 GiB usable (~193 spare). Manifest KEEP 64/2.75 GB DROP 87/6.69 GB ASK 0 — `node tools/lion-migrate-manifest.ts selftest`+`lion-boot-migrate.ts selftest` PASS (test-all). End state E3: Bay1 Kingston boot, Bays2-4 WDs → Raid X healthy (endgame move Bay2→Bay1+WD back deferred to soak). **One wave only** — no next wave until paste-back read.

---
## Preflight (read-only, paste full output before clone, Lion MX500 Bay1)
```
diskutil list
df -h /; df -h /Volumes/Kingston
ls -ld /Users/* /Volumes/Kingston 2>&1 | head -n 50
ls /Users/revo 2>&1 | head -n 20
ls /Applications 2>&1 | wc -l; ls /Applications 2>&1 | head -n 60
```
Gates: disk0 row0 GUID+EFI; disk0s2 Kingston ~239.7 GB ~312 MB used; disk3s2 start disk clone ~931 GiB with revo; Raid X degraded/offline (do not Repair); SMART `diskutil info /dev/disk0 | grep SMART` (1607 lot ~9 yr) — FAIL→STOP.

---
## CCC — operator-approved vehicle
CCC already installed (`com.bombich.ccc` 13 MB, R1). Do NOT use Lion installer (refuses RAID) or `asr`.
- **Source:** `start disk clone` (/dev/disk3s2 MX500 live)
- **Destination:** `Kingston` (/dev/disk0s2 239.7 GB HFS+) — pick volume row, never WD.

### Paths (pick one, same result)
**Path A (recommended): clone everything → delete DROP from /Volumes/Kingston only** — visible in `ls`, reversible on source. 1) CCC Source=start disk clone, Dest=Kingston, Backup everything 2) Run full, no sleep 3) Delete on Kingston only: `/Volumes/Kingston/Users/revo` (775 GiB) + `/Volumes/Kingston/Users/jazzyempire` (56 K) + DROP 87 apps below. Never touch `/Volumes/start disk clone`.
**Path B (filter):** CCC Customize → Add exclusion per same paths, skip during copy. Path A recom. because delete is verifiable.

### DROP 87 (delete from /Volumes/Kingston/Applications/ only)
Reasoned DROP — pro KEPT e.g. iPhoto→Aperture, iMovie→FCP, iDVD→DVD Studio Pro, Chrome/Firefox/Opera/Flock→ArcticFox, Cyberduck/ForkLift→Transmit. `node tools/lion-migrate-manifest.ts drop` is truth if doc drifts.
```
Kid Pix Deluxe 3D, Mavis Beacon, iWeb, iPhoto, Machinarium, Braid, iMovie, Google Chrome, VMware Fusion, LeapFrogConnect, iDVD, Google Earth, TomTom HOME, Yahoo! Messenger, Firefox, Adium, Flock, MacGourmet Deluxe, Adobe AIR Uninstaller, NovaMind Platinum, Google Chrome 2, NovaMind Pro, ffmpegX, Mail, Opera, RapidWeaver, Skype, iCal, iChat, hueyPRO, Leopard Cache Cleaner, Garmin WebUpdater, Cyberduck, Photo Booth, Grapher, Address Book, SousChef, MacGourmet, NeatWorks, DivX Player, VoiceOver Utility, ForkLift, Remote Desktop, Eye-Fi Manager, Transmission, FaceTime, App Store, Winamp, YummySoup!, Mark:Space Notebook, SuperSync, DivX Converter, Cocktail, CrushFTP4, Geekbench, DaisyDisk, CSSEdit, Chess, Awaken, WhatSize, Mathemagics, iPhoto Library Manager, Syncopation, Dictionary, MacUpdate Desktop, VersionTracker Pro, Stickies, TweetDeck, Sponge, Mac Pro EFI Firmware Update, Adobe Media Player, Dupin, X11, iStumbler, MacDaddy, ATI Radeon HD 2600 XT Firmware Update, Google Goggles, LCC Update, Launchpad, Adobe AIR App Installer, Dashboard, Fairmount VLC 32, LCC Connection Utility, Fairmount VLC 64, LCC Uninstaller, Uninstall Contour Shuttle, Evernote
```
+ 2 homes above. Reclaimed ~6.69 GB+775 GiB. (Full .app names with .app suffix in tool output; this line is compact phone-readable.)

### Exceptions — naive /Applications filter breaks KEEP
- **CandyBar** at `/Users/el/Downloads/CandyBar.app` (+Float.icontainer) — NOT in /Applications, must carry or Flavours fails.
- **Widgets:** `widget-com.apple.widget-*.plist` in `/Users/el/Library/Preferences/` + `/Library/Widgets/` + `/Users/el/Library/Widgets/` — miss → Dashboard empty.
- **KEPT:** `/Users/el` 1.3 GB + `/Users/el/Downloads` 256 .icns 351 MB + `/Users/el/Library/Application Support/Flavours/My Flavours` + `/Library/Fonts` + `/Users/el/Library/Fonts`.
### Do NOT touch
WD disk1/disk2 while degraded, /dev/disk3 MX500 rollback, disk1s3/disk2s3 Apple_Boot 134 MB helpers.

---
## Post-clone verification (MX500 boot, Kingston at /Volumes/Kingston, before bless)
```
df -h /Volumes/Kingston; du -sh /Volumes/Kingston 2>&1 | tail -n 5
ls -ld /Volumes/Kingston/Users/el /Volumes/Kingston/Users/revo 2>&1
ls /Volumes/Kingston/Applications 2>&1 | wc -l
ls /Volumes/Kingston/Applications 2>&1 | grep -E "Final Cut|GarageBand|ArcticFox|CandyBar|Flavours|Transmit" | head -n 20
ls /Volumes/Kingston/Users/el/Downloads/CandyBar.app 2>&1 | head -n 5
ls /Volumes/Kingston/Library/Widgets 2>&1 | head -n 20; ls /Volumes/Kingston/Users/el/Library/Widgets 2>&1 | head -n 20
ls /Volumes/Kingston/Users/el/Library/Preferences/widget-com.apple.widget*.plist 2>&1 | head -n 20
```
Expect: used 16–18 GB; /revo gone, /el exists; Apps 64–70 not 151; FCP/GarageBand/ArcticFox/Transmit/Contour Shuttle/Flavours/AirPort/iTunes/CCC present; Mail/Kid Pix/Chrome gone; CandyBar+Widgets present. Paste full output — not trusted until read.

---
## Bless + first boot (non-destructive, MX500 still rollback)
1) System Prefs → Startup Disk → Kingston → Restart (bypasses Option, boots by volume not bay) 2) Verify el desktop, Flavours (Natural Wood+UUID), CandyBar icons, FCP/Motion/Compressor, GarageBand/Audio MIDI, ArcticFox/AirPort/Transmit, Dashboard widgets, audio. Fail → Option-boot back to MX500.

## Soak, Recovery, Endgame, Tooling
Soak: several cold/warm boots + one FCP session before trust. MX500 stays untouched rollback. Do NOT yet move bays/wipe MX500/re-add WD — next wave after soak.
Recovery HD: disk3s3 650 MB not copied by volume clone; CCC can clone it separately (worth doing on single-disk Kingston for Disk Utility/Terminal). Can be later.
Endgame (deferred): shutdown → MX500 out Bay1 → Kingston Bay2→Bay1 → WD back Bay2 → Raid X healthy E3.
Tooling: `lion-migrate-manifest.ts keep|drop|ask|plan|size` (ASK0 151/151), `lion-boot-migrate.ts bay2|check|endstate`, R6 receipt above. **Nothing armed** — destructive choices need explicit paste-back gate.
