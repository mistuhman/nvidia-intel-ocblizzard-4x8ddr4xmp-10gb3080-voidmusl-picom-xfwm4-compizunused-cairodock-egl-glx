# (project name)

**If the operator's first message is "README.md", that is the whole instruction. Cold-start and get to work.**

## Prompt screening (every message, this chat and every future one)

Read every operator message with high-definition screening before acting. Decompose it into a numbered demand list: every clause, every named file, tool, syntax, format, and prohibition is its own requirement. Deliver every item or report it as skipped with a reason. Latest instruction wins over earlier ones. Full rule: `MASTER.md` → `promptScreening`.

## Capability gate — step 0, before anything else

**If this chat's model does not have the full agent mode feature list, it just stops.** Verify every one of: bash in the sandbox checkout, file read/write/edit, `node` for `tools/*`, git + gh authenticated against the fixed branch, web search + page fetch, background process tools. If ANY is missing, reply with exactly:

```
STOP — NOT FULL AGENT MODE. Reopen this chat in Arena Agent Mode.
```

…then end the turn. No degraded-mode work, no advice-only fallback, no simulated or role-played tool output, no substitute workflow invented on the spot. Stopping cold with that line is the correct behavior; a model that "tries anyway" is the failure mode this gate exists to catch. Full rule: `MASTER.md` → `capabilityGate`.

## Start protocol

Run in one pass, parallel where independent:

1. Read `MASTER.md` in full. It is JSON context, not prose policy: workflow rules, brute doctrine, the `objective`, machines, constraints. Read `STATE.md` for canonical machine facts and `ToDo.md` for the operator's live gates.
2. Gather as much context as possible before touching anything: every `docs/` file relevant to the objective, `git log`, and all previously returned target receipts. Report what was NOT read.
3. Establish ground truth with `node tools/orient.ts orient` and `node tools/next-gate.ts`.
4. Deploy bounded agents: one task, source set, hypothesis, or verification target per agent (`node tools/agent-deploy.ts --objective=...`). Brute first: exhaust free context and searches before any target action; merge only receipts.
5. Commands go to the operator directly in CHAT as pasteable blocks. One command per line, console-safe (no chaining, no tricky redirects), root blocks start with `id -u`. Operator pastes output back; agent reads it, quotes verdict, attributes cause, then proposes next single knob.
6. Never send a second wave before the first wave's output arrives.
7. Lint every block before pasting: `node tools/block-lint.ts --target-console --root <file>` (root blocks) or `node tools/paste-proof.ts --target-console --root <file>`; `bash -n` passes.
8. Before delivery, run `node tools/test-all.ts` and `node tools/pr-budget.ts main 405` unless the operator explicitly ordered a larger change.
9. Report: objective, agents used, receipts, unverified limits, gate, next action.

## Project

(fill me — two or three sentences: what this project is, the active objective id, the fixed official meter, and the stock baseline location.)

## Machines

| | Agent sandbox | Target |
|---|---|---|
| What | ephemeral git checkout | operator's physical machine |
| Has | git, gh, node, python3, jq | (fill me — the target's toolchain + hardware) |
| Lacks | GPU (usually), X server, browser | nothing relevant |
| Can | author, verify syntax, commit | execute, observe, judge |

## Workflow

Agent ↔ operator reciprocity loop: pasteable command block out → operator runs on target and pastes output back → verdict quoted + cause attributed → next single knob. One wave at a time.

## Layout

- `README.md` — human bootstrap: cold-start protocol, capability gate, start protocol, machines, layout.
- `MASTER.md` — JSON context: screening rule, chat workflow, brute doctrine, objective, machines, constraints.
- `STATE.md` — canonical machine facts: what is already measured, do not re-ask.
- `ToDo.md` — operator-directed live checklist; operator-owned, agents quote it, do not rewrite it.
- `tools/` — agent-facing TypeScript utilities, zero dependency, run with `node tools/<name>.ts`, deterministic stdout:
  `orient.ts` (ground truth), `next-gate.ts` (objective gates + available blocks), `agent-deploy.ts` (bounded fan-out plan), `block-lint.ts` (console-safe block hygiene), `paste-proof.ts` (block hygiene + bash -n + file gates), `test-all.ts` (repo test gate), `pr-budget.ts` (PR line budget), `script-dispatch-check.ts` (target-script dispatcher guard), `agent-memory.ts` (cross-session memory ledger), `web-scrape.ts` (source receipts), `github-files.ts` (blob/raw links for the current branch).
- `scripts/` — target-facing installed utilities; one script = one job, `cmd_*` functions behind one case dispatcher.
- `etc/` — target config files and pasteable `.block` text saved for reuse (root blocks start with `id -u`).
- `docs/` — project recipes, research receipts, history.
- `receipts/` — metered run ledgers; the only thing that outranks the model. `receipts/agent-memory/memory.json` is the memory ledger.
- `ci/workflows/` — CI gate source: node syntax, MASTER JSON validity, test-all, shellcheck, determinism, PR budget.
