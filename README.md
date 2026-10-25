## Phase 4: cents, varied payments and change-making support

The original illustrated $1/$5/$10/$20 bill and penny/nickel/dime/quarter controls
are preserved. Every mathematically correct combination is accepted, including
extra coins instead of an optimal solution. Players still select and hand over
change themselves. The existing numeric keypad and customer conversations remain.

| Dream purchases | Prices and payment practice |
| --- | --- |
| 0–1 | Whole-dollar prices and change; small orders, $5/$10/$20 payments |
| 2–3 | Halves and quarters, mixed with whole-dollar reviews |
| 4–5 | Add .75 prices and more variation between $5/$10/$20 payments |
| 6–7 | Add selected .05/.10 prices, larger orders, occasional $50/$100 payments |
| 8–9 | Mix in .15/.20/.30/.40/.60/.80 prices |
| 10+ | All fractional amounts from .00 through .95 in 5-cent steps |

Every third arrival remains an easier review. Price pools and review intervals
are deliberately not synchronized, so each introduced fraction can actually
appear. Larger notes are used only at the appropriate effective difficulty and
for substantial orders; payment always covers the total. The current Dream Shop
has six objects: its six-purchase stage is playable, while 8+ stages remain ready
for future catalog additions. No rewards, prices in other shops or purchases were
added or removed.

Change practice is saved separately from multiplication/addition practice. Two
incorrect change confirmations lower future numerical difficulty by one tier.
Three first-try successful change transactions gradually restore a tier. The
more supportive of the two skill settings controls future prices, order size and
payments. Correct item math cannot immediately erase change-making support.
Adding extra coins or using a non-optimal solution is never treated as an error.
Mistakes never spend cash, consume bags/produce, or erase dream ownership. An
active customer's agreed prices/payment remain fixed while support changes.

All money arithmetic converts to integer cents before addition, multiplication
or subtraction, including the on-screen count-up amount. Existing dollar-valued
save fields remain compatible. The loader now retains valid 5-cent prices such
as $4.10 despite binary floating-point representation, as well as saved counted
coins and optional practice data. Older saves default only the new support field;
other progress and pending payments are preserved.

QA includes all milestones, every 5-cent fraction, alternate quarter/dime/nickel/
penny and bill combinations, incorrect/overcounted change, support recovery,
$50/$100 payments, partial-change refresh, old saves, 120 fractional sales and
repeat report/closing checks with deferred rental deductions. Mobile tests cover
six phone layouts, all coin buttons, the original 44px touch targets and no new
register scrolling. Actual iPhone Safari is unavailable here; verification uses
Chromium touch emulation and Safari-sized safe areas, plus rendered screenshots.

## Phase 3: consistent personalities and welcoming greetings

This phase builds on the existing **28 distinct illustrated neighbors**, retaining
all names, portraits, saved visits and purchase memories. It does not regenerate
or replace the established customer collection. Children, teens, adults and
seniors retain their recognizable appearances.

Customers now keep a fixed personality across visits. Twelve dialogue styles
include shy, talkative, playful, practical, cooking, gardening/curious, creative,
outdoors and storytelling voices. Each profile adds two short personal details
alongside its existing opening/parting lines. Choice-sensitive replies and three
rotating phrase variants keep conversations varied, with brief responses for shy
people and little observations/stories for more talkative neighbors. All speech
stays beside the portrait inside the existing illustrated scene.

All three player greetings now lead to the customer's order. Greeting style has
no satisfaction penalty and no effect on alternative acceptance: each earns the
same positive response score, and existing preference categories still determine
whether an alternative is accepted. A quiet greeting never causes a walkout.
The choice remains meaningful as conversational practice, rather than a hidden
financial advantage. Player response buttons and their equal green styling remain.

Rotation and light relationships are preserved: favor fewer visits today and
longer absence; avoid the last eight arrivals; occasionally welcome a known buyer.
There is no visitor cap. Existing saved history survives refresh and market days.
Regulars only praise crops from recorded completed purchases; no missing past
history is invented. There are no new loyalty levels or reputation controls.
Existing in-progress orders retain their saved prices, math work and payment;
new arrivals use their character's fixed preferences.

Validation includes every character × every greeting through a full sale, stable
personalities across days/refresh, equivalent outcomes for all greeting styles,
all three phrase variants on phone layouts, existing rotation/memory recovery,
speech-bubble geometry, all math tiers, inventory/bags, payment and closing/report.
Native iPhone Safari is not available here; tests use Chromium touch emulation,
small Safari-sized viewports and safe areas, plus rendered screenshot inspection.

## Latest targeted market corrections

The tabletop now renders only crops with positive sellable stand stock, rather
than all harvested inventory. A sold-out basket/crate and label disappear together;
restocking restores them. One to three remaining displays center automatically
without stretching the original illustrations. Rendering does not change crop,
inventory, display, sales or customer-history records.

NPC farewells remain in the existing in-scene speech bubble until departure.
Leaving a customer no longer creates a standalone status message. Legacy farewell
notices are also suppressed in market controls and stand preparation; functional
bag/equipment notices remain intact. Farewell satisfaction and transaction rules
are unchanged.

