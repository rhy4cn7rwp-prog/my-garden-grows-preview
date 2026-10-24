# My Garden Grows 1.0 preview — Phase 2B

Changes and deployment are restricted to `my-garden-grows-preview`. The original
`my-garden-grows` repository and website remain untouched. The illustrated
storybook scenes and existing farming, shopping, customer and money gameplay
are preserved.

## Phase 2B: living, seasonal village

The existing six destinations now sit at staggered heights and unequal scales,
with the Dream Shop farther back, foreground garden/supplies, winding connections,
and a small cobbled gathering area, bench and birdbath beside the Farmers Market.
Phone layouts show the entire village without scrolling, with labels and touch
regions kept large. Short landscape screens use a separately staggered arrangement.
All four seasons preserve the same destination positions in each layout.

Visual seasons derive only from the existing numbered season: 1=Spring,
2=Summer, 3=Autumn, 4=Winter, then repeat. Existing 20-day progression is unchanged.
Four painted scenery variants and seasonal tree cutouts show blossoms, lush leaves,
autumn colors/leaves, and frosty winter greenery with warm tree lights. Winter
has fewer ambient actors and no butterflies or blooming flower overlays. Building
art is shared across seasons; the small winter garden icon is gently muted.
These are visual changes, not seasonal crop restrictions or new earning rules.

A few original illustrated neighbors stroll along preset paths or greet people
at the market. Butterflies move between flower verges; trees/flowers sway; birds
occasionally cross overhead. These are decorative actors, unrelated to customer
orders or money. CSS transforms drive motion without timers, random game rolls,
or repeated state/storage writes. All decorations ignore pointer events.
Reduced-motion preferences stop movement, leave neighbors still, and hide passing
birds/falling leaves. On compact screens fewer walkers are displayed.

`src/village-life.js` owns the pure season mapping, normalized atlas renderer,
seasonal scenery and ambient residents; `src/village-life.css` owns their visuals
and motion. `src/town.js` retains destination functions, live badges and savings.
The per-building `data-attachment-slot` elements and a separate world-decoration
layer are reserved for future visual additions. They are empty, noninteractive
hooks: no upgrade system, costs, unlocks, or save-schema fields were added.

The mobile renderer downloads three shared WebP atlases totaling approximately
2 MB, including all four seasons, versus roughly 6 MB in Phase 2A. Original PNG
artwork is preserved; new source atlases are retained under `assets/town/source/`.
See `assets/town/README.md` for frames, export commands and limitations. No interior
art or game-rule file was changed. Phase 2C interiors have not begun.

## Phase 2A: interactive village and shared navigation

Six illustrated locations are real buttons with their own visible artwork:
Dream Shop, Seed & Feed, Market Supplies, My Garden, Farmers Market and Job Board.
The old single town image is preserved in `assets/scene-1.webp` but is no longer
rendered. A painted terrain layer, six separate cutouts, signs, readiness/open
badges, savings progress and animated environmental details compose the village.
The Job Board still opens its existing placeholder; no earning minigames were added.
Community seed help remains available through the leaf button and Job Board.

One live navigation component shows money, season/day, Home and, in interiors,
Back to village. Settings remains on the town header. All navigation and town
buttons have at least 44px targets. Town layouts adapt to the visual viewport,
safe-area insets and landscape orientation, fitting all six places without
scrolling. Gentle butterflies, flower sway and birds use lightweight CSS/SVG;
reduced-motion preferences disable motion and entry transitions.

The old interior header strips are hidden by a display crop, without changing
any prototype image file. Dream Shop/Seed & Feed hide the top 64 source pixels;
garden/supplies/market hide the top 128, including stray strips from another
prototype image. The original 512 × 512 coordinate system remains intact for
interior interactions. All existing merchandise and plot targets are tested.
The underlying rules, save keys/version, accounting, rentals, bags and customer
logic are unchanged.

