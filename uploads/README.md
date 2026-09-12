# uploads/ - operator photo registry (directive 2026-09-12)

Every photo the operator uploads is saved here, hash-verified, and cross-referenced at
EVERY step of instruction imaging. Managed by `node tools/uploads.ts`.

- Upload: attach in chat - the agent runs `ingest --file=<path> --source=chat --label=...`.
  A viewable-but-not-persistable chat photo gets a perception receipt and the bytes are
  re-requested when they matter. Files dropped directly into `uploads/` are indexed too.
- `index.json`: LONG-TERM append-only registry (id U-NNNN, full sha256, dims, claims).
- `RECENT.md`: SHORT-TERM auto window (last 8, full context) - every image agent reads it
  BEFORE perceiving, so the most recent photos are always in agent context.
- `<date>/<file>`: ingested bytes, one dated folder per day.

Rules (docs/imaging-contract.md): `gate` refuses a render and issues a numbered PHOTO
REQUEST whenever a visual claim has no persisted evidence - every time; every emitted
prompt carries the byte-identical UPLOADS CROSSREF BLOCK (`refs`); `verify` passes
immediately before each render or the render is refused.
