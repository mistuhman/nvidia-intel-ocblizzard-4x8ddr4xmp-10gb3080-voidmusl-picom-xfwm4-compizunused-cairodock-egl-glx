# No-POST after a memory OC — diagnosis, and why the operator's flash plan was right

Date 2026-08-25. Trigger: 4000 MT/s @1.55V on an HP 8917 / F.51, applied partly in BIOS and then
from Void; no boot since. Operator's opening plan — flash from a MacBook USB stick — was
dismissed here, then reinstated after three corrections recorded below.

## Verdict (current, after three corrections — see the trail below)

1. **Flash to recover: yes, as the documented remedy** — but only after the zero-DIMM test below
   rules out corrupted DIMM SPD, which a flash would not fix.
2. **Flash for CPU control: still no.** No published unlocked image for the 8917; F.57's whole
   changelog is "Provides improved security"; and it is one-way.
3. **Recover, then stay at 3733 XMP.** 4000 MT/s on 4 DIMMs is ~25% over what Intel rates this
   CPU for.

## Board facts (verified this session)

| Fact | Value | Source |
|---|---|---|
| Motherboard | HP **BlizzardOC**, SSID **8917**, Z690, 4x DDR4 288-pin | HP "BlizzardOC motherboard specifications" page |
| Board/BIOS on this rig | board HP 8917, BIOS AMI **F.51**, OMEN 45L GT22-0xxx | target dmidecode receipt 2026-08-25 06:20 UTC (MASTER.md) |
| Newest official 8917 BIOS | **F.57**, SoftPaq **sp167160**, MD5 `7D3449DEAA9EAAFE251B225D96BA7FA4`, effective **2025-12-08**, supersedes sp163213 | ftp.hp.com/pub/softpaq/sp167001-167500/sp167160.html (fetched) |
| F.57 ENHANCEMENTS + PREREQUISITES | Enhancements: "Provides improved security." — the entire list. Prerequisites: "**previous BIOS versions cannot be reinstalled** after this BIOS update is run." | same file |
| CPU rated memory | **Up to DDR4 3200 MT/s**, 2 channels; "Maximum supported memory speed may be lower when populating multiple DIMMs per channel" | Intel ARK i7-12700KF |
| DDR4 daily voltage consensus | 1.50V is the accepted 24/7 ceiling **with airflow**; 1.55V is borderline/bench territory | overclocker consensus, multiple threads |

## On the 1.55V itself — not the cause

The electrical argument stands and matters for later (3733 XMP and 4000 both exceed the CPU's
rated DDR4-3200; at **4 DIMMs = 2 per channel**, where Intel says support is *lower*, the IMC is
the binding limit and extra VDIMM does not strengthen it). But the resolved timeline shows the
1.55V BIOS setting was not what killed the machine — the Void-side write that followed it was.

## Superseded steps and claims — kept so they are not repeated

**The standard recovery ladder** (F10 defaults → CMOS jumper → CR2032 out → Win+V → boot 2 DIMMs
→ Win+B) **was performed in full by the operator and did not help.** Do not re-propose it.
**Key-map trap:** on this rig **Escape is the ZBM boot menu, not BIOS**; BIOS is **F10 at the HP
splash only**; F2 at the startup menu is HP PC Hardware Diagnostics.

**Four withdrawn claims:** the OMEN logo being lit proving standby power (it is a case LED, lit
whenever the machine is off but plugged in, no diagnostic value); "a flash cannot help because
Win+B needs a board that reaches POST" (backwards — boot-block recovery runs *before* POST);
"this is hardware, it needs parts" (built on assuming the beep pattern was 3-long-2-short without
confirming it); and "1.55V marginality caused this" (electrically true and still relevant for
later, but not the cause — the Void-side write was).

### Minimal bench procedure — EXECUTED, NO EFFECT

The reseat-and-look-for-damage differential (24-pin, CPU EPS, front-panel header, shorts, GPU
seating, battery polarity, DIMM seating, cooler/CPU, PSU) is **closed** — operator confirmed
zero physical damage. One item survives: never pull the CPU to inspect the socket as a
diagnostic, LGA1700 pins bend easily.

Run in full 2026-08-25: reseated 24-pin ATX and CPU EPS 8-pin, front-panel power header, 3080
and its 6+2; disconnected the Sabrent USB HDD, all USB devices and the case RGB/LED-controller
cables; one latched DIMM; boot NVMe pulled. Operator receipt: **"nothing. no matter what i
reconnect."** Recorded so it is not repeated. Note this bench never tried **zero** DIMMs, which
is the one configuration that discriminates — see the discriminator below.

