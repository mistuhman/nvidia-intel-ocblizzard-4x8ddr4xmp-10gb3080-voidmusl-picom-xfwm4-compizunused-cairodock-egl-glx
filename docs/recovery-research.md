# Recovery research — 80-agent audit (2026-08-26)

> **Pass 2 (2026-08-27):** the four open search classes were worked in
> `docs/open-classes-pass2.md` — SoftPaq/`HpBiosUpdate.efi` evidence, BlizzardOC
> literature, and 45L PSU/EC family reports. Read that next.

## Scope and method

The operator asked for a real diagnosis rather than another pass through generic HP support
pages. This is a source audit of the actual failure shape:

- HP OMEN 45L, BlizzardOC / SSID 8917, AMI F.51
- i7-12700KF, RTX 3080, four DDR4 DIMMs
- immediate power cycle, including automatic cycle when AC is connected with `PB` unplugged
- no POST/beep/display and no recovery-stick LED activity
- CMOS, minimal bench, zero-DIMM, pump, and two recovery layouts already tested
- `FDO/PSWD/BBR` header photographed but not moved

The new tool is `tools/recovery-research.ts`. It creates a fixed manifest of exactly **80
unique agents and 80 unique source URLs**, launches one Promise task for each entry in one
wave, and records a manifest SHA, final URL, response hash, byte cap, timeout, evidence
snippets, and trap signals. It does not scrape Google result pages. GitHub sources use `gh api`
without a shell; other sources use bounded native HTTPS fetches. A four-request-per-host gate
protects sources while the 80 logical agents are launched together.

Reproducible plan receipt:

```text
agentCount=80
unique agent IDs=80
unique source URLs=80
manifestSha256=f54c963dfab3b661ae8fa86b823ee7674d400d87120cfc171a9dfcdee7070e15
```

The sandbox run completed all 80 logical agents. GitHub API sources were reachable through
`gh`; 47 direct non-GitHub requests were unavailable in this sandbox's filtered TLS environment.
Those failures are recorded as **errors**, never interpreted as negative evidence. The usable
run produced 23 useful sources, 10 empty sources, and 47 transport errors. No vendor support
page was used as a causal authority.

## High-signal discoveries

### 1. A normal EFI flasher is a real alternative to Win+B — but only after firmware can hold power

