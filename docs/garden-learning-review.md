# Phase 8: educational Garden weeding and illustrated growth

Development branch: `phase-8/educational-weeding-and-crop-closeups`.
This is a review build. Do not merge or publish it until reviewed. Permanent
playtesting remains at its existing build. No original-repository or temporary
hosting changes, new preview repositories, or farm resets are part of this work.

## Learning activity

The existing Garden grid/art, tools, basket, planting and crop mechanics remain.
A green Pull weeds button becomes available in the window starting on global
Day 5, then Day 10, 15, 20, 25, and indefinitely. For example, the Day 5 window
runs through Day 9. Completing it spends that window only. Skipped windows do
not accumulate. A gray disabled button explains the wait, absent plantings or
pending bonus. The continuous day counter is the existing season/day formula.
Only End Day advances it; elapsed real-world time has no role.

Confirmation has Let's Weed! and Not Now. Opening, declining, closing and
resuming never spend an opportunity. Starting creates a saved seeded session.
Math and spelling alternate on successful completions; skipping an unfinished
session does not pretend that the other activity was completed.

Four planted choices appear in a round; a seeded shuffle makes 1–3 incorrect.
The interface does not announce the incorrect count. Tap an answer or drag it
to the weed basket. Correct answers stay planted. After two mistaken choices,
remaining incorrect answers retain their original wording and gain an explicit
red Correct: annotation. Nothing is automatically cleared. Mistakes and hints
reset in each new round; they never affect money, quality, yield or rewards.

Earned dreams use the existing reliable cumulative purchase count (with owned
records as a lower bound): 0–1 = one round, 2–3 = two, 4+ = three. Arithmetic
starts with nonnegative addition/subtraction. Two purchases unlock simple whole
multiplication; four expand number ranges. Six unlock some quarter-step decimal
multiplication, with whole-number/easier problems still mixed in. Later tiers
increase ranges gradually. First purchase alone does not make numbers harder.
Spelling uses a bounded, original 24-word garden/everyday vocabulary bank with
more challenging words gradually added. More vocabulary can be added later.

## One upcoming harvest activity

Completion tags only plants present then. No bonus is awarded early. Pending
bonuses block another completion without overwriting/stacking them. The first
eligible pick opens a gathering activity containing all eligible plants ripe
at that moment. Unripe plants do not carry that activity's bonus into a later
harvest. New plantings never inherit it. Harvest All applies the bonus to all
eligible ripe plants in that event. Individual picks can collect the same set
across visits/refreshes, until the set is gathered, the player chooses Finish
bonus harvest (with confirmation), or End Day (with warning). Neither normal
produce nor already-earned credits is removed by ending an activity.

Repeat producers lose the tag after that pick and grow subsequent normal
harvests. The existing integer fifth-unit per-crop credits preserve the 20%
benefit across small yields and future activities, never fractional inventory.
A 25-plot carrot harvest with normal yield 50 gives 60 once; one-unit crops
accumulate a fifth each eligible harvest until a whole extra unit is earned.

## Illustrated growth and guidebook

Forty new original SVG cutaways depict four stages for ten crop types, with
appropriate roots, bulbs, leaves, stalks, vines, pods and fruit. No old paintings
are changed. Plot popups show the current stage at phone-readable size plus
watering, watered-day growth, repeat harvests, yields and existing market value.
A four-stage gallery is optional. Fast-growing crops can skip a stage between
manual day updates; their growth times are deliberately preserved. Regrowing
repeat plants keep mature leaves without showing ripe produce early.

The same six illustrated guidebook pages explain startup $50, bags/scales and
blanket/table choices, manual days, planting/watering, crop pictures, optional
math/spelling weeding, the next-harvest bonus and established market arithmetic.
No unavailable Job Board earning activities are advertised as working features.

## Saves

Save version 1 and `mgg10` / `mgg10-backup` remain unchanged. New optional fields:
`weedingLesson` (version, last completed cycle, next activity type, seeded session
with round/removals/mistakes) and `weedingHarvest` (gathering day/remaining plots).
Existing per-plant bonus flags and `weedingCredits` are retained. Legacy earned
bonuses remain earned. Legacy six-identical-weed partial activities become the
new challenge rather than inventing educational answers or completed rounds.
Malformed optional records do not reset the farm. Question generation is seeded
and should remain stable for version-1 sessions in future content changes.

## Verification

201 Node tests passed, including randomized round invariants and arithmetic,
progression, five-day/season windows, skipped cycles, partial/complete/backup
recovery, two-mistake assistance, fair individual gathering, Harvest All,
repeat producers, legacy bonuses and integer-credit accumulation. Existing
market/customer/cents/room/economy rule tests remain in the same full suite.

Phone touch checks: Garden (3 viewports), educational weeding (3), all crop
closeups/four-stage assets (3), six-page guide (6), market active-time clock,
checkout and closing/report (5), Clubhouse scaling/dragging (6), cents/mixed
coins, large bills, retry and save recovery (6). Total: 32 layout/flow checks.
The smallest Garden/challenge/crop viewport is 320×440, with simulated safe
areas and visible-browser viewport constraints. The tests use isolated farms.

[Spelling and assistance](review/garden-learning-spelling-iphone.png)
· [Carrot close-up](review/garden-growth-carrot-iphone.png)
· [All forty illustrations](review/garden-growth-contact-sheet.png)

Automated mobile checks use Chromium, not physical iPhone Safari. Actual Safari
toolbars, long drags, VoiceOver and the new SVG art direction need manual review.
Small screens scroll within the reading/challenge popup, with Close and the
weed basket kept together in its sticky footer. Reduced motion disables round
transitions. Illustrations are intentionally lightweight original vector art;
no new painted backgrounds or 3D system are introduced.
