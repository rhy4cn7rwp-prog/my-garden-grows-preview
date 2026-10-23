# My Garden Grows 1.0 preview — Phase 1B

Only `my-garden-grows-preview` is updated. The original game repository and its
website are not modified.

## Playtest improvements

- Repetitive actions keep document/dialog scroll position. Same-purpose dialogs
  retain their container rather than replacing the entire app; focus restoration
  uses `preventScroll` for quantity buttons.
- **Add All Produce to Stand** fills the display from actual inventory, reports
  added/skipped quantities and leaves customer checkout intact. Individual
  controls remain. By-pound produce needs an owned or currently rented scale;
  bags remain optional, so basic blanket selling never requires equipment.
- **Harvest All Ready Crops** uses normal yields, quality and finite regrowth
  rules, reports quantities and ignores unready plots. Individual harvesting stays.
- Seed counts show **available** seeds, excluding reservations. Pending plans
  survive refresh and can be canceled one plot at a time or all at once. Seeds
  are stored as total unplanted seeds with a separate reservation map; finalizing
  a plan consumes each seed once and clears the reservation. Available quantity
  stays consistent before/after finalization.
- The idle open market puts **Welcome Next Customer** first, with **Arrange
  Produce** below it. The blanket's three-customer limit gets friendly educational
  feedback. Tables welcome up to six customers, using half-hour slots.

## Equipment choices and rental costs

| Daily equipment | Upfront | Pay after market | Extra cost |
| --- | ---: | ---: | ---: |
| Table | $1.00 | $3.00 | $2.00 |
| Scale | $1.00 | $2.00 | $1.00 |
| Bags | $0.50 | $1.00 | $0.50 |

Owned equipment remains available. Buying supplies still works; a table costs
$8 permanently. Free blanket selling welcomes three customers instead of six.
Normal produce prices are unchanged.

Both rental prices are shown before consent. Players who can afford the lower
upfront fee pay it immediately (the table's existing select/open flow also
continues to charge $1 only when opening). Players who cannot afford it can
explicitly agree to the more expensive deferred price. Simply viewing/selecting
an offer never adds debt. Scales and bags can be rented during an open market;
tables must be chosen before opening. Rentals expire at End Day and never renew
automatically. An item cannot be rented twice in one farming day or rented when
already owned. There are no refunds for unused rentals.

Deferred charges have a persistent itemized ledger. Closing the market deducts
up to available market earnings (and never takes more cash than the player has).
Any unpaid remainder carries forward **without interest**, including when End
Day is used instead of Close Market. Settlement runs only once; reloads do not
re-charge it. Earlier debt is repaid from later market earnings. Players can
also voluntarily pay from cash. Total unpaid charges cannot exceed **$6**, and
no new deferred rentals are available while any earlier farming day's debt
remains. Free blankets, upfront rentals, and community seed help remain available.
Savings-goal progress subtracts outstanding charges so borrowing does not
inflate savings or unlock a goal early.

## Financial recovery and saves

The town Job Board remains a placeholder: no jobs/math minigames are implemented.
Community seed help offers three free carrot seeds to an eligible struggling
farm so it can grow and sell from a blanket. No fee, loan or restart is required.

Save keys `mgg10` and `mgg10-backup`, and save version 1, are retained. Existing
valid farms gain additive fields for equipment and charges. Money, crops, seeds,
equipment, calendar and goals remain. Legacy paid table rentals migrate without
an extra charge. Pending planting reservations now survive load. Existing
interrupted customer recovery still cancels an unfinished order without taking
inventory or payment. New debt, repayment status and rental access persist.
Do not clear Safari website data or restart your farm to receive this update.

## Tests

- `npm test`: 29 rule tests for previous features, migration, inventory, bulk
  actions, rentals, consent, repayment, carryover, debt caps and recovery.
- `python3 tests/mobile_finances.py`: touch-only legacy financial-recovery loop.
- `python3 tests/mobile_phase1b.py`: touch-only 390 × 844 and 320 × 568 scrolling,
  shopping, saved seed reservations/cancellation, bulk harvesting/display,
  temporary scales, customer checkout, deferred charges, carryover and limits.
- Browser tests need Python Playwright and Chromium at `/usr/bin/chromium`.
  `PREVIEW_URL` optionally selects the deployed HTTPS preview; otherwise each
  script starts/shuts down its own local server. Browser contexts are isolated
  from real player saves. Tests simulate mobile Chromium; actual Safari on an
  iPhone is a remaining manual validation, not an automated claim.

Original artwork and hotspot coordinates are unchanged. See [PHASE2.md](PHASE2.md)
for the deferred equipment-visual and customer-dialogue redesign requirements.
