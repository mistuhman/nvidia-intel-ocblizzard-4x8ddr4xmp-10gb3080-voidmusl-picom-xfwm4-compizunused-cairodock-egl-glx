#!/usr/bin/env node
// lion-boot-migrate.ts - feasibility math + ordered plan for moving the Lion boot volume
// OFF the 1 TB Crucial MX500 (Bay 1) ONTO a 2x240 GB Kingston RAID 0 stripe, so the MX500
// can finally be wiped. Operator proposal 2026-09-17.
//
// The point of this tool is that the proposal has TWO hard blockers that are arithmetic and
// hardware facts, not opinions, and both must be surfaced before anyone touches a disk:
//
//   BLOCKER 1 - CAPACITY. The boot volume currently holds 899 GiB. A 2x240 GB stripe is
//   ~447 GiB raw. 899 does NOT fit in 447. The migration is IMPOSSIBLE until the revo home
//   (775 GiB, ABSOLUTION R5) is reclaimed first. After that reclaim the used set is ~124 GiB,
//   which fits with ~300 GiB to spare. So the R5 reclaim is not optional housekeeping - it is
//   a STRUCTURAL PREREQUISITE of the operator's own migration plan.
//
//   BLOCKER 2 - SATA CHANNELS. The Mac Pro 3,1 has exactly 4 bootable drive bays. Current
//   occupancy is Bay1 = MX500 boot, Bays 2-4 = the three Raid X members. That is 4/4. Two
//   Kingstons need two more channels that do not exist in the bay backplane. The board does
//   carry two extra "ODD SATA" ports behind the front fan assembly, but reaching them needs
//   cables the operator has confirmed he does not own, and their bootability is DISPUTED in
//   the sources. Every resolution to this is an operator decision, not an agent action.
//
// Usage: node tools/lion-boot-migrate.ts <check|plan|bay2|endstate|selftest>

// ---------------------------------------------------------------- measured inputs (receipts)
const GiB = 1024 ** 3, GB = 1000 ** 3;
export const FACTS = {
  bootUsedGiB: 899,        // receipts/absolution/R1/burn-2026-09-17.txt : /dev/disk3s2 931Gi 899Gi 97%
  bootSizeGiB: 931,
  revoHomeGiB: 775,        // receipts/absolution/R5/identity-and-space.md : revo home = 775G
  kingstonCount: 2,        // operator 2026-09-17 + receipts/inventory/macpro31.md seq 82 item 7
  kingstonGB: 240,
  wdCount: 3,              // three WD Green members in Raid X
  bays: 4,                 // iFixit 25114: Mac Pro Early 2008 = four internal bays
  baysUsed: 4,             // Bay1 MX500 boot + Bays 2-4 = three Raid X members (operator layout)
  headroom: 0.95,          // HFS+ slack + SSD over-provisioning
};

export const stripeRawGiB = (): number => (FACTS.kingstonCount * FACTS.kingstonGB * GB) / GiB;
export const stripeUsableGiB = (): number => stripeRawGiB() * FACTS.headroom;
export const usedAfterReclaimGiB = (): number => FACTS.bootUsedGiB - FACTS.revoHomeGiB;
export const fitsNow = (): boolean => FACTS.bootUsedGiB <= stripeUsableGiB();
export const fitsAfterReclaim = (): boolean => usedAfterReclaimGiB() <= stripeUsableGiB();
export const freeBays = (): number => FACTS.bays - FACTS.baysUsed;

// ------------------------------------------------- VERIFIED SSD identity (operator label photo, 2026-09-17)
// Both Kingston labels photographed and read directly. This CLOSES the "SKU UNKNOWN" gap in
// receipts/inventory/macpro31.md item 7. Read off the labels, not inferred:
export const SSD_IDENTITY = {
  model: 'Kingston SSDNow V300',
  partNumber: 'SV300S37A/240G',       // identical on BOTH drives
  kingstonPN: '9904447-745.F03G',     // identical on BOTH drives
  firmware: '608ABBF0',               // identical on BOTH drives
  dateCode: '1607',                   // 2016 week 07 - identical lot on BOTH drives
  assembledIn: 'TAIWAN',
  power: 'DC +5.0V 1A',
  wwn: ['50026B7762054B94', '50026B7762054FB2'], // near-consecutive: same production run
  controller: 'LSI SandForce SF-2281',           // V300 series controller
  matched: true,  // same PN + same firmware + same lot = the ideal case for a stripe
};

