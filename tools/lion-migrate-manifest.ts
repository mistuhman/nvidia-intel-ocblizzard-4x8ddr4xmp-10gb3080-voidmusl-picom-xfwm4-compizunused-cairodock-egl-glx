#!/usr/bin/env node
// lion-migrate-manifest.ts - WHAT gets carried onto the new boot disk, decided as data.
//
// Operator directive 2026-09-17d: "i can temporarily replace the hdd's with the two ssd's. then we
// clean the boot drive, copy only the essential boot items and what i specifically asked for last
// chat, keep the other ssd installed. select which software to keep from there"
//
// "what i specifically asked for last chat" is not paraphrased here. It is the recorded verbatim:
//   seq 142: "keep candybar+flavours ... keep themes/icons/downloads dirs ... wipe apps excluding
//             candybar and flavours and airport arctic etc"
//   seq 151: "delete games ... all software thats not professional software and absolutely
//             necessary for video editing and audio interfacing then delete it"
//             "+ delete the tertiary accounts, not mine, which is Samael/admin"
//             "sweep winamp, i want to use a classic source port of it w cd features and the skins"
//   seq 153: "use the icons and img textures i downloaded on my el admin account"
//
// THE REFRAME THAT MAKES THIS SAFE: a selective COPY is not a delete. Nothing on the MX500 is
// destroyed by building a new boot disk - items are simply not carried over. The MX500 stays
// intact and bootable as a fallback until the operator explicitly wipes it. This also removes the
// capacity blocker: revo's 775 GiB does not have to be deleted first, it just is not copied.
//
// Usage: node tools/lion-migrate-manifest.ts <keep|drop|plan|size|selftest>

import { readFileSync } from 'node:fs';

export type Cls = 'KEEP' | 'DROP' | 'ASK';
export type App = { name: string; size: string; mb: number; cls: Cls; why: string };

const mb = (s: string): number => {
  if (s === '—') return 0; // not in /Applications, so the R1 burn has no size for it
  const n = parseFloat(s);
  if (/G$/.test(s)) return n * 1024;
  if (/K$/.test(s)) return n / 1024;
  if (/^0B$/.test(s)) return 0;
  return n;
};
const A = (name: string, size: string, cls: Cls, why: string): App => ({ name, size, mb: mb(size), cls, why });

