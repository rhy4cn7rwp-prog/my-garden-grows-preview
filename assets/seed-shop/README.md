# Seed & Feed artwork

Original storybook artwork generated for the preview Seed & Feed redesign.
The existing prototype, village and clubhouse artwork is unchanged.

- `source/interior.png`: original generated 1024 × 1536 sunlit timber store,
  referencing the prototype shopkeeper and established clubhouse art style.
- `source/produce.png`: original generated transparent 1983 × 793 produce atlas.
- `interior.webp`: quality-90 mobile encoding, 410,064 bytes.
- `produce.webp`: quality-90 mobile encoding, 486,224 bytes, preserving alpha.

PNG originals are preserved. Runtime assets are format conversions only. Crop
illustrations are clipped at measured source bounds using nested SVG viewports
in `src/seed-shop.js`. Each is part of a real seed-packet button with live names,
prices, basket quantities and accessible labels. The room contains no prices,
HUD, controls, or static seed packets; empty display space receives reusable
packet/shelf components. No external image service, font or package is required.
