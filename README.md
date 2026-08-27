# nvidia-intel-ocblizzard-4x8ddr4xmp-10gb3080-voidmusl-picom-xfwm4-compizunused-cairodock-egl-glx

**If the operator's first message is "README.md", that is the whole instruction. Cold-start and get to work.**

## Prompt screening (every message, this chat and every future one)

Read every operator message with high-definition screening before acting. Decompose it into a numbered demand list: every clause, every named file, tool, syntax, format, and prohibition is its own requirement. Deliver every item or report it as skipped with a reason. Exact quoted strings (`?(example command)`) are implemented exactly, never paraphrased. Latest instruction wins over earlier ones. Full rule: `MASTER.md` → `promptScreening`.

## Start protocol

Run in one pass, parallel where independent:

1. Read `MASTER.md` in full. It is JSON context, not prose policy: workflow rules, brute doctrine, the `objective`, machines, constraints. Read `ToDo.md` for the operator's live gates.
2. Gather as much context as possible before touching anything: every `docs/` file relevant to the objective, the command registry, `git log`, and all previously returned target receipts. Report what was NOT read.
3. Establish ground truth with `node tools/orient.ts orient` and `node tools/next-gate.ts`.
4. Deploy bounded agents: one task, source set, hypothesis, or verification target per agent (`node tools/agent-deploy.ts --objective=...`). Brute first: exhaust free context and searches before any hardware action; merge only receipts.
5. Commands go to the operator through CHAT, reciprocated by pasted output. Every command set quoted in chat must be registry-backed: register with `node tools/cmd.ts add <name> --file=etc/<block>` and quote it as `?(name)`. When ANY message contains `?(name)`, reproduce it with `node tools/cmd.ts expand '<message>'` — the exact same instruction set and the exact same recorded result, byte for byte, every time.
6. When the operator pastes output back: record it verbatim (`node tools/cmd.ts result <name>`), quote the actual verdict, attribute cause, then propose the next single knob. Never send a second wave before the first wave's output arrives.
7. Before pasting target commands, run `node tools/paste-proof.ts --target-console < <block>` or an equivalent stricter check.
8. Before delivery, run `node tools/test-all.ts` and `node tools/pr-budget.ts main 405` unless the operator explicitly ordered a larger refactor.
9. Deliver large, filtered, pasteable command blocks only after tool checks; the operator pastes output back for main-model problem solving.
10. Report: objective, agents used, receipts, unverified limits, gate, next action.

## Project

Live reversible overclocking campaign on the operator's physical Void Linux desktop (post-recovery: the OMEN 45L POSTs and boots clean). Active objective `extreme-optimization-oc`: minimum processes/memory with the beauty stack intact, then EXTREME optimization and overclocking of the i7-12700KF and RTX 3080 10GB with Geekbench 6.7.1 + Unigine Superposition 1080p Extreme as the official meter (stock baselines already recorded in the registry as `?(oc-p7-baseline)`). Live gates and storage work (boot order, AHCI-vs-RAID, SATA zpools) are tracked in `ToDo.md`; one knob at a time, granular, metered. Target changes require an exact inverse and an operator gate.

## Machines

| | Agent sandbox | Target |
|---|---|---|
| What | ephemeral git checkout | operator desktop, user `sd` |
| Has | git, gh, node, python3, jq | X11, NVIDIA RTX 3080 10GB, Intel 12700KF (KF = no iGPU), 32GB DDR4 XMP 3733, HP BlizzardOC Z690 |
| Lacks | GPU, X server, ffmpeg, browser | nothing relevant |
| Can | author, verify syntax, commit | execute, observe, judge |

## Workflow

Agent ↔ operator reciprocity loop: `?(name)` block out → operator pastes target output back → output recorded via `node tools/cmd.ts result <name>` → verdict quoted → next single knob. Deterministic TypeScript tools only; same input, same bytes, every run.

## Layout

- `MASTER.md` — JSON context: screening rule, chat workflow, brute doctrine, objective, machines, constraints.
- `ToDo.md` — operator-directed live checklist (OC + storage gates); operator-owned.
- `commands/registry.json` — deterministic command registry replayed by `?(name)` tokens.
- `tools/` — TypeScript agent tools (`cmd.ts`, `orient.ts`, `next-gate.ts`, `agent-deploy.ts`, `paste-proof.ts`, `block-lint.ts`, `pr-budget.ts`, `test-all.ts`, `web-scrape.ts`, `github-files.ts`, `recovery-research.ts`). Run with `node tools/<name>.ts`.
- `etc/` — target config files and canonical `.block` text the registry wraps.
- `scripts/` — target-facing installed tools.
- `docs/` — OC recipes (`oc-plan.md`, `oc-3080-gwe-recipe.md`, `oc-cpu-bios-checklist.md`) and recovery history.