| Source              | Responsibility                                                                       |
| ------------------- | ------------------------------------------------------------------------------------ |
| `src/town.js`       | Six independent building sprites, landscape details and live village badges/progress |
| `src/town.css`      | Village layout, animation, shared shell and safe-area presentation                   |
| `src/navigation.js` | Single live HUD/icons and visual-viewport measurements for town/register             |
| `src/scenes.js`     | Existing scene rendering, display-only interior crop and navigation transitions      |
| `assets/town/`      | New original building atlas and scenery, with art notes                              |

Phase 2A originally used approximately 6 MB of PNG sources. Phase 2B retains those
sources but renders the smaller WebP exports described above. The miniature
garden and produce in the location sprites are
recognition art; detailed growing plants and dynamic market equipment remain
future work. Interior baked prices/dialogue and decorative Water/End Day artwork
are also deferred; Phase 2A only removes their old navigation/status strips.
See `PHASE2.md`. Phase 2B is now complete; Phase 2C has not begun.

To playtest, open the preview in Safari and refresh if necessary. Keep website
data to retain your farm. Tap each building (or its wooden sign), use Home/Back,
and check that money/day values match your existing farm. No download is needed.

## Phase 1E customer service and order filling

- Choose one of three greetings: an enthusiastic welcome, a friendly question,
  or waiting quietly. Each has its own response. Curious and thoughtful shoppers
  will ask for help after a wait; hurried shoppers may leave. There is no cash fee.
- Satisfaction starts at 50, increases by 20/10 for excellent/good greetings, and
  drops by only 5 for waiting. These scores never change prices, change due, or fees.
- About one in four shoppers asks for a crop missing from the stand, when any
  crop is missing. Politely apologize or offer a vegetable actually on display
  and sellable with the current equipment. Vegetables are recommended for other
  vegetables; berries are not substituted for vegetables. Customer personalities
  affect acceptance; excellent greetings improve the chance by 10 percentage
  points over a good greeting. Outcomes are fixed per customer and saved, so
  refreshing does not reroll a decision. One alternative offer prevents pressure
  through repeated suggestions. A refusal ends the visit without a sale.
- An accepted substitution updates the customer's agreed order and clears the
  uncommitted basket. Its quantity is limited to stock; the revised request is
  shown before the player fills it. No inventory is consumed at this point.
- Fill orders from **all sellable produce on the market stand**, including crops
  not requested. Harvest still stored on the farm and zero-stock varieties are
  not selectable. +/- quantities stop at the smaller of display and harvest stock,
  rather than the requested quantity. Removing the last item removes its entry.
- Check Basket validates both types and quantities. Wrong baskets/totals give
  friendly inline feedback and allow correction without consuming stock, cash,
  or bags. Unfinished mistaken baskets also survive refresh. Stock, money and one
  bag move only after exact change is counted and Give Change completes the sale.
- Three farewells have distinct friendly responses and small satisfaction effects
  (+3/+2/0). They do not change earnings or prices. Customers who leave without
  buying still receive a friendly goodbye and do not count as completed sales.
- Existing saves keep version 1 and the same storage keys. Old active customers
  receive safe defaults for new service fields; checkout and rental ledgers remain
  intact. Sold-out requests may resume at greeting/selection, while payment-stage
  recovery still requires an exact, stocked basket with no extra vegetables.

## Paper bags

- A purchased $3 pack adds exactly **10** bags. Packs can be purchased repeatedly.
- Purchased leftovers persist across days, saves and refreshes.
- **Every completed customer transaction consumes exactly one bag**, regardless
  of crop type, quantities or the number of different items. Counted change and
  the current order are retained while buying a refill if bags run out.
- Bags are consumed only on a successful completed sale. Wrong totals, incorrect
  change, skipped customers, restocking and canceled orders consume none.
- The market preparation, active customer screen and register display bags remaining.
  **Buy more bags** purchases a pack without changing the active customer,
  basket, greeting/checkout stage, visits, clock or market progress.
- Daily-use bags from Phase 1B provide 10 consumable bags for that farming day.
  They are used before purchased stock; unused daily-use bags expire at End Day.
  Purchased stock remains. Another daily-use pack cannot be borrowed repeatedly
  on the same day; a purchased pack can refill an exhausted supply.

## Market stands and rentals

