# DDR4 4x8 @ 2DPC — 3733 baseline to the 4000 MT/s target

Companion to `docs/oc-3080-oc-lab.md`. Same doctrine, different failure mode: a bad GPU overclock
crashes and you notice. **A bad memory overclock corrupts, and ZFS root means you may not.**

## What the receipts already say

- Live baseline is **XMP 3733 @ 1.35 V** — and it has **never been formally validated**.
- **4000 @ 1.50 V booted once** and was never stability-tested. Booted is not stable.
- **1.55 V failed to boot.** Hard ceiling is 1.50 V; the tools refuse anything above it.
- 4 DIMMs at 2 DIMMs-per-channel: the **12700KF memory controller** is the binding limit (rated
  DDR4-3200), not the sticks. More VDIMM does not fix IMC marginality.

## Ladder

| step | MT/s | VDIMM | gear | CR | risk | what it settles |
|---|---|---|---|---|---|---|
| `r0` | 3733 | 1.350 | 2 | 2T | 27 medium | validates the baseline you are already running |
| `r1` | 3800 | 1.350 | 2 | 2T | 29 medium | is there headroom at all, at the same voltage |
| `r2` | 3866 | 1.400 | 2 | 2T | 36 high | first voltage bump |
| `r3` | 4000 | 1.450 | 2 | 2T | 45 severe | the operator target |
| `r4` | 4000 | 1.500 | 2 | 2T | 50 severe | last legal attempt; ceiling |

```bash
node tools/ram-oc-plan.ts ladder
node tools/ram-oc-plan.ts step --id=r3          # BIOS keying, risk notes, suite, inverse
```

## Validation gates (all five, or the verdict is UNPROVEN)

1. **trained-speed** — `dmidecode` Configured Memory Speed equals what you keyed in F10. A board that
   quietly trains *down* looks like a success and is not one.
2. **stress-ng** — `--vm 12 --vm-bytes 80% --vm-method all --verify`.
3. **memtester** — a second verify pass; catches the marginal flips a 20 minute run misses.
4. **zfs-scrub** — `zpool scrub` then `zpool status`: **zero** checksum errors. This is the gate that
   matters on this root pool.
5. **mce-edac** — `dmesg` clean of Machine Check / EDAC / hardware-error lines.

`UNPROVEN` is not a pass. `FAIL` means revert to the previous step **and scrub again** before
trusting anything written under the failed profile.

## Loop

```bash
# on target, inside tmux
sh /home/sd/oc-lab/scripts/ram-validate quick r0     # ~20 min
sh /home/sd/oc-lab/scripts/ram-validate full  r0     # ~1 h + scrub
# then, in the repo or via the ram-oc-validate workflow
node tools/ram-validate-parse.ts parse --id=r0 --mts=3733 --vdimm=1.35 \
  --log=/home/sd/oc-meters/ram-r0.full.log --append=receipts/ram-oc-receipts.json
```

Workflow: `ci/workflows/ram-oc-validate.yml` — `mode=plan` prints the step before a power-on,
`mode=ingest` takes the pasted log and writes the verdict plus the receipt ledger.

## Hard rules

- One knob per power-on. BIOS changes are operator-only (F10) and each has a written inverse.
- VDIMM ≤ 1.50 V, always. Never repeat 1.55 V.
- No memory step while a GPU step is unresolved — one variable at a time or neither result means
  anything.
- After any FAIL: revert, scrub, and only then plan the next attempt.
