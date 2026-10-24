# My Garden Grows 1.0 preview — Phase 2C: The Clubhouse

Changes and deployment are restricted to `my-garden-grows-preview`. The original
`my-garden-grows` repository and website remain untouched. The illustrated
storybook scenes and existing farming, shopping, customer and money gameplay
are preserved.

## Phase 2C: The Clubhouse

The upper-right wooden-door **Clubhouse** control now opens a personal illustrated
room. Back/Return to village returns to the same village; Dream Shop is directly
accessible from the room. Money, season and day remain live. Existing interiors,
seasonal village art, paths and animations are preserved.

The new room has warm timber walls, an arched window seat, empty shelves, a toy
chest, rug and keepsake areas. Six separate illustrated reward buttons appear only
when owned: soccer ball and bicycle in the sports area, tablet on the toy display,
guitar in the music nook, camera on the collectibles display, and a decorated
**puppy-fund keepsake box** at the chest. The existing catalogue sells a _Puppy
fund_, not a live pet; this phase does not add pet gameplay. Tap a reward for its
name, purchase price and recorded season/day. No rearranging, decoration tools,
new shop systems or achievement mechanics are introduced.

### Purchases and existing saves

Dream prices now come from the pure `Game.dreams` catalogue, shared by checkout
and the shop. Choose a savings goal or explicitly buy an affordable unowned item.
Purchases deduct $100/$250/$300/$350/$400/$500 respectively, once, while reserving
cash owed for equipment. Owned items leave the shop's available touch targets;
the preserved shop illustration shows a small “In your Clubhouse” marker instead.
Reaching a savings goal triggers congratulations only: it does not buy or
auto-award the item and does not deduct money. The player must explicitly press
Buy in the Dream Shop. After purchasing the active goal, the game invites the
player to choose their next savings goal; it does not silently choose one. A
next-goal picker lists only unowned items. When all six are owned the village
celebrates a complete collection instead of asking players to save toward an
owned item. Purchases are personal rewards, not market operating
expenses, and do not alter the market-day accounting ledger.

Ownership is an additive version-1 field, `dreamPurchases`, keyed by catalogue ID:
`{ owned: true, season: 2, day: 9, price: 100 }`. Existing `mgg10` and
`mgg10-backup` storage keys are retained. Purchase records persist through refresh,
backup recovery, new farming days and season changes. Identified records without
a historical date remain owned with null dates and an honest “date was not
recorded” message. Invalid optional reward records are ignored independently,
without resetting an otherwise valid farm. No dates, cash movements or ownership
are invented.

**Earlier releases recorded a savings goal and a `won` celebration flag, but no
Dream Shop purchase transaction or ownership history.** Those fields alone never
auto-award a reward or retroactively charge the player. Older farms retain their
money, goal, crops, supplies, bags, rentals and ongoing market transaction.

### Source files, art and validation

`src/clubhouse.js` renders the room, independently clipped reward sprites, item
memories and purchase confirmation. `src/clubhouse.css` fits the room and safe-area
controls to `visualViewport`, using compact portrait/landscape arrangements. The
room artwork remains proportional; decorative edges may crop to fill the screen,
while purchased controls stay independently positioned and accessible. The page
canvas uses room artwork, not a solid green fallback. Safari owns any opaque
native browser chrome.

`assets/clubhouse/source/` preserves the original new PNG artwork; compressed WebP
copies are used at runtime. Original prototype and village assets are unchanged.
Original illustrated room and reward artwork was created for this phase. The
shared atlas uses measured sprite bounds and explicit SVG clips so neighboring
items never leak into a reward's control or preview. Small display ledges are
separate original SVG components.

Run `npm test` for the existing rules plus `tests/clubhouse.test.cjs`. Run
`python3 tests/mobile_clubhouse.py` for isolated touch-browser purchase/reload/
backup tests, all six items, missing historical records, an active market checkout,
one-bag completion, earning a goal through produce selection/total/change,
congratulations without automatic purchase, explicit reward checkout and
player-selected next savings goals, eight phone layouts, safe areas and toolbar changes. The
existing nine mobile regression suites remain applicable; historical tests now
use **Back to village** for returning home because Clubhouse has its own room.

Actual iPhone Safari is still **unverified**: this workspace has no attached
iPhone and WebKit downloads were blocked by the network proxy. Before approving,
playtest on the reported iPhone 12 Pro Max/iOS 27.0.1 with Safari's address bar
both expanded and collapsed. Check the door, room, item taps, back button, a real
purchase and a refresh/reopen. Do not clear website data; that removes saves.
No development money or unlocked rewards are inserted into real player saves.