QA covers actual sale → empty stand stock with harvest still in storage → restock
→ refresh, balanced 3/2/1/0 arrangements, bubble-only goodbyes, six phone layouts,
all 28 customer portraits, existing clock/closing behavior and domain regressions.
Native iPhone Safari still requires a device playtest; rendered checks here use
Chromium touch emulation with Safari-sized viewports and safe areas.

## Latest Farmers Market: neighbors and returning regulars

The market now has **28 individually illustrated human customers**. All twenty
existing names are retained; Maya, Noah, Ava and Oliver keep their exact original
portraits. Names that previously shared those four portraits now have their own
appearances, alongside eight new neighbors. The new 24-portrait transparent WebP
atlas is approximately 628 KB and is cached as one image rather than 24 requests.
The original artwork files remain unchanged.

`src/market-customers.js` owns identity, short personality dialogue and optional
visit memory. Actual orders, prices, greeting/alternative outcomes, satisfaction,
math support, payment, bags and the active-play clock continue using existing
Game rules. Named personality details affect conversation flavor, not finances
or new reputation scores. Several short phrases are shared within seven dialogue
styles, with individual opening/parting lines and three phrase variants.

Selection favors fewer visits today and longer time since the last encounter.
Every seventh arrival may be a familiar buyer, provided they are outside the last
eight arrivals and have not already visited twice today. Ordinary fair rotation
continues indefinitely; the second-visit preference is not a visitor cap. All 28
are reached within the first 40 simulated visits. Memory survives day/season
changes and refresh; it stores one small record per customer plus eight recent
names. Reopening an active order does not count another visit.

Regulars sometimes recognize previous visits. Produce compliments only reference
a crop recorded in an actual completed purchase; apologies, failed checkout and
canceled orders do not create purchases. Older saves start with empty history,
while retaining their money, farm, math work, owned dreams and active orders.
An old in-progress customer can still finish and have that actual sale recorded.
No unrecorded past visits or purchases are guessed.

Speech remains beside the speaking portrait inside the scene, with the existing
cream bubble and tail. Arrivals stay silent until the player greets them. New
portrait mouth anchors follow the same scene projection as the artwork. Trimmed
sprite rows prevent neighboring figures from leaking above heads.

QA covers full rotation, genuine regular memories, duplicate-sale prevention,
day/season/backup recovery, old/malformed optional history, all 28 portraits across
six phone layouts and four conversation stages, 40 welcome-button arrivals,
math stages, adaptive progression, payments and market closing. Screenshots are
visually inspected. Testing uses Chromium touch emulation and Safari-sized safe
areas; native iPhone Safari still needs a physical-device playtest. The figures
use the existing gentle motion rather than individual facial animation.

## Latest market refinement: adding first, multiplication next

Before any Dream Shop purchase, the keypad provides calculated item subtotals;
the player adds them and enters the order total. After the first purchase, each
new customer asks the player to solve one highlighted multiplication line at a
time, then enter the final sum. The existing 2/4/6/8/10 numerical milestones remain;
one purchase alone does not raise prices, quantities or payment difficulty.

Correct line work is saved with its quantity and agreed unit price. Refreshing or
leaving the keypad retains accepted subtotals; editing the basket invalidates
stale work. Previously accepted payment-stage saves can still finish normally.
An already-arrived customer's teaching stage and agreed prices stay stable even
if a reward is bought elsewhere before checkout finishes.

Practice support is saved separately from permanent dream ownership. Two wrong
answers ease future numerical orders by one tier (to a minimum of the beginner
tier). Three first-try correct questions gradually remove one tier of support.
Retries still receive encouraging hints, and every third customer remains a
review order. Support never removes multiplication once it is unlocked, changes
an active order, resets purchases, or alters prices already agreed with a shopper.

The independent decorative register prop has been removed; the original asset
is retained. Produce baskets and crates now fill the full counter width, with
four visible slots on larger phones and three on the smallest screens. The real
checkout keypad and change-counting controls remain in their existing flow.
Clock, dialogue, closing, purchasing and farming rules are unchanged.

QA covers beginner addition versus first-purchase multiplication, line/total
retries, saved subtotals and old saves, adaptive easing/recovery, all later tiers,
complete payment/bag/report flow, and touch layouts with simulated Safari safe
areas. Screenshots verify full-width produce and speech-bubble clearance. Native
iPhone Safari is not available here and still needs device playtesting. On very
short screens the receipt can scroll internally while the keypad stays tappable.

## Latest Farmers Market: closing, conversations and progressive math

At 1 PM the current customer can finish, then a friendly closing announcement
links to the existing daily report. Early close still opens the report directly.
Sold-out conversations offer one “Can I interest you in something else?” choice;
the customer picks stocked produce or politely declines. No stock or bags are
consumed until a completed sale.

The total keypad shows unanswered quantity × price problems. Market prices and
order sizes now progress with cumulative, verified Dream Shop purchases. Every
third customer practices the previous tier. Customer prices and tier are saved
with their order so buying a reward or refreshing never changes an agreed price.
Seed prices and crop growth are unchanged; stand labels, basket prices, totals,
payments, change and accounting share the same market prices.

| Purchases | New challenges | Maximum payment |
| --- | --- | --- |
| 0–1 | Whole dollars, 1–2 items of each crop | $20 |
| 2–3 | .25 and .50 prices | $20 |
| 4–5 | .75 prices, up to 3 crop varieties | $20 |
| 6–7 | Up to 4 of each crop; multiplication and mixed orders | $20 |
| 8–9 | Up to 5 of each crop, larger orders | $50 |
| 10+ | Up to 8 of each crop; occasional $30+ orders | $100 |