[Rixmerz/hp-omen-bios-flash-linux](https://github.com/Rixmerz/hp-omen-bios-flash-linux) at
commit `3e66db41f395f46b576c4a8090122ac8c1a61d6a` documents extracting HP's signed
`HpBiosUpdate.efi` from the AMI UCP payload and installing it as the default
`EFI/BOOT/BOOTX64.EFI`. Its README says this bypasses the Win+B recovery path on the author's
OMEN 15, board 8787, and was verified F.16 to F.26. Its extraction and media-layout scripts
are separately receiptable at `dd5c517245577795131f9a021e91fc251455351f` and
`f3c023355cad74f8bac3f442e7508aef7bf222b1`.

This is important because the operator's current test may have proved only that the crisis
recovery path never gets far enough to enumerate USB. It does **not** prove that a normal EFI
application would fail once a boot menu is reachable. It is not yet a fix for this machine:
8787 is not 8917, the F.57 SoftPaq has not been inspected here for `HpBiosUpdate.efi`, and the
current board does not reach a normal EFI boot menu. The correct next artifact question is
whether `sp167160.exe` contains the signed EFI flasher and its signature siblings. Do not
invent names or fabricate a capsule before that is known.

### 2. A generic Linux capsule wrapper is not automatically applicable

[Ocean-Moist/hp-bios-flash-linux](https://github.com/Ocean-Moist/hp-bios-flash-linux) at commit
`785a5cc35cc1f67584147ac88ea6a313a97036dc` demonstrates a boot-time UEFI `UpdateCapsule()`
applier. Its validation target is an Insyde OmniBook with a known ESRT GUID, not this AMI
BlizzardOC board. The project explicitly derives the capsule GUID from the target's ESRT and
uses a vendor-specific signed payload.

Conclusion: after Void is bootable, inspect `/sys/firmware/efi/esrt` read-only. Do not wrap
`08917.bin` in an invented capsule, do not guess an ESRT GUID, and do not use a capsule tool as
a substitute for HP's signed flasher. A raw BIOS `.bin` and a UEFI capsule are different
artifacts.

### 3. The BBR header is the strongest untested board-local recovery mechanism

Independent reports are not proof of this board's pinout, but they identify a much better
hypothesis than another generic USB retry:

- A [GeekSquad Omen report](https://www.reddit.com/r/GeekSquad/comments/17t9e5m/hp_omen_looping_on_start_up_not_posting_replaced/)
  describes an Omen with the `FDO/PSWD/BBR` header where moving to BBR produced immediate
  beeps and a recovery process; the author reports the BBR jumper plus recovery USB fixed the
  machine. It is a different Dorado board.
- An [Omen Obelisk report](https://www.reddit.com/r/HPOmen/comments/1fi10ne/hp_omen_obelisk_desktop_stuck_on_omen_logo_or/)
  reports a BBR position on pins 5–6 caused beeps and a BIOS rewrite, followed by restoring
  the jumper. It is a different board and therefore **not** a pin instruction for BlizzardOC.
- A [Hardwareluxx Omen/Oasis discussion](https://www.hardwareluxx.de/community/threads/hp-omen-hp-oasis-mainboard-z590h-ursache-gefunden-warum-bios-nicht-aufrufbar-kann-mir-das-jemand-erkl%C3%A4ren.1338551/)
  identifies the label semantics as FDO = Flash Descriptor Override, PSWD = password reset,
  and BBR = Boot Block Recovery. That is useful nomenclature only; Oasis is not BlizzardOC.
- A [GitHub HP BIOS-mod research thread](https://github.com/bibikalka1/HP_Z440_Z640_Z840_BIOS_mod/issues/1)
  separates boot-block and FDO functions on older HP workstations. It explicitly warns that
  its jumper positions are platform-specific.

The operator's own photo already confirms a larger blue jumper by the SATA area marked
`FDO/PSWD/BBR`. Therefore the best free route is **BBR, not FDO and not PSWD**, but we still
need a fresh close-up that shows the three pins, current cap orientation, and legible silkscreen.
Do not transfer the 5–6 or 1–2 numbers from another Omen.

### 4. `efivarfs` supports the SPI-varstore hypothesis, but it does not identify the reset cause

The [Linux kernel efivarfs documentation](https://docs.kernel.org/filesystems/efivarfs.html)
states that UEFI variables can be created, deleted, and modified, and that non-standard
variables are made immutable by default because firmware bugs can make removing them prevent
POST. The EDK2 variable runtime sources found by the 80-agent audit show separate non-volatile
and volatile stores and firmware-volume/FTW handling.

That supports the distinction between RTC/CMOS clearing and a firmware variable store. It does
not prove that this operator performed a setup-var write: the repository records conflicting
BIOS-versus-Void descriptions and contains no direct target execution receipt. Keep Mechanism
A as a hypothesis. The zero-DIMM failure moves the fault earlier than memory training; it does
not distinguish SPI state from EC/protection or power sequencing.

### 5. Do not use runtime Omen software to solve a pre-POST board

[OmenMon](https://github.com/OmenMon/OmenMon) is useful evidence about the Windows EC/WMI layer:
its source reads and writes EC registers only after an operating system and its driver are
running. Its model database and probe output are valuable **after** boot, but it cannot repair
an AMI setup store or force a board through an early reset when there is no POST. It is not a
recovery path for tonight's state.

Likewise, `setup_var`, `RU.EFI`, `efivarfs`, `efibootmgr`, and a Void service cannot execute
until the target reaches an EFI shell or Linux. No software-only command can repair a board that
never reaches its software environment.

### 6. The power symptom still has two physically distinguishable branches

The automatic cycle on AC insertion with `PB` disconnected proves the case button is not the
only power request. It does not tell us whether the EC/board asserts `PS_ON#` and then releases
it, or whether the PSU asserts protection and drops the rail. Generic checklists cannot answer
that. A future measurement, only if the operator already owns a suitable DMM or logic probe and
we have the exact HP PSU/connector pinout, would distinguish:

| Observation | What it would support |
|---|---|
| `PS_ON#` is asserted then released while standby remains present | board/EC/firmware aborts sequencing |
| `PS_ON#` is never asserted | EC/front-panel power-request path |
| `PS_ON#` stays asserted but rails collapse | PSU protection, rail fault, or heavy short |

This is a measurement branch, not permission to backprobe an unidentified proprietary cable.
The Super User [BlizzardOC power-connector report](https://superuser.com/questions/1792437/4pin-cpu-connectors-on-hp-omen-45l)
warns that at least the CPU power connectors may not be standard. Do not add or change cables.

## Ranked free plan for tonight

### Gate 0 — no power: identify the recovery mechanism, not another stick

1. Keep the OMEN unplugged and the PSU switch off.
2. Photograph the `FDO/PSWD/BBR` header straight-on with the cap still in its current
   position. Include the surrounding silkscreen and enough board context to establish
   orientation. Do not remove or move the cap.
3. If `sp167160.exe` is available on any currently accessible host, inspect/extract a copy
   without executing anything on the OMEN and report whether it contains `HpBiosUpdate.efi`,
   the matching `.s09`/`.s12`/`.s14`/`.sig` files, and the exact firmware image/signature.
   Windows is not required. Keep the original SoftPaq and current verified USB unchanged;
   if the SoftPaq is unavailable, do not block BBR on it.
4. State whether a 3.3 V SPI programmer/clip or a DMM/logic probe is already owned. This is an
   inventory question, not a request to purchase hardware.

### Gate 1 — the one named hardware test, only after explicit opt-in

The likely highest-value free attempt is **BBR only** with the existing verified recovery
media. The exact pin pair must come from the BlizzardOC photo/silkscreen; no numbers from
Dorado, Oasis, Z440, or an Obelisk are valid substitutes. FDO and PSWD stay untouched.

After the operator explicitly opts into the BBR test and the pin mapping is confirmed, the
procedure is one move to BBR, one power attempt, and one observation of LED/beeps/screen/time.
If recovery starts, do not interrupt it. If it completes or stops, power off, remove AC, and
restore the cap to its documented normal position before attempting a normal boot. If BBR
produces the same silent cycle and no LED, remove AC and restore the cap to its documented
normal position; stop and do not switch to another random header position.

### Gate 2 — conditional recovery paths

- If BBR reaches a normal EFI boot path, use the signed `HpBiosUpdate.efi` route only if F.57's
  own SoftPaq contains it and its signatures. This bypasses Win+B but still uses HP's signed
  payload.
- If BBR reaches a boot block but only the recovery tree is accepted, use the existing
  `08917.bin`/`.sig` media and wait without interruption.
- If BBR fails and an owned 3.3 V programmer/clip exists, the next action is a **read-only**
  SPI identification/dump plan with power isolated and a full backup before any write. Do not
  write a guessed image, erase the chip, or connect a 5 V programmer.
- If neither BBR nor an owned SPI instrument is available, the honest limit is that there is
  no remaining software-only fix while the board is pre-POST. The next useful free evidence is
  a controlled PS_ON#/rail measurement, not a fourth USB permutation.

## Limits and receipts

- The 80-agent tool's 47 direct-web transport errors are an environment limitation, not source
  conclusions. GitHub evidence was fetched through `gh api`; direct pages were independently
  checked with the web fetch tool where available.
- The BBR reports are cross-model analogies. They justify prioritizing the header, not blindly
  moving it.
- `HpBiosUpdate.efi` presence in F.57 is unknown until the actual SoftPaq is inspected.
- Exact BlizzardOC jumper pin numbering, SPI chip identity, ESRT exposure, `PS_ON#` waveform,
  and availability of test instruments are unknown.
- No OMEN power-on was performed during this research pass.
