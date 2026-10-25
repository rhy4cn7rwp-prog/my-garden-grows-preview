# Market Supplies artwork

Original storybook art generated for Phase 3B, referencing the approved Seed &
Feed atmosphere and original Market Supplies style. Original game artwork is
unchanged.

- `source/interior.png`: preserved 1024 × 1536 store illustration. The new friendly
  shopkeeper stands behind the counter; the foreground is intentionally clear.
- `source/products.png`: preserved transparent 1774 × 887 eight-object atlas:
  bags, boxes, tags, sign; basket, table, canopy, scale.
- `interior.webp` / `products.webp`: quality-90 mobile encodings (about 818 KiB total).

All merchandise is rendered as separate real buttons using measured nested SVG
clips, normalized onto a 1792 × 896 virtual atlas. Prices and names are live text,
not painted into the art. Rack rails, price cards and counter plaque are separate
visual elements. The plaque matches the room's cover projection. PNG originals
are preserved; only format conversion was used for runtime WebPs. No external
image host or font is required.

## Visual refinement

`source/display-table.png` and `source/aframe.png` preserve newly generated
transparent storybook props. Their quality-90 WebP encodings are used at runtime.
The existing interior and eight-object atlas remain unchanged. The new sign
replaces atlas object 3 everywhere, including product details. Four products
share the perspective tabletop baseline; price cards hang on the apron. The
A-frame stands near the right leg, with merchandise touch targets above it.
The $8 reusable sign SKU and all transaction/save rules are unchanged.
Short portrait windows retain a scrollable room with sticky navigation rather
than shrinking product touch targets. Normal taller iPhone views fit the room.