Stock and order budgets further limit quantities. Existing known purchases seed
the cumulative counter; reaching a goal does not increment it. There are currently
only six Dream Shop objects, so the 8+ tiers are implemented and tested for future
catalog additions, not reachable through today's six-item shop. No new rewards
or repeat purchasing were added.

QA includes all tiers through successful checkout, incorrect-total retry, decimal
change, $100 payment, saved checkout recovery, milestone purchases, automatic
closing announcement/report and active-play clock recovery. Mobile Chromium touch
layouts are tested; actual iPhone Safari lock/reopen behavior still merits a device
playtest. On exceptionally short screens the math receipt can scroll within its
panel while keypad controls remain visible and at least 44px tall.

## Latest market gameplay refinements

The 9 AM–1 PM clock now measures 20 minutes of **visible, active game time**.
Visibility/pagehide/freeze events save and pause the exact fractional elapsed time;
returning resumes it. Saves checkpoint every second and on game actions, so even
an abrupt browser termination without exit events loses at most the last checkpoint
instead of charging offline time. A recovered game never uses an old timestamp to
count time away. Legacy open saves use their last recorded game time; other farm
fields and storage keys are unchanged. Time runs while exploring any location in
this game, but not while its tab is hidden.

Customers arrive without a speech bubble or visible order. Greeting (including the
existing wait choice) reveals their response and request in the scene; the existing
sold-out, checkout, payment, farewell and bag rules remain unchanged.

QA: Node rules/recovery tests; mobile lifecycle/reload/deadline tests at five sizes;
rendered dialogue placement at six sizes; complete keypad/payment flow at seven
sizes. Chromium touch emulation is available here, not native iPhone Safari. Please
also test locking and reopening Safari on a real iPhone before the next phase.

# My Garden Grows 1.0 preview — Phase 4C: Accelerated Market Clock

Changes and deployment are restricted to `my-garden-grows-preview`. The original
`my-garden-grows` repository and website remain untouched. The illustrated
storybook scenes and existing farming, shopping, customer and money gameplay
are preserved.

## Latest visual correction: speech inside the market scene

Customer dialogue is rendered exactly once inside `.market-tableau`, beside the
customer's head. The cream bubble, brown outline and separate pointed SVG tail
share the portrait's 1536×1024 camera projection. Each portrait has a measured
mouth-height anchor. Resizing reprojects those anchors through the same uniform
`xMidYMid slice` scale and crop as the artwork, rather than positioning speech
against the page. Bubble bounds avoid the clock, face, produce and register.

Greetings, requested crops/quantities, payment and thanks use shorter natural
speech. The large below-scene dialogue panel and repeated order sentence are
removed. Player greeting/service/farewell buttons and transaction controls stay
below the illustration, including landscape. The illustrated scene uses the
freed space; short screens retain normal vertical scrolling. Official opening
returns the market scroll view to the top so the stall and clock are visible.

No Game rules, timer epochs, transactions, pricing, inventory or save fields
changed. The total keypad and change register retain their fitted layouts.
`tests/mobile_market_speech.py` checks all four portraits at greeting, ordering,
payment and thanks across six phone/landscape sizes (96 combinations), measures
actual rendered bounds and text fit, and captures screenshots for visual review.
Phone screenshots were manually inspected, not just component-count assertions.
The existing service, keypad, clock, accounting/bag and navigation tests verify
compatibility. Native iPhone Safari remains a manual device check.

## Phase 4C: accelerated market clock

The Farmers Market runs from **9:00 AM to 1:00 PM game time**. Each game minute
is exactly 5,000 real milliseconds, so the four-hour market lasts 1,200,000 ms
(20 real minutes). A small original wooden analog clock and AM/PM time sit below
the navigation on the left, clear of the customer. There is no countdown display.
Hands and digital time are derived from the epoch, rather than counting timer
callbacks. The DOM updates without replacing conversation or checkout controls.

Official opening saves additive `marketStartedAt` epoch milliseconds in the
existing version-1 save and backup. Navigation, refresh, focus/visibility resume
and Safari `pageshow` use that same epoch; background/phone suspension does not
pause or extend the session. An early close saves `marketClosedAt`, freezing the
actual displayed closing time. End Day clears these timestamps for the next
market, without automatically advancing the farming day at market closing.

Customer-count caps and per-customer half-hour jumps have been removed. All
stand choices can admit customers while the clock is before 1 PM and sellable
stand stock remains. Table/scale purchases and rentals keep their prices and
inventory rules; copy no longer promises a three/six-customer cap. At the exact
deadline new admissions are rejected. An already-active customer may complete
all greeting, order, math, change, bag and farewell steps without a new timer.
When that customer leaves—or immediately if the stand is idle—the market closes,
settles existing deferred charges once and presents its accounting report. A
last-millisecond admission click opens that report instead of a retry error.
Early closing remains available between customers.

Older open saves cannot contain an actual historical epoch: their recorded game
hour is converted once into equivalent remaining time at first recovery, then
the resulting epoch is saved. Existing money, purchases, orders, counted change,
inventory and farming progress are retained. Saves with a valid start epoch
never have it reset on recovery. Closed legacy saves retain their recorded hour.
No save version/storage-key change or progress reset is required.

