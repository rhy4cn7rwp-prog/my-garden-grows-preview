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
