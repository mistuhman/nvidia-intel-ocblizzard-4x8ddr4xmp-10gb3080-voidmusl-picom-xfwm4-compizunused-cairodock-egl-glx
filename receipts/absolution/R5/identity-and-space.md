# ABSOLUTION R5 burn - identity resolved, space located
Source: webhook POST uuid 4f787751, 13204 bytes / 304 lines, read via fetch_page 2026-09-17.
Note: page tagged rollout=R5, report body says rollout=R3 (operator ran the already-downloaded
command). Data is complete - ABSOLUTION1_DONE present - so the burn is valid; the mismatch is
exactly what the parse gate is designed to surface.

## Identity: CONFIRMED, no longer a guess
    dscl RealName:  el  ->  Samael
    admin group:    GroupMembership: root el
So the operator's "Samael/admin" IS short name `el`. KEEPER=el is correct, and el is a real admin.
jazzyempire and revo are NOT in the admin group, so removing them cannot orphan admin rights.
`el` is logged in on ttys000; neither doomed account is logged in.

## Accounts
| acct | uid | RealName | home size | verdict |
|---|---|---|---|---|
| el | 502 | Samael | 1.3G | KEEP (operator, admin, textures) |
| revo | ? | (none) | **775G** | REMOVE |
| jazzyempire | ? | (none) | 56K | REMOVE (empty) |
| Guest | 201 | Guest User | 0B | excluded by rule |

## THE SPACE IS revo: 775G of the 899G used
R1 only measured revo's Downloads (54G) and I wrongly treated that as the whole story. The home is
**775G**. That single account is the 97%-full condition. The 58-app sweep (5.09GB) is noise by
comparison - removing revo is the only action that actually changes the disk state.

## Textures: operator's claim VERIFIED, and they are on the keeper
/Users/el/Downloads: **256 .icns**, 1 iconset, 82 images, 351M total. Named items include
CandyBar.app, CandyBar_3.3.4.zip, Flavours.dmg, flavours_classic.zip, Brushed-Metal-Texture.jpg,
rich-gunmetal-metallic-background...jpg, Ducks-on-a-Misty-Pond1.jpg, atom-png-*.png.
Deep scan also found the live Flavours themes:
  /Users/el/Library/Application Support/Flavours/My Flavours/...Natural Wood.flavour
  /Users/el/Library/Application Support/Flavours/My Flavours/CEFDBDFF-....flavour
  /Users/el/Downloads/CandyBar.app/Contents/Resources/Float.icontainer
All inside the KEEPER's home => protected by construction; the accounts script never touches it.

Also present: /Users/el/Downloads/Winamp-0.8.1.13.dmg - the operator's classic-Winamp plan is
already staged locally.

## revo content warning (operator decision, not agent's)
revo/Downloads holds business documents, audiobooks (.aa/.aax), WAV/mp3, spreadsheets, PDFs and
**3064 images + 135 .icns**. It is somebody's real working data, not junk. The script harvests
Downloads + theme files to /Users/el/absolution-harvest/revo/ before deletion, and the home is
moved to quarantine rather than deleted, so nothing is unrecoverable until the operator purges.

## Unchanged
Boot volume /dev/disk3s2 "start disk clone", 931Gi, 899Gi used, 97% full, verify OK.
Firewall disabled, stealth disabled, guest UNSET - the harden wave is still outstanding.