`tests/market-clock.test.cjs` covers exact millisecond boundaries, fractional
hands, epoch/backup recovery, stock and unlimited admissions, one-time settlement,
active customer completion, early closing, next day and legacy migration.
`tests/mobile_market_clock.py` tests five phone/landscape layouts using controlled
wall time: AM/noon/PM, moving hands, refresh, navigation, simulated long
suspension, preserved checkout, auto-report, admission races and early close.
The existing financial, register, dialogue, navigation, clubhouse and shopping
regressions also run. Native iPhone Safari remains a manual playtest; downloading
the WebKit runtime in this environment was blocked with HTTP 403.

## Phase 4B: customer conversations and total keypad

The market now has speech bubbles containing the actual requested crops and
quantities, with short varied greetings, existing service responses, and thanks.
Sentences appear gently in sequence and remain readable until the player acts;
there are no reading timers, automatic sales or satisfaction changes. The smiling
painted portraits move subtly, and a brief departure fades out after the player's
farewell. Reduced-motion settings remove these effects. The existing artwork
has no independently animated eyelids or mouths; no facial animation was painted
onto the portraits.

Correct totals trigger a customer response and a visual payment offer, based
only on the existing tendered amount. No correct total is shown before the
player calculates it. The arithmetic activity uses a separate wooden/brass
**Calculate total** keypad with visible unit prices, number/decimal keys,
backspace, clear and confirmation. There is no text input or editable element,
so tapping cannot summon iOS's native keyboard. Desktop number keys, decimal,
Backspace, Delete, Enter and Escape work as well. Incorrect baskets still return
to basket preparation; incorrect totals can be corrected on the keypad.

Answer drafts remain available when the keypad is closed and reopened within
the same page and basket. A refresh retains the farm, order, basket and payment
state through existing saves; an unconfirmed answer draft is not saved, matching
the previous unsaved numeric entry. The Game rules, prices, finances, inventory,
bag use, savings, seasons and other scenes are unchanged. The existing separate
change-counting register is retained.

`tests/mobile_phase4b.py` covers phone/landscape and desktop layouts, safe areas,
no-scroll key/control geometry, no native editable control, blank/incorrect
answers, decimal limits, backspace/clear, keyboard input, payment timing, sale,
one bag, refresh and reduced motion. Previous customer, finance, bag, register,
market, navigation, clubhouse and shop checks now enter totals using the visible
keypad rather than filling the retired native number input. Tests use isolated
Chromium mobile contexts; physical iPhone Safari remains a manual playtest.

## Phase 4A: first-person Farmers Market

The player stands behind the selling counter, looking toward a village market.
A separate red-and-white canopy scene, four reusable human customer portraits,
painted register prop and real harvested-produce buttons replace the original
static market with its three fixed crop hotspots. Exactly one human is shown
when a customer is active; the portrait follows the saved customer name, without
adding or changing any saved identity, preference or scoring data.

The horizontal harvest tray includes only crops actually held, with live
**on-stand quantities** from `Game.marketStock` and unchanged regular crop prices.
Harvested stock that has not been arranged is marked zero on stand. Swipe the
tray when more than three varieties are available. No promotional pricing or
supply requirement was introduced. The decorative stall does not confer an
owned table/canopy bonus: existing stand choices, rentals and customer limits
still apply and are displayed in the controls.

The illustrated register is a real button: it opens the existing change-counting
activity at the payment step. Customer greetings, alternatives, basket checks,
calculating totals, payment, one-bag-per-sale, farewells and accounting retain
their existing rules and dialogs. Neither `game.js` nor save keys/version were
changed. Other shop/village/clubhouse artwork is unchanged.

`tests/mobile_farmers_market.py` verifies seven touch viewport/safe-area layouts,
all ten crop displays, persistent active customers and finances, real register
access and a completed sale with one bag. Existing financial, bag, customer,
register, navigation and shop regressions also run. The cash register remains
scroll-free in the tested short viewport and toolbar simulations. Very short
main-market screens may scroll to keep customer controls readable; the harvest
tray scrolls horizontally within its own region, not the page.

Physical iPhone Safari remains a manual playtest. Four initial portrait variants
are shared among twenty existing customer names; additional people can be added
to the atlas without rewriting customer transactions. New source illustrations
are preserved under `assets/farmers-market/source`, with mobile WebP runtime
assets. The art uses separate foreground produce/register components; future
promotion layouts can extend the price cards, but discounts are not implemented.

## Phase 3B: Market Supplies

Enter **Market Supplies** from the village. The new storybook store has a friendly
shopkeeper, a wooden plaque attached to the counter, and separate illustrated
supplies on reusable shelf components. Tap real merchandise to compare options,
choose quantities and review a basket before paying. The familiar navigation,
money/calendar display, safe areas and short-screen shelf scrolling are retained.
No other shop interior or existing artwork was redesigned.

| Product                 | Provisional game price | Inventory type                          |
| ----------------------- | ---------------------- | --------------------------------------- |
| Paper produce bags      | 5 for $1; 20 for $3    | Consumable; existing purchased bag pool |
| Cardboard produce boxes | 5 for $3               | Consumable                              |
| Price tags              | 10 for $1              | Consumable                              |
| Market sign             | $8 each                | Reusable                                |
| Produce baskets         | $5 each                | Reusable                                |