**Correction:** an earlier revision said to keep the 3080 installed because "no iGPU means no
display and no readable code." The second half was **wrong**: the beep comes from the board
speaker, independent of display output, so removing the GPU is a valid isolation step.

## Causal reconstruction 2026-08-25 — what actually happened

An earlier version concluded "this is hardware, it needs parts." **Withdrawn** — it stacked two
unverified guesses (that the beep was the 3-long-2-short memory code, never confirmed; therefore
that "the CPU is not executing BIOS"). Zero physical damage is confirmed by the operator, which
closes the burnt-connector / bulging-cap / short branch, and parts are ruled out.

### What is actually established

All operator receipts unless noted: booted and benched clean today (target receipt 07:43 UTC);
4000 @1.50V booted but was never stress-tested; 4000 @1.55V did not work; it beeped during the
"4 dimm" trouble but the pattern was never captured and turned out not to matter; it now lights
instantly and power-cycles silently; zero physical damage; CMOS resets and power cycles did not
help; the CR2032 was genuinely out with the GPU out; F10 was re-entered after the 1.55V.

The two questions that mattered were whether the CR2032 was really out and *how the setting was
applied*. I should have asked those first instead of listing checks.

Both unknowns resolved: the **CMOS cell was genuinely out, with the GPU out** (they overlap), so
the clear did happen and that branch is closed; and the 1.55V was **"applied from Void"**, which
is the fact the whole diagnosis turns on.

### What "applied from Void" means, and why no reset could fix it

Linux exposes UEFI variables as writable files under `/sys/firmware/efi/efivars/`. Writing a
firmware setup variable from a running Linux system writes into the **variable store on the SPI
flash** — not into the CMOS/RTC settings that a battery pull clears.

The kernel's own efivarfs documentation names the failure mode directly:

> "Due to the presence of numerous firmware bugs where **removing non-standard UEFI variables
> causes the system firmware to fail to POST**, efivarfs files that are not well-known
> standardized variables are created as immutable files."

And on this class of firmware the state is not recoverable by a CMOS clear. The documented
analysis of exactly this failure:

> "the setup is the thing you need to run to fix corrupted efivars — the setup won't run if the
> efivars are corrupt — and those efivars are stored in a part which is neither on disk on the
> ESP, **nor in the NVRAM that is zeroed by a CMOS clear** — these motherboards don't
> default-to-setup."

The resulting symptom is a firmware hang before it can report anything: *"the firmware hangs at
the moment it tries to get a list of things to boot into."* That is lights on, immediate cycle,
**no beep** — with zero hardware damage, which is exactly what the operator reports.

It also explains "only just gotten progressively worse": each further attempt writes into the
same store, and repeated CMOS resets change nothing because they are clearing a different region.

**This is a hypothesis, not a finding.** What would confirm it: how the setting was applied. If
it went through `/sys/firmware/efi/efivars/`, `efivar`, `chipsec`, a `setup_var`-style tool, or
anything else that writes UEFI variables from Linux, the hypothesis holds. If it was applied by
some other route, it does not, and this needs rethinking. **That question is the gate.**

### Why the flash is the right remedy — and the claim that had to be withdrawn

An earlier revision said the flash could not help because "Win+B needs a board that reaches
POST." Backwards: HP's crisis recovery runs from the **boot block**, before normal POST, and
exists precisely for a machine that will not POST. HP's wording: *"If the BIOS is corrupted, the
system automatically attempts to restore the BIOS from a hidden partition when the computer is
restarted. If this recovery method fails, use another working computer to create a BIOS recovery
flash drive."* Owners report the stick auto-detected on a plain power-on, with Win+B as the
explicit trigger when it is not.

For a corrupted variable store a full image rewrite is the documented remedy, because it
replaces the variable region. The operator's opening plan was right and was dismissed here on
faulty reasoning. **Recovery, not CPU control.** F.57 / sp167160 / MD5
`7D3449DEAA9EAAFE251B225D96BA7FA4` / SSID 8917, one-way.

### Provenance — what the record can and cannot show, and the cause

