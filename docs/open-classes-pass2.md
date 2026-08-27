# Open search classes — pass 2 (2026-08-27)

New-chat work per `docs/next-chat-prompt.md`. The stall gate still stands: **no
power-on, no jumper, no USB/hotkey permutation is proposed here.** This pass only
closes the four open *search* classes with named sources. No OMEN contact occurred.

Sandbox note: direct `ftp.hp.com` download from the agent sandbox fails in the
filtered TLS environment (`curl` rc=35 `SSL_ERROR_SYSCALL`), so the SoftPaq was
**not** downloaded here. Evidence below is literature + GitHub-API receipts; the
one remaining artifact receipt is an operator-side directory listing (free, Windows
host, zero OMEN touch).

---

## Class 1 — sp167160 contents / `HpBiosUpdate.efi`

### What is now proven (with sources)

1. **The official record matches the repo's stored facts.** The SoftPaq page
   `ftp.hp.com/pub/softpaq/sp167001-167500/sp167160.html` (fetched this pass)
   states: F.57 REV A, ROM Family SSID 8917, MD5 `7D3449DEAA9EAAFE251B225D96BA7FA4`,
   supersedes sp163213, effective 2025-12-08, models OMEN 45L + 40L, enhancement
   "Provides improved security", prerequisite "previous BIOS versions cannot be
   reinstalled after this BIOS update is run". An HP Community answer (2026-05)
   confirms sp167160 is the current F.57 for any 8917-baseboard OMEN desktop.

