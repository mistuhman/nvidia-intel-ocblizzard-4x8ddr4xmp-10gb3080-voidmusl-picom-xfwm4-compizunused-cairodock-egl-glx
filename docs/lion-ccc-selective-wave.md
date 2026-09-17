# Lion Bay 2 selective-copy wave — CCC from MX500 → Kingston (session 01a0af07)

**Where we left off (PR #92 merged 2026-09-17i):**
- `disk0 = 240.06 GB KINGSTON S…` GUID confirmed (`GUID_partition_scheme` + EFI 209.7 MB), JHFS+ `Kingston` 239.7 GB, 312.4 MB used — can boot an Intel Mac. Receipt `receipts/absolution/R6/diskutil-list-2026-09-17.md`
- `disk1s2 + disk2s2 = Apple_RAID` survivors; third WD pulled from Bay 2 → **Raid X offline as expected**, intact. Never Erase/Create/Rebuild/Demote on disk1/disk2.
- `disk3s2 = start disk clone` on CT1000MX500SSD 1 TB — **live Lion 10.7.5 boot**, untouched. Has `disk3s3 Recovery HD 650 MB`.
- **Device numbers ≠ bays and shift across boots** — re-read `diskutil list` before any destructive line.

**What this wave is:** a **selective COPY, not a delete**. Nothing on the MX500 is destroyed — items are simply not carried over, MX500 stays bootable as rollback until the Kingston is trusted. Projected new boot ≈ 16.1 GB vs ~209 GiB usable on the single Kingston, ~193 GiB spare. Manifest: **KEEP 64 / 2.75 GB · DROP 87 / 6.69 GB · ASK 0**. Verified by `node tools/lion-migrate-manifest.ts selftest` + `node tools/lion-boot-migrate.ts selftest` (both PASS, wired into `test-all.ts`).

**End state:** Bay 1 = Kingston boot, Bays 2-4 = three WDs → Raid X healthy (E3, the only layout that keeps Raid X). Requires the **endgame move** after soak: move Kingston Bay 2 → Bay 1, return WD Bay 2. Apple boots by blessed volume, not bay.

**One physical action per message** still binds. This entire CCC clone is ONE wave — no second wave ships until its paste-back is read.

---

## Preflight (read-only, paste full output before cloning)

Run in Terminal on Lion (MX500 boot), still in Bay 1:

```
diskutil list
df -h /
df -h /Volumes/Kingston
ls -ld /Users/* /Volumes/Kingston 2>&1 | head -n 50
ls /Users/revo 2>&1 | head -n 20
ls /Applications 2>&1 | wc -l; ls /Applications 2>&1 | head -n 60
```

Gates:
- `diskutil list` row 0 for disk0 still `GUID_partition_scheme` and disk0s1 EFI exists
- `disk0s2 Kingston` still ~239.7 GB, still ~312 MB used (proves the format stuck)
- `disk3s2 start disk clone` still boot, still ~931 GiB with revo present (so the copy has something to exclude)
- `Raid X` shows degraded/offline (expected since Bay 2 pull) — do **not** let Disk Utility "Repair" it
- SMART first: `diskutil info /dev/disk0 | grep SMART` or DriveDx/TechTool if installed — 1607 lot ≈ 9 yr, power-on hours unknown. If SMART is failing, STOP and report before trusting the Kingston.

---

## CCC selective copy — the operator-approved vehicle

Carbon Copy Cloner **is already installed** and is the tool that performs this migration (`com.bombich.ccc` 13 MB, R1 burn). Do NOT use the Lion installer — it refuses RAID targets and cannot make a selective copy. Do NOT use `asr`.

### Source / Destination

- **Source:** `start disk clone` (`/dev/disk3s2`, MX500) — the live Lion volume
- **Destination:** `Kingston` (`/dev/disk0s2`) — the freshly GUID-repartitioned 239.7 GB HFS+

If CCC shows the destination by its disk name without a volume, pick the **volume row** `Kingston`. Never pick a WD.

### Exclusion method — two equivalent paths, pick one

**Path A (recommended, easiest to verify): clone everything, then delete DROP from destination only.**  
This is *identically* selective — the MX500 never loses a byte; the Kingston ends up without the junk.

1. In CCC: **Source = start disk clone**, **Destination = Kingston**, preset = *Backup everything* (clones the whole system plus /Users/el etc.)
2. Run the clone. Let it finish fully; do not interrupt, do not sleep.
3. After clone completes, on the **Kingston volume only** (`/Volumes/Kingston`), delete:
   - `/Volumes/Kingston/Users/revo` (775 GiB — the quota win; it never needed to travel)
   - `/Volumes/Kingston/Users/jazzyempire` (56 K)
   - Every app in the DROP list (`/Volumes/Kingston/Applications/<Name>.app`) — full list below. Do not touch `/Volumes/start disk clone`.

**Path B (pure filter):** in CCC → *Customize* → *Add exclusion* for each of the same paths above and let CCC skip them during the copy. Same result, more clicking.

Both paths satisfy "revo is not copied" and "DROP 87 not copied". Path A is recommended because the delete is visible in `ls` and reversible on the source.

### The 87 DROP apps (delete from `/Volumes/Kingston/Applications/` only)

Each is a reasoned DROP — pro equivalents are KEPT (e.g., iPhoto→Aperture, iMovie→FCP, iDVD→DVD Studio Pro, Chrome/Firefox/Opera/Flock→ArcticFox, Cyberduck/ForkLift→Transmit). `node tools/lion-migrate-manifest.ts drop` is the source of truth if this doc ever drifts.

```
Kid Pix Deluxe 3D.app                  Mavis Beacon Teaches Typing.app      iWeb.app
iPhoto.app                             Machinarium.app                      Braid.app
iMovie.app                             Google Chrome.app                    VMware Fusion.app
LeapFrogConnect.app                    iDVD.app                             Google Earth.app
TomTom HOME.app                        Yahoo! Messenger.app                 Firefox.app
Adium.app                              Flock.app                            MacGourmet Deluxe.app
Adobe AIR Uninstaller.app              NovaMind Platinum.app                Google Chrome 2.app
NovaMind Pro.app                       ffmpegX.app                          Mail.app
Opera.app                              RapidWeaver.app                      Skype.app
iCal.app                               iChat.app                            hueyPRO.app
Leopard Cache Cleaner.app              Garmin WebUpdater.app                Cyberduck.app
Photo Booth.app                        Grapher.app                          Address Book.app
SousChef.app                           MacGourmet.app                       NeatWorks.app
DivX Player.app                        VoiceOver Utility.app                ForkLift.app
Remote Desktop.app                     Eye-Fi Manager.app                   Transmission.app
FaceTime.app                           App Store.app                        Winamp.app
YummySoup!.app                         Mark:Space Notebook.app              SuperSync.app
DivX Converter.app                     Cocktail.app                         CrushFTP4.app
Geekbench.app                          DaisyDisk.app                        CSSEdit.app
Chess.app                              Awaken.app                           WhatSize.app
Mathemagics.app                        iPhoto Library Manager.app           Syncopation.app
Dictionary.app                         MacUpdate Desktop.app                VersionTracker Pro.app
Stickies.app                           TweetDeck.app                        Sponge.app
Mac Pro EFI Firmware Update.app        Adobe Media Player.app               Dupin.app
X11.app                                iStumbler.app                        MacDaddy.app
ATI Radeon HD 2600 XT Firmware Update.app  Google Goggles.app               LCC Update.app
Launchpad.app                          Adobe AIR Application Installer.app  Dashboard.app
Fairmount (for VLC 32 bits).app        LCC Connection Utility.app           Fairmount (for VLC 64 bits).app
LCC Uninstaller.app                    Uninstall Contour Shuttle.app        Evernote.app
```

Plus the two home folders above. Size reclaimed on Kingston: ~6.69 GB + 775 GiB.

### CandyBar + widgets + fonts — do NOT drop these or the keep is broken

Naive `/Applications`-only filtering would silently lose these; the KEEP list explicitly calls them out:

- **CandyBar** lives at `/Users/el/Downloads/CandyBar.app` (plus `Float.icontainer` nearby) — **not** in `/Applications`. Copy it, or Flavours theming breaks.
- **Dashboard widgets:** Dashboard itself is part of the OS, but installed widgets and saved state live at:
  - `widget-com.apple.widget-*.plist` in `/Users/el/Library/Preferences/`
  - `/Library/Widgets/`
  - `/Users/el/Library/Widgets/`
  Miss these and Dashboard comes up empty.
- **`/Users/el` (1.3 GB, uid 502)** and **`/Users/el/Downloads` (256 .icns, 351 MB)** and **`/Users/el/Library/Application Support/Flavours/My Flavours`** and **`/Library/Fonts` + `/Users/el/Library/Fonts`** — all KEEP per manifest.

### What NOT to touch

- Never Erase/Create/Rebuild/Demote any WD (`disk1`, `disk2`) while Raid X is degraded — that destroys the 3 TB stripe.
- Never touch `/dev/disk3` (MX500 boot) — it is the rollback.
- Never touch `disk1s3`/`disk2s3` `Apple_Boot Boot OS X` 134 MB helpers.

---

## Post-clone verification (before declaring the Kingston bootable)

Still on the MX500 boot, Kingston mounted at `/Volumes/Kingston`:

```
df -h /Volumes/Kingston
du -sh /Volumes/Kingston 2>&1 | tail -n 5
ls -ld /Volumes/Kingston/Users/el /Volumes/Kingston/Users/revo 2>&1
ls /Volumes/Kingston/Applications 2>&1 | wc -l
ls /Volumes/Kingston/Applications 2>&1 | grep -E "Final Cut|GarageBand|ArcticFox|CandyBar|Flavours|Transmit" | head -n 20
ls /Volumes/Kingston/Users/el/Downloads/CandyBar.app 2>&1 | head -n 5
ls /Volumes/Kingston/Library/Widgets 2>&1 | head -n 20
ls /Volumes/Kingston/Users/el/Library/Widgets 2>&1 | head -n 20
ls /Volumes/Kingston/Users/el/Library/Preferences/widget-com.apple.widget*.plist 2>&1 | head -n 20
```

Expected:
- `/Volumes/Kingston` used ≈ 16–18 GB (2.75 KEEP + 1.3 el + ~12 OS estimate), not 312 MB anymore
- `/Volumes/Kingston/Users/revo` **does not exist**; `/Volumes/Kingston/Users/el` exists
- `ls /Volumes/Kingston/Applications | wc -l` ≈ 64–70 (not 151)
- `Final Cut Pro`, `GarageBand`, `ArcticFox`, `Transmit`, `Contour Shuttle`, `Flavours`, `AirPort Utility`, `iTunes`, `Carbon Copy Cloner` all present under `/Volumes/Kingston/Applications`
- A DROP probe like `ls /Volumes/Kingston/Applications/Mail.app` → **No such file**; same for Kid Pix, Mavis, Chrome
- CandyBar present at `/Volumes/Kingston/Users/el/Downloads/CandyBar.app`
- Widget plists + Widgets folders present

Paste the full output — the new boot is not trusted until this is read.

---

## Blessing and first boot

Non-destructive. Inverse is still the MX500.

1. Apple menu → System Preferences → **Startup Disk** → select **Kingston** → Restart
2. Observe: must boot without Option key, to `el` desktop. If it falls through to the MX500, re-pick Startup Disk — Apple boots by blessed volume, not bay, so the bay has not mattered yet.
3. Verify on Kingston boot:
   - `el` logs in, Dock is correct, wallpaper/desktop renders
   - **Flavours themes** render (Natural Wood + UUID theme)
   - **CandyBar icons** present
   - **Final Cut Pro / Motion / Compressor** open (licence lives in `/Library/Application Support` — a missing Library copy would break them here)
   - **GarageBand / Audio MIDI Setup** enumerate
   - **ArcticFox + AirPort Utility + Transmit** launch
   - **Dashboard** shows the migrated widgets with their cities/stocks/stickies
   - Audio test via `Audio MIDI Setup` if possible

If anything is missing, **Option-boot** back to MX500 (`start disk clone`) — rollback is one key at power-on. No data has been lost.

---

## Soak before trust

- Several clean boots (cold and warm) from Kingston
- One real editing session (FCP) before the Kingston is trusted
- The MX500 stays in Bay 1, untouched, as complete rollback for as long as you want.

**Do not yet:** move bays, wipe the MX500, or re-add the third WD expectation. Those are the **endgame move** (step 9) and ship as a separate wave after soak.

---

## Recovery HD (worth carrying, not blocking)

Source has `disk3s3 Apple_Boot Recovery HD 650 MB`. A plain CCC volume clone does **not** copy it. CCC can clone Recovery HD as a **separate explicit step** (CCC → Recovery HD task). Worth doing because the destination is a single disk (RAID 0 could never have had one) — it gives Disk Utility + Terminal + reinstall with no external media. Can be done immediately after the volume clone or added later; the clone boots fine without it.

---

## Endgame move (deferred to the next wave)

When Kingston is trusted: shutdown → pull MX500 from Bay 1 → move Kingston Bay 2 → Bay 1 → return WD to Bay 2 → boot → Raid X remounts healthy. Final E3: Bay 1 Kingston boot, Bays 2-4 WDs. **Do not execute this move in the same power cycle as the clone** — one variable at a time.

---

## Tooling

- `node tools/lion-migrate-manifest.ts keep|drop|ask|plan|size` — KEEP/DROP lists with reasons, coverage-gated (ASK 0, 151/151 classified)
- `node tools/lion-boot-migrate.ts bay2` — 10 ordered Bay 2 steps (mount shim, partition GUID, copy, bless, soak, endgame)
- `node tools/lion-boot-migrate.ts check|endstate` — capacity/bay arithmetic and single-disk boot re-estimate
- `receipts/absolution/R6/diskutil-list-2026-09-17.md` — GUID + degraded-as-expected receipt

**Nothing is armed by this document.** Every destructive choice still requires an explicit operator paste-back gate.