Free blankets welcome up to 3 customers; owned or rented tables welcome up to 6.
Normal produce prices are unchanged. Buying supplies still works; an owned
$8 table needs no daily fee. Tables are chosen before opening; scales and bags
can be obtained during the market.

| Daily equipment   | Upfront | Deferred if unable to pay upfront | Extra cost |
| ----------------- | ------: | --------------------------------: | ---------: |
| Table             |      $1 |                                $3 |         $2 |
| Scale             |      $1 |                                $2 |         $1 |
| 10 daily-use bags |   $0.50 |                                $1 |      $0.50 |

Both prices are explained before consent. Charges have a persistent itemized
ledger, a $6 unpaid cap, no interest, and no new deferred rentals while an earlier
farming day's debt remains. Closing or End Day deducts available earnings once;
remaining debt carries forward. Voluntary repayment remains available. The free
blanket and community seed help remain available for financial recovery. Savings
goals subtract outstanding charges rather than treating borrowed equipment as
extra savings. The Job Board is still a placeholder, without math minigames.

## Cash register and report

Phase 1E uses `visualViewport.height`, offsets and resize/scroll events to fit
Safari's currently visible area, including moving browser toolbars. The total input
uses 16px text to prevent Safari's automatic focus zoom, without disabling user
zoom. Smaller coins,
tighter spacing and a short-screen layout keep every payment control visible.
Normal portrait screens retain two large rows of bills; short screens put the
four bills in one row, with coins underneath. All buttons retain 44px touch targets.
Bag count/refill remain below Change Counted and above Start Over/Give Change.
Tests check no register scrolling, cut-off buttons or overlapping targets at
320 × 360, 320 × 400, 375 × 500, 390 × 664 and 568 × 256 landscape, plus earlier
Phase 1D viewports, simulated safe-area insets and a separate visual viewport that
shrinks to 350px while the layout viewport stays tall. Accessibility text can still
use an overflow fallback when necessary; content is not clipped to force a fit.
These are Chromium touch emulation and explicit viewport simulations, not a claim
of physical iPhone Safari verification. WebKit could not be installed in this
workspace because its browser-download domains return HTTP 403.

The register uses original simplified SVG bills ($1/$5/$10/$20) and coins
(1¢/5¢/10¢/25¢), with large values, accessible labels and touch-sized targets.
These are garden play-money illustrations, not copies of real currency. Change
calculations and the explicit Give Change step remain unchanged.

The market-day report shows produce sales and **completed customers**, upfront
table and scale rentals, bag purchases/daily-use fees, other supply purchases,
manual equipment payments, closing-time deferred payments, unpaid carryover and
net market-day cash earnings. Each actual cash payment is recorded once. A
closing payment's per-item details are included within that payment, not added
again. Unpaid carryover is shown separately and not deducted twice. Buying bags
records the full pack cost once; using individual bags adds no second charge.

This is a cash-basis **market-day** report, not total farm profit: seed costs are
excluded. Owned supply purchases made during the day are market cash expenses;
equipment bought on earlier days is not charged again. End Day saves the prior
report for viewing while resetting only daily counters and expiring rentals.

## Other retained improvements

Market crop hotspots no longer render floating hover labels/native tooltips or
sticky dotted rectangles. Touch interactions and accessible names remain; only
keyboard navigation gets a solid focus indication. Existing shop hotspots and
artwork are unchanged. See [PHASE2.md](PHASE2.md) for the deferred art redesign.

Phase 1B scroll/focus retention, bulk display/harvest actions, individual controls,
friendly customer limits and saved seed reservations remain. Planned seeds are
excluded from available quantity immediately and consumed once at planting;
canceling restores availability.

## Saves and migration

Save keys `mgg10` / `mgg10-backup` and save version 1 are retained. Existing money,
crops, seeds, equipment, goals, calendar, plans and equipment debt are preserved.
Old owned bag packs convert to 10 bags per pack **once**, without a new charge.
Old daily-use bag access converts to the appropriate daily supply once.

