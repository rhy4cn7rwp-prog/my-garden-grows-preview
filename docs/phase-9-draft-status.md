# Phase 9 — Neighborhood, learning experiences and narration

Implemented on `phase-9/neighborhood-and-learning`, PR #7. The user's continuation
approval authorizes fixing in-scope issues and merging after successful checks.
The original draft blockers are resolved. No original game repository or new
hosting repository is involved. See the final test notes below.

## Ten working activities

| Job | Interaction | Little / Growing Gardener |
| --- | --- | --- |
| Garden Word Search | Swipe straight letter paths; tap start/end alternative; found words remain highlighted | 5×5 short words and picture/read-aloud clues / 8×8, longer words, diagonal/backward placement |
| Packing Shed | Moving produce belt; drag into illustrated crates or tap produce then crate | 2 types, slower belt / 4 types, faster belt |
| Harvest Stack Sort | Top-item moves into empty/matching crates; Undo and Restart | 2 types, capacity 3 / 3 types, capacity 4; two spare crates |
| Mrs. Magee's Mixed-Up Labels | Wooden letter tiles into slots, removable letters, gradual hints, highlighted words | Short regular words with pictures and bundled letter sounds / longer garden words |
| Veggie Match | Adjacent swaps, matches of 4+, pop/fall transitions, cascades, legal-move reshuffle | 3 produce types, 80-point goal / 5 types, 160-point goal; exactly 120 seconds of active play |
| Mr. Jones's Carrots | Side-view toss arcs, drag basket or left/right controls, catch counter, oversized carrots | Wide basket, slower launches, 8 points / narrower basket, quicker launches, 14 points; 60 seconds |
| Pull Neighborhood Weeds | Drag/tap jagged red weeds among round green plants | 5 weeds / 7 weeds; no player-Garden crop or reward mutation |
| Pick Tomatoes | Pick/drag individual ripe red tomatoes, leave smaller green tomatoes | 4 / 6 requested tomatoes; one fruit per counted pick |
| Water Flowers | Drag can onto pots, or select can then tap pots; flowers perk up | 4 / 6 flowerpots |
| Tidy the Yard | Drag leaves/sticks to matching piles, or tap/select then place | 6 / 10 pieces |

All jobs are initially unlocked and independent of money, equipment and Dream
Shop progression. Every successful job pays exactly $1 at the result screen's
Collect $1 action. Claiming is idempotent: the completed active session is removed
in the same mutation as wallet/cooldown updates. Quitting/failing pays nothing
and starts no cooldown. Each paying neighbor rests for five real minutes; cards
count down live and quietly become available, including across navigation,
refresh and time away. Real timestamps are independent of farming days.

Timed rounds use elapsed active milliseconds with no persisted running anchor.
Pause, hidden tabs, navigation and pagehide stop/checkpoint the clock. Restored
jobs require Play/Resume, so no absent time is charged. Match must reach its goal
and complete 120,000 ms; reaching the score early cannot pay early. Failed rounds
can retry immediately. Scores/bests and full session progress are saved. The
single animation loop stops outside the Job Board and does not multiply at
results. Reduced motion disables decorative transitions and the moving belt;
essential arcade carrots still move so the activity remains playable.

## Child-selected experiences

New games receive one friendly choice, with Read to Me. Existing saves default
to Growing Gardener, without a popup, balance change or reset. Both share wallet,
crops, inventory, dreams, room, customers, reports and all rewards. Town Settings
and the Job Board's Play & Sound settings can switch preferences any time.

Little Gardener never unlocks harder mandatory numbers from Dream purchases.
New Garden weed sessions use one picture-based nature round. Switching an
unfinished academic Garden round to Little replaces equations with plants while
preserving completed rounds and cleared answer positions. Returning to Growing
does not discard that adapted round. Planted-crop bonuses stay unchanged.

Existing jobs keep their original puzzle/settings when switching; the settings
text explains that the player can resume them or leave without penalty and
start a fresh job in the new experience. Market orders already in progress are
preserved. Little can complete those without calculations, while new Little
customers request one crop with a manageable quantity. Bagging/payment reuses
existing validation, inventory, bag, cash and history functions, without updating
the child's Growing arithmetic-support history from automatically solved work.
Growing retains the original keypad, line math, adaptive practice and money tray.

## New-player economy and legacy compatibility

