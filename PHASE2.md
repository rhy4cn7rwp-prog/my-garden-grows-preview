# Phase 2: a state-driven storybook world

Do not implement this redesign as part of Phase 1B. Preserve prototype 0.9's
colorful illustrated storybook appearance, characters, scenery and atmosphere.

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

Phase 1B intentionally retains the existing art, including those limitations.