// ---------------------------------------------------------------- the manifest
// Source of every size/name: receipts/absolution/R1/burn-2026-09-17.txt (150 apps).
export const APPS: App[] = [
  // --- named by the operator, explicitly ---
  A('CandyBar', '—', 'KEEP', 'operator named (seq 142). Lives in /Users/el/Downloads/CandyBar.app, not /Applications'),
  A('Flavours', '68M', 'KEEP', 'operator named (seq 142) - theming engine; My Flavours themes in el Library'),
  A('ArcticFox', '102M', 'KEEP', 'operator named (seq 142) - the working modern-ish browser on Lion'),
  A('AirPort Utility', '47M', 'KEEP', 'operator named (seq 142) + ToDo task 1 AirPort resets depend on it'),
  A('iTunes', '213M', 'KEEP', 'the CD-burn path for the mp3->CD goal (Winamp Mac has no burn engine)'),

  // --- professional video: this IS Final Cut Studio, the reason the machine exists ---
  A('Final Cut Pro', '413M', 'KEEP', 'professional video editing - the core of the stated use case'),
  A('Motion', '388M', 'KEEP', 'Final Cut Studio motion graphics'),
  A('Compressor', '92M', 'KEEP', 'Final Cut Studio encoder'),
  A('DVD Studio Pro', '120M', 'KEEP', 'Final Cut Studio authoring - pairs with the SuperDrive/CD goal'),
  A('Cinema Tools', '45M', 'KEEP', 'Final Cut Studio conform/telecine'),
  A('LiveType', '47M', 'KEEP', 'Final Cut Studio titling'),
  A('Apple Qmaster', '25M', 'KEEP', 'Final Cut Studio distributed encoding'),
  A('Apple Qadministrator', '19M', 'KEEP', 'Final Cut Studio cluster admin'),
  A('Aperture', '301M', 'KEEP', 'professional photo/RAW - pro media tool, adjacent to the editing workflow'),
  A('QuickTime Player 7', '28M', 'KEEP', 'Pro-keyed QT7 handles legacy codecs FCP depends on; not replaceable by QTX'),
  A('FxFactory', '29M', 'KEEP', 'professional FCP/Motion plug-in host'),
  A('LooksBuilder', '9.8M', 'KEEP', 'Red Giant Looks - professional colour grading for FCP'),
  A('ScreenFlow', '16M', 'KEEP', 'professional screen recording/editing'),
  A('Blackmagic Media Express', '1.2M', 'KEEP', 'capture/playback for Blackmagic video I/O hardware'),
  A('Blackmagic On-Air', '8.2M', 'KEEP', 'Blackmagic live capture'),
  A('Blackmagic Disk Speed Test', '164K', 'KEEP', 'validates the disk can sustain video bitrates - directly useful post-migration'),
  A('HandBrake', '15M', 'KEEP', 'video transcoding workhorse'),
  A('VLC', '104M', 'KEEP', 'universal media playback/verification'),
  A('MPlayer OSX Extended', '35M', 'KEEP', 'codec fallback playback'),
  A('DVDRemaster', '18M', 'KEEP', 'DVD transcode - fits the optical/CD workflow'),

  // --- audio interfacing ---
  A('GarageBand', '319M', 'KEEP', 'audio interfacing - the T2 host-matrix candidate (docs/mac-daily-driver.md)'),
  A('Audio MIDI Setup', '6.5M', 'KEEP', 'Apple: CoreAudio aggregate device + the SM7B/MicPort chain. T2 depends on it'),
  A('Podcast Capture', '9.0M', 'KEEP', 'audio capture, part of the audio-interfacing class'),
  A('Podcast Publisher', '13M', 'KEEP', 'pairs with Podcast Capture'),

  // --- migration + disk tooling (needed to DO this job) ---
  A('Carbon Copy Cloner', '13M', 'KEEP', 'CRITICAL: this is the tool that performs the migration. The old sweep classed it CANDIDATE=delete'),
  A('Disk Utility', '16M', 'KEEP', 'Apple: builds the stripe, repairs the disk (operator asked for clean+repair)'),
  A('RAID Utility', '6.7M', 'KEEP', 'Apple: the RAID set is the migration destination'),
  A('DiskWarrior', '8.1M', 'KEEP', 'directory repair - operator asked to "clean and repair disk" (seq 142)'),
  A('TechTool Deluxe', '12M', 'KEEP', 'hardware/disk diagnostics on a 2008 machine'),
  A('Rember', '1.1M', 'KEEP', 'memtest - 10 GiB of 2008 FB-DIMMs deserve a check'),
  A('Terminal', '10M', 'KEEP', 'Apple: every wave in this project is pasted into it'),
  A('Console', '7.7M', 'KEEP', 'Apple: reads the logs the receipts come from'),
  A('Activity Monitor', '7.1M', 'KEEP', 'Apple: standard diagnostics'),
  A('System Information', '5.3M', 'KEEP', 'Apple: hardware inventory for receipts'),
  A('Keychain Access', '12M', 'KEEP', 'Apple: keychain hygiene was an explicit ToDo item'),
  A('System Preferences', '3.7M', 'KEEP', 'Apple: Startup Disk selection lives here - required by the migration'),
  A('Migration Assistant', '6.4M', 'KEEP', 'Apple: alternative/adjunct transfer path'),
  A('Time Machine', '1.7M', 'KEEP', 'Apple: the backup story this Mac currently lacks'),
  A('Boot Camp Assistant', '9.9M', 'KEEP', 'Apple: the dual-boot goal in case-swap-macpro-plan.md'),
  A('ColorSync Utility', '11M', 'KEEP', 'Apple: colour management for video/photo work'),
  A('DigitalColor Meter', '1.9M', 'KEEP', 'Apple: colour sampling, tiny'),
  A('Grab', '2.5M', 'KEEP', 'Apple: screenshots for the receipt loop'),
  A('Font Book', '10.0M', 'KEEP', 'Apple: fonts matter for titling work'),
  A('Preview', '41M', 'KEEP', 'Apple: PDF/image viewing'),
  A('TextEdit', '9.1M', 'KEEP', 'Apple: plain-text editing for blocks'),
  A('Automator', '10.0M', 'KEEP', 'Apple: batch media tasks'),
  A('AppleScript Editor', '7.5M', 'KEEP', 'Apple: scripting the above'),
  A('Image Capture', '3.3M', 'KEEP', 'Apple: scanner/camera ingest'),
  A('DVD Player', '8.2M', 'KEEP', 'Apple: the SuperDrive has a disc in it right now'),
  A('QuickTime Player', '28M', 'KEEP', 'Apple: modern QT alongside QT7'),
  A('Network Utility', '1.5M', 'KEEP', 'Apple: AirPort work'),
  A('Bluetooth File Exchange', '1.6M', 'KEEP', 'Apple: small, part of the OS'),
  A('Safari', '36M', 'KEEP', 'Apple: dead for modern web but the OS integrates with it; ArcticFox is the real browser'),
  A('Mail', '49M', 'DROP', 'operator uses Dashboard widgets for desktop PIM, not the Apple apps (2026-09-17g). Lion Mail cannot do modern OAuth/TLS anyway - it can no longer log into Gmail/iCloud, so it is dead weight, not a downgrade'),
  A('Address Book', '20M', 'DROP', 'operator ruling 2026-09-17g: widgets cover the desktop use. No pro alternative needed - contacts are not part of the A/V workflow'),
  A('iCal', '33M', 'DROP', 'operator ruling 2026-09-17g: the Dashboard Calendar widget covers this. Lion iCal cannot sync to modern CalDAV endpoints'),

  // --- explicitly swept by the operator ---
  A('Winamp', '9.5M', 'DROP', 'operator: "sweep winamp" (seq 151) - replaced by a classic source port with CD + skins'),
  A('Chess', '6.5M', 'DROP', 'game - operator: "games currently, delete"'),
  A('Braid', '250M', 'DROP', 'game - operator: "games currently, delete"'),
  A('Machinarium', '345M', 'DROP', 'game - operator: "games currently, delete"'),
  A('Kid Pix Deluxe 3D', '2.0G', 'DROP', 'game/kids software - the single largest app on the disk'),
  A('Mavis Beacon Teaches Typing', '717M', 'DROP', 'kids/typing software, not professional'),

  // --- not professional video/audio: dropped per seq 151 ---
  A('Skype', '36M', 'DROP', 'communications, not pro A/V; ancient client on a dead protocol version'),
  A('Adium', '62M', 'DROP', 'chat client'),
  A('Yahoo! Messenger', '69M', 'DROP', 'dead service'),
  A('iChat', '30M', 'DROP', 'Apple chat - dead service'),
  A('FaceTime', '10.0M', 'DROP', 'Apple - dead on 10.7 without a current ID'),
  A('Google Chrome', '228M', 'DROP', 'dead on Lion; ArcticFox is the kept browser'),
  A('Google Chrome 2', '55M', 'DROP', 'duplicate dead browser'),
  A('Firefox', '68M', 'DROP', 'superseded by ArcticFox (which IS a Firefox fork)'),
  A('Opera', '43M', 'DROP', 'dead-on-Lion browser'),
  A('Flock', '61M', 'DROP', 'defunct browser'),
  A('TweetDeck', '3.4M', 'DROP', 'dead service client'),
  A('Evernote', '0B', 'DROP', 'zero-byte stub'),
  A('VMware Fusion', '222M', 'DROP', 'virtualization - not video/audio; ancient version, and the host is 2008 hardware'),
  A('Google Earth', '109M', 'DROP', 'not professional A/V'),
  A('LeapFrogConnect', '216M', 'DROP', 'kids device sync'),
  A('TomTom HOME', '102M', 'DROP', 'GPS device sync'),
  A('Garmin WebUpdater', '28M', 'DROP', 'GPS device sync'),
  A('Eye-Fi Manager', '12M', 'DROP', 'dead SD-card service'),
  A('NeatWorks', '15M', 'DROP', 'receipt scanning, not A/V'),
  A('MacGourmet', '17M', 'DROP', 'recipe manager - not professional A/V'),
  A('MacGourmet Deluxe', '60M', 'DROP', 'recipe manager duplicate - not professional A/V'),
  A('SousChef', '19M', 'DROP', 'recipe/cooking app - not professional A/V'),
  A('YummySoup!', '9.3M', 'DROP', 'recipe manager - not professional A/V'),
  A('NovaMind Pro', '50M', 'DROP', 'mind mapping'),
  A('NovaMind Platinum', '56M', 'DROP', 'mind mapping duplicate'),
  A('RapidWeaver', '43M', 'DROP', 'web design, not A/V'),
  A('CSSEdit', '7.2M', 'DROP', 'web development editor - not professional A/V'),
  A('iWeb', '524M', 'DROP', 'Apple web design - dead MobileMe service, huge'),
  A('Mathemagics', '5.3M', 'DROP', 'math trainer'),
  A('Mark:Space Notebook', '9.2M', 'DROP', 'note taking'),
  A('Sponge', '3.3M', 'DROP', 'utility, unused'),
  A('MacDaddy', '2.0M', 'DROP', 'utility, unused'),
  A('iStumbler', '2.4M', 'DROP', 'wifi scanner - AirPort Utility covers the need'),
  A('Google Goggles', '1.2M', 'DROP', 'dead service'),
  A('Awaken', '5.5M', 'DROP', 'alarm clock'),
  A('Dupin', '2.9M', 'DROP', 'iTunes playlist dedupe - niche'),
  A('Syncopation', '4.8M', 'DROP', 'dead sync service'),
  A('SuperSync', '9.2M', 'DROP', 'dead sync service'),
  A('iPhoto Library Manager', '5.0M', 'DROP', 'iPhoto helper; Aperture is the kept pro tool'),
  A('iPhoto', '410M', 'DROP', 'consumer photo - Aperture is the professional replacement and is KEPT'),
  A('iMovie', '244M', 'DROP', 'consumer video - Final Cut Pro is the professional replacement and is KEPT'),
  A('iDVD', '122M', 'DROP', 'consumer authoring - DVD Studio Pro is the pro replacement and is KEPT'),
  A('Photo Booth', '21M', 'DROP', 'toy webcam app'),
  A('Transmission', '11M', 'DROP', 'torrent client - not professional A/V'),
  A('CrushFTP4', '8.4M', 'DROP', 'FTP server daemon - not needed on a workstation'),
  A('Cyberduck', '23M', 'DROP', 'FTP client; Transmit is the kept one'),
  A('Transmit', '20M', 'KEEP', 'operator ruling 2026-09-17g asked for the professional option - Transmit (Panic) IS it. Cyberduck and ForkLift are the amateur/redundant ones and are dropped. Keep exactly one transfer tool and make it this'),
  A('ForkLift', '14M', 'DROP', 'file manager/FTP - redundant with Transmit'),
  A('Cocktail', '9.1M', 'DROP', 'maintenance app for Leopard, wrong OS version'),
  A('Leopard Cache Cleaner', '29M', 'DROP', 'maintenance app for Leopard, wrong OS version'),
  A('MacUpdate Desktop', '4.3M', 'DROP', 'dead update service'),
  A('VersionTracker Pro', '4.1M', 'DROP', 'dead update service'),
  A('WhatSize', '5.5M', 'DROP', 'disk usage - DaisyDisk/GrandPerspective overlap'),
  A('GrandPerspective', '1.2M', 'KEEP', 'disk usage visualiser, 1.2M, genuinely useful for keeping the new small boot disk tidy'),
  A('DaisyDisk', '7.4M', 'DROP', 'duplicate of GrandPerspective'),
  A('DivX Player', '15M', 'DROP', 'VLC handles DivX'),
  A('DivX Converter', '9.2M', 'DROP', 'HandBrake handles conversion'),
  A('ffmpegX', '50M', 'DROP', 'ancient GUI wrapper; HandBrake is maintained and kept'),
  A('Fairmount (for VLC 64 bits)', '680K', 'DROP', 'DVD decrypt shim, superseded'),
  A('Fairmount (for VLC 32 bits)', '812K', 'DROP', 'DVD decrypt shim, superseded'),
  A('Adobe Media Player', '3.0M', 'DROP', 'dead Adobe product'),
  A('Adobe AIR Application Installer', '888K', 'DROP', 'dead runtime'),
  A('Adobe AIR Uninstaller', '57M', 'DROP', 'dead runtime'),
  A('hueyPRO', '30M', 'DROP', 'operator ruling 2026-09-17g: go professional instead. huey is a CONSUMER colorimeter and its readings are not trustworthy for grading. Without the USB puck the app does nothing at all. Pro path = X-Rite i1Display Pro, which does not use this software. Dropping loses nothing'),
  A('Contour Shuttle', '2.6M', 'KEEP', 'operator ruling 2026-09-17g: this IS the professional tool - the ShuttlePro v2 is a standard FCP edit-bay controller and 2.6M is nothing. Keep the driver; if the puck is gone, delete it in five seconds later'),
  A('Uninstall Contour Shuttle', '200K', 'DROP', 'uninstaller stub'),
  A('LCC Uninstaller', '680K', 'DROP', 'Logitech uninstaller stub'),
  A('LCC Connection Utility', '792K', 'DROP', 'Logitech mouse/kb utility'),
  A('LCC Update', '1.1M', 'DROP', 'Logitech updater'),
  A('Geekbench', '7.5M', 'DROP', 'Geekbench 2 - benchmarking is the OMEN track, not this Mac'),
  A('X11', '2.5M', 'DROP', 'nothing in the keep set needs X11'),
  A('Remote Desktop', '14M', 'DROP', 'Apple admin tool for fleets, not needed'),
  A('VoiceOver Utility', '15M', 'DROP', 'accessibility - drop unless needed'),
  A('Grapher', '21M', 'DROP', 'Apple math tool'),
  A('Dictionary', '4.6M', 'DROP', 'Apple, small but unused'),
  A('Calculator', '5.0M', 'KEEP', 'Apple stock utility, tiny, universally useful'),
  A('Stickies', '3.6M', 'DROP', 'Apple notes toy'),
  A('Dashboard', '876K', 'DROP', 'Apple widget layer, dead'),
  A('Launchpad', '1.1M', 'DROP', 'Apple launcher, unused on a 10.7 pro box'),
  A('Mission Control', '1.5M', 'KEEP', 'Apple window manager - part of the OS UX'),
  A('App Store', '9.6M', 'DROP', 'the 10.7 store catalog is dead (R5: update chatter disabled)'),
  A('Batch Monitor', '5.4M', 'KEEP', 'Compressor companion - part of Final Cut Studio'),
  A('ATI Radeon HD 2600 XT Firmware Update', '1.6M', 'DROP', 'firmware updater for a card not in this machine (GTX 285 is installed)'),
  A('Mac Pro EFI Firmware Update', '3.1M', 'DROP', 'operator ruling 2026-09-17g: a one-shot installer, not a tool. Apple still hosts it; re-download if an EFI update is ever actually planned. Carrying a firmware flasher onto a fresh boot disk is pure downside'),
];

