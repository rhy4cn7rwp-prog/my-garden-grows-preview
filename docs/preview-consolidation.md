# Permanent playtesting consolidation

Approved destination: https://rhy4cn7rwp-prog.github.io/my-garden-grows-preview/

This branch includes all ancestors of permanent main (942da47), PR #1
(c40273c), and Phase 8 (9589dc4). No original repository files or temporary
hosting repository files are changed. The temporary repository's root and
phase-8 directory are pinned exports of these source branches; differences
are hosting-only save namespaces, first-visit copy scripts, and browser titles.
None of those temporary hosting adapters is imported here.

Preserved improvements include the round reading table and legible illustrated
six-page book, customer portrait isolation, panoramic Clubhouse and treasure
placements, all existing shops/market/math/active-time clock, and the interactive
25-plot Garden with watering, harvesting, plans and endless manual farming days.

## Saves

Retain `mgg10` and `mgg10-backup`, version 1, and all existing recovery logic.
No reset, temporary-save import, or change of storage origin is needed.
New optional fields safely default for old saves: gardenWeeding (current
activity day and unique pulled weeds), weedingCredits (integer fifth-units
per crop), and boolean plot.weedingBonus. Existing ownership, money, crop,
stock, market session and room position records use their established paths.
Temporary playtest progress remains separate and is not imported.

## Optional weeding

Tap Pull weeds in the Garden, then pull six illustrated weeds for the whole
currently planted garden. Each plant receives one bonus on its next harvest.
No normal yield, quality, growth, price, or skipping penalty changes. Newly
planted crops do not retroactively receive an earlier bonus. Repeat producers
consume the bonus on the first harvest only. Another round requires all bonuses
used and a later player-advanced farming day. Partial activities and awarded
bonuses survive refresh. Weed taps are idempotent; awards cannot stack.

20% means one extra produce unit per five normal units of a crop harvested with
an eligible bonus. Small amounts accumulate as integer fifth-unit credits per
crop, including across future rounds. Inventory remains whole units, bonuses do
not disappear through rounding, and repeated low-yield harvests are not doubled.
The popup explains this. Credits are consumed atomically with an actual harvest,
never by opening information or previewing yield. An all-carrot 25-plot harvest
of normally 50 carrots becomes 60, once only.

## Validation

183 Node tests cover established systems, backward-compatible recovery, optional
weeding, idempotence, repeat crops, partial/complete saves, and exact bonus math.
Touch browser checks cover Garden, weeding, six-page book, customer portrait
pixel isolation, market clock/checkout, cents, treasure scaling, seed shopping,
and supplies at phone-sized viewports. These run Chromium with touch and safe
area simulations; physical iPhone Safari testing remains recommended, especially
address-bar resizing, gestures, VoiceOver and rendering on device.

Future development uses branches and PRs in this repository. No new preview
repositories are required. Existing temporary repositories are retained.