Valid active customers and baskets, including checkout/change and completed-sale
stages, now resume after refresh. Invalid pending orders recover safely without
taking cash, stock or bags. Successful sales cannot be charged or bagged again.

Older saves lack a detailed purchase ledger and actual customers-served count.
Known already-paid rental/closing totals are migrated into the report without
recharging. Reports clearly flag earlier missing history and show recorded net
rather than inventing customer counts or retroactive purchases. A new farming
day has complete accounting. Do not clear Safari data or restart to update.

## Tests and validation

- `python3 tests/mobile_phase2b.py`: all four seasons and repeating visual years,
  actual winter-to-spring End Day/reload, stable staggered destination geometry,
  no-scroll layouts and >=44px targets at six mobile sizes, safe-area/toolbar
  simulation, passive animation clocks with zero gameplay mutations, decorative
  pointer-event safety, reduced motion, cached exterior asset budget and empty
  future-decoration hooks. Seasonal screenshots are written to `/tmp/phase2b-*.png`.
- `python3 tests/mobile_phase2a.py`: all six village locations and five interiors,
  no-scroll town at 320 × 360, 320 × 440, 375 × 548, 390 × 664, 430 × 740 and
  667 × 320 landscape; all targets >=44px; all 25 existing plots and all shop/market
  targets after display cropping; one live HUD; no navigation-induced gameplay
  changes; saved rentals/seeds/goals/plots/bags and pending checkout recovery;
  readiness/open badges; keyboard/reduced motion; Safari visual-height, offset
  and safe-area simulations. Screenshots are written to `/tmp/phase2a-*.png`.
- `npm test`: 61 rule tests covering prior features, order type/quantity validation,
  mistaken-basket recovery, greetings, preferences/alternatives, farewells,
  bag packs/consumption, active restocking, save migration/resumption,
  cash-matched accounting, settlement idempotency and exact change.
- `python3 tests/mobile_phase1e.py`: full touch flow at five viewports, all-stock
  choices with hidden unavailable items, stock caps, incorrect basket/total retries,
  refresh recovery, greetings, accepted/declined alternatives, both apologies,
  three farewells, successful checkout, and no-scroll/no-overlap register checks.
  Includes separate Safari visual/layout viewport sizes, offset, safe-area and
  toolbar transitions, and >=44px targets. Screenshots are written to `/tmp`.

- `python3 tests/mobile_phase1d.py`: verifies the entire register and all controls
  fit without vertical/horizontal scrolling at 390 × 664, 375 × 548, 320 × 460,
  320 × 440 and 667 × 320, plus toolbar resizing and safe-area simulation. Also
  verifies all-product bag consumption, immediate counts, restock with counted
  change retained and save persistence.
- `python3 tests/mobile_finances.py`: original touch-only financial recovery loop.
- `python3 tests/mobile_phase1b.py`: scroll retention, bulk actions, plans,
  deferred rentals, checkout/settlement and customer limits at two phone sizes.
- `python3 tests/mobile_phase1c.py`: bag refill with an active customer, refresh,
  illustrated denomination targets, exact coin/bill change, checkout refills,
  cash-matched reports, saved leftovers and absent market hover decorations at
  390 × 844 and 320 × 568.

Browser tests require Python Playwright and Chromium at `/usr/bin/chromium`.
They use isolated browser contexts; real player saves are never touched.
`PREVIEW_URL` optionally selects the HTTPS preview instead of each test's local
server. Automated tests simulate mobile Chromium. Actual iPhone Safari remains
manual playtesting; it has not been claimed as automated validation.

Source responsibilities: `game.js` owns rules/accounting data, `accounting.js`
renders reports without money mutations, `money.js` draws play-money controls,
and `scenes.js` / `interactions.js` render interiors and connect UI actions.
The separate town/navigation modules own the Phase 2A village shell.

Community help also accounts for bags under the universal bag rule. Eligible
cash-poor farms without bags receive three starter paper bags. Carrot seeds are
shared only if they also lack a viable crop resource. This avoids trapping a
farm with no bags and old debt that blocks another deferred rental; it does not
reset money, crops or equipment, or allow repeat collection while resources are
available. Donated bags have no cash expense.