Bag choices show **20¢ each** versus **15¢ each**. Twenty bags bought as four
small packs cost $4, versus $3 in bulk: $1 saved, with a larger upfront purchase
than one $1 pack. These are simplified game prices. Short explanations distinguish
buying from selling, supplies as a business expense, consumables and reusable items.
There is no automated recommendation or customer/earnings boost.

The new supply basket supports reviewed quantities, exact totals, affordability
checks, receipts and pending-basket refresh. Purchases debit integer cents once
and record upfront expenses; bags appear in the existing bag-purchase report
line and other new supplies in **Other market expenses**. Closing never charges
these purchases again. Paid-money reports and backup saves accept the additive
expense category without resetting existing farms.

### Compatibility and phase boundaries

- Save version and storage keys remain unchanged. `marketSupplyStock` separates
  `consumables: {boxes, priceTags}` from `reusable: {marketSigns, produceBaskets}`;
  `marketSupplyCart` holds the reviewed new-product basket. Invalid optional
  records are sanitized independently of otherwise valid farm progress.
- **`bagCount` remains authoritative for purchased bags.** No second bag stock is
  stored. Legacy `owned.bags` counts only old ten-packs for backward migration;
  five/twenty-packs do not pretend to be ten-packs. Daily-use rental bags remain
  separate and retain existing expiry/use rules. No old bag quantity is guessed.
- Boxes, tags, signs and baskets are stored for future selling integration and
  are optional. They are not consumed and never gate a sale or boost earnings.
  The existing one-paper-bag-per-completed-sale rule is unchanged.
- Existing table ($8), canopy ($10), scale ($5), their purchases and rentals remain
  under **Equipment & rentals**, with their own preserved equipment basket.
  A pending older ten-bag cart can still be reviewed and reduced there.
- The existing in-market emergency refill remains **10 bags for $3**. Its price,
  customer preservation and register flow were intentionally not rewritten in
  this shop phase. New 5/$1 and 20/$3 packs are purchased in this store.
- Seed & Feed, garden growth, market/customer/payment mechanics, clubhouse,
  dream purchases, savings and seasons retain their existing rules. No upgrade
  system, new supply-consumption requirement or other interior redesign began.

### Validation and actual-device checks

All **118 automated rule tests** pass. New tests cover prices, exact pack counts,
bulk arithmetic, mixed checkout, stock types, atomic invalid/insufficient orders,
normal/backup/pending-cart recovery, old bag migration, corrupt optional records,
reusable persistence across seasons, expense accounting without duplicate cash
charges, and sales with no new supplies.

`tests/mobile_market_supplies.py` passes at 320×360, 320×440, 375×548, 390×664,
428×746, 428×892 and 667×320 with simulated safe areas and Safari-style toolbar
height changes. Actual touch checks buy a mixed basket for $27, leave $23 from
$50, receive 25 bags/5 boxes/20 tags/1 sign/2 baskets, recover inventory after
refresh and backup loading, preserve unrelated farm values, and reach existing
equipment/rental options. Price labels are in front of rails and fit their cards.
The existing **15 mobile suites** also pass (one old finance test's planting label
was updated to the already-approved “Carrot Seeds” terminology).

All automation is isolated Chromium. **Native physical iPhone Safari remains
unverified**: no device is attached and WebKit installation is proxy-blocked.
On the iPhone 12 Pro Max, check merchandise taps, quantity taps while scrolling,
bulk comparison text, inventory, toolbar changes, equipment access and refresh
without clearing website data. Very short portrait viewports scroll the shelf
area while navigation and basket controls remain accessible.

## Strawberry plants terminology

The strawberry product is now **Strawberry Plants** throughout the store,
accessible product labels, bundle contents, basket, receipt and planting
inventory/choices. Details show the unchanged $3 price **per plant**; receipts
count plants. Mixed baskets and the fixed eight-item bundle use “items” instead
of describing the strawberry product as a seed packet. Artwork is unchanged.

The existing internal `strawberry` ID and `state.seeds.strawberry` inventory key
are retained. Existing stock and saved purchases need no migration. Growing time,
yield, repeat harvests, produce price, seed/plant purchase arithmetic and all
other rules remain unchanged. The harvested fruit is still “Strawberries.”

All 118 automated tests pass, including adding two plants to existing legacy
stock, charging exactly $6 and recovering all five plants after saving. The full
mobile seed-shop suite verifies purchasing, bundle quantities, receipt wording
and refresh recovery at seven phone-sized layouts. Native Safari remains a
manual-device check.

## Accurate planting-material names

A presentation-only shared name map now labels seed packets, product details,
bundle contents, baskets, receipts, available planting inventory and planting
choices consistently: singular crop names before **Seeds**, and **Seed Potatoes**
for potato planting material; strawberries use **Strawberry Plants**. Potato purchase units say “pack.” Harvested produce
keeps its existing crop names. Crop IDs, saved `seeds` keys, all prices, quantities,
watered growing days, yields, repeat harvests and purchase rules are unchanged;
no save migration or artwork change is needed.

All 118 automated tests pass, including exact name checks in the shop, basket and
receipt, unchanged crop metadata and purchased inventory recovery. Mobile seed
shopping covers all ten labels at seven phone layouts, including payment and
refresh. Planting-inventory/reservation/recovery and existing storybook-sign
mobile checks also pass. Native iPhone Safari remains a manual playtest.

