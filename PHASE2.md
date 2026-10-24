# Phase 2: a state-driven storybook world

## Phase 2A delivered: town and navigation only

- The village is assembled from six independent visible building/location
  buttons, a painted terrain layer and separate animated environmental objects.
- Labels, savings progress, harvest readiness and market-open badges reflect
  real state. There are no old town-image hotspots or baked money/day controls.
- One functional header provides money, season/day, Clubhouse and appropriate Back.
  Interior source images are preserved, with their old HUD regions display-cropped.
- Existing gameplay/save logic is unchanged. The Job Board remains a placeholder.
- The old prototype images remain intact. New art details and limitations are in
  `assets/town/README.md`. Physical iPhone Safari playtesting remains manual.

## Phase 2B delivered: living village exterior

- Six destinations retain their functions in a staggered layout with depth and
  a market gathering area; labels/targets fit the tested phone viewports.
- Existing season numbers repeat Spring/Summer/Autumn/Winter without changing
  the 20-day calendar. Scenery and independent tree sprites change; buildings
  stay in the same layout. No new crop or market restrictions were introduced.
- Gentle preset walkers, market activity, occasional birds, butterflies, swaying
  trees/flowers and autumn leaves are decorative and cannot intercept input or
  mutate gameplay. Reduced-motion settings are supported.
- Normalized atlas components and empty per-building/world decoration slots
  support later visual additions. No upgrades, unlocks, purchases or new save
  fields were added. Original artwork and all interiors remain preserved.
- Three cached WebP atlases total about 2 MB, including all seasonal scenery.

## Final Phase 2B refinements delivered

- Edge-to-edge proportional scenery with no outer brown frame; light live HUD
  and savings overlays respect safe areas and visible Safari viewport dimensions.
- The Home identity is now **Clubhouse**, using a wooden-door icon and accessible
  label. It still returns to the village; no clubhouse room or new saved fields.
- Paved, curved walking routes are mapped to the actual terrain image and trimmed
  around visible obstacles. Residents turn and pause; reduced motion keeps them
  still. No animation frame loop, game-state changes or new artwork assets.

## Phase 2C and later — interiors remain deferred

Preserve prototype 0.9's colorful storybook appearance, characters and atmosphere.
Phase 2B is exterior-only. Do not start Phase 2C before the user reviews the preview.
The following interior changes are still pending:

- Give the Clubhouse button its future personal-room destination, displaying
  purchased Dream Shop items and earned achievements after that work is approved.

- Remove baked-in money bubbles, seasons, day labels, navigation, prices, and
  other controls from background art. Render only one live set of controls and
  values, derived from the saved gameplay state.
- Replace transparent garden squares over an already-planted picture with 25
  real illustrated plots. Empty soil, planting, watering, growth stages,
  harvesting and finite regrowth must visibly match each plot's actual crop.
- Make the illustrated Water and End Day buttons the actual controls. Remove
  duplicate controls underneath.
- Make merchandise, baskets, shelves, equipment and money actual rendered
  interactive objects in all shops and the market, rather than invisible
  rectangles on fixed images. Keep shopkeepers visible with compact contextual UI.
- **The current market image always depicts a fully equipped stand.** In Phase 2
  show a blanket or table, canopy, scale, produce bags and displayed inventory
  only when the player's current owned/rented equipment and stock support them.
  Expired rentals should disappear; actual quantities and sale actions should
  visibly change the stand.
- **The market image contains fixed customer dialogue that may contradict the
  actual order.** Remove the baked-in dialogue and render conversations and
  requests from the real customer's state and order.
- Keep drawing coordinates and touch hit targets in the same coordinate system.
  Retain educational conversations, calculation of totals, handling money and
  counting back change. Validate keyboard, touch and actual iPhone Safari.

Phase 2A retains the interior artwork, including those non-navigation limitations.

## Phase 1C follow-up notes

Normal market touch/hover interaction no longer exposes crop tooltips or dotted
hotspot rectangles. Keep that behavior when replacing fixed produce art with
state-driven merchandise. Retain a keyboard-only focus cue for accessibility.

Render actual bag stock and packing in the scene: one bag for every completed customer
transaction regardless of items or quantities, and fewer visible bags as stock
is consumed. The current bag inventory text is functional, but the
background still depicts fixed bags/equipment/produce regardless of saved stock.

The new original play-money vectors can be reused in a later scene-integrated
register. Larger changes to scenery, customers and baked-in dialogue remain
outside Phase 1C.