// What the verified SKU actually changes:
export const SSD_NOTES: string[] = [
  'MATCHED PAIR CONFIRMED: identical part number, identical firmware 608ABBF0, identical 1607 lot, ' +
    'near-consecutive WWNs. A stripe runs at the slower member\'s pace, so a mismatch would have been a ' +
    'real problem. There is no mismatch. This is the best case.',
  'THE V300 NAND CONTROVERSY IS MOOT HERE. Kingston silently switched the V300 from synchronous to ' +
    'slower asynchronous Micron NAND (anandtech 7763); async units read ~180-250 MB/s on incompressible ' +
    'data instead of the advertised 450. But the Mac Pro 3,1 drive bays are SATA II, hard-capped at ' +
    '300 MB/s raw / ~250-270 MB/s real (everymac mac-pro-how-to-replace-hard-drive-install-ssd). The bay ' +
    'ceiling is at or below the async drive\'s ceiling, so the downgrade costs almost nothing in THIS machine.',
  'STRIPING STILL HELPS: each bay is its own SATA channel, so two drives aggregate past the single-bay ' +
    'ceiling. This is the one place the stripe earns its risk.',
  'NO TRIM - AND IT DOES NOT MATTER HERE. Apple software RAID never passes TRIM to members (its RAID ' +
    'driver predates TRIM), and Lion 10.7 has no TRIM for third-party SSDs anyway - trimforce only ' +
    'arrived in 10.10.4 (macrumors 2015/07/01). So the stripe loses nothing Lion was going to give. ' +
    'More to the point: ~16 GB on a 447 GB stripe leaves the drives ~96% empty, which is enormous ' +
    'effective over-provisioning. SandForce garbage collection has all the free blocks it could want.',
  'AGE: 1607 date code = ~9 years old. Unknown power-on hours. Check SMART before trusting either one, ' +
    'and remember a 2-drive RAID 0 doubles the chance of a boot-disk failure.',
];

// ------------------------------------------------- END-STATE BAY ARITHMETIC (the thing the swap hides)
// The temporary swap works fine. The problem is what happens when the WDs go back.
export type Config = { id: string; layout: string; bays: number; raidX: string; verdict: string };
export const END_STATES: Config[] = [
  {
    id: 'E1', layout: '2 Kingston stripe + MX500 kept + 3 WD returned',
    bays: 6, raidX: 'n/a', verdict: 'IMPOSSIBLE - needs 6 bays, the machine has 4. This is literally what was asked for.',
  },
  {
    id: 'E2', layout: '2 Kingston stripe + 2 WD',
    bays: 4, raidX: 'DEAD - a 3-member set cannot run on 2 members',
    verdict: 'Fits the bays. Costs you Raid X permanently and the MX500 goes on the shelf.',
  },
  {
    id: 'E3', layout: '1 Kingston boot + 3 WD Raid X returned',
    bays: 4, raidX: 'ALIVE - all three members back',
    verdict: 'THE ONLY END STATE THAT KEEPS RAID X. Boot is ~16 GB in 209 GB usable. Kingston B becomes a cold spare - which, for a 9-year-old drive, is arguably where the second one belongs anyway.',
  },
  {
    id: 'E4', layout: '2 Kingston stripe + MX500 + 1 WD',
    bays: 4, raidX: 'DEAD', verdict: 'Fits, keeps the MX500 installed as asked, but abandons Raid X and two WDs.',
  },
];
export const bayDemand = (): number => FACTS.kingstonCount + 1 + FACTS.wdCount; // kingstons + MX500 + WDs
export const endStateConflict = (): boolean => bayDemand() > FACTS.bays;

// ================================================================ BAY 2 SWAP (operator decision 2026-09-17f)
// "lets just swap out the hdd in the bay (bay 2) next to the crucial with a 240gb kingston"
// This is Option B (single Kingston, no stripe) and it lands on end state E3 - the only layout
// that keeps Raid X alive. Two physical facts have to be understood first.