## Storybook sign refinements

The village title now rests on a small light parchment/wood plaque with dark
brown lettering. It stays readable over all four seasonal skies without a large
new panel. Existing seasonal scenery, destinations and navigation are retained.

Seed & Feed now has one decorative wooden plaque on the counter front. Its SVG
uses the unchanged room image's source coordinates, cover scale and object
position, including Safari visible-height changes. The upper-left floating shop
heading is removed; the welcome message remains. The plaque never receives input,
so packets and controls retain their existing touch behavior. In landscape it
fits the exposed counter panel beside the merchandise. No image files changed.

Normal portrait layouts still fit the screen. Very short portrait viewports
retain a proportional room with internal shelf scrolling, sticky navigation and
basket controls; the plaque and packet rows have separate physical space.
`tests/mobile_storybook_signs.py` checks all four seasonal title variants, plaque
attachment/visibility, non-overlap with touch targets, toolbar resizing and exact
saved state at seven phone layouts. Seed-shop purchases/receipts/recovery and the
three existing village suites pass, alongside all 118 rule/presentation tests.
Native physical iPhone Safari remains a manual check.

## Seed & Feed interior — current Phase 2D

Enter **Seed & Feed** from the village. A new sunlit wooden garden store keeps the
friendly illustrated shopkeeper, pots, tools, flowers and watering cans visible.
Ten separate illustrated seed packets sit on reusable wooden display shelves.
These are actual merchandise buttons, not transparent hotspots over painted
packets. Names, prices and basket badges are live catalog values. The welcome
message stays on the window side, clear of the shopkeeper's face.

Tap a packet for its cost, owned quantity, watered growing days, yield/repeat
harvest information and estimated market selling price (each or per pound).
Choose 0–100 packets using the existing quantity rules. The existing **$11 variety
bundle** remains fixed: 3 carrots, 2 onions, 2 green beans, 1 strawberry; individual
cost $12, discount $1. Bundle and individual choices have equal green functional
buttons; no preferred crop or profitability recommendation is added.

The basket allows quantities to be reduced or increased, shows the exact total
and available money, and disables empty/over-budget payment. The underlying
`Game.purchase` still independently validates and performs the transaction.
Nothing is charged or added to seed inventory until payment succeeds. Receipts
show the amount paid, remaining balance and actual per-crop quantities, including
expanded bundle contents. The shelf basket count includes all eight bundle
packets. Existing pending baskets and saved/backup inventory remain supported.

`src/seed-shop.js` and `src/seed-shop.css` own the new presentation. Existing seed
entry points delegate only while in the seed shop. `src/game.js`, farming,
market/customer/accounting, clubhouse camera, savings and progression rules are
unchanged. Original art remains intact; the two new generated PNGs are preserved
under `assets/seed-shop/source/`, with WebP runtime art totaling about 875 KiB.
Only this shop interior is redesigned.

**Validation:** `npm test` passes 118 rule/presentation tests. Four new checks cover
live catalog merchandise, mixed individual/bundle payments and receipt inventory,
fixed assortment arithmetic/selling units, and empty/over-budget checkout.
`tests/mobile_seed_shop.py` uses actual touch events at 320×360, 320×440, 375×548,
390×664, 428×746, 428×892 and 667×320, including safe areas and shorter Safari-style
visible heights. It verifies all ten packet interactions, prices, repeat quantity
updates without jumping, editable baskets, exact $29 mixed checkout from $50,
18 received packets, $21 remaining, pending basket refresh, paid inventory refresh,
backup recovery and unchanged other farm values. Existing 13 mobile suites pass.

The main store fits without page scrolling. Very short screens may need to scroll
inside the compact detail/basket drawer; checkout and close controls remain
accessible. All automation uses isolated Chromium saves. **Native iPhone Safari
is not verified here:** no physical device is attached, and the environment's
WebKit download is proxy-blocked. On the iPhone 12 Pro Max, check the shopkeeper's
visibility, packet labels, repeated taps, drawer scrolling, toolbar changes and a
normal refresh. Do not clear website data. Review this store before another
interior redesign begins.

## Clubhouse camera and treasure spatial fix

The original room and reward artwork remain unchanged. A missing positioning
rule had left the panoramic canvas below the visible room while the static page
fallback remained on screen. The canvas and placement highlights now fill the
actual room bounds, and screenshot pixel checks guard against that regression.
The room now composites
owned treasures, their contact shadows, and the original chest-front mask in
**one room-space scene** before applying the cylindrical camera projection.
Every visible pixel follows the same rays: treasures no longer have separately
scaled screen sprites which can slide against the furniture. Separate invisible
buttons retain accessible item information and at least 44-pixel touch targets.
The carried preview remains separate only while an item is in the player's hand.

The camera stays at one fixed position and turns from −80° to +80°. Its lens is
fixed for each viewport (44–60° horizontal field of view); finding a treasure,
centering, or turning never changes the zoom. Find may tilt the **whole room** to
show a high shelf or low treasure. Safari toolbar changes retain the normalized
view tilt rather than reframing a previously found treasure. Backing-pixel-aligned
rendering strips and a fresh frame prevent old-view blending at strip boundaries.