2. **HP's recovery file set is standardized, and `HpBiosUpdate.efi` is a real,
   shipped HP artifact.** HP Community threads and a Super User answer show the
   classic layout on an HP_TOOLS volume:
   `Hewlett-Packard\BIOSUpdate\{HpBiosUpdate.efi, HpBiosUpdate.s09/.s12/.s14/.sig,
   HpBiosUpdate32.*, HpBiosMgmt.*, CryptRSA.efi}` plus `Hewlett-Packard\BIOS\New\`
   holding `<board>.bin` + signature. The modern consumer layout the operator's
   stick uses (`HP\BIOS\New\08917.bin` + `.sig`) is the same scheme's newer tree.

3. **Why extraction reports disagree — the flasher hides inside an AMI UCP
   container.** The `Rixmerz/hp-omen-bios-flash-linux` README (fetched via GitHub
   API at HEAD; scripts read this pass) documents that inside HP AMI SoftPaqs the
   payload is an AMI UCP container (`@UAF` magic) whose entries are TianoCompress-
   compressed and tagged `@UFI` = `HpBiosUpdate.efi`, `@US9/@US2/@US4/@USG` = the
   `.s09/.s12/.s14/.sig` siblings, `@RFI` = `CryptRSA.efi`, `@NAL` = name index.
   "grep/strings find nothing because of the compression … It is very easy to
   conclude the SoftPaq doesn't contain them. It does." (on that OMEN 15 SoftPaq).
   Extraction chain used by its `extract-softpaq.sh`: `7z x spXXXXXX.exe` → inner
   `BIOS_Update.exe`/`Winflash.exe` → `biosutilities -e` (platomav/BIOSUtilities
   `AmiUcpExtract`, pure Python, no Windows needed). badcaps' HP guide shows the
   same UCP unwrap with the AMIUCP GUI on Windows.

4. **The decisive answer for the prompt's third question — `HpBiosUpdate.efi`
   requires a booting platform.** Rixmerz's route boots the flasher as a *normal
   EFI application* (`EFI/BOOT/BOOTX64.EFI`, F9 boot menu), and the flasher itself
   refuses to run with "SecureBoot must be disabled before flashing this BIOS
   image". So it needs: POST completes → memory init → DXE → USB enumeration →
   removable-media EFI boot. **On a board that cuts power before memory init,
   `HpBiosUpdate.efi` cannot run — no EFI application can.** This resolves the
   next-chat-prompt question: *if the OMEN does not POST, sp167160 cannot help it
   recover.* Its value is the **post-recovery flash path**: if the board ever
   POSTs again (or BBR-style boot-block recovery ever engages), the EFI-app route
   sidesteps the Win+B pre-boot USB stack that even Rixmerz's healthy machine
   could not enumerate ("The BIOS recovery files cannot be found…" on every
   layout — same failure shape we saw, on a machine that otherwise booted).

### The one remaining free artifact receipt (operator, Windows host, no OMEN)

The 2026-08-26 Windows photo already showed the created stick's root contains
`EFI`, `Hewlett-Packard`, and `HP` folders. If `Hewlett-Packard\BIOSUpdate\` on
that stick holds `HpBiosUpdate.efi` + siblings, the question "does this recovery
toolchain ship the signed EFI flasher?" is answered **yes** without extracting
anything (HP's utility lays it down from its payload). Two listings settle it:

```
dir /s /b H:\
dir /s /b C:\SWSetup\sp167160
```

(second one only if the SoftPaq was run on the helper PC; if absent, run
sp167160.exe there — it is HP's official installer and exits on SSID mismatch on
non-OMEN hardware). **Inspect only — do not modify the stick.** Rebuilding the
stick again would be a relabeled member of the closed USB class.

---

## Class 2 — BlizzardOC 8917 board-specific recovery literature

- HP's own BlizzardOC spec document (support.hp.com `ish_5037050-5037113-16`,
  fetched this pass) documents dimensions, Z690, 4× DDR4 (rated max **DDR4-3733
  with 125 W K-series CPUs** — our 4000 custom profile was out of spec), rear I/O,
  and **contains no recovery, jumper, or BBR documentation at all**. It even
  misstates the socket as "LGA 1200" (12700K is LGA1700) — treat HP consumer doc
  details as unverified until checked against the board.
- No service manual, boardview, or schematic for BlizzardOC surfaced in public
  vendor literature this pass. Prior cross-model BBR reports (GeekSquad/Dorado,
  Obelisk, Oasis, Z440 — see `docs/recovery-research.md`) remain analogies only.
- **Conclusion:** no board-specific recovery path beyond the already-closed
  3-pin-cap and USB+hotkey classes exists in reachable public literature. The
  `FDO/PSWD/BBR` 3-pin has exactly two pair states; factory left-pair and the
  slide-toward-text right pair have both now been occupied (right pair = the
  attempted-and-FAILed BBR-shaped slide). A cap *removal* would be the same
  physical shape as the closed jumper class and is not proposed.

---

## Class 3 — OMEN 45L PSU / EC sequencing literature

- **PSU identity/connectors:** 45L GT22 uses Cooler Master OEM units (650/750/850/
  1000/1200 W variants). An HP Community expert answer on 45L shutdowns states
  the machine "uses a standard ATX PSU" with standard 24-pin, EPS (CPU), and GPU
  connections, and that a standard ATX unit can be bench-wired to the board.
  This **conflicts** with the earlier Super User BlizzardOC report that the CPU
  4-pin/EPS pinout may not be ATX-standard. Conflict is **unresolved** — no
  pinout receipt exists, so no PSU backprobe, jumper, or paperclip action is
  proposed (that would also be a cable-class relabel).
- **45L EC-latch family behavior:** HP Community "OMEN 45L not turning on"
  (8328782) documents 45L units that blip fans for a millisecond and refuse to
  start until the cord is fully removed and the power button held 20–30 s — the
  same drain ritual already closed on this rig. One owner reports faint
  electrical noise near the CPU right before cycle-off, presumed board failure.
- **45L loop-with-vanishing-beep family:** r/HPOmen "HP Omen Turning Off/On"
  (1h7nmk3, Dec 2024, incl. a 12700K+3080 unit): XMP/memory-profile change → 3
  beeps → boot loop; beeping *stopped* as the condition worsened — the same
  feedback-disappearance shape as our timeline. Resolutions in that thread were
  heterogeneous (RAM reseat after loop; eventual boot + BIOS update; one bent-
  socket-pin board+CPU death; one "glitch CPU"). These are **data points for the
  failure family, not diagnoses of this board** — no purchase or part-swap
  conclusion is drawn from them.
- **Auto-power-on on AC insert:** HP's "After Power Loss" BIOS option exists on
  HP desktops; community receipts put business-unit defaults at "Power Off" /
  "Previous State", and no OMEN-45L-specific default receipt was found. So the
  observed auto-cycle on cord-in with `PB` unplugged stands as *the board/EC
  asserts a power request without the case button* — mechanism unattributed.
  The `PS_ON#`-vs-PSU-protection split from `docs/recovery-research.md` remains
  measurable **only** with an instrument the operator does not own.

---

## Class 4 — owned instrument plans

Unchanged: operator reports no DMM, no 3.3 V SPI programmer/clip, no logic probe
("i dont have any special tools"). No plan authored. If that ever changes, the
read-only SPI identification/dump plan and the PS_ON#/rail observation table in
`docs/recovery-research.md` / `docs/omen-free-recovery-runbook.md` are the named
next actions.

---

## State after this pass

| Class | Status |
|---|---|
| sp167160 contents | Literature-closed; one free operator receipt remains: two `dir /s /b` listings on the Windows host |
| BlizzardOC literature | Searched; nothing beyond closed classes exists in public vendor literature |
| PSU/EC sequencing | Searched; standard-ATX claim vs non-standard-EPS warning conflicts; auto-on mechanism unattributed; split needs an instrument |
| Instruments | None owned; no plan |

**Free evidence that remains, ranked:** (1) the Windows-host `dir` listings
(artifact receipt, answers the sp167160 question definitively); (2) nothing else
without either an owned instrument or an operator-named test. The hardware halt
gate is unchanged: cap left pair, cord out, no power-on.
