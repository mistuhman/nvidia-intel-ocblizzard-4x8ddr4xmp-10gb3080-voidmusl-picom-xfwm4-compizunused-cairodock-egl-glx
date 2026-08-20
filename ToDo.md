# ToDo

| Goal | Sentence | Done |
|---|---|---|
| ZFS filesystem | Replace the current root filesystem with ZFS on root (via zfsbootmenu), with snapshots and rollback for every state change. | ☐ |
| doas over sudo | Remove sudo entirely and manage privilege elevation with OpenBSD doas, delivering a doas.conf equivalent to the current sudo rules. | ☐ |
| Full hardening | Harden Void Linux end to end: default-deny nftables firewall, kernel-hardening sysctls, service minimization, locked-down SSH, and package integrity checks. | ☐ |
| Network interception | Capture and record all network traffic — full packet capture plus intrusion-detection alerting — so every connection is logged for later review. | ☐ |
| Network control | Own every packet in and out of the machine with an explicit, audited ruleset: default deny, only the permitted flows allowed. | ☐ |
| Machine logging | Log the whole machine — boot, auth, processes, file changes — to durable, redundant logs with a defined retention policy. | ☐ |
| Overrun detail | Produce tamper-evident logs and a written incident runbook so, if the machine is ever overrun, the operator can reconstruct exactly what happened and what to do next. | ☐ |
