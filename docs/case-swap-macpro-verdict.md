# Case-swap verdict — 2006 Mac Pro (1,1/A1186, cheese-grater) transplant proposal

Date: 2026-09-07 (session 01a07de8) — the RECORD of the original no-mod claim and its
receipts. **Superseded as working state:** operator committed to the transplant with
compromises accepted; the living plan is `docs/case-swap-macpro-plan.md`. Model year
RESOLVED 2026-09-07h by operator: 2006 Mac Pro 1,1 (A1186 family), heavily upgraded.

Operator proposal (verbatim clauses): case swap to the cheese-grater Mac Pro; abandon the
OMEN fans; rad on "dual 180mm and the 180mm exhaust"; "fits all the needs without harmful
modding"; make a decision.

## Verdict on the no-mod claim: refuted on three receipts

1. **No 180mm mounts exist.** Case fans are 120mm-class proprietary zones: the PCIe/front
   cage unit (Apple p/n 922-8884) is a 120mm 4-pin
   (https://www.ebay.com/p/1801531864 ,
   https://www.macpartsdepot.com/922-8884-mac-pro-early-2009-a1289-fan-pcie.html), plus a
   small PSU/optical zone fan (607-3434). The largest fan any conversion fits is 140mm
   (https://www.tonymacx86.com/threads/laverdas-new-a1289-2010-mac-pro-pc-build-incl-front-panel-functionality.306044/).
   Consequence: the 240mm rad has NO native home — aftermarket brackets
   (https://thelaserhive.com/kits/powermac-g5-conversion-products/motherboard-tray/)
   or DIY, same class as the APEX zip-ties, is the only in-case path.
2. **ATX conversion = cut-and-Dremel, priced in the kit instructions themselves** — cut the
   rear PCI slot area ("rock the part back and forwards until the PCI slots come out"),
   Dremel the rivets + proprietary motherboard pegs, trim the shelf
   (https://thelaserhive.com/wp-content/uploads/2016/03/Mac-Pro-next-generation-kit.pdf).
   Corroborated: "most of the rear had to be removed to fit ATX boards" — custom tray,
   custom rear I/O, custom front I/O minimum
   (https://mastergrade.wordpress.com/2020/11/17/sleeper-pc-mac-pro-part-two/).
   Kit money: Mac Pro ATX+PSU kit £80-90, front-panel kit £55, rad brackets £20
   (https://thelaserhive.com/product/front-panel-conversion-kit/ ; orders by email).
3. **OMEN fans are a 90B control, not decoration.** The 8917 EC watches named headers
   (pump FAN1, rad LCFAN/TFAN-LCFAN2, FFAN1); a dead/untach'd watched header is exactly
   what produced the August 90B prompt. Generic tach substitution = untested class; one
   header at a time, proven with `etc/omen-90b-fan-probe.block`. Cooler-own OMEN fans
   therefore stay in ANY chassis (plan Phase 3: OMEN on watched headers, 140-class
   additions on free headers).

## Genuine native wins (why the case still earns the project)

Four factory 3.5" sleds; perforated front/rear + huge volume; box-stock aluminum beauty;
and the fit argument that turned verdict into project: Cryo-Chamber asymmetric hoses only
relax in a chassis this big (plan, 2026-09-07e).

## Unverified limits

Fan sizes from listings + one thread (no caliper receipts); Laser Hive 2026 stock unchecked;
90B-with-generics untested by design.