// ---------------------------------------------------------------- user data rules
export type DataRule = { path: string; action: string; why: string };
export const DATA_RULES: DataRule[] = [
  {
    action: 'COPY IN FULL',
    path: '/Users/el/Library/Preferences/widget-com.apple.widget-*.plist + /Library/Widgets + /Users/el/Library/Widgets',
    why: 'operator 2026-09-17g: "i only really use widgets for some of the desktop features". Dashboard is '
      + 'part of the OS and needs no app, but the INSTALLED WIDGETS and their saved state (which cities, '
      + 'which stocks, which stickies) live here. Miss these and Dashboard comes up empty on the new disk.',
  },

  { path: '/Users/el (Samael, admin, uid 502, 1.3G)', action: 'COPY IN FULL', why: 'operator account - "the only account ive used since downloading lion" (seq 153)' },
  { path: '/Users/el/Downloads (256 .icns, 82 images, 351M)', action: 'COPY IN FULL', why: 'operator: "use the icons and img textures i downloaded on my el admin account" (seq 153); "keep themes/icons/downloads dirs" (seq 142)' },
  { path: '/Users/el/Library/Application Support/Flavours/My Flavours', action: 'COPY IN FULL', why: 'the live .flavour themes - Natural Wood + one UUID theme (R5 receipt)' },
  { path: '/Users/el/Downloads/CandyBar.app + Float.icontainer', action: 'COPY IN FULL', why: 'CandyBar lives in Downloads, not /Applications - a naive /Applications copy would MISS it' },
  { path: '/Users/el/Downloads/Winamp-0.8.1.13.dmg', action: 'COPY', why: 'already staged; the classic-port plan may still want the skins/reference' },
  { path: '/Users/revo (775G)', action: 'DO NOT COPY', why: 'operator: delete the tertiary accounts (seq 151). NOT copying it is what makes the 447 GiB stripe viable' },
  { path: '/Users/jazzyempire (56K)', action: 'DO NOT COPY', why: 'operator: delete the tertiary accounts (seq 151); empty anyway' },
  { path: '/Users/Shared', action: 'REVIEW THEN COPY', why: 'may hold shared assets; small, check before dropping' },
  { path: '/Library/Application Support (selective)', action: 'COPY FOR KEPT APPS ONLY', why: 'FCP/Motion/FxFactory/Flavours keep licences and content here - a copy that misses this breaks the kept pro apps' },
  { path: '/Library/Fonts + /Users/el/Library/Fonts', action: 'COPY', why: 'titling work depends on installed fonts' },
];

