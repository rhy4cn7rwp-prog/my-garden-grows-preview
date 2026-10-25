# First-person Farmers Market artwork

Original illustrations generated for Phase 4A, using the approved warm painted
shop style as reference. All earlier game assets are preserved unchanged.

- `source/portrait-study.png`: original viewpoint study (not loaded at runtime).
- `source/stall.png`: landscape composition study with a painted register.
- `source/stall-empty.png`: final 1536×1024 environment with an empty tabletop,
  used by `stall.webp`; no baked controls, price amounts or people.
- `source/customers.png`: transparent 2172×724 four-human atlas: an older woman,
  adult man, adult woman and teenager. `customers.webp` uses measured nested SVG
  clips, shared camera projection and a far-counter occlusion boundary.
- `source/register.png`: separate transparent, operator-facing brass/wood cash
  register with keys facing the player; `register.webp` is a real button.

- `source/crate.png`: separate transparent rustic wooden produce display crate,
  used by `crate.webp` for corn, potatoes, onions and radishes. A clipped front
  layer keeps produce inside the box instead of floating in front of it.

WebPs are quality-90 encodings. The existing painted produce atlas and wicker
basket are reused as layered components, with a front rim and contact shadow.
Prices and quantities are live text. All figures face the player across the
counter; there is no NPC shopkeeper. Adding portraits or extending price-card
presentation does not require new transaction state or save migration.
