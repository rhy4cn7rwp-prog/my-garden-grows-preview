# Phase 2A village art

These are new original generated illustrations, created using prototype 0.9's
village as an art-direction reference. No original prototype asset was modified.

- `buildings.png`: 1536 × 1024 RGBA atlas, six individual cutouts in 512 × 512
  cells. Top row: Dream Shop, Seed & Feed, Market Supplies. Bottom row: My Garden,
  Farmers Market, Job Board. Transparent background; no UI text or game values.
- `landscape.png`: painted scenery only: sky, mountains, trees, flowers, empty
  clearings and paths. There are no buildings, signs or game controls in it.

`src/town.js` renders six separate visible SVG sprites inside actual buttons.
Each sprite clips to its own cell (including letterboxed layouts), so adjacent
atlas cells cannot leak into another building. The landscape is a separate CSS
layer, and birds, moving flowers and butterflies are independent SVG layers.
Labels, savings progress, harvest readiness and market-open indicators are live
HTML derived from game state. The two images are preloaded and shared/cached;
there is only one atlas download for all six buildings.

The PNG sources total approximately 6 MB. They are kept in their original form
in this phase; image-format/compression optimization is a future asset-pipeline
step. Once loaded, animation uses small SVG groups and CSS transforms, not new
image downloads or a canvas/3D render loop. Reduced-motion preferences are honored.

These are illustrated location cutouts, not full skeletal character rigs or
individual editable merchandise layers. The tiny garden/market produce in the
location artwork is decorative location identification, not the farm inventory.
Detailed state-driven plots, shop merchandise and market equipment belong to
later phases. The interiors continue using their preserved prototype artwork.
