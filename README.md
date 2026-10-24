# My Garden Grows 1.0 preview — Phase 1C

Changes and deployment are restricted to `my-garden-grows-preview`. The original
`my-garden-grows` repository and website remain untouched. The illustrated
storybook scenes and existing farming, shopping, customer and money gameplay
are preserved.

## Paper bags

- A purchased $3 pack adds exactly **10** bags. Packs can be purchased repeatedly.
- Purchased leftovers persist across days, saves and refreshes.
- A transaction containing **loose produce sold by the pound** needs one bag,
  regardless of quantities or how many crop types are in that order. Other
  produce needs no bag. Empty bag stock never blocks all market sales.
- Bags are consumed only on a successful completed sale. Wrong totals, incorrect
  change, skipped customers, restocking and canceled orders consume none.
- The market preparation, customer order and register display bags remaining.
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

| Daily equipment | Upfront | Deferred if unable to pay upfront | Extra cost |
| --- | ---: | ---: | ---: |
| Table | $1 | $3 | $2 |
| Scale | $1 | $2 | $1 |
| 10 daily-use bags | $0.50 | $1 | $0.50 |

Both prices are explained before consent. Charges have a persistent itemized
ledger, a $6 unpaid cap, no interest, and no new deferred rentals while an earlier
farming day's debt remains. Closing or End Day deducts available earnings once;
remaining debt carries forward. Voluntary repayment remains available. The free
blanket and community seed help remain available for financial recovery. Savings
goals subtract outstanding charges rather than treating borrowed equipment as
extra savings. The Job Board is still a placeholder, without math minigames.

## Cash register and report

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

- `npm test`: 48 rule tests covering prior features plus bag packs/consumption,
  active restocking, save migration/resumption, cash-matched accounting,
  settlement idempotency and exact change.
- `python3 tests/mobile_finances.py`: original touch-only financial recovery loop.
- `python3 tests/mobile_phase1b.py`: scroll retention, bulk actions, plans,
  deferred rentals, checkout/settlement and customer limits at two phone sizes.
- `python3 tests/mobile_phase1c.py`: bag refill with an active customer, refresh,
  illustrated denomination targets, exact coin/bill change, no-bag sales,
  cash-matched reports, saved leftovers and absent market hover decorations at
  390 × 844 and 320 × 568.

Browser tests require Python Playwright and Chromium at `/usr/bin/chromium`.
They use isolated browser contexts; real player saves are never touched.
`PREVIEW_URL` optionally selects the HTTPS preview instead of each test's local
server. Automated tests simulate mobile Chromium. Actual iPhone Safari remains
manual playtesting; it has not been claimed as automated validation.

Source responsibilities: `game.js` owns rules/accounting data, `accounting.js`
renders reports without money mutations, `money.js` draws play-money controls,
and `scenes.js` / `interactions.js` render scenes and connect UI actions.
