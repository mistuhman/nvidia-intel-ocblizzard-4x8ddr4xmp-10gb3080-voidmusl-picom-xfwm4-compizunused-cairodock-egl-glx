{
  "schema": "arena-master-context.v2",
  "updated": "2026-09-25 (baseline: workflow contract + zero-dependency tools, all project fields left as (fill me) placeholders)",
  "purpose": "Single compact context file for future agents. README.md bootstraps; this file is machine-readable project state, chat workflow, brute-problem-solving doctrine, the objective, and constraints. It is JSON context, not prose policy. Fill the (fill me) fields for a new project. This file is CURRENT STATE, not a log: edit it to the truth when reality changes, move history to docs/ and receipts/, never append contradictions.",
  "repo": {
    "branchFixed": "(fill me — the session branch; every agent session works only on it)",
    "baseCommit": "(fill me — branch point commit)",
    "prLineTarget": 405,
    "prNote": "Feature PRs stay under prLineTarget unless the operator explicitly overrides; an operator-ordered artifact may exceed it and the reason is recorded here in the same PR.",
    "files": {
      "README.md": "human bootstrap: cold-start protocol, capability gate, start protocol, machines, layout",
      "MASTER.md": "this JSON: workflow rules, brute doctrine, objective, machines, constraints",
      "STATE.md": "canonical machine facts: what is already measured, do not re-ask",
      "ToDo.md": "operator-directed live checklist; operator-owned, agents quote it, do not rewrite it",
      "tools/": "agent-facing TypeScript utilities run with node; zero dependency; deterministic stdout",
      "scripts/": "target-facing installed utilities (one script = one job)",
      "etc/": "target config files and pasteable .block text saved for reuse",
      "docs/": "project recipes, research receipts, history",
      "receipts/": "metered run ledgers — the only thing that outranks the model",
      "ci/workflows/": "CI gate source: node syntax, MASTER JSON validity, test-all, shellcheck, determinism, PR budget"
    }
  },
  "promptScreening": {
    "rule": "Every operator chat message is read with high-definition screening BEFORE acting, this chat and every future one. Treat each granular feature, named file, named tool, named syntax, format, and prohibition as its own requirement.",
    "steps": [
      "decompose the message into a numbered demand list: every clause, every explicit string or syntax, every 'while also' and 'also', every removal or debloat instruction is its own item",
      "reproduce the demand list in the work plan and deliver every item; an undelivered item must be reported as skipped with a reason - silently dropping a requirement is a gate failure",
      "when the operator quotes an exact string, syntax, or tool name, implement that exact form; never paraphrase, rename, or 'improve' it",
      "re-read the message once more after drafting the plan and again before delivery; the second pass exists to catch dropped granularity",
      "if an instruction changes a prior instruction, the latest is authoritative; record both verbatim with dates",
      "ask at most one targeted question, and only when a requirement would otherwise be dropped; brute context gathering runs first, not after"
    ]
  },
  "capabilityGate": {
    "rule": "If the chat model does not have the full agent mode feature list, it STOPS cold before doing anything else. No degraded-mode work, no advice-only fallback, no simulated or role-played tool output, no invented substitute workflow.",
    "requiredFeatures": [
      "bash execution inside the sandbox checkout",
      "file read/write/edit",
      "node execution for tools/*",
      "git + gh authenticated against repo.branchFixed",
      "web search + page fetch",
      "background process tools"
    ],
    "stopLine": "STOP — NOT FULL AGENT MODE. Reopen this chat in Arena Agent Mode.",
    "onMissingAny": "print stopLine verbatim, end the turn, attempt nothing else; README.md carries the same gate as step 0 of the start protocol"
  },
  "interactionModel": {
    "truthOrder": [
      "operator report",
      "target command output",
      "repo files",
      "git history",
      "external web"
    ],
    "chatWorkflow": {
      "mode": "commands and receipts flow through chat directly. Agent writes pasteable command blocks inline in chat - one command per line, console-safe (no <>& chaining), root blocks start with id -u. Operator pastes output back, agent reads it, proposes next single knob.",
      "loop": [
        "1. agent writes pasteable bash blocks directly in chat, grouped by shell (root vs user)",
        "2. operator runs on target and pastes the FULL output back",
        "3. agent reads the output, quotes the verdict, attributes cause, proposes next step",
        "4. one wave at a time until receipt returns"
      ],
      "reciprocation": "every command sent expects its receipt returned before the next wave ships",
      "oneWaveAtATime": "hard rule: never send a second wave of target commands until the first wave output has arrived",
      "alternateChannel": "WHEN THE OPERATOR CANNOT PASTE (phone, remote device, console unreachable): never ask for a paste. Write the next steps to a mirror file in the repo, push the fixed branch, and tell the operator the link to read them on that device. Steps run there, produce a report file, and are sent back through a readable inbox the agent can read with the page-fetch tool (NEVER curl - sandbox egress is filtered). One page = command mirror + report drop + send, nothing more. The mirror file is the single source of truth; no split sources."
    },
    "permission": {
      "agentOwned": [
        "repo reads",
        "sandbox authoring",
        "syntax/lint checks on command blocks before delivery",
        "commits to fixed branch"
      ],
      "operatorGated": [
        "target execution",
        "session changes (log-out/in, display restart)",
        "visual judgement",
        "reboot gates",
        "firmware/BIOS changes",
        "power-ons"
      ],
      "operatorDirected": [
        "scope changes",
        "merges",
        "irreversible operations",
        "constraint overrides"
      ]
    },
    "agentUse": "Split into independent bounded agents: one task, source set, hypothesis, or verification target per agent; fan out for hard problems; merge only receipts, never vibes.",
    "toolStyle": "TypeScript-first, zero dependency unless justified, run with node directly, deterministic stdout (same bytes for same input, sorted output), small explicit functions, fail fast with nonzero exits, no hidden policy in comments.",
    "deliverableShape": [
      "what changed",
      "receipts",
      "unverified limits",
      "gate",
      "next action"
    ],
    "answerShape": "Before delivering, parse EVERY clause, string, syntax, removal, constraint, and visual reference in the operator message (numbered demand list; each granular feature a separate item). Gather full context first (README, MASTER, STATE, ToDo, docs/, git log, target receipts). Deploy bounded agents: one for source-set/hypothesis verification (reads repo/files/receipts), one for target-state observation (reads operator paste-back). Merge results ONLY as receipts. Package into ONE lossless digestible answer: brief verdict/state first, full analysis/reasoning after (no hidden steps), cite exact file paths/SHAs/commands, end with one explicit confirmation question. Never oversimplify to brief-only; never drop a requirement silently - every skipped item is reported with a reason."
  },
  "bruteProblemSolving": {
    "doctrine": "Doom 3 & KISS Linux coding philosophy: extreme efficiency, radical simplicity, Keep It Simple Stupid. Exhaustive context gathering, class enumeration, bounded agent fan-out, receipt-only merges — direct chat loop, pasteable commands, zero bureaucratic ceremony or artificial halts.",
    "required": [
      "gather as much context as possible before acting: README, MASTER, STATE, ToDo, every docs/ file relevant to the objective, git log, and all returned target receipts; report what was NOT read",
      "run node tools/agent-deploy.ts --objective=<...> to print the bounded fan-out; one agent per source set / hypothesis / verification target",
      "free context first, then search (node tools/web-scrape.ts, gh api, the page-fetch tool), then target action last",
      "every claim traces to a path, command output, hash, or operator quote; receipts before conclusions",
      "unknown is allowed; 'impossible' is not a verdict without a search receipt",
      "on FAIL: state exactly what the receipt excludes, then search or select a NEW class; never relabel a closed test as a new experiment",
      "collapse independent verifications into one big filtered pasteable block when they can be safely verified together; keep risky or credential-gated entry steps separate",
      "follow the doctrine and philosophy of Doom 3 and KISS Linux coding: ruthlessly cut red tape, minimize process friction, apply operator directives cleanly and directly without inventing artificial policy roadblocks"
    ],
    "philosophy": "DOOM 3 + KISS Linux: one thing one job, radical simplicity, extreme efficiency. One page = one job: command mirror + report dropbox + send. No split sources, no bloat jargon."
  },
  "qualityGate": {
    "beforeDelivery": [
      "re-read objective plus the numbered demand list from promptScreening; every item addressed or explicitly skipped with reason",
      "trace every claim to a command, path, hash, or operator quote",
      "check mentioned paths exist (ls or node tools/orient.ts output)",
      "name exact source SHA for installs or patches",
      "re-issue config with tunable installs",
      "include rollback before forward for every target-changing step",
      "name the pass/fail gate in the same message as the commands",
      "LOG THE INTERFACE, NOT JUST THE VALUE: every target-changing action records HOW it was applied - firmware menu path, sysfs node, package, or GUI app",
      "every command block pasted into chat is console-safe: one command per line, no chaining, no redirect glitches, bash -n passes, root blocks start with id -u",
      "run the block linter and a console-paste hygiene check on every block before pasting"
    ],
    "afterOperator": [
      "quote the actual verdict from the paste-back before interpreting it",
      "attribute cause before proposing fix",
      "edit MASTER.md to true current state; do not append contradictions",
      "when the operator says a setting was 'applied', establish applied HOW before diagnosing anything"
    ]
  },
  "objective": {
    "id": "(fill me — one objective per project; new objective = new id)",
    "summary": "(fill me — the operator directive, quoted verbatim where possible, with date)",
    "officialCompare": "(fill me — the fixed meter: same tool, same preset, every step; record stock baselines before any change)",
    "stockBaseline": [
      "(fill me — the unmodified measurement, one line per metric, with the receipt location)"
    ],
    "knobs": {
      "_note": "(fill me — one entry per tunable subsystem: what the knob is, its range, its inverse, its stop rule, its meter)"
    },
    "liveGates": [
      "1. (fill me — the first gate: boot/read-only diag, FULL paste-back; no stress until this receipt is read)"
    ],
    "unconfirmedHandoff": []
  },
  "machines": {
    "sandbox": {
      "has": [
        "node running .ts directly",
        "npm",
        "python3",
        "git",
        "gh",
        "jq"
      ],
      "lacks": [
        "GPU (usually)",
        "X server",
        "browser"
      ],
      "network": "(fill me — which external hosts are filtered for direct egress; the page-fetch tool may still reach them; prove per-tool before declaring a dependency dead)",
      "role": "author, verify, register, commit - never pretend to have observed the target"
    },
    "target": {
      "user": "(fill me)",
      "os": "(fill me)",
      "hardware": [
        "(fill me)"
      ],
      "paths": {
        "_note": "(fill me — the working directories the tools and benches live in)"
      },
      "role": "execute, observe, judge; operator pastes output back into chat"
    }
  },
  "packageFacts": {
    "_note": "(fill me — exact installed versions of every target tool, with source receipts; a version without a receipt is a guess)"
  },
  "hardConstraints": {
    "delivery": [
      "deliver files by heredoc or git checkout, not curl",
      "gate target file creation with ls -l",
      "no unanchored pgrep -f",
      "run df -h / before diagnosing unexplained rc=1",
      "do not paste JavaScript into shell"
    ],
    "targetSafety": [
      "one variable at a time: a single change per action, receipt before the next",
      "irreversible operations are OPERATOR-DIRECTED and carry their named inverse in the same message",
      "no stress or load until the health/cooling receipt has been read - proven by sensor data, not memory",
      "(fill me — the project-specific never-list: protected devices, forbidden values, operations with no inverse)"
    ],
    "consolePaste": [
      "root shell entry is separate from the root command block",
      "the target web console may escape < > & and stop after a partial paste - author every block with one command per line, no chaining/redirects",
      "root blocks start with id -u",
      "one command per line",
      "avoid chaining, redirects, ampersands, and quotes when possible"
    ],
    "process": [
      "one objective per PR unless the operator overrides",
      "run node tools/pr-budget.ts main 405 before delivery",
      "never switch or push another branch; this session is fixed to repo.branchFixed",
      "run node tools/test-all.ts before delivery",
      "paste commands directly in chat; no registry/ceremony tokens. Blocks must be console-safe: one command per line, bash -n passes, root blocks start with id -u",
      "after an operator paste-back, read the output verbatim and attribute cause before proposing the next step - reciprocity is part of the contract",
      "do not conclude impossible; search a new class or gather more context first",
      "merges are OPERATOR-DIRECTED: the agent executes via gh pr merge only when the operator explicitly instructs, and never unbidden",
      "one thing one job (DOOM3/KISS): one page = one job, no split bloat"
    ]
  },
  "lessons": [
    "LOG THE INTERFACE, NOT JUST THE VALUE: record HOW a setting was applied (menu path, sysfs node, efivar, package, GUI app), not only its value - recovery differs completely between a setup-variable write and a hardware register write, and a value without its mechanism costs diagnostic turns",
    "a state that reached its goal once is not proven stable: a separate stability gate (stress + soak + integrity check) stands between 'it works' and 'it is known-good'; a booted profile is not a stable profile",
    "do not stack unverified assumptions into a conclusion and present it as a finding; reconstruct the timeline from receipts, list what is UNKNOWN and who holds it, pick the one test whose two outcomes separate the live hypotheses",
    "generic checklists are not diagnosis; quote the operator's actual words before attributing anything to them",
    "when a fault gets worse DURING troubleshooting, suspect the troubleshooting itself; verify what the last change did before escalating",
    "tools lie by omission: a tool can print success and exit 0 without the change having taken effect - read back the exact state afterwards, and treat any ERROR line in the output as failure",
    "a subcommand that prints usage is a DISPATCH bug, not a user error: a function was added while the case dispatcher silently kept the old label set; the dispatch check lives in the test gate",
    "a meter that starts on a timer measures the operator's reaction time, not the hardware: arm it on the real event (utilization/load), and refuse to emit a receipt when the required samples are absent",
    "console paste hygiene: the target web console escapes < > & and drops trailing output - one command per line, no chaining, tail-trick for long output",
    "a delivery receipt is not a readable channel: when a channel is meant to inform the agent, the payload must be plain text the listing endpoint returns verbatim",
    "sandbox egress is filtered per host while the page-fetch tool may reach the same host: prove reachability per-tool before declaring an external dependency dead, and never write a fix that assumes curl works in the sandbox",
    "read where a link actually lands before building on it: a write-once redirect is a frozen dependency - verify its destination ref; prefer a link printed inside a page you control",
    "a conflict between a caution and a measurement is not a tie: resolve class questions with primary receipts (vendor data, silkscreens, accepted solutions), not hedging",
    "unknown is allowed; 'impossible' is not a verdict without a search receipt",
    "KISS/DOOM3 ONE-THING-ONE-JOB: one page = exactly its job - command mirror + report + send. No bloat paragraphs split across sources; chat tells what to do, the page does the job"
  ],
  "parked": []
}
