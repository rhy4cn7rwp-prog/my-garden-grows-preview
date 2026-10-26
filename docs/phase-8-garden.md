# Phase 8 — Interactive Garden review

Branch: `phase-8/interactive-garden` (based on the unmerged PR #1 branch).
PR #1 and the public game must remain unmerged/unchanged during this review.

## What changed

The existing Garden rules still own all seeds, planting reservations, crop ages,
quality, repeat-harvest counts, yields, prices and harvested inventory. The new
`src/garden.js`/`src/garden.css` presentation draws 25 actual soil/plant controls
inside the original illustrated scene. Its source image is untouched. Cropping
removes baked navigation and Water/End Day buttons; a soil-pattern mask hides the
old painted plants beneath the real growing plots. Produce uses the existing
illustrated atlas. Early plants use lightweight shared sprout/leaf illustrations;
this is not a replacement background or a new set of crop economics.

- Drag the can onto a plant, or select it and tap a plant. Water All and the
  crop-info Water button call the same `Game.waterPlot` rule. Watering only sets
  `watered`; repeats never advance age or change yields. Soil darkens and a water
  badge plus falling drops give feedback. Reduced motion keeps static feedback.
- Drag ripe produce into the basket, or use the existing crop-info Harvest button.
  The existing `Game.harvest` commits stock once; a flying illustration and status
  show the crop/quantity. Harvest All uses the same rule. Green beans and other
  repeat crops retain their regrowth/remaining-harvest behavior. Quality-adjusted
  yields remain unchanged and are now shown accurately in the crop window.
- The garden keeps its seed quantities, plan/cancel/commit workflow, growing-crop
  information, estimated prices, harvest inventory and market connection.
- Tools and the basket remain visible when scrolling shorter screens; the action
  bar is fixed within the visible Safari-height/safe-area bounds. Plots and main
  actions have at least 44px targets. Shorter phones scroll the garden rather than
  shrink its 25 targets. Ordinary growing plots/background permit native scrolling;
  ripe plots are drag targets, so scroll beside them when needed.
- End Day warns about dry growing plants and offers Keep Gardening, End Day Anyway
  or Water All and End Day. A waiting customer must be finished before ending a
  day. No browser timer advances crops, watering or the farming calendar.

## Endless days without a save migration

The prior game already rolled into another season every 20 days; it did not need
to erase the farm. This increment removes the apparent 20-day ending/countdown
from the UI: `Game.farmDay(date) = (season - 1) * 20 + day` is the continuous day
shown in the HUD, purchase dates and reports. For example, Season 2/local Day 20
is displayed as Day 40, followed by Season 3/Day 41. Seasons can keep cycling.

The saved `season` and local `day` fields, dated reward records, daily rental/debt
keys and history coordinates retain their existing values and format. Customer
history already used that same continuous-day calculation. No save-version,
ownership, wallet, seed/crop, price, quality, market-clock or history migration is
required. Ripe plants now clear their watered-today badge on a new day as well;
their age, harvest quantity and quality do not change while waiting to be picked.

## Guide and regression checks

The six-page illustrated book remains optional. Garden pages now explain planning,
the can/tap/Water All alternatives, manual End Day, picking/dragging/bulk harvests,
repeat crops and endless farming. Its artwork, controls and accessible shortcut
are preserved.

- `npm test`: 180 rules/UI tests, including per-plant/Water All equivalence,
  repeated-watering idempotence, unchanged yields and quality adjustments, repeated
  harvest protection, regrowth, Garden-to-market stock/sale flow, 1,000 manual days,
  canonical legacy-date recovery and preserved in-progress market data.
- `python tests/mobile_garden.py`: actual can and produce touch drags at 320×440,
  375×548 and 428×746; lower-row dragging with sticky tools; invalid water drop;
  tap watering; plan/menu/commit; bulk tools; dry-plant cancel/water-and-advance;
  repeat and double harvests; save/reload; day rollover; dynamic visible toolbar
  heights; active customer protection and reduced motion.
- Existing six-layout Clubhouse/guide recovery and treasure sizing/dragging tests,
  and five-layout market-clock/payment/closing tests pass.

The test browsers use isolated farms. Native iPhone Safari touch feel, toolbar
changes, lock/unlock and VoiceOver remain manual review checks. Screenshots in
`docs/review/` show the actual touch-browser Garden, not generated mockups.

## Separate playable review build

The approved review-host repository is `my-garden-grows-pr-1`. Phase 8 is published
only to its new `/phase-8/` folder; its root PR #1 playtest files remain unchanged.
The original repository and preview `main` are never deployed by this work.

The hosting-only adapter uses `mgg-phase-8:mgg10` and its own backup. On first visit
it copies an existing PR #1 farm if available, otherwise the original preview
farm. Reading the source records never writes or removes them. Existing Phase 8
progress is never replaced on later visits. All further progress remains separate.
The review build is pinned to a source commit in its `preview-manifest.json`.