Operator asked whether an agent had written the OC from Void. Grepped the tree **and all six
commits** for `efivar|setup_var|chipsec|SaSetup|CpuSetup|firmware/efi|dmpstore|RU.efi|flashrom`:
no such write appears anywhere in the repository. The only touches of
`/sys/firmware/efi/efivars` are reads (`ls`, `cat`) in `etc/zfs-bios-setup-ledger.block` and
`etc/zfs-bootnext-once.block`; those write only standardized `Boot####`/`BootNext` variables via
`efibootmgr`, with rollback documented in the same file.

**Scope limit on that result, stated plainly because an earlier revision over-claimed from it:**
the grep covers this repository only. MASTER.md records an explicit operator directive —
**"STOP block-file flow, commands only in chat"** — so any command a prior session gave in chat
never entered the repo and the grep cannot see it. The honest answer to "did an agent suggest
this?" is therefore **unknown, and it may well have.** What the record does support is narrower:
no agent *executed* anything on the target, because target execution is operator-gated by this
project's own permission model, and the memory OC values logged in MASTER.md were read off the
F10 setup screen — which is why the option names looked familiar.

**Cause, confirmed 2026-08-25:** operator applied the setting from Void with a **"chipsec
adjacent tool"**, i.e. a chipset/firmware tool of the `setup_var` / RU.EFI / UefiVarTool class
that writes BIOS setup varstores (`Setup`, `CpuSetup`) directly. Documented risk for that tool
class: *"risks are significant when overwriting critical UEFI variables without prior backups,
which can lead to boot failures or complete system inoperability"*, and malformed writes can
brick the device if essential varstores are affected. That is **Mechanism A**.

**Independently confirmed by the discriminator:** operator ran the zero-DIMM test and it
**still would not POST**. A board whose firmware is healthy reaches memory init and complains
when it finds no memory; this one does not, so the hang is upstream of memory and no DIMM
configuration can change it. The variable store, not the DIMMs.

So the exact tool name no longer matters — the test carries the conclusion on its own.

### Timeline, resolved 2026-08-25

The apparent contradiction is resolved — both things happened, in sequence:

1. Typed **4000 / 1.50V in the BIOS**, rebooted to Void — **but Void showed base speeds**, i.e.
   the Custom Profile did not take effect.
2. Went back into the BIOS, set **4000 / 1.55V**, rebooted to Void, **"and then applied it"**
   from Void.
3. Dead ever since, and progressively worse.

So the BIOS part is not in dispute, and step 2 is the event that killed it. **What "applied it"
means is still unknown and is the whole question.**

### The fork, and how it was settled

Two candidate mechanisms survived every other test, and only one is fixed by flashing:
**A** = corrupted UEFI setup variable (firmware hangs before POST; a full image rewrite replaces
the variable region, so **the flash fixes it**); **B** = corrupted DIMM SPD written over SMBus
(stick untrainable in any machine; **the flash does nothing**, fix is SPD reprogram or new
DIMMs). B was live because step 1 of the timeline gave the motive — the BIOS profile would not
stick, so forcing it at the DIMM is the obvious next move.

**Discriminator, run by the operator: power on with ZERO DIMMs.** A healthy board reaches memory
init and complains when it finds no memory. **It still did not POST** — so the hang is upstream
of memory and no DIMM configuration changes it. Combined with "chipsec adjacent tool", that is
**A**. Both branches of evidence agree, and the test result carries the conclusion on its own.

### GO — flash F.57 from the USB recovery stick

SSID is not a guess: the 2026-08-25 06:20 UTC target receipt gives board HP **8917**, BIOS
**F.51**, OMEN 45L GT22-0xxx.

**A first attempt failed 2026-08-25. Treat it as an untested recovery, not a failed one** — three
specific defects were present, all mine:

1. **Wrong key order for this machine class.** HP support's own instructions for an OMEN 30L
   desktop are *"Press and hold the Windows key + V, then press the Power button... If Win+V
   doesn't work, try Win+B or just power on with the USB inserted. Some OMEN desktops
   auto-detect the recovery drive."* **Win+V is primary on OMEN desktops; Win+B is the
   fallback.** I gave Win+B first.
2. **Probably not a valid stick.** The documented way to build it is HP's own **"Create Recovery
   USB"** option inside the SoftPaq, which requires running the `.exe` **on Windows**. A stick
   hand-assembled on macOS by extracting a `.bin` is a different artifact and the firmware may
   not recognize it at all.