## Safari page-edge canvas follow-up

The illustrated game viewport already filled its available area, but the larger
HTML/body page canvas still had a solid green fallback. Safari can expose that
canvas around expanded/collapsing browser toolbars and safe areas. The page now
paints the same seasonal terrain atlas proportionally across its large viewport,
with transparent town body/game fallback layers. The visible game, destinations, HUD, savings and
walking geometry remain unchanged. No new artwork downloads are needed.

`src/village-canvas.js` and `.css` measure resolved `100lvh` (with `100vh` fallback)
for background painting while retaining `visualViewport` sizing for the controls.
They select the correct atlas quadrant and keep Safari's theme-color matched to
that season's sky instead of green. Updates are idempotent and also run on
`pageshow`/orientation changes. Other locations retain their existing layout.
`viewport-fit=cover` remains enabled; Safari's controls and safe-area padding stay
in place. Safari owns its opaque browser/status UI and may show a tint there;
a website cannot force illustrated content into every native toolbar.

Validation in this workspace covers mobile viewport/safe-area models and exposed
page screenshots. Actual iPhone Safari is **not verified**: no physical iPhone is
attached, and the Playwright WebKit browser download returned HTTP 403 from the
environment's network proxy. The user reports iPhone 12 Pro Max with iOS 27.0.1; that native Safari version
is not available here. The preview needs a real Safari check, particularly
with the address bar expanded/collapsed. Refresh without clearing website data.

## Phase 2B final refinements: immersive shell, Clubhouse and paved routes

The village is edge-to-edge: the outer brown frame and margins are removed.
Terrain fills the visible Safari viewport behind the UI using proportional cover
scaling. Building and character sprites retain their aspect ratios. Money,
season/day and savings remain live, on light readable overlays. Safe-area insets
protect controls and location labels while the artwork reaches both screen edges.
Interior artwork and the existing interior shell remain unchanged.

The former Home control is now a cozy wooden-door icon with the accessible label
**Clubhouse**. In Phase 2B this returned to the town; Phase 2C now opens the
personal room described above. Earned-achievement gameplay remains deferred.

`src/village-walks.js` traces curved lanes and town-square arcs in the preserved
terrain's coordinate system. At layout/season/safe-area changes it maps these
curves onto the actual covered image, samples paved regions and excludes segments
where a resident's body would overlap buildings, labels, trees or the bench.
A smaller layout may use a shorter safe square walk rather than crossing scenery.
Walkers travel in both directions, turn during pauses and stop along connected
shop/market approaches. The market neighbor also stands on verified paving.

Motion is compiled into browser-managed transform keyframes, with easing,
arc-length spacing and pauses. There is no JavaScript frame loop or animation
write to game state/local storage. Animation instances are canceled when leaving
town; reduced-motion settings keep residents still on safe path positions.
Artwork, six destination functions, the seasonal cycle and all save fields are
preserved. `src/village-shell.css` contains the village-only immersive presentation.

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
orders or money. Browser-managed transforms drive motion without a JavaScript frame loop, random
game rolls or repeated state/storage writes. All decorations ignore pointer events.
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

One live navigation component shows money, season/day, Clubhouse and, in interiors,
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
data to retain your farm. Tap each building (or its wooden sign), use Clubhouse/Back,
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

- `python3 tests/mobile_safari_canvas.py`: seven phone-sized large/visible viewport
  models (including iPhone 12 Pro Max 428 × 926 with 428 × 746 visible-area
  conditions and 926 × 428 landscape), four seasons, expanded/collapsed toolbar metrics, exposed page-strip
  screenshot colors, proportional atlas coverage, safe HUD/savings controls,
  matching browser tint, page-cache restoration, navigation and saved progress.
  This does not emulate native Safari chrome or constitute a physical Safari test.
- `python3 tests/mobile_village_refinements.py`: edge-to-edge and proportional
  terrain, Clubhouse label/action, actual shoe positions sampled against source
  pavement colors in every season, source-alpha sprite bounds checked for building,
  tree, bench and sign overlaps, out-and-back motion/facing/pauses, small-screen
  safe-area changes, route lifecycle cleanup and reduced-motion stillness.
  Uses Pillow to inspect preserved source pixels without changing the artwork.
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
- `npm test`: 75 rule tests covering clubhouse ownership/checkout, goal congratulations
  without auto-purchase, explicit next-goal selection, prior features, order type/quantity validation,
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
The refinement visual checks also require Pillow.
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
