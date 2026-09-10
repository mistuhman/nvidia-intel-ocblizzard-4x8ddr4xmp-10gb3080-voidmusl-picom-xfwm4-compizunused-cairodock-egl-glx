# Mac storage art — style contract (reusable)

Operator directive 2026-09-10, verbatim (`docs/macpro-storage-prompts.jsonl` seq 2):

> quake live style ui on everything, so hexagonal semi transparent amoled black backpanels and silver white glossy lining elements with skeumorphic os x sub iconography. with the drives shown in the correct place on the mac and each one being labelled with its purpose. for reuse between the user and model. 3 hdd raid 5 pcie and boot ssd

This file is the machine-readable half of that directive. `tools/mac-storage-art.ts`
loads it as the style contract and refuses to emit a render prompt that misses a
required token. Both halves (this file + the tool) are reusable by the operator and
by any future model: change the tokens here, re-run the passes, every plate follows.

## Palette

| Token | Value | Use |
|---|---|---|
| `amoled-black` | `#05070A` | page and panel substrate |
| `panel-black-70` | `#0A0E14` at 70-85% opacity | hexagonal back panels, semi transparent |
| `silver-white` | `#E8EDF4` | primary text, glossy lining strokes |
| `gloss-edge` | `#FFFFFF` at 60% | 1-2 px specular rim on panel edges |
| `gunmetal` | `#2A3138` | Quake-Live bevels, recessed frames |
| `quake-amber` | `#F2A93B` | attention / warning strokes |
| `raid-cyan` | `#39C0ED` | data path, RAID engine, cables |
| `cold-ice` | `#7FD1FF` | BTC cold-storage volume |

## Geometry (Quake Live)

- Back panels are **hexagons** (flat-top), semi transparent black over a dark
  brushed-gunmetal field. Not rectangles with rounded corners.
- Every panel carries a **2 px silver-white glossy lining**: bright on the top-left
  edge, fading on the bottom-right, plus a 1 px gunmetal bevel inside it.
- Corners are chamfered; the chamfer is repeated at a smaller scale for sub-panels.
- Panel headers use a small hexagonal tag with a single word in compressed caps.
- Grid: 24 px module, 8 px half-module. All panels snap to it.

## Skeuomorphic Mac OS X sub-iconography

Sub-icons are drawn in classic Aqua skeuomorph and sit **on** the Quake panels:

| Element | Icon treatment |
|---|---|
| 3.5" HDD member | classic Mac OS X internal-disk icon — brushed aluminium drive body, coloured status LED, glossy top light |
| Boot SSD | slim 2.5" SSD rendered in the same aluminium language, small green OK LED |
| RAID set | stacked-disk RAID glyph, three platters visible, cyan parity band |
| Cold vault volume | Mac OS X external/volume icon with a **padlock** badge, frosted ice tint |
| Warning | Aqua caution triangle, glossy, amber |
| Cabling | SFF-8087 connector glyph, braided cable with a rounded strain relief |
| PCIe | Apple PCIe slot iconography — slot fingers drawn as a row of gold contacts |

Rules: icons stay flat-on-panel with a soft drop shadow and a top specular
highlight; no 3D perspective skew; no neon outlines; no glassmorphism blur over
text.

## Typography

- Headers: heavy condensed sans, all caps, letter-spaced, silver-white.
- In-image label budget (defect class `F-25`): **4 words / 24 characters maximum**.
  Longer copy never goes inside the rendered image — it goes in the deterministic
  overlay layer emitted by `node tools/mac-storage-art.ts svg` and the HTML gallery.
- Numerals are the risky glyph class: prefer `1 TB` over `1000 GB`, `2 TB` over
  `2048 GB`, `3 x 1 TB` over `three one-terabyte drives`.

## Composition rules (all plates)

1. Drives are drawn **in their real physical position** on the Mac — bay 1 on top,
   bay 4 at the bottom, optical bays above them, PCIe area below.
2. Every drive carries a label with its **purpose**, not just its size.
3. Data path direction is always left to right: members → RAID engine → volume.
4. The boot SSD is never drawn as part of the RAID path.
5. No text is allowed to overlap a panel edge; no leader line crosses another.
6. Aspect ratio is fixed per plate in `docs/macpro-storage-scene.json`.

## Negative constraints (what breaks a plate)

`no-text-walls`, `no-paragraph-in-image`, `no-watermark`, `no-photoreal-human`,
`no-brand-logo-watermark`, `no-neon-glow-bloom`, `no-blurry-icons`,
`no-extra-drives`, `no-macbook`, `no-rack-server`, `no-fan-art-logo`,
`no-invented-port-counts`, `no-raid-5-in-disk-utility`, `no-apfs-on-10-7`.
