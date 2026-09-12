# Universal Instruction-Imaging Contract (v1, 2026-09-12)

Operator directive 2026-09-12 (session 01a097ba): instruction imaging must be OPTIMAL,
applicable to ANYTHING, and reproducible in model->operator communication. Reference loop
implementations: `tools/mac-guide-art.ts`, `tools/mac-storage-art.ts` (P0-P10). This is the
subject-agnostic contract every imaging task follows.

## Loop (any subject)
P0 harvest -> P1 lex (numbered demand list) -> P2 resolve -> P3 typecheck -> P4 layout ->
P5 stylecheck -> P6 emit (deterministic prompt from scene IR, never hand-written) -> P7
render -> P8 pixel-audit -> P9 critique (findings vs numbered pass) -> P10 deduct (patch IR
so the NEXT prompt hash moves). Fixpoint = latest pass zero ERROR. P0 harvests evidence, not
vibes: uploads first, then hash-verified public images; every fact gets a source.
Measurement grounding: docs/measurement-fundamentals.md - per-plate measurement
table, source ladder S1-S5, one measurement class per pass, ratio checks at P3/P4/P8,
photo wins on any conflict; inventory log: receipts/inventory/<machine>.md.

## Evidence first - ask for photos every time
Before any render: enumerate the image's visual claims, run
`node tools/uploads.ts gate --claims='[{"claim":"..."}]'`. Any MISSING claim => numbered
PHOTO REQUEST to the operator in chat; render REFUSED until covered; re-fires every time the
gap appears. Never guess a detail to fill a missing photo. Chat-only photos (viewable, bytes
not persistable) get a capped-confidence perception receipt; bytes re-requested when hashing
or pixel-audit needs them.

## Cross-reference uploads at every step
Every emitted prompt carries the byte-identical UPLOADS CROSSREF BLOCK (`uploads refs`,
window / `--ids=` / `--all`). `node tools/uploads.ts verify` runs immediately before every
render; hash mismatch REFUSES the render. Scene/prompt hashes land in the ledger so any
render is reproducible byte-for-byte and any critique maps to its exact prompt+refs.

## Memory - short and long term
SHORT-TERM: `uploads/RECENT.md` (auto window, last 8, full context). EVERY image agent reads
it before perceiving and re-checks after each ingest. LONG-TERM: `uploads/index.json`
(append-only, full sha256/dims/claims) + automatic agent-memory perception receipt per
ingest. 1:1 rule: claims about any image trace to a receipt (`agent-memory check --q=`) or
are marked MISSING. Agents disperse context in groups via agent-memory stacks.

## Reproducible communication + failure rules
Every wave: verdict -> receipts (paths+hashes) -> unverified limits -> gate -> next action,
ending with one explicit confirmation question; photo requests numbered; one wave at a time.
On FAIL: state what receipts exclude, pick a new class; never relabel a closed test; when in
doubt run `verify` (hashes) and `gate` (coverage) - both refuse work they cannot prove.
