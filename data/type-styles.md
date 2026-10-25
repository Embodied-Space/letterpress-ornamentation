# Type styles for text placeholders

`type-styles.json` lists the type styles a text placeholder (spec 12) can use to estimate how wide a line
of text will be. Each style has an average character width, as a fraction of the font size (ems):

```
width ≈ number of characters (spaces included) × charWidth × font size
```

The first five are rough defaults for broad styles. Measure the fonts you actually own and add them; a
measured font is much closer than a default.

## Measuring a font
1. Set this phrase in the font, upper and lower case, with normal word spaces. It has 43 characters,
   counting the 8 spaces:

   ```
   The quick brown fox jumps over the lazy dog
   ```

2. Measure the length of the line in points (lock it up and measure the type, or pull a proof and
   measure the print). 1 pica = 12 pt, 1 inch = 72 pt.
3. Work out the average width:

   ```
   charWidth = length in pt ÷ (43 × font size in pt)
   ```

   For example, the phrase in 12 pt type measuring 15 picas (180 pt): 180 ÷ (43 × 12) = 0.35.

If you mostly set a font in capitals, measure `THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG` as well and
add it as its own style (for example "Caslon 540 caps"), as capitals are much wider.

## Adding a style
Add an entry to `type-styles.json`:

```json
{
  "id": "caslon-540-18",
  "name": "Caslon 540, 18 pt",
  "charWidth": 0.35,
  "note": "Measured 2026-10-24 from a proof: 270 pt at 18 pt."
}
```

- `id`: kebab-case, unique.
- `name`: shown in the text form's style list.
- `charWidth`: the average character width in ems, more than 0.
- `note` (optional): where the number came from.

The first style in the list is the one a new text block starts with. Changing a style later doesn't
change text blocks already placed: a block keeps the width it was given until you edit it.