// ---------------------------------------------------------------- reporting
const sum = (xs: App[]): number => xs.reduce((t, a) => t + a.mb, 0);
const byCls = (c: Cls): App[] => APPS.filter((a) => a.cls === c).sort((x, y) => y.mb - x.mb);
const fmt = (m: number): string => (m >= 1024 ? `${(m / 1024).toFixed(2)} GB` : `${Math.round(m)} MB`);

function list(c: Cls): void {
  const xs = byCls(c);
  console.log(`${c} - ${xs.length} apps, ${fmt(sum(xs))}\n`);
  for (const a of xs) console.log(`  ${a.size.padStart(6)}  ${a.name}\n          ${a.why}`);
}

function size(): void {
  const k = byCls('KEEP'), d = byCls('DROP'), q = byCls('ASK');
  console.log('MIGRATION SIZE ESTIMATE');
  console.log(`  KEEP apps   ${String(k.length).padStart(3)}   ${fmt(sum(k))}`);
  console.log(`  ASK apps    ${String(q.length).padStart(3)}   ${fmt(sum(q))}  (undecided - your call)`);
  console.log(`  DROP apps   ${String(d.length).padStart(3)}   ${fmt(sum(d))}  (not copied; stays on the MX500 until you wipe it)`);
  console.log(`  classified  ${String(APPS.length).padStart(3)}   = all 150 apps in the R1 burn + CandyBar (which lives in ~/Downloads)`);
  const apps = sum(k) + sum(q);
  const el = 1.3 * 1024, sys = 12 * 1024; // el home 1.3G (R5); Lion system+library ballpark 12G
  const total = (apps + el + sys) / 1024;
  console.log(`\n  kept apps        ${fmt(apps)}`);
  console.log(`  /Users/el        1.30 GB   (R5 receipt)`);
  console.log(`  OS + libraries  ~12.0 GB   (ESTIMATE - Lion system, not measured on this disk)`);
  console.log(`  ------------------------------------`);
  console.log(`  projected boot  ~${total.toFixed(1)} GB  vs ~209 GiB usable on ONE 240 GB Kingston (Bay 2)`);
  console.log(`  => fits with ~${(209 - total).toFixed(0)} GiB to spare on the single Bay-2 Kingston. No stripe needed.`);
  console.log('\n  NOTE: the 12 GB OS figure is an estimate. Confirm with the identity probe before the clone.');
}

