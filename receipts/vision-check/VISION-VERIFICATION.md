# VISION CAPABILITY VERIFICATION — session 01a0ad71 (2026-09-17)

Operator directive: "deploy agents to read ToDo.md, README.md, and MASTER.md then verify
model image sight capability before continuing at further user prompt".

VERDICT: **IMAGE SIGHT = LIVE AND VERIFIED.** This chat model CAN see images.

This matters because MASTER `repo.priorSessions` records the opposite for an earlier chat:
"SESSION LIMIT: the 01a082d3 chat model has NO image input - every photo receipt is a TEXT
DESCRIPTION from the operator." That limit does NOT apply to this session. Photo receipts
can be uploaded directly again; `docs/imaging-contract.md` P7/P8 render+pixel-audit and
`tools/uploads.ts` perception receipts are unblocked.

## Test A — blind synthetic read (deterministic, self-scoring)

Method chosen so the result cannot be faked: a generator script drew randomized content with
`random.SystemRandom()` and wrote the answer key to `/tmp/vision-answer.json`, which was NOT
printed to the agent's context. The agent viewed only the PNG, committed a reading to
`reading-a.json`, and only then revealed and diffed the key.

- Image: `receipts/vision-check/vision-test-a.png`
  sha256 `89523f59df719e8601d0ab30bce7ce05d683caa4cd7baadb91ed9e00cfb09104` (2796 bytes, 720x420)
- Reading: `receipts/vision-check/reading-a.json`

| field | read blind | ground truth | result |
|---|---|---|---|
| code | 6322 | 6322 | PASS |
| word | BLIZZARD | BLIZZARD | PASS |
| shape | TRIANGLE | TRIANGLE | PASS |
| shape_count | 4 | 4 | PASS |
| shape_color | YELLOW | YELLOW | PASS |
| background | BLACK | BLACK | PASS |
| dims | 720x420 | 720x420 | PASS |

`VISION_TEST_A=PASS (exact match, all 7 fields)` — 7/7, including a 4-digit random code that
exists nowhere in the agent's text context. Proves OCR of rendered glyphs, colour naming,
shape classification and counting.

## Test B — real photograph (generalization beyond synthetic glyphs)

- Image: `image-search/hp-omen-45l-desktop-interior-motherboard-1.jpg`
  sha256 `7ea8cd41148c79519f87b53a3d1f958b953c6425e198a6569b15facfb5155a71`
- Source: hp.com OMEN upgrade-compatibility guide (marketing photo, NOT a target receipt)

Unprompted description produced from the pixels: a man in a white tee, dark curly hair and
glasses, seated back-to-camera at a light-wood corner desk in a loft with exposed brick, black
steel trusses and tall windows; THREE displays (left = green valley/mountain game scene,
centre = a video-call/chat UI with participant tiles, right = more game view); a blue boom-arm
broadcast mic on an articulated arm; headphones on a hook, a brown bookshelf speaker, low-profile
keyboard on a large black deskmat; to the right a glass-side tower with RGB ring fans, visible
GPU and a blue OMEN diamond logo on the front panel; two potted succulents and a pen cup.

Multi-object, spatial-layout, text-in-UI and logo recognition all succeeded on a noisy real image.

## Capability gate (README step 0 / MASTER `capabilityGate`) — all present

bash in sandbox checkout / file read-write-edit / `node` v22.22.3 for `tools/*` /
git + gh authenticated (`arena-ai-coding-agent[bot]`) / web search + page fetch /
background process tools / **image input (verified above)**.

Not the stop case. No `STOP — NOT FULL AGENT MODE.` line required.

## Limits not proven by these two tests

- Fine EXIF/metadata extraction was not tested (the agent reads pixels, not camera tags).
- Sub-millimetre measurement off a photo is NOT established; `docs/measurement-fundamentals.md`
  ratio discipline and the photo-wins rule still govern any dimension claim.
- No operator photo has been ingested this session: `uploads/index.json` is still
  `totalEntries=0`, so `node tools/uploads.ts gate` will still refuse renders whose visual
  claims have no persisted evidence. Sight being live does not by itself satisfy that gate.
- Synthetic-glyph OCR does not guarantee reading small/blurred silkscreen on a board macro;
  that is re-verified per photo when it matters.