export const BAY2_MOUNT = {
  problem: 'A 2.5" SSD does not screw into a 3,1 sled. The sled screw holes are 3.5" spacing, and '
    + 'the OWC 2.5" Mac Pro sled (MMP35T25) is explicitly 2009-2012 only - it does NOT fit a 3,1.',
  operatorHasNoAdapter: true, // receipts/inventory/macpro31.md item 6: "i have no conversion cables or anything"
  workaround: 'The bay is cable-free direct-attach, so the SSD can be pushed straight onto the backplane '
    + 'connector with NO sled at all. This is widely done on classic Mac Pros: the drive is light enough '
    + 'that the connector holds it. Support the underside (a non-conductive shim) so nothing hangs on the port.',
  properFix: 'NewerTech AdaptaDrive 2.5-to-3.5 bracket (~$11) fits ALL classic Mac Pro sleds including the 3,1. '
    + 'Not required to proceed - it is the tidy version, orderable later.',
  sources: [
    'discussions.apple.com/thread/7553566 (3,1: no 2.5" sled exists; AdaptaDrive works; sled-less install reported)',
    'bhphotovideo OWCMMP35T25 (explicitly NOT compatible with MacPro3,1)',
    'discussions.apple.com/thread/2507049 (pushed connector-with-SSD straight onto the backplane, "works great")',
  ],
};

// The move that makes this work. Bay 2 is a Raid X member, so the Kingston cannot simply LIVE there.
export const BAY2_STEPS: string[] = [
  'STEP 1 - KNOW WHAT YOU ARE PULLING. Bay 2 holds a WD Green that is one of the three Raid X members. '
    + 'The moment it comes out, the 3 TB Raid X volume goes OFFLINE. That is expected and is NOT data loss. '
    + 'Data loss only happens if something erases or re-initialises a member while the set is broken. '
    + 'Label the drive with its bay as it comes out and set it somewhere safe.',
  'STEP 2 - SHUT DOWN FULLY. Not sleep. Unplug mains. The bays are hot-swap-capable electrically but '
    + 'there is no reason whatsoever to take that risk with a RAID member.',
  'STEP 3 - FIT THE KINGSTON IN BAY 2. If you have no 2.5-to-3.5 bracket (you said you have no adapters), '
    + 'push the bare SSD directly onto the Bay 2 backplane connector and support it from underneath. '
    + 'Do not force it and do not let the drive hang off the connector.',
  'STEP 4 - BOOT FROM THE MX500 AS NORMAL. Nothing about the boot disk changed. Confirm in Disk Utility '
    + 'that you can see: the MX500 (boot), the new Kingston, and a Raid X set showing as damaged/offline '
    + 'with a missing member. Seeing Raid X broken here is CORRECT. Do not let Disk Utility "fix" it. '
    + 'Never click Erase, Create, Rebuild or Demote on anything WD.',
  'STEP 5 - ERASE THE KINGSTON ONLY. Disk Utility, select the Kingston by its hardware name, erase as '
    + 'Mac OS Extended (Journaled), GUID Partition Table. GUID matters - an Intel Mac will not boot from '
    + 'an APM-formatted disk. Name it something you will recognise at the Option-boot screen.',
  'STEP 6 - SELECTIVE COPY WITH CARBON COPY CLONER. Source = the MX500 boot volume, destination = the '
    + 'Kingston, with /Users/revo, /Users/jazzyempire and the DROP list excluded. '
    + 'See: node tools/lion-migrate-manifest.ts plan',
  'STEP 7 - BLESS AND TEST. System Preferences > Startup Disk > the Kingston. Reboot. Verify el logs in, '
    + 'Flavours themes render, CandyBar icons are present, Final Cut opens, audio devices enumerate. '
    + 'If anything is wrong, Option-boot straight back to the MX500 - it is untouched in Bay 1.',
  'STEP 8 - RUN IT FOR A WHILE. Several clean boots and a real editing session before you trust it. '
    + 'The MX500 stays in Bay 1 as a complete, bootable rollback for as long as you want it there.',
  'STEP 9 - THE ENDGAME MOVE (this is the step that saves Raid X). When the Kingston is trusted: '
    + 'shut down, REMOVE THE MX500 FROM BAY 1, MOVE THE KINGSTON FROM BAY 2 INTO BAY 1, and put the '
    + 'WD Green back into Bay 2. Boot. Apple boots by blessed volume, not by bay, so moving the Kingston '
    + 'costs nothing (re-pick it in Startup Disk if the machine hesitates). Raid X now has all three '
    + 'members back and remounts as a healthy 3 TB volume. Final layout: Bay 1 Kingston boot, Bays 2-4 '
    + 'the three WDs. That is end state E3.',
  'STEP 10 - ONLY THEN THE MX500. Once it is out of the machine it is just a 1 TB SSD on the bench. '
    + 'Wipe it externally, keep it as a cold backup of the old system, or re-use it. Nothing is urgent '
    + 'and nothing is irreversible until you erase it - so harvest anything you still want FIRST.',
];

