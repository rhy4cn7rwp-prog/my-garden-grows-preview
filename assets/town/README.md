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

The Phase 2A PNG sources total approximately 6 MB and remain in their original
form. Phase 2B runtime exports are described below; the game no longer downloads
these PNGs. Once loaded, animation uses small SVG groups and CSS transforms, not new
image downloads or a canvas/3D render loop. Reduced-motion preferences are honored.

These are illustrated location cutouts, not full skeletal character rigs or
individual editable merchandise layers. The tiny garden/market produce in the
location artwork is decorative location identification, not the farm inventory.
Detailed state-driven plots, shop merchandise and market equipment belong to
later phases. The interiors continue using their preserved prototype artwork.

## Phase 2B additions and runtime exports

Original Phase 2A PNG files remain unchanged. New original generated source art:

- `source/seasons.png`: 2 × 2 atlas of the same terrain/paths/cobbled square,
  spring/summer on top and autumn/winter below. Each frame is portrait 3:4.
  It contains no buildings or game UI. Buildings stay independent and retain
  their new organic positions across all four seasons.
- `source/life.png`: 4 × 2 transparent atlas. Top row: spring, summer, autumn,
  winter versions of a tree. Bottom: walking woman, walking child, greeting
  farmer, bench/birdbath vignette. These are decorative neighbors, not actual
  sales customers. Some frame bounds are tightened to isolate the complete
  bench and neighboring farmer without stray adjacent pixels.

Runtime `buildings.webp`, `seasons.webp` and `life.webp` are WebP exports at quality
90, with transparency retained. Together they are approximately 2 MB; all four
season frames share one cached image. Original PNGs are not fetched by the game.
Exports can be reproduced with FFmpeg:

```sh
ffmpeg -i assets/town/buildings.png -c:v libwebp -quality 90 -compression_level 6 -frames:v 1 assets/town/buildings.webp
ffmpeg -i assets/town/source/seasons.png -c:v libwebp -quality 90 -compression_level 6 -frames:v 1 assets/town/seasons.webp
ffmpeg -i assets/town/source/life.png -c:v libwebp -quality 90 -compression_level 6 -frames:v 1 assets/town/life.webp
```

`village-life.js` uses normalized frame coordinates instead of binding layout to
source pixel dimensions. It supplies separate terrain, tree, fixture and resident
layers. Buildings expose empty decoration slots and the world has a separate
attachment layer for future personal touches. There is no upgrade system or
additional saved data yet.

Limitations: these are painted cutouts with lightweight pose/bob and route
animations, not skeletal character rigs or pathfinding AI. The terrain paths are
painted scenery. Building exteriors remain the same illustrations in every
season; seasonal variation currently lives mainly in terrain, trees and ambient
details. Winter does not impose new farming rules. Interior redesign is Phase 2C.
