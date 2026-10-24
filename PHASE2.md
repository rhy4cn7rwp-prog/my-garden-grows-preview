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
  label. This initially returned to the village; Phase 2C now opens the room below.
- Paved, curved walking routes are mapped to the actual terrain image and trimmed
  around visible obstacles. Residents turn and pause; reduced motion keeps them
  still. No animation frame loop, game-state changes or new artwork assets.

## Safari page-edge canvas follow-up

The underlying HTML page now paints the existing seasonal terrain instead of a
solid green fallback outside the visual game rectangle. Background painting uses
large-viewport bounds while controls keep their visual-viewport/safe-area layout.
Safari receives a matching sky theme-color; native opaque chrome remains owned
by the browser. No gameplay, artwork, destination layout or animation changes.
Mobile simulations passed; actual iPhone Safari remains unverified because no
iPhone is attached and WebKit installation is blocked by the environment proxy.

## Phase 2C delivered: the personal Clubhouse

- A new illustrated wooden hideaway with an arched window seat, shelves, toy chest,
  rug and space to grow. The former door control opens this room; Return to village
  and the shared HUD preserve money, season/day and existing navigation.
- Six separate illustrated reward components appear only for recorded purchases.
  Item taps show names and recorded season/day (or explain a missing date).
- Explicit Dream Shop purchases deduct catalogue prices once, reserve equipment
  debt and remove owned purchase options. Reaching a savings goal only triggers
  congratulations; buying is an explicit action. After buying, the player chooses
  a new goal. Saving and selecting goals never auto-purchase rewards.
  The puppy-fund reward is a keepsake savings box, not a new pet simulation.
- Additive v1 ownership records retain existing farms and backup saves. Earlier
  goal/won flags never imply a purchase. Missing history is not invented.
- Tests cover exact payments, insufficient funds, duplicates, all six rewards,
  old/backup/refreshed saves, market checkout continuity and one-bag completion,
  plus phone safe areas and toolbar changes. Native iPhone Safari remains a
  manual check; no hardware is attached and WebKit download is proxy-blocked.
- Source art is retained alongside lightweight WebP runtime assets. Existing
  interiors and village artwork are preserved. No furniture editor, decorations
  purchasing system, new minigames or achievement system is included.

## Phase 2D delivered: interactive panoramic Clubhouse

- Connected illustrated room wings and a fixed-position ±80° camera, rendered
  with a bounded cylindrical Canvas 2D projection. Original room/reward source
  artwork is preserved. The room remains a layered storybook environment.
- Swipe to turn; hold an owned treasure for 420 ms to drag. Suitable surfaces
  glow while carrying, occupied/invalid drops revert, and holding near an edge
  gently turns the view. UI/safe-area bounds remain protected.
- Positions save in optional room coordinates; old or malformed layouts never
  reset a valid farm. Purchased ownership, goal behavior and all other game rules
  remain intact. Find controls reach offscreen treasures. Per-item or all-item
  restores change only positions; blockers in a restored home spot return home.
- Reduced-motion settings skip animated button turns. One mobile-resolution
  canvas repaints only on demand; the new runtime painting is about 464 KB.
- Pure rules, touch gestures, save recovery, navigation exclusion, goal/purchase
  behavior and existing gameplay are tested. Physical iPhone Safari still needs
  manual checks of long press, edge turns, real toolbar transitions and speed.

## Phase 2E delivered: surface-anchored treasure placement

- Current panorama, reward art, navigation, 160° viewing and non-placement game
  rules are unchanged. Sprites now use bottom-contact anchors measured directly
  on the painting, including separate shelf rows, cushions, chest and clear floor.
- Depth/angle scaling, contact shadows and a clipped copy of the original chest
  front provide natural placement/layering. Floor objects remain in front of
  furniture; chest contents are intentionally partly hidden inside it.
- Compatible items snap to the nearest valid surface; invalid/occupied drops
  revert. Smaller silhouettes allow multiple treasures per display. The floor
  supports two-dimensional placement outside furniture footprints.
- Vertical glances and coherent camera framing reach high shelves without moving
  the standing position or detaching objects from the painting. Quick edge drops
  and stationary holds do not trigger edge turning.
- Layout schema 2 migrates old center-based positions onto supported surfaces,
  preserving farm state and ownership. Save recovery is stable after migration.
- Pure and mobile tests cover all surface types, pixel-level chest occlusion,
  contact alignment during rotation, real touch drops, orientation/toolbar
  changes and saved layouts. Physical iPhone Safari remains a manual check.

## Later phases — other interiors remain deferred

Preserve prototype 0.9's colorful storybook appearance, characters and atmosphere.
The following interior changes are still pending:

- Earned achievements may eventually be displayed in the Clubhouse; no new
  achievement mechanics are part of this phase.

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

## Clubhouse spatial correction (after Phase 2E)

- Preserved all original artwork and surface-aware drag/save rules.
- Corrected missing absolute positioning that left the panorama below the
  visible room and exposed the static page fallback. Screenshot pixel checks
  now verify the displayed scene as well as offscreen rendering.
- Owned treasures, shadows and chest front are now composed in room space and
  projected once with the room. DOM targets remain accessible and touch-friendly.
- Fixed viewpoint, ±80° yaw and a viewport-fixed lens; finding or centering a
  treasure no longer changes zoom. Toolbar changes preserve viewing tilt.
- Restored furniture-relative soccer-ball dimensions; tightly saved edge spots
  retain their surface with a small clearance adjustment where needed.
- Added full-frame pixel-reference checks across angles/surfaces and repeated
  saved-layout recovery, alongside existing actual-touch mobile regression suites.
- Native iPhone Safari still requires manual playtesting; Chromium tests are not
  a claim of native Safari verification. No other gameplay or new phase began.

## Final size and contact refinement

- Camera geometry, yaw limits and artwork are unchanged.
- Soccer ball restored to 64 source pixels (initial mobile design approximately
  64–68 displayed pixels), with a body-contact anchor excluding shadow padding.
- Expanded cushion placement along its top edge, surface-specific contact
  shadows, original chest-front occlusion and forgiving nearby-edge snaps.
- Owned positions migrate on the same surface if revised clearance/top edges
  require adjustment. Finances, goals and purchases remain untouched.
- Actual touch drops into all four surface types now include turning the view
  and refreshing after each drop. Pixel-reference checks remain required.
- Native Safari still needs an actual-device playtest.

## Seed & Feed interior delivered (current Phase 2D request)

- New original illustrated timber shop and transparent crop atlas; original art
  preserved. Shopkeeper remains visible behind the counter.
- Real packet buttons on reusable shelf components, with catalog names/prices
  and live basket badges; no static-packet hotspots or baked-in controls.
- Compact bottom detail/basket drawer, crop-growing and selling information,
  individual quantities and the unchanged $11 fixed eight-packet variety bundle.
- Editable basket, affordability safeguards, exact receipt quantities/spending/
  remaining money, pending-cart refresh and saved/backup inventory recovery.
- `Game.purchase`, crop/equipment prices, market, garden, clubhouse camera,
  goals and progression unchanged. All original seed artwork retained.
- 106 rule/presentation tests, seven seed-shop mobile layouts and existing
  13 mobile suites pass. Native iPhone Safari still needs a real-device check.
- No other shop interior redesign has begun. Await player review of Seed & Feed.