3. **Probably not enough patience.** For HP **desktops** specifically: *"the power light remains
   on and the display screen may remain blank for about 40 seconds before anything is
   displayed"*, and HP flashes are slow — *"HP's seem to take at least 10"* minutes. On a machine
   that power-cycles on its own, giving up early looks identical to failure.

**Corrected procedure:**

1. Build the stick with **HP's "Create Recovery USB" on any Windows PC** (borrow one for ten
   minutes if needed). That is the only reliably-recognized artifact. FAT32, 8-32GB, **not
   exFAT or NTFS**.
2. If hand-assembling is the only option: the `.bin` lives in the SoftPaq's **`Dos Flash`**
   folder and goes at the **root** of the FAT32 stick. Boot-block recovery *"search[es] the root
   folder of any FAT/FAT32 filesystem on any USB media source for a compatible binary image."*
3. OMEN off, PSU switch off, cord out, power button held 20-30s. **Refit the DIMMs** (recovery
   needs memory) and the 3080.
4. Stick into a **rear** port, **USB 2.0** if the board has one.
5. Hold **Win+V**, press power, **keep holding Win+V**. Then repeat with **Win+B**. Then try a
   **plain power-on with the stick in** — some OMEN desktops auto-detect it.
6. **Sit through it.** Blank screen ~40s is normal, and the flash can run 10+ minutes. Watch the
   stick's activity LED — blinking means the firmware is reading it. **Never interrupt power.**
7. After it completes: F10 → **load defaults** → save → reboot.

Try different sticks and different rear ports before concluding anything. If a correctly-built
HP recovery stick, Win+V and Win+B and plain power-on, with enough wait, all produce nothing —
*then* the recovery path is genuinely exhausted and the remaining options are HP support or an
SPI programmer with a clip.

**Expect after recovery:** the flash clears the EFI NVRAM boot entries, so Void may not be in
the boot list. MASTER.md already records that this firmware self-enumerates the `EFI/BOOT`
fallback and ZBM lives on the ESP, so press Escape at the HP splash for the ZBM menu and boot
from there, then re-add the entry once Void is up. Nothing on the NVMe or the Sabrent is
affected by the flash.

### Building the stick — Windows is the reliable route, macOS is the fallback

**Preferred: any Windows PC.** Download `sp167160.exe`, run it, choose **"Create Recovery USB"**.
That produces the artifact HP's firmware actually expects. Borrow a machine for ten minutes if
needed — it is the difference between a real test and a guess.

**Fallback, macOS-only** (`sw_vers` first and report it — "2020" and "High Sierra" cannot both
be right, and it changes which tools run):

1. Download `https://ftp.hp.com/pub/softpaq/sp167001-167500/sp167160.exe`. Verify:
   `md5 sp167160.exe` → `7d3449deaaeaafe251b225d96ba7fa4`.
2. Extract with **Keka** (drag the `.exe` on) or The Unarchiver; or `brew install p7zip` then
   `7z x sp167160.exe -osp167160`. **Expect double packing** — SoftPaqs often contain another
   `.exe` you must extract again. Look for the **`Dos Flash`** folder; the `.bin` is in there.
3. If you get only a stub, the SoftPaq builds its payload at runtime and must actually run —
   Wine in a VM, or Windows, where `sp167160.exe -pdf -fC:\SWSetup\sp167160 -s` unpacks it.
4. Disk Utility → Erase → **MS-DOS (FAT)** → Scheme **Master Boot Record**. FAT32, 8-32GB.
5. `.BIN` at the stick **root**, plus `.sig`/`.s09` siblings and copies under `EFI/HP/BIOS/New`
   and `EFI/Hewlett-Packard/BIOS/New`. Optional: `dot_clean -m /Volumes/<STICK>`.

**Report the file list before flashing.** If there is no `.BIN`, the attempt is not a test.

### Prevention, for after it boots

Never write firmware setup variables or DIMM SPD from a running OS on this rig again. Mount
efivarfs read-only (`efivarfs /sys/firmware/efi/efivars efivarfs ro 0 0` in `/etc/fstab`), do all
BIOS work in F10. Memory ceiling: 3733 XMP.

### Loose ends

- **Storage is safe.** A dead board, PSU or CPU does not touch `nvme/ROOT/void` or `tank/games`.
  Keep the NVMe as-is — its shell history is the best evidence of what "applied it" ran.
- **Parts — ruled out by the operator**, and not re-proposed here.

