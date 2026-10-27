# Job Board playtest refinements

All work stays in the permanent preview. All ten existing job IDs and the farm's
version-1 save keys (`mgg10` and `mgg10-backup`) remain unchanged.

## Completed scope

| Request | Implementation |
| --- | --- |
| Free letters | Select any tile and any slot; drag from tray/slot; move, swap and return tiles. Tile identities distinguish repeated letters. Words are checked only when every slot is filled; incorrect words remain editable. |
| Vocabulary | 109 curated farm/garden/nature/equipment words, including 34 short early-reader choices. Picture clues and optional pronunciation remain. Recent history is shared between word jobs within each experience and retains the last 24 words. |
| Letter sounds | Sixteen additional local synthesized clips complete the alphabet. Original ten clips are unchanged. Hard C/G and short-vowel hints are contextualized by whole-word pronunciation. |
| Mow and rake | A connected illustrated lawn with planted obstacles; drag steering or four large direction buttons. Cut every grassy patch, sweep the rake through clippings, then drag or tap three piles into compost. Reward is unavailable until both stages finish. |
| Manual rows | Drag scenery in either direction; no automatic advancement, snapping, drift or skipping. Pulling fruit/weeds does not move the view. Dragging healthy carrot foliage pans safely instead of trying to remove it. |
| Carrot weeding | Four/five dense carrot clusters in Little/Growing, with four distinct yellow jagged weeds each (16/20 total), roots, dirt particles and exposed soil after removal. Healthy foliage remains. This never touches the main Garden's five-day weeding feature. |
| Tomatoes | All plants and ripe/unripe fruit remain visible for inspection. Manual exploration, tap/detach/drag to basket, unchanged requested ripe counts and no deadline. |
| Characters | One canonical detailed Mr. Jones and new silver-haired, bespectacled Mrs. Magee, reused on notices, introductions, gameplay and result screens. No replacement of existing farm/room artwork. |
| Records | All ten jobs have a personal-best indicator and Leaderboard controls. Local records show previous best and latest result, separated by experience, rules version and comparable settings. No accounts, public names or database. |
| Rewards | First successful record pays $1. A successful improvement on an existing comparable best pays $3 **total**. Ties pay $1. One claim sets the same independent five-minute cooldown. Failed attempts have no payout/cooldown. |
| Timing | New Veggie Match rounds last 90 active seconds; Mr. Jones remains 60. Other jobs are untimed. Pause/hidden/pagehide stops active time. Untimed completion time is a record, not a deadline. |

## Records and migration

`job-records.js` compares points for Match/Carrot Catch and active completion time
for the other eight activities. Completion times are compared and displayed to
the same hundredth-second precision, so a displayed tie never earns a hidden
bonus. Word jobs compare matching word-length combinations; stacks compare crate
capacity/count and scramble-complexity bands. Other jobs compare their fixed
mode-specific targets/settings. The first record in a different setting is $1.

Records update only when a successful reward is claimed; viewing results,
reloading and repeated touch delivery cannot pay again. Failed timed results can
be remembered without establishing a successful best. Money is adjusted in
integer cents. The legacy coarse `jobs.best` map remains intact and is shown as
an earlier score when no new classified record exists.

New sessions use `rulesVersion: 3`. Version 1/2 sessions replay using their
original generator/actions, original flower/weeding targets, original label
placement rules, original two-minute Match duration and original $1 reward.
Twenty pre-update version-2 session fixtures recover exactly and can finish for
$1, alongside the prior version-1 migration fixtures. Do not change a version's
word pool or replay rules without a migration: saved version-3 word plans are
immutable and validated against the curated collection.

`records` and `wordHistory` are optional additive job fields. Their validation
cannot reset a farm wallet, crops, purchases, equipment, room positions or market
session. Mode switching keeps the unfinished job's original experience and uses
the new preference for subsequent jobs. The only change in `game.js` is two
messages saying jobs pay **at least** $1, reflecting the new bonus.

## Validation

- `npm test`: **256 passing** rule/regression tests, including 2,000 seeded word-job
  plans across both experiences, valid grids, exact tile multisets,
  arbitrary placement/swap/return, connected mower paths, both lawn stages,
  fair record buckets, genuine improved points/time, ties, integer-cent payouts,
  duplicate claims, independent cooldowns and old/new save recovery.
- `mobile_neighborhood.py`: **60** completed flows (ten jobs × both experiences ×
  320×440, 375×548 and 428×746) using touch, including full mow/rake/compost runs.
- `mobile_job_refinements.py`: **15** focused checks across the same phone sizes
  for free-letter dragging/correction/reload, forward/back row pans and no drift,
  carrot visibility, mower/rake gestures, pile dragging, $1/$3/tie awards through
  refresh and duplicate delivery, all 26 audio decodes and active-clock pause.
- Prior focused touch/result and Phase 9 integration suites pass, including the
  repaired touch-release handling for Stack Sort Undo/Restart.
- Guidebook/Clubhouse, Garden weeding, cents-market transactions, Seed & Feed and
  Market Supplies mobile regressions pass. Total: **116 mobile flow checks**.

Browser checks use Chromium touch at iPhone-sized available viewports, including
simulated safe areas in existing suites. Native iPhone Safari, VoiceOver, and the
subjective feel of synthesized letter hints/illustration/dragging still need
family playtesting. Narrow phones allow vertical scrolling to retain readable
text and comfortable controls. No actual Safari hardware result is claimed.
