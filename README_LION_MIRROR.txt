Mac Pro 1,1 — new Lion InstallESD mirror (2026-09-10 rewrite)

The date-to-2016 path is WITHDRAWN (operator: it did not work).
The previous Bay 4 restore is not a labeled installer: Option-key picker
showed Lion SSD Base, EFI Boot, Mac OS X — no "Mac OS X Install ESD".

NOW (still at the gray picker):
  Click Lion SSD Base (the highlighted disk with the up-arrow).
  Do not click EFI Boot.
  Do not click Mac OS X.

THEN, on the Snow Leopard desktop, make a NEW mirror of the INNER
InstallESD.dmg onto Bay 4 only.

Why a new mirror, not another date hack
  Apple 10.7 bootable media = asr restore of InstallESD.dmg (the file
  inside Install OS X Lion.app), then bless --label. createinstallmedia
  does not exist on Lion. The outer InstallMacOSX.dmg / .pkg is not
  bootable. Two volumes named "Mac OS X Install ESD" (the dmg AND Bay 4)
  is how a restore becomes "EFI Boot".

What is erased
  Bay 4 only (the current installer disk / EFI Boot).
  NOT Lion SSD Base (Bay 1 rescue Snow Leopard).
  NOT start disk clone (Bay 3 Crucial MX500 — Lion target).

How (double-click)
  lion-asr-installer-mirror.command
  Enter admin password. Read the dialog: dest name, /dev/diskNsX, protocol.
  Click "Erase Bay 4" only if that dest is the installer disk, not the 1 TB SSD.
  Report: ~/Desktop/lion-asr-installer-mirror.txt — return it before the next restart.

How (Disk Utility, if you skip the script)
  Do NOT drag a mounted "Mac OS X Install ESD" onto another of the same name.
  Finder: Install OS X Lion.app > Show Package Contents > Contents > SharedSupport.
  Disk Utility > Restore > Image... > pick InstallESD.dmg (the FILE).
  Destination = the physical Bay 4 disk (SATA, not Disk Image, not MX500).
  Erase destination checked. Then Terminal:

    sudo bless --folder "/Volumes/Mac OS X Install ESD/System/Library/CoreServices" --label "Mac OS X Install ESD"

After a good mirror
  Restart, hold Option. Picker must show "Mac OS X Install ESD".
  If it still says EFI Boot: photograph, stop, do not guess.
  Installer destination = start disk clone (1 TB). Do not erase it
  (this ESD is an upgrade installer). Do not touch Lion SSD Base.
  Replace other drives only after Lion has booted from the SSD.
