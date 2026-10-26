# Per-plot weeding reward

A successful activity flags every currently planted plot. The flagged plant's
next harvest adds exactly one unit: one pound for lb crops or one item for each
crops. Its flag is removed atomically with that harvest, never by another pick,
End Day, a season change, navigation or save recovery. Crop readiness does not
affect eligibility. Individual harvests and Harvest All share the same rule.
Repeat producers get the bonus on one harvest only; newly planted crops have no
inherited flag. Normal quality-adjusted yields and all prices remain unchanged.

Five-day windows, the once-only End Day invitation, lesson progression and
math/spelling interactions remain unchanged. Pending crop flags continue to
block another weeding activity, so rewards cannot stack. Completion now has
the requested Wonderful Weeding! message and only Back to the Garden.
Invitation, Garden indicators, crop info and the six-page guide describe +1,
with no event-expiry warnings or Finish bonus harvest controls.

## Save compatibility

Keep version 1, mgg10 and mgg10-backup. Existing boolean plot.weedingBonus flags
already identify pending plants and now mean +1. An obsolete weedingHarvest
record is cleared without deleting any plant flags, including when its old
remaining list is empty/malformed or its date is from an earlier day. Flags
already consumed/expired under the old game are not invented or reinstated.
Valid weedingCredits records remain as inactive legacy data; the new reward does
not accrue, round or spend fractional credits. Every pending flag gets at least
the former potential extra unit, given the current normal yields of 1–4.
Money, ownership, room placements, inventory, customers, lesson progress and
active market sessions retain their established recovery paths.

## Validation

205 automated tests passed, including every crop/unit type, quality-adjusted
base yields, staggered ripening, seven days and season rollover, individual and
bulk harvests, new planting exclusion, repeat producers, duplicate prevention,
legacy-event migration and primary/backup recovery. Existing challenge,
invitation, financial and market rules remain in the full test suite.

18 touch/mobile layout checks passed: new staggered reward/migration (3),
educational weeding and completion (3), automatic invitation (3), established
Garden controls (3), and six-page guide/market-session recovery (6). Garden
checks include 320×440, 375×548 and 428×746, simulated safe areas and real touch
controls. Tests use isolated farms in Chromium, not physical iPhone Safari.
The user's verified invitation code and original illustrations remain intact.