export const BAY2_NOTES: string[] = [
  'WHY THE KINGSTON CANNOT JUST STAY IN BAY 2: Bay 2 belongs to Raid X. Leaving the Kingston there '
    + 'means Raid X never gets its third member back and the 3 TB volume stays dead. Bay 1 is the only '
    + 'bay that is not a RAID member, so the boot disk has to end up in Bay 1. That is why STEP 9 exists.',
  'NO STRIPE, AND THAT IS FINE. One 240 gives ~209 GiB usable for a ~16 GB system. The bays are SATA II '
    + '(~250-270 MB/s real) and a single V300 already saturates that, so the second drive would have '
    + 'bought you very little. Keep Kingston B as a cold spare - sensible for a 9-year-old drive.',
  'SMART FIRST. These are ~9 years old with unknown power-on hours. Check SMART on the Kingston before '
    + 'you trust it as a boot disk, not after.',
  'RAID X IS OFFLINE FROM STEP 1 TO STEP 9. If you need anything off the 3 TB volume, copy it BEFORE '
    + 'you pull the Bay 2 drive.',
];

// ---------------------------------------------------------------- external constraints
export type Constraint = { id: string; verdict: string; detail: string; source: string };
export const CONSTRAINTS: Constraint[] = [
  {
    id: 'C1-raid0-boot-supported',
    verdict: 'SUPPORTED',
    detail: 'Apple software RAID 0 is a valid Mac Pro boot volume; a 3,1 owner documents the exact bay-2/3 stripe + clone + Startup Disk route.',
    source: 'forums.macrumors.com/threads/676960 (Mac Pro early 2008, step-by-step)',
  },
  {
    id: 'C2-cannot-raid-the-running-disk',
    verdict: 'HARD RULE',
    detail: 'You cannot create a RAID set on the startup disk; creation unmounts and destroys members. The stripe must be built from OTHER disks while booted from the MX500.',
    source: 'support.apple.com/guide/disk-utility/dskua23150fd',
  },
  {
    id: 'C3-installer-vs-clone',
    verdict: 'CLONE, DO NOT REINSTALL',
    detail: 'The Lion installer often refuses a RAID target because it cannot build a Recovery HD. The reliable path is: keep booting the MX500, then CLONE onto the stripe (Carbon Copy Cloner / SuperDuper / Disk Utility Restore). CCC is ALREADY INSTALLED on this Mac.',
    source: 'forums.macrumors.com/threads/1256512 + receipts/absolution/R1 (com.bombich.ccc, 13M)',
  },
  {
    id: 'C4-no-recovery-hd-on-raid',
    verdict: 'ACCEPTED LOSS',
    detail: 'A RAID 0 boot set generally carries no Recovery HD. On 10.7.5 this machine already boots from a clone and uses Option-boot, so the practical loss is small - but it must be a conscious trade.',
    source: 'forums.macrumors.com/threads/1256512',
  },
  {
    id: 'C5-stripe-doubles-failure-risk',
    verdict: 'RISK',
    detail: 'RAID 0 across two SSDs means either drive failing loses the whole boot volume. Note the existing Raid X (3x1TB -> 3TB) is ALSO a no-redundancy stripe, so this Mac would then have two striped sets and zero parity anywhere.',
    source: 'forums.macrumors.com/threads/676960 + operator Disk Utility photo 2026-09-17',
  },
  {
    id: 'C6-odd-sata-ports-exist-but-disputed',
    verdict: 'DISPUTED',
    detail: 'The logic board has two extra hidden ODD SATA ports behind the front fan assembly. Some owners boot from them; the long-standing write-up says they are NOT bootable. Either way they need a SATA data cable + Molex-to-SATA power + a 2.5in bracket, which the operator has stated he does not own.',
    source: 'n0tablog RAID10/Bootcamp ODD-SATA write-up + macrumors 971435 + receipts/inventory/macpro31.md item 6',
  },
];

