# My Garden Grows 1.0 preview

This repository is the isolated playtesting game. The original
`rhy4cn7rwp-prog/my-garden-grows` repository is not modified by this work.

## Market stands

Choose the day's stand when arranging the market:

- **Free blanket:** no fee; up to 3 customers per farming day.
- **Rented basic table:** $1, paid only when opening; up to 6 customers.
- **Owned table:** remains available for $8 in Market Supplies, with no daily fee;
  up to 6 customers. Existing purchased tables are preserved.

Produce prices stay the same. A blanket has fewer selling opportunities because
fewer neighbors visit. Customer visits use half-hour slots. A rental lasts until
End Day, survives reloads, and never renews automatically. Closing the market
does not refund the daily rental. You cannot reopen or change your stand after
opening that farming day. Buying a table is optional.

## Financial recovery

The town now has a **Job Board** placeholder. It explains future educational
work opportunities; no math minigames or job payouts have been implemented.

Until those jobs arrive, **Community seed help** offers three free carrot seeds
when the player has less than $1 and no seeds, planted crops, or harvest that
can earn money with their current equipment. By-pound-only crops without a
scale do not block help. Existing farm progress is retained; there is no loan
or repayment. Players cannot repeatedly collect seeds while they still have a
viable growing/selling resource. They can plant and water the donated carrots,
then sell them from a free blanket without buying equipment.

## Existing saves

`mgg10` and `mgg10-backup` remain unchanged. Valid version 1 saves receive new
stand/rental fields on load, while cash, crops, seeds, equipment, calendar,
and savings goal are retained. Existing interrupted-order recovery behavior
still cancels the pending customer without taking inventory or payment.
Do not clear Safari website data or start a new farm to get this update.

## Tests

- `npm test`: 14 rule tests for rentals, billing, customer limits/sales,
  financial recovery, transactions, legacy migration, and backup recovery.
- `python3 tests/mobile_finances.py`: touch-only 390 × 844 browser test that
  recovers a bankrupt legacy farm, verifies the placeholder, grows/sells donated
  seeds, checks rental affordability, and verifies persistent rental/payment.
  Requires Python Playwright and Chromium at `/usr/bin/chromium`.
- Set `PREVIEW_URL` to test the same flow against the hosted preview instead
  of its temporary local HTTP server. Test browsers use an isolated context
  and do not touch real player saves.

Original storybook assets and hotspot positions are unchanged. No major visual
redesign is included. Tests emulate mobile Chromium; actual iPhone Safari
playtesting remains valuable.
