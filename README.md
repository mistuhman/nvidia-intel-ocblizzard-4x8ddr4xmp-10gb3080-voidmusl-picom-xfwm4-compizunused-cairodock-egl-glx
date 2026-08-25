# nvidia-intel-ocblizzard-4x8ddr4xmp-10gb3080-voidmusl-picom-xfwm4-compizunused-cairodock-egl-glx

**If the operator's first message is "README.md", that is the whole instruction. Cold-start and get to work.**

## Start protocol

Run in one pass, parallel where independent:

1. Read `MASTER.md` in full. It is JSON context, not prose policy.
2. Establish ground truth with `node tools/orient.ts orient`.
3. Read `activeObjective` from `MASTER.md`; that is the task and gate.
4. Deploy bounded agents: one task, source set, hypothesis, or verification target per agent.
5. Before pasting target commands, run `node tools/paste-proof.ts --target-console --root <block-file>` or an equivalent stricter check.
6. Before delivery, run `node tools/test-all.ts` and `node tools/pr-budget.ts main 405` unless the operator explicitly ordered a larger refactor.
7. Deliver large, filtered, pasteable command blocks only after tool checks; the operator pastes output back for main-model problem solving.
8. Report objective, agents used, receipts, unverified limits, gate, and next action.

## Project

Live reversible rebuild of the operator's physical Void Linux musl desktop: XFCE runs `compiz-reloaded`, `cairo-dock`, frozen gunmetal theme, and a headless-baked PS3-XMB wallpaper. The target is a daily driver. Target changes require exact inverse and an operator gate.

## Machines

| | Agent sandbox | Target |
|---|---|---|
| What | ephemeral git checkout | operator desktop, user `sd` |
| Has | git, gh, node, python3, jq | X11, NVIDIA RTX 3080 10GB, Intel 12700KF (KF = no iGPU), 32GB DDR4 XMP |
| Lacks | GPU, X server, ffmpeg, browser | nothing relevant |
| Can | author, verify syntax, commit | execute, observe, judge |

## Layout

- `MASTER.md` — JSON context: constraints, machine facts, file interactions, active objective.
- `ToDo.md` — operator-directed work-infrastructure checklist.
- `scripts/` — target-facing installed tools.
- `tools/` — TypeScript agent tools. Run with `node tools/<name>.ts`.
- `etc/` — target config files authored in repo.
