# Issue #1: incremental implementation and review

Source issue: https://github.com/rhy4cn7rwp-prog/my-garden-grows/issues/1

This branch is the first review increment in the **preview repository**. It is
not a completed implementation of the entire core-game issue. Do not merge or
publish it until reviewed. GitHub Pages remains pointed at preview `main`; no
workflow, Pages setting, original repository or existing player's data is changed.

## Included in this PR

- **Priority 1:** reproduce the shoulder/arm fragments on an isolated 28-person
  browser contact sheet. They originate inside the tightly packed portrait atlas,
  not a second customer element, stale transition, or the market background.
  Replace rectangular-only cropping with reviewed source-space silhouette clips.
  The original PNGs/WebPs, 28 identities, dimensions, mouth anchors, animations,
  speech bubbles and transaction rules remain unchanged. Three touching sleeves
  need explicit source-space seams in addition to alpha-component analysis.
- **Priority 2, Clubhouse:** the green guidebook now has dark ink on a light title
  panel, and rests on a reading stand on a small round wooden table in the centered
  view. Both additions share the room's existing fixed panoramic projection.
  The bottom shortcut, Home/Town navigation, treasured items and saved positions
  remain unchanged. This is a fixed reading accessory, not a new purchase, reward,
  placement surface or decorating system.
- **Priority 2, guide:** revise all six playable pages to explain the current
  goal/shopping/growing/stand preparation/order/bagging/checkout/change loop. The
  guide remains optional and fits mobile. It deliberately does **not** claim that
  a free starter mix, paid Job Board chores, mandatory register purchase or dragging
  half-pound portions are playable before those features exist. The following
  copy is staged for that later increment instead of shipping false instructions.

## Pending Issue #1 increments

1. Implement fresh-game-only $0 onboarding, one-time starter mix, tactile Job
   Board chores and a recovery path. Never rewrite old wallets or inventories.
2. Balance and implement the mandatory equipment checklist; connect every offered
   supply to an actual function. Retain old ownership/rentals/active sessions with
   an explicit migration policy before changing opening requirements.
3. Implement count/weight drag-and-bag fulfillment with reversible preparation and
   stock committed only on successful sale.
4. Change progression milestones and freeze difficulty at the next session boundary;
   retain the exact prices/math stage of already active customers and markets.
5. Revisit garden/stock flow, validate economy end to end, and enable the new guide
   copy together with its actual mechanics. Keep the issue open between PRs.

## Draft six-page guide for the new mechanics (not loaded by the game)

### 1 — Choose Your Dream!
Visit the Dream Shop and choose something you'd love to save for. Choosing is free!
When you have enough money, come back to buy your dream for your Clubhouse.

### 2 — Your First Seeds!
A new garden starts with $0. Visit Seed & Feed for your one-time free mixed seeds.
Plant your mix, water each day, and harvest when the crops are ready!

### 3 — Lend a Hand!
Visit the Town Job Board to earn money helping neighbors. Pull weeds, pick ripe
red tomatoes, or help water. Green tomatoes need more time! You can come back for
another chore. You won't need to buy tools first.

### 4 — Get Your Stand Ready!
Save chore money for your market table, produce scale, cash register and paper
bags. Check your supplies before opening, then arrange your harvest for customers.

### 5 — Fill the Order!
Greet your customer and read their order. Count items into the basket, or weigh
produce on the scale. Add or remove pieces until the amount is right, then bag
it. One completed customer purchase uses one paper bag.

### 6 — Count, Save, Dream!
Enter the prices and total when asked, then count back change with bills and
coins. New gardeners start with simpler questions. Later markets add
multiplication, then cents as your dream collection grows. Saved enough? Visit
the Dream Shop to buy your reward, then choose another dream and keep growing!

The next math increment should use 0–1 owned objects for addition of shown line
totals, 2–3 for whole-dollar multiplication, and 4–5 for .50 then .25 prices,
with later progression retained. Apply changes only at the next market session.

Exact beginner/later session instructions must be checked against the final
implementation before enabling this draft. No progress or difficulty is changed
by reading either guide.

## Validation and review

- `npm test`: includes silhouette frame/face/hand checks, known stray pixel
  coordinates, book placement/contrast metadata and existing save/transaction tests.
- `python tests/mobile_customer_isolation.py`: all 28 people at 320×440,
  375×548 and 428×746; real rendered pixel comparisons against the same scenery
  with the customer hidden, plus a negative control that restores the Ruby/Mateo
  fragment when its silhouette clip is removed. Greeting, payment, completed sale
  and departure transitions must still show exactly one customer (then none).
- `python tests/mobile_clubhouse_guide.py`: six phone/safe-area layouts, six loaded
  illustrated pages, startup/Home/Town, dynamic toolbar sizes, exact saved-state
  recovery, market pause/resume, completed purchase and Safari-style frozen-page
  restoration in Chromium emulation.
- Existing scale, placement, projection, clock and transaction regressions remain
  available. Native iPhone Safari still needs device playtesting before merge.
- `python tools/capture_issue1_review.py`: captures the unchanged-main portrait
  rendering and this branch, plus the centered Clubhouse book, using only isolated
  browser contexts. Images in `docs/review/` are review artifacts, not game assets.

The clip geometry generator (`tools/build_customer_clips.py`) requires Pillow,
NumPy and SciPy for **offline alpha analysis**. Runtime uses only the generated
28KB JavaScript geometry and existing artwork; no image processing or new library
is shipped. It does not rewrite source/runtime images. Regeneration must include
review of the contact sheet and the three clothing seam overrides.