Only absent primary AND backup saves, or an explicitly confirmed new farm, use
Game.newGame(): $0, one unclaimed starter assortment, new-equipment requirements.
The legacy Game.initial factory/recovery contract remains available and existing
farms retain their wallet, purchased equipment, blanket/rental options and active
market access. No retroactive fee or register gate is applied to those farms.

At Seed & Feed the free starter assortment is three Carrot Seeds, two Green Bean
Seeds and two Lettuce Seeds. Claim once per new save, then the offer disappears.
New farms buy a reusable table ($8), scale ($5), register ($4), and ten bags ($3):
$20 when all are missing. Only missing items are charged. Table, scale and bags
use the existing equipment checkout/accounting; the register is separately
recorded. A queued equipment basket is preserved. Subsequent bags remain
consumable through existing rules. New-market opening checks requirements;
existing open sessions are never invalidated. Every job is a free way to earn,
so depleted money or seeds never requires restarting or selling at market.

Save version 1 and mgg10/mgg10-backup remain. New profile fields are optional:
learningExperience, experienceChosen, narrationEnabled, effectsEnabled,
newEconomy, starterClaimed, cashRegister, jobs. Jobs store per-job cooldown/best,
a serial and a bounded seeded action log. Recovery replays/validates the optional
session instead of trusting raw score/won flags. Invalid optional records cannot
reset farm money/progress. Future puzzle-generation changes must maintain or
explicitly migrate version-1 session replay. An actual pre-Phase-9 factory save
fixture verifies the old wallet, ownership, crop bonus and active checkout.

## Optional audio and artwork

Narration starts off. Explicit Read to Me works without changing that preference;
enabling narration adds brief guide, neighbor and shop read-aloud. Settings save
narration and effects separately. A shared adapter cancels prior voices/clips on
replay, screen changes and hiding. It never blocks play and falls back to written
instructions if browser speech is unavailable. Character profiles distinguish
Mrs. Magee, Mr. Jones and the shop/guide, ready for future recorded replacements.
Short regular-word letter sounds are bundled synthesized phoneme WAVs, not
spoken letter names; tests verify non-silent PCM and browser decoding. There is
no paid voice service, external runtime API, advertising or monetization.

New neighbor portraits and job surfaces are original lightweight SVG/CSS, with
existing produce artwork reused. All original paintings and 40 crop cutaways
are unchanged. The How to Play book keeps six illustrated pages, updated for
both experiences, jobs, new-only economy, manual farming and per-plot bonuses.

[Job Board](review/phase9-job-board-iphone.png) · [Mrs. Magee](review/phase9-labels-iphone.png)
· [Mr. Jones](review/phase9-catch-iphone.png) · [Veggie Match](review/phase9-match-iphone.png)

## Final validation and limits

240 automated tests passed. This includes all twenty job/mode completion paths,
$1/cooldown/recovery invariants, 1,000 reversible Stack Sort seeds, solvable word
searches, match-four playability/cascades/exact clock, failed/quit retries, nature
weeding adaptation, starter/kit economy, audio fallbacks/phoneme files, and old
farm/session recovery. The prior new-wallet assertion now expects $0, with
separate real legacy-save coverage retaining $877.65 and a pending sale.

112 phone layout/flow checks passed: all ten jobs × two modes × three viewports
(60), integrated new-player/audio/market flow (3), guidebook (6), and established
Garden/invitation/bonus/market/shops/Clubhouse regressions (43). Core new-game
checks use 320×440, 375×548 and 428×746, touch gestures and simulated safe areas.
Regression layouts also include landscape and smaller available heights.

All-game UI checks perform actual drags/taps, payouts and refreshes. Timer rules
are checked at exact active-millisecond boundaries; long arcade rounds are
accelerated in tests, plus real pause/reload/hidden-tab observations. No actual
children's browser storage is accessed; tests use isolated synthetic farms.

Physical iPhone Safari, VoiceOver and voice/phonics listening quality still need
family playtesting. Automated phone tests use Chromium, not native Safari.
System voices vary by device; the phonics clips are synthetic, not a full human
phonics curriculum. Small screens may scroll the board, instructions or longer
puzzles; gameplay status and Pause/Read/Leave controls remain accessible. The
larger letter grid uses swipeable cells rather than requiring precise tiny taps.
