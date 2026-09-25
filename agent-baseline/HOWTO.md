# HOWTO — instantiating this baseline for a new project

The baseline is the baseline, not a copy of the project it came from: every project
specific is a `(fill me)` placeholder. The workflow is the product.

## Instantiate

1. Copy the CONTENTS of this directory to the root of a fresh repo (this directory
   then disappears as a directory and becomes the new repo's top level).
2. Replace the `(fill me)` placeholders, in this order:
   - `MASTER.md` → `repo.branchFixed`/`baseCommit`, `objective`, `machines`,
     `packageFacts`, `hardConstraints.targetSafety` last item. Keep it valid JSON —
     `python3 -m json.tool MASTER.md` is in the test gate.
   - `README.md` → project section + machines table.
   - `STATE.md` → the measured facts (every row cited to a receipt).
   - `ToDo.md` → TOP PRIORITY with the operator's directive quoted verbatim.
3. Name the session branch and set `MASTER.md` `repo.branchFixed` to it. Every agent
   session works only on that branch; `orient` flags a mismatch.
4. Target machine: author `scripts/` (one script = one job, `cmd_*` + one case
   dispatcher), `etc/*.block` (root blocks start with `id -u`), `docs/` recipes,
   `receipts/` ledgers. Run `node tools/script-dispatch-check.ts` on every script.
5. Activate CI: copy `ci/workflows/agent-baseline-ci.yml` to `.github/workflows/`
   (or use the repo's own workflow-copy script convention).
6. Tell the next agent chat: read `README.md`. The cold-start protocol does the rest.

## What the baseline gives you (the efficiency surface)

- **30-second cold start:** README → MASTER → STATE → ToDo, then `orient` +
  `next-gate` print the ground truth; a new session never re-derives what a receipt proved.
- **Capability gate:** a chat model missing any agent-mode feature stops cold with a
  fixed line instead of doing degraded work.
- **Prompt screening:** every operator message decomposes into a numbered demand list;
  nothing is dropped silently.
- **One-wave reciprocity loop:** pasteable blocks out, full output back, verdict quoted,
  cause attributed, next single knob. Block hygiene is linted, not vibes (`block-lint`,
  `paste-proof`).
- **Permission model:** what the agent owns, what is operator-gated, what is
  operator-directed — the same three lists for every project.
- **Brute doctrine:** context → search → target action; receipts before conclusions;
  bounded agents via `agent-deploy`; unknown is allowed, "impossible" is not.
- **Quality gate:** rollback named before forward, pass/fail gate in the same message,
  interface logged not just value.
- **Cross-session memory:** `agent-memory.ts` ledger with a `check --q` 1:1 gate —
  an agent must not claim chat-history or perception facts without a recorded receipt.
- **Process gates:** `test-all.ts` (syntax, JSON validity, selftests, hygiene) and
  `pr-budget.ts main 405`, proven by CI on every push.
- **Lessons:** the distilled failure modes, written so the next agent does not pay
  for them twice.

## Deliberately NOT in the baseline

Kept in the source repo — add them back only if the new project needs them:

- `tools/cmd.ts` — byte-exact command+receipt registry. Superseded by the direct paste
  loop + the `agent-memory` ledger; kept where a long campaign needs byte-stable replay
  of sent commands and recorded results.
- `tools/uploads.ts` + the imaging contract — operator photo registry / imaging loop
  (evidence-gated render pipeline). Add when the new project works from operator photos.
- `tools/vision-check.ts`, `tools/image-read.ts`, `tools/inspiration-match.ts` — the
  imaging pipeline around the registry above.
- All domain labs (GPU/RAM/CPU OC tooling, machine-specific helpers, `.command` pages,
  burn/relay pages, `etc/*.block` domain blocks, `docs/`, `receipts/` domain ledgers) —
  replace with the new project's own labs, built on the same zero-dependency node
  conventions and the same test-gate shape.