## Why flashing never buys CPU control on this board

F.57's whole ENHANCEMENTS list is "Provides improved security". No unlocked image for
BlizzardOC/8917 has ever been published, and unlocking HP is "notoriously difficult, and may be
straight up improbable for your system." A modded image would fail Boot Guard's signed-manifest
verification and not POST. And HP staff state Plundervolt mitigations lock voltage offsets at
firmware level, so even XTU or ThrottleStop cannot undervolt a current OMEN. **Recovery only.**

## The path that actually gets CPU control, without flashing

The 12700KF is a K part — the multiplier is unlocked in silicon. What is in the way is firmware
*lock bits*, which live in setup variables and MSRs and can be inspected and sometimes changed
without rewriting the firmware image. Reversible, unlike a flash. Cheapest first: read-only MSR
probe (below) to find what is locked; then **PL1/PL2 at MSR 0x610**, usually writable even where
voltage is locked and normally the biggest legal win on a locked OEM board since the 12700KF is
power-limited at stock; then turbo ratios at 0x1ad; then voltage offsets at 0x150 with
`intel-undervolt` only if the OC lock reports unlocked. Last resort and still no reflash: clear
OC/CFG lock bits from an EFI shell (`setup_var` / RU.EFI style) — edits variables, not the
image, so Boot Guard is not tripped, but a wrong varstore/offset makes the board unbootable, so
it needs probe receipts and an explicit go/no-go.

Packages in void-packages master (verified via GitHub API this session): `msr-tools`
1.3.0.20170320_1, `intel-undervolt` 1.7_1, `fwupd` 2.1.7_1.

### Post-recovery probe — deferred until the machine boots

Kept out of this file to avoid bloat; the command set will be re-issued in chat when Void is up.
It is read-only and covers: `dmidecode` board/BIOS/memory (proves F.57 took and memory is back
at stock), `zpool status`, `dmesg -l err`, and MSRs `0x194` (OC lock, bit 20), `0x150` (OC
mailbox), `0x1ad` (turbo ratios), `0x610`/`0x611` (PL1/PL2), plus `fwupdmgr security` for Boot
Guard / HSI state. Packages: `msr-tools` 1.3.0.20170320_1, `intel-undervolt` 1.7_1, `fwupd`
2.1.7_1. MSR bit meanings are provisional until the returned values are seen.

## Before you flash — and a correction to how this was framed

An earlier revision led with "there is exactly one way to confirm it outright," described a paid
SPI programmer, and closed with "I'd lean programmer." **Withdrawn.** The error underneath it: I
treated the F.57 flash as a risky irreversible step needing certainty first. It is not. "You
cannot go back to F.51" only matters if F.51 is worth keeping — and F.51 is the state that
**does not boot**. There is nothing to go back to. F.57's only documented change is "Provides
improved security"; the memory profile is gone; boot entries come back via ZBM; boot-block
recovery exists for an interrupted flash. **Downside near zero, cost zero, HP's documented
remedy.** You do not need certainty before a free attempt at a fix.

**Free checks that tell you how far firmware gets** (two minutes, worth doing alongside):
a wired USB keyboard with Num Lock / Caps Lock pressed on power-on — LED toggles means firmware
enumerated USB HID and is running well past early init, which would argue *against* an early
variable-store hang; no response means hung very early, consistent with Mechanism A. Also: does
the HP splash ever appear, even briefly? And flashlight the board near the 24-pin for POST/debug
LEDs — whether the 8917 has them is **unverified**, so look rather than assume.

**If the recovery works, the diagnostic question is moot.** You do not need to know which
mechanism broke it to have a working PC; the NVMe's shell history will tell you afterwards, for
free, from inside Void.

### Appendix — external SPI read, only after the free path is genuinely exhausted

A CH341A programmer plus SOIC8 clip reads and writes the 24/25-series BIOS flash with the
machine not booting, giving a byte-exact dump (`flashrom -p ch341a_spi -c <chip> -r backup.bin`;
read twice and compare, since poor clip contact corrupts reads). Documented caveats: peripheral
circuits can defeat in-circuit clipping; WSON8 needs an adapter; 1.8V parts need a 1.8V adapter;
ESMT/SST-class chips are read-only on the CH341A; residual power defeats detection; a reversed
clip can fry the chip. **Last resort, never a prerequisite, and not to be recommended before a
correctly-built recovery stick has actually been tried.**