function plan(): void {
  console.log('MIGRATION ORDER - operator layout: temporarily swap HDDs out for the two SSDs\n');
  const steps = [
    'BAY PLAN. Keep the MX500 in Bay 1 as the SOURCE (it stays bootable and untouched all the way ' +
      'through). Pull TWO WD HDDs, put Kingston A in Bay 2 and Kingston B in Bay 3. The third WD can ' +
      'stay in Bay 4 or come out - it makes no difference, because...',
    'RAID X GOES OFFLINE - AND THAT IS THE BIG RISK OF THIS STEP. Raid X is a 3-member stripe with NO ' +
      'redundancy and live data. Removing any member takes the whole 3 TB volume offline. The data is ' +
      'NOT lost by unplugging, but it IS lost if anything re-initialises or erases a member while it is ' +
      'degraded. Rule for the whole operation: never click Erase/Create on a WD, and put all three back ' +
      'in before expecting Raid X to mount again. Apple RAID reassembles by member UUID, so bay order ' +
      'does not matter - but all three must return.',
    'BUILD THE STRIPE from the two Kingstons in Disk Utility (RAID tab, Striped, JHFS+). This erases ' +
      'ONLY the Kingstons. You cannot do this to the running disk, which is why the MX500 stays as boot.',
    'SELECTIVE COPY - not a full clone. Carbon Copy Cloner, source = the MX500 boot volume, destination ' +
      '= the stripe, with revo/jazzyempire and the DROP list excluded. This is the step that "cleans" the ' +
      'boot drive: the new disk is clean by construction because the junk is never copied.',
    'BLESS AND TEST. System Preferences > Startup Disk > the stripe. Reboot. Verify: it boots, el logs ' +
      'in, Flavours themes render, CandyBar icons are present, Final Cut opens, audio devices enumerate.',
    'RUN SEVERAL CLEAN BOOTS before trusting it. The MX500 is still in Bay 1 and still bootable - ' +
      'Option-boot returns you to the old system instantly if anything is wrong. That is the rollback.',
    'ONLY THEN wipe the MX500. At that moment it is a non-boot, non-RAID disk and the erase is routine. ' +
      'Everything not copied (revo included) dies here - so harvest anything wanted BEFORE this step.',
    'RESTORE THE BAYS. Put the WDs back, confirm Raid X mounts with all three members, and decide where ' +
      'the freshly-wiped MX500 lives (operator: "keep the other ssd installed").',
  ];
  steps.forEach((s, i) => console.log(`STEP ${i + 1}. ${s}\n`));
  console.log('DATA RULES:');
  for (const r of DATA_RULES) console.log(`  [${r.action}] ${r.path}\n     ${r.why}`);
  console.log('\nNOTHING IS ARMED. No erase, clone or Startup Disk change is authored by this tool.');
}

