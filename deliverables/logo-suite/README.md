# Liquid Legacy Distribution: logo suite

The official crest (in `crest/`) is the primary logo and the one the website uses. The flat vector marks below are logo variations, proposed for approval; until they are approved, the official crest is the only logo in use. They are drawn as single-colour outlines for jobs the photoreal crest can't do: one-colour print, embossing, engraving, case stamps, light backgrounds and very small sizes.

## Which mark to use where

| Mark | Use it for | Smallest size |
|---|---|---|
| `crest/crest-full.png` | Hero moments, presentations, signage on dark grounds. Crest plus the official lettering. | 240 px wide |
| `crest/crest-mark.png` | The crest without lettering, on dark grounds. | 160 px wide |
| `lockup-horizontal` | Website header, letterhead, email signature, documents. Crown and LLD, a hairline, then the name on two lines. | 120 px wide (30 mm) |
| `wordmark` | Cartons, packaging, places where the monogram already appears nearby. | 140 px wide (35 mm) |
| `monogram` | LLD in a laurel wreath under a crown. Social avatar, embossing, embroidery, small spaces. | 24 px (8 mm) |
| `seal` | Roundel lettered "Liquid Legacy Distribution" and "Est. 2026". Case stamps, wax seals, stickers, merchandise. | 64 px (18 mm); 88 px or larger for legible lettering |
| `shield` | A one-colour stand-in for the full crest: heater shield, inner border, LLD and crown. Foil, engraving, uniforms, and anywhere the crest's detail would be lost. | 32 px (10 mm) |

## Colours

Every SVG comes in four colours. Pick the one that matches the ground:

| File suffix | Hex | Use on |
|---|---|---|
| `-gold` | #BF9F66 | Obsidian, coal and other dark grounds |
| `-parchment` | #EFE8DA | Dark grounds and photography |
| `-ink` | #1A1815 | Parchment, white, one-colour print |
| `-gold-deep` | #7A5C30 | Parchment and light grounds. Plain gold is too light on parchment. |

## Files

- `svg/`: all five marks in all four colours. Outlined paths with no live text and a tight viewBox. They scale to any size.
- `png/`: transparent PNGs 512, 1024 and 2048 px wide, in gold, ink and parchment.
- `crest/`: the official crest artwork, background removed. Use it on dark grounds only.
- `app-icons-vector/`: app-icon versions of the vector marks. These are alternates; the live site uses the official artwork.
- `contact-sheet.png`: every mark at large size and at working size, on obsidian and on parchment, with the small sizes magnified.

## Spacing and care

- Keep clear space on every side equal to the height of the crown.
- Don't recolour outside the four colours above. Don't add shadows, outlines or gradients, and don't stretch or rotate a mark.
- The marks are rebuilt from source with `pnpm logos`. Typefaces: Cinzel Decorative and Cinzel. Both are licensed under the SIL Open Font License, and copies are in `brand/fonts/`.
