# STATE.md — canonical machine facts

**Read this first, every session, before proposing anything.** It exists because
agents repeatedly re-derived facts that were already in a receipt and got them wrong.
Regenerate the live half with (fill me: ONE single command the operator runs that
writes the whole capture to one file — one file, paste it back wholesale).

Last verified: (fill me — date + what that receipt proved. Bookkeeping-only edits must
say so: no new target receipt = nothing below was re-measured.)

---

## Hardware (stable, do not re-ask)

| | |
|---|---|
| Machine | (fill me) |
| (rows) | (fill me — every row cited to a receipt date) |

## (fill me — per-domain sections: storage, network, software, ...)

Each row: the fact, its value, and the receipt that proved it (date + source: target
output, photo, package db, operator quote). A row without a receipt is a hypothesis,
not a fact — label it as one.

---

Rules:

1. A target receipt contradicts a row → the receipt wins, the row is corrected in the
   same PR, the old value moves to the receipt history (docs/ or git log), never left
   as a second live row.
2. Historical names and superseded mappings stay readable but are marked historical;
   absence from a receipt does not prove removal or failure.
3. This file is facts, not policy. Workflow rules live in MASTER.md; live gates in
   ToDo.md. If a section starts explaining *what to do next*, it is in the wrong file.
