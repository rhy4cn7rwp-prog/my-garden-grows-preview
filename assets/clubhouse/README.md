# Clubhouse artwork

Original storybook room and reward illustrations created with the image-generation
tool for Phase 2C. Existing prototype and village artwork was not altered.

- `source/room.png`: original generated wooden hideaway, 1086 × 1448.
- `source/rewards.png`: original final transparent reward atlas, 1535 × 1024.
- `room.webp` / `rewards.webp`: quality-90 WebP encodings for mobile delivery.

The PNG sources are preserved without painting/cropping. Atlas items are rendered
with measured SVG viewBoxes and explicit clips in `src/clubhouse.js`; the rendered
objects are separate owned-item buttons. Do not assume exact equal atlas cells.
The puppy-fund reward is a paw-print keepsake box, not a live pet.

The timber room contains no money/day/season labels, navigation controls or
purchased goods. All such controls and ownership are live game elements.

## Phase 2D panorama

- `source/panorama.png`: original generated 2172 × 724 connected room expansion,
  derived from the preserved Phase 2C room using the image-generation editing tool.
- `panorama.webp`: quality-88 runtime encoding, 464,076 bytes.

The expanded painting retains the central round-window alcove, original rug,
seating nook, shelves and chest, and adds a left reading/bench wall and right
shelf/cabinet wall. It contains no rewards or interface. The original room and
reward assets above remain byte-for-byte unchanged. Canvas 2D samples this one
continuous image; rewards remain separate touch controls.

## Furniture-relative sizing

The PNG and WebP artworks are unchanged. `ClubhouseLayout.itemSizes` supplies an
approximate physical width/height and the correct atlas aspect ratio for each
reward. The approved soccer-ball diameter defines the common room-pixel scale;
the bench seat and floorboards provide a visual cross-check. Surface depth and
the existing camera projection then apply uniformly to all items and furniture.
Bicycle wheels, guitar base, tablet case, camera body/strap and keepsake base use
individual contact insets, rather than treating transparent shadows as feet.
These dimensions are storybook guides, not an architectural room model.