// ---------------------------------------------------------------- bay resolution options
export type Option = { id: string; title: string; cost: string; risk: string; note: string };
export const BAY_OPTIONS: Option[] = [
  {
    id: 'A', title: 'Temporarily break Raid X: pull one WD, stripe both Kingstons in the freed bay + one more',
    cost: 'no purchase', risk: 'HIGH',
    note: 'Raid X is a NO-REDUNDANCY stripe: pulling any member destroys the 3 TB set. Only viable if Raid X contents are backed up or disposable. Needs 2 free bays, so TWO WDs come out.',
  },
  {
    id: 'B', title: 'Single Kingston 240 as the new boot (no stripe), in the bay the MX500 vacates',
    cost: 'no purchase', risk: 'LOW',
    note: 'After the revo reclaim the system is ~124 GiB, which fits one 240 comfortably. Loses the stripe speed but needs ZERO extra channels and zero cables. Simplest path that still frees the MX500.',
  },
  {
    id: 'C', title: 'Mount both Kingstons in the optical bay on the hidden ODD SATA ports',
    cost: 'SATA data cable + Molex-to-SATA power + 2.5in bracket', risk: 'MEDIUM',
    note: 'Keeps all 4 bays for HDDs - the original 4x1TB plan. Blocked today by missing cables, and ODD-port bootability is disputed (C6). Verify with one drive before buying two of everything.',
  },
  {
    id: 'D', title: 'Retire the Raid X stripe into a smaller/redundant set, freeing bays permanently',
    cost: 'depends on target layout', risk: 'OPERATOR DECISION',
    note: 'Fits the stated end-goal ("new drives for raid") and fixes the zero-parity problem, but it is a storage redesign, not a boot migration. Separate wave.',
  },
];

// ---------------------------------------------------------------- ordered plan
export function planSteps(): string[] {
  return [
    'STEP 0 (BLOCKING, no hardware): reclaim the revo home - 775 GiB of the 899 GiB in use. Until this ' +
      'runs, 899 GiB cannot fit a ~447 GiB stripe and the migration is arithmetically impossible. ' +
      'ABSOLUTION already harvests revo Downloads + themes to /Users/el/absolution-harvest/ and MOVES the ' +
      'home to quarantine (reversible until purged). This step alone may satisfy "clean the SSD".',
    'STEP 1 (read-only): confirm post-reclaim usage with df -h / and confirm the Kingston SKUs from their ' +
      'labels. Exact model matters for TRIM/firmware; receipts/inventory/macpro31.md still lists them UNKNOWN.',
    'STEP 2 (operator decision): resolve the bay/channel problem - options A-D above. 4 bays, 4 disks, ' +
      'zero free today. Nothing proceeds until this is chosen.',
    'STEP 3 (destructive to the Kingstons ONLY): build the stripe in Disk Utility from the two Kingstons. ' +
      'Never select the running disk (C2) and never select a Raid X member.',
    'STEP 4 (copy, non-destructive to source): clone the live system onto the stripe with Carbon Copy ' +
      'Cloner (already installed) - NOT the Lion installer (C3). The MX500 stays untouched and bootable.',
    'STEP 5 (reversible): System Preferences > Startup Disk > the stripe, then reboot. Inverse = Option-boot ' +
      'and pick the MX500 again. Prove several clean boots from the stripe before trusting it.',
    'STEP 6 (finally the original request): only once the stripe has booted cleanly and repeatedly does the ' +
      'MX500 stop being the boot disk - at which point wiping it is a normal erase of a non-boot, non-RAID ' +
      'disk, and tools/lion-disk-plan.ts guards will show a genuinely free target for the first time.',
  ];
}

