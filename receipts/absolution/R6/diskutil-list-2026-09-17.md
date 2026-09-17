# `diskutil list` — Bay 2 swap verification (session 01a0ae24, 2026-09-17)

Source: operator photo of Terminal, `RevolYOUtionarys-Mac-Pro`, user `el`,
last login `Thu Sep 17 03:01:54 on ttys000`. Transcribed from the image.

```
/dev/disk0
   #:                       TYPE NAME                    SIZE       IDENTIFIER
   0:      GUID_partition_scheme                        *240.1 GB   disk0
   1:                        EFI                         209.7 MB   disk0s1
   2:                  Apple_HFS Kingston                239.7 GB   disk0s2
/dev/disk1
   0:      GUID_partition_scheme                        *1.0 TB     disk1
   1:                        EFI                         209.7 MB   disk1s1
   2:                  Apple_RAID                        999.9 GB   disk1s2
   3:                 Apple_Boot Boot OS X               134.2 MB   disk1s3
/dev/disk2
   0:      GUID_partition_scheme                        *1.0 TB     disk2
   1:                        EFI                         209.7 MB   disk2s1
   2:                  Apple_RAID                        999.9 GB   disk2s2
   3:                 Apple_Boot Boot OS X               134.2 MB   disk2s3
/dev/disk3
   0:      GUID_partition_scheme                        *1.0 TB     disk3
   1:                        EFI                         209.7 MB   disk3s1
   2:                  Apple_HFS start disk clone        999.3 GB   disk3s2
   3:                 Apple_Boot Recovery HD             650.0 MB   disk3s3
```

## Findings

| # | Finding | Consequence |
|---|---|---|
| 1 | **`disk0` row 0 = `GUID_partition_scheme`** | **THE LAST GATE IS CLEARED.** The Kingston is GUID, so it can boot an Intel Mac. The repartition was done correctly. Clone may proceed. |
| 2 | `disk0s1 EFI 209.7 MB` present | Confirms GUID independently — an EFI system partition only exists on a GUID disk. APM/MBR would not have one. |
| 3 | `disk0s2 Apple_HFS Kingston 239.7 GB` | Single full-size HFS+ volume, as intended. Not split, not CoreStorage. |
| 4 | Exactly **two** `Apple_RAID` members (`disk1s2`, `disk2s2`) | Correct: the third Raid X member is the WD pulled from Bay 2. Raid X is degraded/offline **as expected**. Both survivors are intact and must not be touched. |
| 5 | `disk3s2 Apple_HFS "start disk clone" 999.3 GB` | The live boot volume (MX500), untouched. Matches the R1 burn, which recorded `/dev/disk3s2` mounted at `/`. |
| 6 | **`disk3s3 Apple_Boot Recovery HD 650.0 MB` EXISTS** | The current boot disk has a Recovery HD. Worth carrying over — see below. |
| 7 | `disk1s3` / `disk2s3` = `Apple_Boot "Boot OS X"` 134.2 MB | Standard Apple RAID helper partitions, not user data. Leave alone. |
| 8 | Device numbering ≠ bay numbering | `disk0` is the new Kingston. Never address a disk by number in a destructive command without re-reading `diskutil list` first — identifiers are assigned at boot and shift. |

## Recovery HD note (new, actionable)

The source disk has a 650 MB Recovery HD (`disk3s3`). A plain CCC volume clone copies the
**volume**, not the recovery partition. Carbon Copy Cloner can clone the Recovery HD as a
separate explicit step. Since the destination is a single disk (not the abandoned RAID 0 —
which could not have had one at all), a Recovery HD **is** possible here and is worth having:
it provides Disk Utility, Terminal and reinstall without external media.

Not blocking. The clone boots fine without it; it can also be added after the fact.

## Rules unchanged by this receipt

- Never run Erase / Create / Rebuild / Demote against `disk1` or `disk2` — they are live
  Raid X members in a no-redundancy stripe.
- The MX500 (`disk3`) stays in Bay 1, bootable, as rollback until the Kingston is trusted.
- Endgame move still required: Kingston must finish in **Bay 1** so the third WD can return
  to Bay 2 and Raid X can remount with all three members (end state E3).
