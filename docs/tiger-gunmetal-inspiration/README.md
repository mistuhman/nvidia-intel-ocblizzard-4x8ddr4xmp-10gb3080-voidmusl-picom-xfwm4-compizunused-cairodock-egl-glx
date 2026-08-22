# Tiger-Gunmetal inspiration board (2026-08-22)

Sourced via image search, profiled by `tools/image-read.ts`, scored by
`tools/inspiration-match.ts` against `etc/tiger-theme-inspiration-spec.json`
(the operator description, verbatim: black, brushed gunmetal, reflective,
gradients blending blacks, skeuomorphic, dark grey, white, prussian blue).

- `brushed-metal-reference.jpg` — score 0.870 (best of 3). Adopted for its
  measured material physics: monotone vGradient ramp 126.6 -> 16.7,
  brush anisotropy 5.5 horizontal, specular 0.10, topBias 5.1.
- `rejected-flat-foil.jpg` — score 0.823. Flat vector foil: anisotropy 0.8,
  specular 0, no gradient ramp. Rejected as inspiration.
- None of the stock textures carries prussian blue or enough black; the
  theme generator synthesizes the palette while matching the reference's
  measured reflectivity numbers.

## Theme v2 gate receipts (2026-08-22, operator direction: more reflective, skeuomorphic, gradients blending blacks)

Agent-built TypeScript tooling (zero-dependency, deterministic):

- `tools/image-read.ts` — PNG pixel profiler: luma percentiles, dark/mid/specular
  shares, v/h gradient band ramps, top-light bias, Sobel brush anisotropy,
  palette clusters, blue + deep-blue shares. Decoder verified against the
  Python ground-truth codec pixel-for-pixel (8642 specular pixels, both sides).
- `tools/inspiration-match.ts` — scores images against
  `etc/tiger-theme-inspiration-spec.json` (operator description, verbatim).
  Unknown descriptor tokens fail the run; nothing is assumed. Signal
  semantics: `black` = darkShare >= 0.38 (material-strip aware);
  `gradients` = >= 5 monotone band drops with <= 1 dead-flat pair (designed
  specular rim edges allowed, flat banding rejected); `prussian blue` =
  blueShare >= 0.003 AND deep-blue-family share >= 0.002.

Gate results (v2 material, after v1 measured specular=0 / no white / flat
foils — the exact gaps the operator called out):

- emerald `theme.screenshot.png` MATCH=PASS score=0.949
- emerald `pixmaps.top.active.middle.png` (real titlebar material) MATCH=PASS score=0.806
- gtk `tiger3d/preview.png` MATCH=PASS score=0.869
- gtk `tiger3d/menubar.png` (real bar material) MATCH=PASS score=0.841
- sourced stock textures still correctly RESULT=NONE (closest 0.870, no blue,
  not black enough) — the palette is synthesized, the physics adopted.
- theme-material-profiles.json holds the raw profiles of both bar materials.

Operator photo note: the two attached reference photos never arrived in the
sandbox filesystem (/home/user/uploads/ absent). The v2 finish therefore
targets the measured physics of the closest passing reference plus the
operator's literal description; re-attach the photos and
`node tools/image-read.ts <photo>` extracts their exact reflectivity numbers
for a tuned v3 pass.