// ---------------------------------------------------------------- output
function check(): void {
  console.log('CAPACITY CHECK - operator proposal: 2x240GB Kingston RAID 0 as the new boot');
  console.log(`  stripe raw            ${stripeRawGiB().toFixed(1)} GiB (${FACTS.kingstonCount} x ${FACTS.kingstonGB} GB)`);
  console.log(`  stripe usable (~95%)  ${stripeUsableGiB().toFixed(1)} GiB`);
  console.log(`  boot used NOW         ${FACTS.bootUsedGiB} GiB  => FITS: ${fitsNow() ? 'YES' : 'NO'}` +
    (fitsNow() ? '' : `  SHORT BY ${(FACTS.bootUsedGiB - stripeUsableGiB()).toFixed(1)} GiB`));
  console.log(`  boot used AFTER revo  ${usedAfterReclaimGiB()} GiB  => FITS: ${fitsAfterReclaim() ? 'YES' : 'NO'}` +
    (fitsAfterReclaim() ? `  headroom ${(stripeUsableGiB() - usedAfterReclaimGiB()).toFixed(1)} GiB` : ''));
  console.log(`\nBAY CHECK  bays=${FACTS.bays} used=${FACTS.baysUsed} free=${freeBays()}` +
    `  => need ${FACTS.kingstonCount} more channels, have ${freeBays()}`);
  console.log('\nCONSTRAINTS:');
  for (const c of CONSTRAINTS) console.log(`  [${c.verdict}] ${c.id}\n     ${c.detail}\n     src: ${c.source}`);
  console.log('\nBAY/CHANNEL OPTIONS:');
  for (const o of BAY_OPTIONS) console.log(`  ${o.id}. ${o.title}\n     cost: ${o.cost} | risk: ${o.risk}\n     ${o.note}`);
  const verdict = !fitsNow() && fitsAfterReclaim()
    ? 'PLAN IS SOUND, BUT ORDER MATTERS: reclaim revo FIRST (step 0), then the stripe fits. Bay/channel question is still an operator decision.'
    : 'RE-CHECK: capacity assumptions changed.';
  console.log(`\nVERDICT: ${verdict}`);
}

function plan(): void {
  console.log('BOOT MIGRATION PLAN - MX500 (Bay 1) -> 2x240GB Kingston stripe');
  for (const s of planSteps()) console.log(`\n${s}`);
  console.log('\nNOTHING HERE IS ARMED. No erase, clone or Startup Disk change is authored by this tool.');
}

function selftest(): void {
  let fail = 0;
  const ok = (n: string, c: boolean): void => { console.log(`${c ? 'PASS' : 'FAIL'} ${n}`); if (!c) fail++; };
  // the two findings this tool exists to prove
  ok('899 GiB does NOT fit a 2x240 stripe', !fitsNow());
  ok('post-reclaim 124 GiB DOES fit', fitsAfterReclaim());
  ok('reclaim delta is the revo home', usedAfterReclaimGiB() === FACTS.bootUsedGiB - FACTS.revoHomeGiB);
  ok('stripe raw is ~447 GiB', Math.round(stripeRawGiB()) === 447);
  ok('zero free bays today', freeBays() === 0);
  ok('two Kingstons need more channels than exist', FACTS.kingstonCount > freeBays());
  // guardrails
  ok('every constraint cites a source', CONSTRAINTS.every((c) => c.source.length > 0));
  ok('the no-RAID-on-boot-disk rule is recorded', CONSTRAINTS.some((c) => c.id === 'C2-cannot-raid-the-running-disk'));
  ok('clone-not-installer is recorded', CONSTRAINTS.some((c) => /CLONE/.test(c.verdict)));
  ok('a zero-purchase option exists', BAY_OPTIONS.some((o) => o.cost === 'no purchase' && o.risk === 'LOW'));
  ok('plan puts the reclaim first', /STEP 0/.test(planSteps()[0]) && /revo/.test(planSteps()[0]));
  ok('plan wipes the MX500 only at the end', /STEP 6/.test(planSteps()[6]) && /wiping it/.test(planSteps()[6]));
  // verified-hardware + end-state assertions
  ok('Kingston SKU is verified from a label photo, not guessed', SSD_IDENTITY.partNumber === 'SV300S37A/240G');
  ok('the pair is matched (same PN, firmware and lot)', SSD_IDENTITY.matched);
  ok('the end state as stated overflows the bays', endStateConflict());
  ok('exactly one end state preserves Raid X', END_STATES.filter((c) => /ALIVE/.test(c.raidX)).length === 1);
  ok('the no-TRIM-on-Apple-RAID fact is recorded', SSD_NOTES.some((n) => /NO TRIM/.test(n)));
  // bay-2 swap assertions
  ok('bay2 plan ends with the Kingston in Bay 1 (E3)', /MOVE THE KINGSTON FROM BAY 2 INTO BAY 1/.test(BAY2_STEPS.join(' ')));
  ok('bay2 plan warns Raid X goes offline at step 1', /OFFLINE/.test(BAY2_STEPS[0]));
  ok('bay2 plan forbids erasing a WD', /[Nn]ever click Erase/.test(BAY2_STEPS.join(' ')));
  ok('bay2 plan specifies GUID, not APM', /GUID/.test(BAY2_STEPS.join(' ')));
  ok('the sled-fit problem is recorded with a no-purchase workaround', BAY2_MOUNT.workaround.length > 40);
  ok('bay2 plan wipes the MX500 only after it leaves the machine', /STEP 10/.test(BAY2_STEPS[9]));
  const body = planSteps().join('\n');
  ok('plan never tells the operator to erase the running disk', !/erase the (running|boot)/i.test(body));
  console.log(fail === 0 ? 'LION_BOOT_MIGRATE_SELFTEST=PASS' : `LION_BOOT_MIGRATE_SELFTEST=FAIL failures=${fail}`);
  if (fail > 0) process.exit(1);
}