The soccer ball is 64 source-art pixels across on a shelf, scaled only for its
chosen surface/depth and the shared room projection. It is not enlarged to make
a touch target. Chest, bookshelf, window-seat and free-floor hold-and-drag rules,
invalid-drop recovery, and saved room coordinates are retained. A previously
saved ball right against a shelf edge may move a few pixels along that same
surface to accommodate the corrected size. Ownership and farm values do not change.

The final contact refinement retains that camera unchanged. The ball is sized
against the initial mobile design (approximately 64–68 displayed pixels), and
its visible body—not the atlas's transparent/shadow padding—is anchored at each
surface. Shelf contacts follow measured board edges; the window-seat contact
follows the cushion top, with more usable horizontal room. The unchanged chest
front masks the lower part of stored items. Subtle contact shadows differ for
floor, cushion, shelf and chest. Nearby releases can snap inward up to 18 source
pixels from a usable edge; distant or crowded releases return to the previous
saved location. Larger ball margins can move an old edge placement slightly along
its existing surface; older cushion contacts migrate to the cushion top.

`tests/mobile_clubhouse_spatial.py` independently rebuilds the expected source
composition and compares every rendered pixel across viewing angles and four
surface types at five phone/landscape sizes. It also compares the visible browser
screenshot against the canvas throughout the unobstructed play area. It also checks a constant lens,
refresh recovery, camera limits and unchanged farm/ownership/money. The existing
actual-touch placement, customer/purchase and room-gesture suites remain in use.
`npm test` passes **118 rule tests**. All mobile automation is isolated Chromium;
**native iPhone Safari remains unverified** because this environment has no
physical iPhone and its WebKit browser download is blocked by the proxy.

Playtest on the iPhone 12 Pro Max: turn left/right while watching a ball against a
shelf; hold and drop it into the chest, onto a shelf/seat, and onto clear floor;
leave, return, and refresh Safari. Expand/collapse Safari's toolbar and check
nothing jumps relative to the furniture. Do not clear website data.

## Phase 2E: treasures rest on real surfaces

The clubhouse artwork is **unchanged**. Placement now follows measured contact
edges in the original panorama: individual bookshelf rows, the cushioned window
seat and reading bench, the inside of the open chest, and a broad two-dimensional
floor area that excludes furniture and the pet cushion.

Hold a purchased treasure for about half a second, drag, and release near a
suitable surface. It snaps to the nearest supported surface; the active drop area
has a soft highlight. Invalid or excessively overlapping drops return to the
previous saved spot. Large items stay on the floor; smaller items fit on shelves,
seats and inside the chest. The floor allows both horizontal placement and depth,
rather than the former narrow horizontal band. Turning, My treasures, restore
controls, Dream Shop purchases, finances and all other game rules are retained.

Swipe **up/down** to glance toward high shelves or the floor, as well as left/right
for the same ±80° panorama. This changes only the view from the fixed standing
position. Holding a moving treasure near a view edge briefly, then continuing to
hold, can turn/tilt the room. A stationary hold or quick drop near an edge does
not start a camera move. Reduced-motion settings still skip animated button turns.

### Why items no longer float

- Surface definitions in `src/clubhouse-layout.js` are measured on the unchanged
  2172 × 724 painting. Shelf rows follow their own sloping top edges. Cushion
  anchors sit on the actual cushion, and chest anchors sit behind the front rim.
- The visible sprite's **bottom contact** is projected with the same rays and
  camera framing as the artwork. Camera straps may hang below the contact point;
  the camera body still rests on the shelf. Small contact shadows reinforce the
  surface. Source-sized props scale with floor depth and viewing perspective.
- The visible artwork is never independently clamped to the viewport. Only its
  invisible touch target adjusts to remain comfortable (at least 44 px). Finding
  an item adjusts the whole room's framing, and the display layers clip at the
  fixed controls, so treasures cannot cover navigation.
- The original chest front panel is restored over chest contents in the composed
  room texture. No new art or image downloads are used. Floor items are drawn
  **in front of** the chest, while stored items remain partly hidden **inside**
  it. The carried preview is above furniture until released.
- Placement collisions compare the actual source-space silhouettes instead of a
  large arbitrary angular gap, allowing multiple small items on a shelf or in the
  chest. The floor contour accounts for the whole item's footprint.
- Drop highlights and chest masks are clipped to the visible angular range before
  projection, preventing polygons behind the viewer from crossing the scene.

### Saved progress and checks

The farm save remains version 1 with the same `mgg10` / `mgg10-backup` keys.
`clubhouseLayoutVersion: 2` distinguishes bottom-contact layouts from Phase 2D's
center-based positions. Identified older positions retain their horizontal place
where it fits and snap to the corresponding real surface. Previously hanging
music-wall items move to a supported floor position. A floor spot intersecting
furniture moves just forward onto clear floor. Ownership, purchase dates, cash,
crops, bags, rentals, accounting and the chosen savings goal are not changed.
Version-2 placements survive repeated recovery exactly; missing/corrupt optional
placements never reset an otherwise valid farm.

`tests/clubhouse-placement.test.cjs` checks surface measurements, item-size limits,
multiple-item space, floor exclusion/depth, chest occlusion data, layout migration
and repeated save recovery. `tests/mobile_clubhouse_placement.py` uses real touch
pointer sequences in isolated Chromium contexts to drop into the chest, three
shelf rows, the window seat and multiple floor locations. It checks actual sprite
contact coordinates against the artwork projection, samples foreground pixels to
verify chest layering, and exercises rotation, vertical glances, dynamic browser
height, orientation changes and refresh at seven phone sizes. Existing suites
still test the complete purchase/goal and gameplay flows.