function selftest(): void {
  let fail = 0;
  const ok = (n: string, c: boolean): void => { console.log(`${c ? 'PASS' : 'FAIL'} ${n}`); if (!c) fail++; };
  const names = APPS.map((a) => a.name);
  ok('no duplicate app entries', new Set(names).size === names.length);
  // every operator-named keep must actually be KEEP
  for (const n of ['CandyBar', 'Flavours', 'ArcticFox', 'AirPort Utility'])
    ok(`operator-named KEEP: ${n}`, APPS.some((a) => a.name === n && a.cls === 'KEEP'));
  // the explicit sweep
  ok('Winamp is swept per seq 151', APPS.some((a) => a.name === 'Winamp' && a.cls === 'DROP'));
  // games dropped
  for (const g of ['Chess', 'Braid', 'Machinarium'])
    ok(`game dropped: ${g}`, APPS.some((a) => a.name === g && a.cls === 'DROP'));
  // the professional core survives
  for (const p of ['Final Cut Pro', 'Motion', 'Compressor', 'GarageBand', 'Audio MIDI Setup'])
    ok(`pro A/V kept: ${p}`, APPS.some((a) => a.name === p && a.cls === 'KEEP'));
  // the catch that matters most
  ok('Carbon Copy Cloner is KEPT (it performs the migration)',
    APPS.some((a) => a.name === 'Carbon Copy Cloner' && a.cls === 'KEEP'));
  ok('iTunes kept as the CD-burn path', APPS.some((a) => a.name === 'iTunes' && a.cls === 'KEEP'));
  // data rules
  ok('el home is copied', DATA_RULES.some((r) => /Users\/el \(/.test(r.path) && r.action === 'COPY IN FULL'));
  ok('el Downloads (icons/textures) copied', DATA_RULES.some((r) => /Downloads \(256/.test(r.path) && r.action === 'COPY IN FULL'));
  ok('CandyBar-in-Downloads trap recorded', DATA_RULES.some((r) => /CandyBar\.app/.test(r.path)));
  ok('revo is not copied', DATA_RULES.some((r) => /revo/.test(r.path) && r.action === 'DO NOT COPY'));
  ok('kept set fits a 240 GB disk', (sum(byCls('KEEP')) + sum(byCls('ASK'))) / 1024 < 240);
  ok('every app carries a reason', APPS.every((a) => a.why.length > 10));
  // COVERAGE GATE: every app in the burn must be classified, or the copy silently drops something.
  try {
    const burn = readFileSync('receipts/absolution/R1/burn-2026-09-17.txt', 'utf8').split('\n')
      .filter((l) => l.startsWith('APP '))
      .map((l) => l.split('|').slice(3).join('|').trim())
      .filter(Boolean);
    const known = new Set(names);
    const missing = burn.filter((b) => !known.has(b));
    ok(`all ${burn.length} burn apps classified`, missing.length === 0);
    if (missing.length) console.log(`     unclassified: ${missing.join(', ')}`);
  } catch { ok('burn receipt readable for coverage check', false); }
  // All 7 ASK items were ruled on by the operator 2026-09-17g, so ASK must now be EMPTY.
  // Anything landing back in ASK means a new undecided app crept in - that must fail.
  ok('no undecided apps remain (all 7 ASK ruled 2026-09-17g)', APPS.filter((a) => a.cls === 'ASK').length === 0);
  ok('Transmit kept as the one professional transfer tool', APPS.some((a) => a.name === 'Transmit' && a.cls === 'KEEP'));
  ok('Dashboard widget state is copied', DATA_RULES.some((r) => /[Ww]idget/.test(r.path)));
  const body = plan.toString();
  ok('plan warns Raid X goes offline', /RAID X GOES OFFLINE/.test(body));
  ok('plan keeps MX500 as rollback', /Option-boot returns you to the old system/.test(body));
  console.log(fail === 0 ? 'LION_MIGRATE_MANIFEST_SELFTEST=PASS' : `LION_MIGRATE_MANIFEST_SELFTEST=FAIL failures=${fail}`);
  if (fail > 0) process.exit(1);
}

const cmd = process.argv[2] ?? 'size';
if (cmd === 'keep') list('KEEP');
else if (cmd === 'drop') list('DROP');
else if (cmd === 'ask') list('ASK');
else if (cmd === 'plan') plan();
else if (cmd === 'size') size();
else if (cmd === 'selftest') selftest();
else { console.log('usage: node tools/lion-migrate-manifest.ts <keep|drop|ask|plan|size|selftest>'); process.exit(1); }