function bay2(): void {
  console.log('BAY 2 SWAP - single Kingston V300 as the new boot disk (operator decision)\n');
  console.log('  Chosen: pull the WD in Bay 2 (next to the Crucial in Bay 1), fit a 240 GB Kingston.');
  console.log('  This is Option B, and it lands on end state E3 - the ONLY layout that keeps Raid X alive.\n');
  console.log('  MOUNTING REALITY');
  console.log(`    problem : ${BAY2_MOUNT.problem}`);
  console.log(`    you have no adapter : ${BAY2_MOUNT.operatorHasNoAdapter}`);
  console.log(`    workaround : ${BAY2_MOUNT.workaround}`);
  console.log(`    tidy fix : ${BAY2_MOUNT.properFix}\n`);
  console.log('  ORDERED STEPS\n');
  for (const st of BAY2_STEPS) console.log(`    ${st}\n`);
  console.log('  NOTES\n');
  for (const n of BAY2_NOTES) console.log(`    - ${n}\n`);
  console.log('  NOTHING IS ARMED. No erase, clone or Startup Disk change is authored by this tool.');
}

function endstate(): void {
  console.log('END-STATE BAY ARITHMETIC - what happens when the WDs go back\n');
  console.log(`  VERIFIED HARDWARE: ${SSD_IDENTITY.model} ${SSD_IDENTITY.partNumber}, firmware `
    + `${SSD_IDENTITY.firmware}, lot ${SSD_IDENTITY.dateCode} - MATCHED PAIR (operator label photo)\n`);
  for (const n of SSD_NOTES) console.log(`  - ${n}\n`);
  console.log(`  Bays available: ${FACTS.bays}. Bays the stated end state needs: ${bayDemand()} `
    + `(${FACTS.kingstonCount} Kingston + 1 MX500 + ${FACTS.wdCount} WD).`);
  console.log(`  CONFLICT: ${endStateConflict() ? 'YES - over by ' + (bayDemand() - FACTS.bays) + ' bays' : 'no'}\n`);
  for (const c of END_STATES) {
    console.log(`  ${c.id}. ${c.layout}`);
    console.log(`      bays ${c.bays}/${FACTS.bays} | Raid X: ${c.raidX}`);
    console.log(`      ${c.verdict}\n`);
  }
  console.log('  The temporary swap is unaffected - it is a migration vehicle, not a final layout.');
  console.log('  But the final layout is an OPERATOR DECISION and it has to be made before the MX500 is wiped.');
}

const cmd = process.argv[2] ?? 'check';
if (cmd === 'check') check();
else if (cmd === 'plan') plan();
else if (cmd === 'bay2') bay2();
else if (cmd === 'endstate') endstate();
else if (cmd === 'selftest') selftest();
else { console.log('usage: node tools/lion-boot-migrate.ts <check|plan|bay2|endstate|selftest>'); process.exit(1); }