Actual iPhone Safari is still **unverified**: no physical iPhone is attached and
WebKit installation is proxy-blocked. Please playtest shelf snapping, partly
visible chest contents, edge carrying, Safari toolbar changes, rotation and a
refresh on the reported iPhone 12 Pro Max/iOS 27.0.1. Do not clear website data.

## Phase 2D: look around and make the Clubhouse yours

Open the wooden-door **Clubhouse** button. Swipe across the room to turn your head
from **80° left to 80° right**, without moving your standing position. The left
and right buttons work too, and **Center** looks straight ahead. The original
round-window nook, wooden floor, rug, empty shelves and toy chest continue into
new illustrated reading and display areas. The original Phase 2C room/reward
assets and all earlier prototype/village artwork are preserved unchanged.

**Tap** an owned treasure for its name/purchase history. **Hold for about half a
second**, then drag it to a glowing floor or suitable display surface. A quick
swipe over an item still turns the room; it does not move the item. Holding a
moving item near a side edge slowly turns the view so it can be carried to a side
area. A valid drop saves immediately. An invalid, occupied, canceled, or
out-of-room drop returns to the last saved spot. The view keeps items above the
navigation controls and inside phone safe areas.

**My treasures** finds any purchased item, including one in another part of the
panorama. The item information dialog offers **Restore default position**. If
another moved item is occupying its original spot, that blocker returns home too;
no item is lost. **Restore all item positions** in My treasures resets only room
placements, never the farm, money, inventory or ownership. Unpurchased items do
not appear and cannot be moved. Dream Shop prices, explicit purchases, goal
congratulations/selection and existing market/farming rules are unchanged.

### Panorama and saved layout implementation

- `src/clubhouse-layout.js` holds shared pure placement/projection rules. It loads
  before `game.js`; missing optional room code cannot erase a recoverable farm.
- `src/clubhouse-room.js` owns Pointer Events, the 420 ms hold gesture, collision
  checks through Game, safe-area layout, look/find/reset controls and Canvas 2D.
  It also handles a short button tap immediately after panning without losing or
  double-firing a mobile compatibility click. It cleans up captures/listeners
  when leaving the room and cancels incomplete placement on toolbar/rotation
  changes instead of silently saving a half-finished move.
- The continuous 2172 × 724 painting is sampled by cylindrical viewing rays,
  with matching vertical correction. This is a layered illustrated 2D panorama,
  not a walkable 3D reconstruction. It never stretches the old portrait image
  into a wide strip. Changing yaw keeps the same eye position; screen resizing
  changes the field of view/crop rather than stored room coordinates.
- The new panorama WebP is about **464 KB**. The background canvas caps its pixel ratio
  at 1.5 and draws only during input, viewport changes or a short button turn.
  The spatial fix uses one reusable 2172 × 724 room-space composition, rebuilt
  only for layout/ownership/carry changes. The earlier foreground mask canvas
  remains available for geometry checks but is hidden after scene composition.
  There is no idle paint loop, WebGL context, video or collection of room copies.
  Reduced motion makes button-driven turns immediate; direct finger movement
  remains direct, without inertia.
- The additive version-1 `clubhousePositions` field stores each owned item's
  `{surface, angle, y}` in room coordinates. Valid surface types/angle bounds are
  enforced; malformed optional layouts are ignored independently of the farm.
  Old saves without placements use the new sensible default spots. Normal and
  backup save recovery retain ownership and valid custom positions. Existing
  `mgg10` / `mgg10-backup` storage keys remain unchanged.

### Phase 2D validation and remaining manual checks

`npm test` passes all **118 rule tests**, including `tests/clubhouse-room.test.cjs`: projection/inverse geometry,
painted-edge bounds, valid defaults, owned-only moves, compatible surfaces,
collision rejection, exact save recovery, old/malformed layouts, per-item/cascade
and whole-room resets, and recovery when optional room code is unavailable.

`python3 tests/mobile_clubhouse_room.py` uses actual touch pointer sequences in
isolated Chromium contexts for panning, quick swipes over items, long presses,
floor/shelf drops, invalid/canceled drops, edge turning during a drag, immediate
post-pan button taps, leave/reenter/reload persistence, finding every reward,
individual/all restores, safe-area phone sizes, reduced motion and idle repaint
checks. `tests/mobile_clubhouse.py` retains the Phase 2C purchase/goal/accounting
flow and now finds rewards across the panoramic room. Existing Phase 1 and
village suites remain required regression coverage.

**Physical iPhone Safari is still unverified.** No iPhone is attached and WebKit
installation is blocked by the environment's network proxy. On the reported
12 Pro Max/iOS 27.0.1, please check the swipe/hold distinction, comfortable turn
speed, edge carrying, finger placement on shelves, toolbar expansion/collapse,
rotation, restore buttons and refreshing a custom layout. Safari owns opaque
native chrome; artwork cannot be forced into every browser toolbar. Refresh the
preview without clearing website data, which would remove saved progress.

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
- `npm test`: 118 rule tests covering clubhouse ownership/checkout, goal congratulations
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
